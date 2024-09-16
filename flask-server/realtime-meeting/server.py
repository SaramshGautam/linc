import io
import logging
import torch
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import openai
import re
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask and SocketIO
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", ping_interval=15, ping_timeout=30)

# Initialize device settings
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# Load Whisper Model
model_id = "openai/whisper-small"
model = AutoModelForSpeechSeq2Seq.from_pretrained(model_id, torch_dtype=torch_dtype, use_safetensors=True)
model.to(device)
processor = AutoProcessor.from_pretrained(model_id)

pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    max_new_tokens=128,
    chunk_length_s=30,
    batch_size=16,
    return_timestamps=True,
    torch_dtype=torch_dtype,
    device=device,
)

# Initialize text classification pipeline
try:
    classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)
    logger.info("Text classification pipeline initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize text classification pipeline: {e}")

# Emotion-to-emoji dictionary
emotion_emoji = {
    'joy': '😊',
    'surprise': '😱',
    'neutral': '',
    'anger': '😡',
    'sadness': '😰',
    'disgust': '😰',
    'fear': '👿'
}

last_end_time = 0  # Initialize last end time

# Function to format time
def format_time(seconds):
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02}:{secs:02}"

# Handle connections and disconnections
@socketio.on('connect')
def handle_connect():
    global last_end_time
    last_end_time = 0  # Reset last end time on new connection
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

####################################################################################################
# PUSHTOSPEAK FUNCTIONALITY
####################################################################################################

@socketio.on('audio')
def handle_audio(data):
    global last_end_time
    try:
        wav_blob = data['wavBlob']
        language = data['language']
        print("Received audio data, size:", len(wav_blob), "language:", language)

        # Perform transcription
        result = pipe(wav_blob, return_timestamps=True, generate_kwargs={"language": language})
        transcript_chunks = result['chunks']
        print("---transcription output: ", transcript_chunks)

        transcript_with_timestamps = []
        for chunk in transcript_chunks:
            start_time, end_time = chunk['timestamp']
            adjusted_start_time = last_end_time + start_time
            adjusted_end_time = last_end_time + end_time
            text = chunk['text']
            transcript_with_timestamps.append({
                "start": format_time(adjusted_start_time),
                "end": format_time(adjusted_end_time),
                "text": text
            })

        last_end_time += transcript_chunks[-1]['timestamp'][1]  # Update last end time

        # Perform sentiment analysis and append emojis
        updated_data = []
        for item in transcript_with_timestamps:
            text = item['text']
            if text:
                results = classifier(text)[0]
                dominant_emotion = sorted(results, key=lambda x: x['score'], reverse=True)[0]['label']
                emoji = emotion_emoji.get(dominant_emotion, '')
                item['emoji'] = emoji
                updated_data.append(item)

        print("--- Emoji Prediction Result:\n", updated_data)
        emit('transcript', updated_data)

    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        emit('transcript', {'error': 'Error processing audio'})

####################################################################################################
# REALTIME TRANSLATION FUNCTIONALITY
####################################################################################################

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")
# OPENAI_API_KEY = 'your_openai_api_key_here'
# openai.api_key = OPENAI_API_KEY

# Supported language pairs for translation
supported_languages = [
    ("en", "es"),  # English to Spanish
    ("en", "zh"),  # English to Mandarin
    ("en", "ar"),  # English to Arabic
    ("en", "hi"),  # English to Hindi
    ("en", "bn")   # English to Bengali
]

def translate_text_gpt4(text, target_language):
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": f"Give me the translation only and nothing extra of the following text to {target_language}:\n\n{text}"}
    ]
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",  
            messages=messages,
            max_tokens=1000,  
            temperature=0.3,
        )
        translation = response.choices[0].message.content

        translation = re.sub(r'^.*?(Translate[d]?:?|Translation |Translating:)\s*', '', translation, flags=re.IGNORECASE).strip()
        translation = re.sub(r'\s*(End of translation|Translation end[s]?)\s*$', '', translation, flags=re.IGNORECASE).strip()

        quote_match = re.search(r'["\'](.*?)["\']', translation)
        if quote_match:
            translation = quote_match.group(1)

        return translation
    except Exception as e:
        logging.error(f"Error in translate_text_gpt4: {e}")
        raise

@socketio.on('translate')
def translate_text(data):
    try:
        text_to_translate = data.get('text')
        target_language = data.get('to')

        print('--- Transcript received from the frontend: ---\n', text_to_translate)
        print('--- Target language received from the frontend: --- ', target_language)

        translated_data = []

        for item in text_to_translate:
            text = item.get('text', '')
            translated_text = translate_text_gpt4(text, target_language)
            translated_data.append({
                'start': item.get('start'),
                'end': item.get('end'),
                'text': translated_text
            })

        print("--Output of Translation: ", translated_data)
        emit('translation', translated_data)
    except Exception as e:
        logging.error(f"Error in translate_text endpoint: {e}")
        emit('translation', {'error': 'Error in translation'})

####################################################################################################
# MAIN APPLICATION RUNNER
####################################################################################################

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5010, debug=False)  
