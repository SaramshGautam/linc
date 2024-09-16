from flask import Flask, request, jsonify, send_from_directory
import os
import json
import re
import pandas as pd
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from bertopic import BERTopic
from bertopic.representation import OpenAI
import openai
from flask_cors import CORS
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import soundfile as sf
from datetime import datetime
from pyannote.audio import Pipeline
from pydub import AudioSegment
import logging
from collections import Counter
import numpy as np
import config
import os
from dotenv import load_dotenv

load_dotenv()

# Set up OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

HF_AUTH_TOKEN = os.getenv("HF_AUTH_TOKEN")

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# emotion-to-emoji dictionary
emotion_emoji = {
    'joy': '😁',
    'surprise': '😱',
    'neutral': '',
    'anger': '😡',
    'sadness': '😰',
    'disgust': '😰',
    'fear': '👿'
}

# Initialize the text classification pipeline for emoji service
try:
    classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)
    logger.info("Text classification pipeline initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize text classification pipeline: {e}")

# Initialize the diarization pipeline
diarization_pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token=HF_AUTH_TOKEN
)

client = openai
prompt = """
I have a topic that contains the following documents:
[DOCUMENTS]

The topic is described by the following keywords: [KEYWORDS]

Based on the information above, generate a refined and concise topic label in the following format:
topic: <topic label>
"""
representation_model = OpenAI(client, prompt=prompt, model="gpt-4o", chat=True)
topic_model = BERTopic(embedding_model="all-MiniLM-L6-v2", representation_model=representation_model)

# Set up the device and data type based on CUDA availability
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

# Load the Whisper model and processor
model_id = "openai/whisper-tiny"
model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, torch_dtype=torch_dtype, use_safetensors=True,
)
model.to(device)

processor = AutoProcessor.from_pretrained(model_id)

# Set up the pipeline for automatic speech recognition
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

def find_audio_path_by_meeting_id(meeting_id):
    audio_mapping = {
        # 'meeting1': '/Users/saramshgautam/linc/flask-server/transcription-services/data/input/audio_5.mp3',
        # Add other mappings here
    }
    return audio_mapping.get(meeting_id, None)

def format_time(seconds):
    """Convert seconds to mm:ss format."""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02}:{secs:02}"

def remove_stopwords(text):
    word_tokens = word_tokenize(text)
    filtered_sentence = [w for w in word_tokens if w.lower() not in stop_words]
    return ' '.join(filtered_sentence)

stop_words = set(stopwords.words('english'))


def process_transcript(transcript):
    timestamps = re.findall(r'\[(\d{2}:\d{2}-\d{2}:\d{2})\]:', transcript)
    sentences = re.split(r'\[\d{2}:\d{2}-\d{2}:\d{2}\]:', transcript)
    cleaned_sentences = [remove_stopwords(sentence.strip()) for sentence in sentences if sentence.strip()]
    
    intervals = []
    for ts in timestamps:
        start, _ = ts.split('-')
        minutes, seconds = map(int, start.split(':'))
        total_minutes = minutes
        intervals.append(total_minutes)

    return intervals, cleaned_sentences

def group_into_intervals(intervals, sentences, interval_length=5):
    grouped_data = {}
    for minute, sentence in zip(intervals, sentences):
        interval_start = (minute // interval_length) * interval_length
        grouped_data.setdefault(interval_start, []).append(sentence)
    return grouped_data

@app.route('/transcription', methods=['POST'])
def transcribe_audio():
    logger.info("Endpoint /transcription called.")
    meeting_id = request.form.get('meeting_id')
    logger.debug(f"Received meeting ID: {meeting_id}")


    if 'audio' in request.files:
        # Handling audio file upload from real-time frontend
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        audio_data = file.read()
        try:
            result = pipe(audio_data, return_timestamps=True, generate_kwargs={"language": "english"})
            transcript_chunks = result['chunks']

            transcript = ""
            for chunk in transcript_chunks:
                unformatted_start_time, unformatted_end_time = chunk['timestamp']
                text = chunk['text']
                start_time = format_time(unformatted_start_time)
                end_time = format_time(unformatted_end_time)
                transcript_chunk = f"[{start_time}-{end_time}]: {text}\n"
                transcript += transcript_chunk

            # transcript_folder = '/Users/saramshgautam/linc/flask-server/transcription-services/data/output'
            # transcript_folder = '/home/student/linc/flask-server/transcription-services/data/output'
            # os.makedirs(transcript_folder, exist_ok=True)
            # transcript_file_path = os.path.join(transcript_folder, f'{meeting_id}_transcript.json')
            # with open(transcript_file_path, 'w') as transcript_file:
            #     json.dump({"transcript": transcript}, transcript_file, indent=4)

            print("Transcription:", transcript)
            return jsonify({'transcript': transcript}), 200

        except Exception as e:
            print("Error:", e)
            return jsonify({'error': str(e)}), 500
    
    else:
        return jsonify({'error': 'Invalid request'}), 400
    
def format_minutes_to_time(minutes):
    return f"{minutes // 60:02d}:{minutes % 60:02d}"

def process_transcript_topics(transcript):
    timestamps = re.findall(r'\[(\d{2}:\d{2}-\d{2}:\d{2})\]:', transcript)
    sentences = re.split(r'\[\d{2}:\d{2}-\d{2}:\d{2}\]:', transcript)
    cleaned_sentences = [remove_stopwords(sentence.strip()) for sentence in sentences if sentence.strip()]
    
    intervals = []
    for ts in timestamps:
        start, _ = ts.split('-')
        minutes, seconds = map(int, start.split(':'))
        total_minutes = minutes
        intervals.append(total_minutes)

    return intervals, cleaned_sentences

def group_into_intervals_topics(intervals, sentences, interval_length=5):
    grouped_data = {}
    for minute, sentence in zip(intervals, sentences):
        interval_start = (minute // interval_length) * interval_length
        grouped_data.setdefault(interval_start, []).append(sentence)
    return grouped_data

@app.route('/bert-topic', methods=['POST'])
def process_transcript_endpoint():
    meeting_id = request.form.get('meeting_Id')
    transcript = request.form.get('transcript')
    print("--- Meeting_ID --- ", meeting_id)
    print("--- Meeting Transcript --- ", transcript)

    # Load the transcript from the saved JSON file
    # transcript_folder = '/Users/saramshgautam/linc/flask-server/transcription-services/data/output'
    # transcript_file_path = os.path.join(transcript_folder, f'{meeting_id}_transcript.json')
    # try:
    #     with open(transcript_file_path, 'r') as transcript_file:
    #         transcript_data = json.load(transcript_file)
    #         transcript = transcript_data.get("transcript", "")
    # except Exception as e:
    #     return jsonify({'error': f'Failed to load transcript: {str(e)}'}), 500

    # if not transcript:
    #     return jsonify({'error': 'No transcript found in the saved file'}), 400
    
    intervals, cleaned_sentences = process_transcript_topics(transcript)

    cleaned_sentences = [s for s in cleaned_sentences if isinstance(s, str) and s.strip()]
    if not cleaned_sentences:
        return jsonify({'error': 'No valid sentences found in the transcript'}), 400


    grouped_data = group_into_intervals_topics(intervals, cleaned_sentences)

    # topics, _ = topic_model.fit_transform(cleaned_sentences)
    try:
        topics, _ = topic_model.fit_transform(cleaned_sentences)
    except TypeError as e:
        print("Error during topic modeling:", str(e))
        return jsonify({'error': 'Error during topic modeling. Ensure that all inputs are valid strings.'}), 500
    
    topic_labels = topic_model.get_topic_info()
    processed_topic_names = [name.split('_', 1)[-1] if '_' in name else name for name in topic_labels.Name]
    topic_labels_dict = dict(zip(topic_labels.Topic, processed_topic_names))

    results = []
    for interval_start, sentences in grouped_data.items():
        topics, _ = topic_model.transform(sentences)
        
        topics = [topic for topic in topics if topic != -1]
        topic_counts = pd.Series(topics).value_counts().to_dict()

        start_time = format_minutes_to_time(interval_start)
        end_time = format_minutes_to_time(interval_start + 5)
        interval_data = {'time_frame': f"{start_time}-{end_time}"}
        for topic in set(topics):
            interval_data[topic] = topic_counts.get(topic, 0)

        results.append(interval_data)

    df_results = pd.DataFrame(results).fillna(0)
    df_results.columns = ['time_frame'] + [topic_labels_dict.get(topic, f"Topic {topic}") for topic in df_results.columns[1:]]
    topic_columns = df_results.columns[1:]
    df_results[topic_columns] = df_results[topic_columns].astype(int)



    print(" --- BerTopic Result: --- \n", df_results)

    # output_file = '/Users/saramshgautam/linc/flask-server/streamgraph/text-rank/bertTopic/topic_intervals_from_server.csv'

    meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)
    if not os.path.exists(meeting_dir):
        os.makedirs(meeting_dir)
        print(f"Created directory: {meeting_dir}")
    output_file = os.path.join(meeting_dir, f"{meeting_id}_bertopics.csv")
    df_results.to_csv(output_file, index=False)
    print(f'Results successfully saved to {output_file}')

    result_dict = df_results.to_dict(orient = 'records')
    print("=== Bert Topic Result == \n",result_dict)

    # bertopics_folder = '/home/student/linc/flask-server/chordchart/data/input/bertopics'
    # bertopics_folder = '/home/student/linc/flask-server/chordchart/data/input/bertopics'
    # os.makedirs(bertopics_folder, exist_ok=True)
    # bertopics_file_path = os.path.join(bertopics_folder, f'{meeting_id}_bertopics.json')
    # with open(bertopics_file_path, 'w') as bertopics_file:
    #     json.dump(df_results.to_dict(orient='records'), bertopics_file, indent=4)

    # print(f'BerTopic results successfully saved to {bertopics_file_path}')

    meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)
    os.makedirs(meeting_dir, exist_ok=True)
    meeting_bertopics_file_path = os.path.join(meeting_dir, f'{meeting_id}_bertopics.json')
    with open(meeting_bertopics_file_path, 'w') as meeting_bertopics_file:
        json.dump(df_results.to_dict(orient='records'), meeting_bertopics_file, indent=4)
    print(f'BerTopic results successfully saved to {meeting_bertopics_file_path}')

    return jsonify({"topics": df_results.to_dict(orient='records')})

def translate_text_gpt4(text, target_language):
    segments = split_text(text)
    translations = []
    for segment in segments:
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Give me the translation only and nothing extra of the following text to {target_language}:\n\n{segment}"}
        ]
        try:
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=1000,
                temperature=0.5,
            )
            translation = response.choices[0].message.content
            translations.append(translation.strip())
        except Exception as e:
            print(f"Error in translate_text_gpt4 segment translation: {e}")
            raise
    return " ".join(translations)

def split_text(text, max_length=500):
    sentences = re.split(r'(?<=[.!?]) +', text)
    segments = []
    current_segment = ""

    for sentence in sentences:
        if len(current_segment) + len(sentence) < max_length:
            current_segment += sentence + " "
        else:
            segments.append(current_segment)
            current_segment = sentence + " "
    if current_segment:
        segments.append(current_segment)
    return segments

@app.route('/translate', methods=['POST'])
def translation():
    try:
        text = request.form.get('transcript')
        target_language = request.form.get('language')

        print('--- Transcript received from the frontend:\n', text)
        print('--- Target language received from the frontend:\n', target_language)

        if not text or not target_language:
            return jsonify({'error': 'Missing data'}), 400

        translated_text = translate_text_gpt4(text, target_language)
        print('--- Translated text:\n', translated_text)
        return jsonify({'translated': translated_text}), 200
    except Exception as e:
        print(f"Error during translation: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/summarization', methods=['POST'])
def summarize():
    try:
        meeting_id = request.form.get('meeting_id')
        text_to_be_summarized = request.form.get('transcript')

        if not meeting_id or not text_to_be_summarized:
            return jsonify({'error': 'Meeting ID or transcript not provided'}), 400
        
        print(f"--- Received Meeting ID for Summarization: {meeting_id}")
        print(f"--- Received Transcript for Summarization: --- \n{text_to_be_summarized}")

        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Generate a summary of the following transcript for post-meeting analysis:\n\n{text_to_be_summarized}"}
        ]

        print("--- Starting Summarization")
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=1000,
            temperature=0.5,
        )

        final_summary = response.choices[0].message.content

        print("--- Output from the summarization: \n", final_summary)

        meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)

        # Check if the directory exists, and create it if it doesn't
        if not os.path.exists(meeting_dir):
            os.makedirs(meeting_dir)
            print(f"Created directory: {meeting_dir}")

        # Save the summary to a text file in the meeting directory
        summary_file_path = os.path.join(meeting_dir, f"{meeting_id}_summary.txt")
        with open(summary_file_path, 'w') as summary_file:
            summary_file.write(final_summary)
        print(f"Summary saved to: {summary_file_path}")

        return jsonify({'summary': final_summary}), 200

    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({'error': 'Error occurred during summarization'}), 500

@app.route('/actions', methods=['POST'])
def actions():
    try:
        meeting_id = request.form.get('meeting_id')
        transcript = request.form.get('transcript')

        if not meeting_id or not transcript:
            return jsonify({'error': 'Meeting ID or transcript not provided'}), 400
        
        print(f"--- Received Meeting ID for Action items: {meeting_id}")
        print(f"--- Received Transcript for Action Items: --- \n{transcript}")

        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Generate a list of action items or tasks based on the following transcript of a meeting:\n\n{transcript}"}
        ]

        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=600,
            temperature=0.5,
        )

        actions = response.choices[0].message.content

        print("--- The action items from the meeting are:\n", actions)

        meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)

        # Check if the directory exists, and create it if it doesn't
        if not os.path.exists(meeting_dir):
            os.makedirs(meeting_dir)
            print(f"Created directory: {meeting_dir}")

        # Save the action items to a text file in the meeting directory
        actions_file_path = os.path.join(meeting_dir, f"{meeting_id}_action_items.txt")
        with open(actions_file_path, 'w') as actions_file:
            actions_file.write(actions)
        print(f"Action items saved to: {actions_file_path}")

        return jsonify({'actions': actions}), 200

    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({'error': 'Error occurred during generating action items'}), 500

@app.route('/predict-sentiment', methods=['POST'])
def predict_sentiment():
    if not request.form:
        logger.error("Request is not in form data format")
        print("Request is not in form data format")
        return jsonify({'error': 'Invalid request, please send form data with "transcript".'}), 400

    transcript = request.form.get('transcript')
    meeting_id = request.form.get('meeting_id')

    if not meeting_id:
        print("No meeting_id found in form data request")
        logger.error("No meeting_id found in form data request")
        return jsonify({'error': 'Invalid request, please send form data with "meeting_id".'}), 400
    
    if not transcript:
        logger.error("No transcript found in form data request")
        print("No transcript found in form data request")
        return jsonify({'error': 'Invalid request, please send form data with "transcript".'}), 400

    try:
        updated_data = []
        lines = transcript.split('\n')
        for line in lines:
            if line.strip():
                timestamp, text = line.split(': ', 1)
                results = classifier(text)[0]
                dominant_emotion = sorted(results, key=lambda x: x['score'], reverse=True)[0]['label']
                emoji = emotion_emoji.get(dominant_emotion, '')  # Default to empty if not found
                updated_item = {
                    'timestamp': timestamp,
                    'emoji': emoji
                }
                updated_data.append(updated_item)

        print("--- Emoji Prediction Result: \n ", updated_data)

        meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)

        # Check if the directory exists, and create it if it doesn't
        if not os.path.exists(meeting_dir):
            os.makedirs(meeting_dir)
            print(f"Created directory: {meeting_dir}")

        # Save the sentiment prediction results to a JSON file
        sentiment_file_path = os.path.join(meeting_dir, f"{meeting_id}_sentiment_predictions.json")
        with open(sentiment_file_path, 'w') as sentiment_file:
            json.dump(updated_data, sentiment_file, indent=4)
        print(f"Sentiment predictions saved to: {sentiment_file_path}")

        return jsonify(updated_data)
    
    except Exception as e:
        logger.error(f"Error during sentiment prediction: {e}")
        return jsonify({'error': 'An error occurred during sentiment prediction'}), 500

@app.route('/diarization', methods=['POST'])
def diarize_audio():
    meeting_id = request.form.get('meeting_id')
    print(f"Received meeting ID: {meeting_id}")

    if 'audio' not in request.files:
        print('No audio file provided')
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        print('No audio file selected')
        return jsonify({'error': 'No selected file'}), 400
    
    temp_audio_path = f"/tmp/{audio_file.filename}"
    temp_wav_path = None  
    audio_file.save(temp_audio_path)

    try:
        audio_path = temp_audio_path

        if temp_audio_path.lower().endswith('.mp3'):
            print(f"Converting MP3 to WAV: {temp_audio_path}")
            audio = AudioSegment.from_mp3(temp_audio_path)
            temp_wav_path = "/tmp/temp_audio.wav"
            audio.export(temp_wav_path, format="wav")
            audio_path = temp_wav_path
        else:
            audio_path = temp_audio_path

        print(f"Starting diarization for: {audio_path}")
        diarization_result = diarization_pipeline(audio_path, num_speakers=3)
        print("--- Diarization Result : \n", diarization_result)
        print("Diarization completed successfully")

        speaker_segments = []
        for segment in diarization_result.itertracks(yield_label=True):
            turn, _, speaker = segment
            speaker_segments.append({
                "speaker": speaker,
                "start": round(turn.start, 0),
                "end": round(turn.end, 0)
            })
        print("--- Speaker Segments : ----\n", speaker_segments)

        meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)
        os.makedirs(meeting_dir, exist_ok=True)

        # Save the speaker segments to a JSON file in the meeting's directory
        output_file_path = os.path.join(meeting_dir, f"{meeting_id}_speaker_segments.json")
        with open(output_file_path, 'w') as output_file:
            json.dump(speaker_segments, output_file, indent=4)
        
        print(f"Speaker segments saved to: {output_file_path}")

        saved_audio_file_path = os.path.join(meeting_dir, f"{meeting_id}_audio.mp3")
        audio_file.save(saved_audio_file_path)
        print(f"Audio file saved to: {saved_audio_file_path}")

        return jsonify(speaker_segments), 200

    except Exception as e:
        print(f"Error during diarization: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up temporary files
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        if temp_wav_path and os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)

def extract_speakers_with_counts(transcript):
    speaker_pattern = re.compile(r'SPEAKER_\d+')
    speakers = re.findall(speaker_pattern, transcript)
    speaker_counts = Counter(speakers)
    return speaker_counts

@app.route('/generate_speakers', methods=['POST'])
def process_transcript():
    meeting_id = request.form.get('meeting_id', '')
    transcript = request.form.get('transcript', '')

    if not meeting_id:
        return jsonify({"error": "No meeting_id provided"}), 400
    if not transcript:
        return jsonify({"error": "No transcript provided"}), 400
    
    # print(transcript)
    print("--- Meeting ID Received inside /generate_speakers = ",meeting_id )
    speaker_counts = extract_speakers_with_counts(transcript)
    
    response = {
        'num_speakers': len(speaker_counts),
        'speakers': dict(speaker_counts)
    }

    print(f' Speaker Indentifying Backend Result \n ${response}')
    
    meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)
    os.makedirs(meeting_dir, exist_ok=True)
    speakers_file_path = os.path.join(meeting_dir, f'{meeting_id}_speakers.json')
    with open(speakers_file_path, 'w') as speakers_file:
        json.dump(response, speakers_file, indent=4)
    
    print(f'Speaker identification results successfully saved to {speakers_file_path}')
    
    return jsonify(response)

def group_into_intervals_speakers(transcript, interval_length=5):
    timestamps = re.findall(r'\[(\d{2}:\d{2}-\d{2}:\d{2})\]:', transcript)
    # sentences = re.findall(r'\[(\d{2}:\d{2}-\d{2}:\d{2})\] \((SPEAKER_\d+)\): (.+)', transcript)
    sentences = re.findall(r'\[(\d{2}:\d{2}-\d{2}:\d{2})\] \(([\w\d_]+)\): (.+)', transcript)

    
    print(f"--- Sentences Found: --- \n {sentences}")
    intervals = []
    grouped_data = {}

    for sentence in sentences:
        ts, speaker, text = sentence
        words = len(text.split())

        start, end = ts.split('-')
        start_minutes, start_seconds = map(int, start.split(':'))
        end_minutes, end_seconds = map(int, end.split(':'))
        total_start_minutes = start_minutes
        total_end_minutes = end_minutes
        
        interval_start = (total_start_minutes // interval_length) * interval_length
        interval_end = (total_end_minutes // interval_length) * interval_length
        
        for interval in range(interval_start, interval_end + interval_length, interval_length):
            if interval not in grouped_data:
                grouped_data[interval] = {}
            if speaker not in grouped_data[interval]:
                grouped_data[interval][speaker] = 0
            grouped_data[interval][speaker] += words

    return grouped_data

@app.route('/speaker-words', methods=['POST'])
def process_transcript_speakers():
    meeting_id = request.form.get('meeting_id')
    transcript = request.form.get('transcript')
    if not meeting_id:
        return jsonify({'error': 'No meeting_id provided'}), 400
    if not transcript:
        return jsonify({'error': 'No transcript provided'}), 400

    print(f"--- Received Meeting ID /speaker_words: {meeting_id}")
    print("--- Received Transcript in speaker-words is: --- \n", transcript)
    grouped_data = group_into_intervals_speakers(transcript)
    print(f"--- Grouped Data: --- \n {grouped_data}")

    meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)

    # Check if the directory exists, and create it if it doesn't
    if not os.path.exists(meeting_dir):
        os.makedirs(meeting_dir)
        print(f"Created directory: {meeting_dir}")

    # Save the transcript file in the meeting directory
    transcript_file_path = os.path.join(meeting_dir, f"{meeting_id}_transcript.txt")
    with open(transcript_file_path, 'w') as transcript_file:
        transcript_file.write(transcript)
    print(f"Transcript saved to: {transcript_file_path}")

    if not grouped_data:
        return jsonify({'error': 'No data found after processing'}), 400

    results = []
    for interval_start, speakers in grouped_data.items():
        start_time = format_minutes_to_time(interval_start)
        end_time = format_minutes_to_time(interval_start + 5)
        interval_data = {'time_frame': f"{start_time}-{end_time}"}
        
        for speaker, word_count in speakers.items():
            interval_data[speaker] = word_count
        
        results.append(interval_data)

    df_results = pd.DataFrame(results).fillna(0)
    print(f"--- DataFrame Results: --- \n {df_results}")

    if df_results.empty:
        return jsonify({'error': 'No data to save to CSV'}), 400

    # output_file = '/Users/saramshgautam/linc/flask-server/streamgraph/speaker/speaker-participation.csv'
    meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)
    if not os.path.exists(meeting_dir):
        os.makedirs(meeting_dir)
        print(f"Created directory: {meeting_dir}")
    output_file = os.path.join(meeting_dir, f"{meeting_id}_speaker-participation.csv")
    # output_file = '/Users/saramshgautam/linc/flask-server/data/${meeting_id}/speaker-participation.csv'
    df_results.to_csv(output_file, index=False)


    print(f'Results successfully saved to {output_file}')
    return jsonify({'message': f'Results successfully saved to {output_file}'})

def parse_interval(time_frame):
    start, end = time_frame.split('-')
    start_seconds = int(start.split(':')[0]) * 60 + int(start.split(':')[1])
    end_seconds = int(end.split(':')[0]) * 60 + int(end.split(':')[1])
    return pd.Interval(left=start_seconds, right=end_seconds, closed='both')

def assign_topic(row, melted_topics):
    for _, topic_row in melted_topics.iterrows():
        if row['start'] in topic_row['time_frame']:
            return topic_row['topic']
    return None

def generate_chord_data(speakers, influence_matrix):
    fixed_colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]
    num_speakers = len(speakers)
    colors = fixed_colors[:num_speakers]  # Use only as many colors as needed
    chord_data = {
        "matrix": influence_matrix.tolist(),
        "meta": {
            "names": speakers,
            "colors": colors
        }
    }
    return chord_data

@app.route('/get_chord_data', methods=['POST'])
def get_chord_data():
    meeting_id = request.form.get('meeting_id')
    
    # Debugging: Print the received data
    print("Received meeting_id chord :", meeting_id)
    
    if not meeting_id:
        print("No meeting_id provided")
        return jsonify({'error': 'Invalid input data'}), 400

    meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)
    os.makedirs(meeting_dir, exist_ok=True)
    output_file_path = os.path.join(meeting_dir, f"{meeting_id}_chord_data.json")
    
    # Check if the chord data file already exists
    if os.path.exists(output_file_path):
        print(f"Chord data found for meeting_id: {meeting_id}. Loading from file.")
        with open(output_file_path, 'r') as output_file:
            chord_data = json.load(output_file)
        return jsonify(chord_data)
    
    # Load the corresponding data from local files
    try:
        # speaker_segment_path = f"/Users/saramshgautam/linc/flask-server/chordchart/data/input/speakersegments/{meeting_id}_speaker_segments.json"
        speaker_segment_path = f"/Users/dev/linc/flask-server/data/{meeting_id}/{meeting_id}_speaker_segments.json"
        bertopics_path = f"/Users/dev/linc/flask-server/data/{meeting_id}/{meeting_id}_bertopics.json"
        print(f"Loading speaker segments from: {speaker_segment_path}")
        print(f"Loading bertopics from: {bertopics_path}")
        
        if not os.path.exists(speaker_segment_path):
            print(f"Speaker segments file not found: {speaker_segment_path}")
            return jsonify({'error': 'Speaker segments data not found'}), 404
        
        if not os.path.exists(bertopics_path):
            print(f"Bertopics file not found: {bertopics_path}")
            return jsonify({'error': 'Bertopics data not found'}), 404
        
        with open(speaker_segment_path, 'r') as f:
            speaker_segment = json.load(f)
        
        with open(bertopics_path, 'r') as f:
            topics = json.load(f)
    except FileNotFoundError:
        return jsonify({'error': 'Data not found for the provided meeting_id'}), 404
    
    transcript = pd.DataFrame(speaker_segment)
    topics = pd.DataFrame(topics)

    print('Speaker Segments:\n', transcript)
    print('Topics :\n', topics)

    if transcript.empty or topics.empty:
        print("Transcript or topics DataFrame is empty")
        return jsonify({'error': 'Invalid input data'}), 400
    
    topics['time_frame'] = topics['time_frame'].apply(parse_interval)

    # Process topics
    topic_columns = topics.columns[1:]
    melted_topics = topics.melt(id_vars=['time_frame'], value_vars=topic_columns, var_name='topic', value_name='score')
    transcript['topic'] = transcript.apply(lambda row: assign_topic(row, melted_topics), axis=1)

    # Detect topic continuations
    continuations = []
    for i in range(1, len(transcript)):
        if transcript.iloc[i]['topic'] == transcript.iloc[i-1]['topic'] and transcript.iloc[i]['speaker'] != transcript.iloc[i-1]['speaker']:
            continuations.append((transcript.iloc[i-1]['speaker'], transcript.iloc[i]['speaker']))

    print(f'Continuations: {continuations}')

    # Create a sorted list of unique speakers
    speakers = sorted(set(transcript['speaker']))
    print(f'Speakers: {speakers}')


    # Initialize and populate the influence matrix
    speaker_index = {speaker: idx for idx, speaker in enumerate(speakers)}
    influence_matrix = np.zeros((len(speakers), len(speakers)), dtype=int)
    for src, tgt in continuations:
        source_idx = speaker_index[src]
        target_idx = speaker_index[tgt]
        influence_matrix[source_idx, target_idx] += 1
    print(f'Influence Matrix:\n{influence_matrix}')


    # Generate the chord data
    chord_data = generate_chord_data(speakers, influence_matrix)

    # Save the chord data to a JSON file
    with open(output_file_path, 'w') as output_file:
        json.dump(chord_data, output_file, indent=4)

    return jsonify(chord_data)

@app.route('/get-csv', methods=['POST'])
def get_csv():
    data_type = request.form.get('dataType')
    meeting_id = request.form.get('meeting_id')

    if not meeting_id:
        return jsonify({'error': 'No meeting_id provided'}), 400

    print("-- Meeting ID received to fetch the CSV file:", meeting_id)
    
    directory = f'/Users/dev/linc/flask-server/data/{meeting_id}'

    if data_type == 'speakers':
        filename = f'{meeting_id}_speaker-participation.csv'
    else:
        filename = f'{meeting_id}_bertopics.csv'

    try:
        with open(os.path.join(directory, filename), 'r') as file:
            csv_data = file.read()
        return csv_data, 200, {'Content-Type': 'text/csv'}
    except FileNotFoundError:
        return jsonify({'error': f'File not found: {filename}'}), 404

@app.route('/validate', methods=['POST'])
def validate_participant():
    data = request.json
    meeting_id = data.get('meeting_id')
    participant_id = data.get('participant_id')

    if meeting_id in config.valid_participants and participant_id in config.valid_participants[meeting_id]:
        return jsonify({"valid": True}), 200
    else:
        return jsonify({"valid": False, "message": "Invalid Meeting ID or Participant ID"}), 400
    
@app.route('/save_meeting_data', methods = ['POST'])
def save_meeting():
    print("Request files:", request.files)

    meeting_id = request.form['meeting_id']
    meeting_name = request.form['name']
    meeting_date = request.form['date']

    print(f"Received Meeting ID: {meeting_id}")
    print(f"Received Meeting Name: {meeting_name}")
    print(f"Received Meeting Date: {meeting_date}")

    meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)
    print(f"Creating directory: {meeting_dir}")
    os.makedirs(meeting_dir, exist_ok=True)

    audio_file = request.files['audio']
    if audio_file:
        audio_path = os.path.join(meeting_dir, 'audio.mp3')
        audio_file.save(audio_path)
        print(f"Audio file saved to: {audio_path}")
    else:
        print("No audio file found in the request.")

    transcript = request.files['transcript']
    if transcript:
        transcript_path = os.path.join(meeting_dir, 'transcript.txt')
        transcript.save(transcript_path)
        print(f"Transcript saved to: {transcript_path}")
    else:
        print("No transcript file found in the request.")

    summary_file = request.files.get('summary')
    if summary_file:
        summary_path = os.path.join(meeting_dir, 'summary.txt')
        summary_file.save(summary_path)
        print(f"Summary saved to: {summary_path}")
    else:
        print("No summary file found in the request.")


    action_items_file = request.files.get('actionItems')
    if action_items_file:
        action_items_path = os.path.join(meeting_dir, 'action_items.txt')
        action_items_file.save(action_items_path)
        print(f"Action items saved to: {action_items_path}")
    else:
        print("No action items file found in the request.")

    radar_chart_data = request.form.get('radar_chart_data')
    if radar_chart_data:
        radar_chart_path = os.path.join(meeting_dir, 'radar_chart_data.json')
        with open(radar_chart_path, 'w') as f:
            json.dump(json.loads(radar_chart_data), f)
        print(f"Radar chart data saved to: {radar_chart_path}")
    else:
        print("No radar chart data found in the request.")

    return jsonify({"message": "Meeting data saved successfully!"}), 200

@app.route('/get_meeting_ids', methods=['GET'])
def get_meeting_ids():
    data_folder = '/Users/dev/linc/flask-server/data'
    
    try:
        meeting_ids = [d for d in os.listdir(data_folder) if os.path.isdir(os.path.join(data_folder, d))]
        return jsonify({'meeting_ids': meeting_ids}), 200
    except Exception as e:
        print(f"Error retrieving meeting IDs: {e}")
        return jsonify({'error': 'Failed to retrieve meeting IDs'}), 500

import base64
@app.route('/load_meeting_data', methods = ['POST'])
def load_meeting_data():
    meeting_id = request.form.get('meeting_id')
    if not meeting_id:
        print('No meeting_id provided in request')
        return jsonify({'error': 'No meeting_id provided'}), 400
    else: 
        print('Meeting Id Selected is = ', meeting_id)

    meeting_dir = os.path.join('/Users/dev/linc/flask-server/data', meeting_id)
    if not os.path.exists(meeting_dir):
        print(f'Meeting directory not found for ID {meeting_id}')
        return jsonify({'error': f'Meeting directory not found for ID {meeting_id}'}), 404

    try:
        transcript_file_path = os.path.join(meeting_dir, f"{meeting_id}_transcript.txt")
        print(f'Loading transcript from: {transcript_file_path}')
        with open(transcript_file_path, 'r') as transcript_file:
            transcript = transcript_file.read()
            
        summary_file_path = os.path.join(meeting_dir, f"{meeting_id}_summary.txt")
        print(f'Loading summary from: {summary_file_path}')
        with open(summary_file_path, 'r') as summary_file:
            summary = summary_file.read()

        actionItems_file_path = os.path.join(meeting_dir, f"{meeting_id}_action_items.txt")
        print(f'Loading action items from: {actionItems_file_path}')
        with open(actionItems_file_path, 'r') as actionItems_file:
            actionItems = actionItems_file.read()

        diarization_file_path = os.path.join(meeting_dir, f"{meeting_id}_speaker_segments.json")
        print(f'Loading diarization data from: {diarization_file_path}')
        with open(diarization_file_path, 'r') as diarization_file:
            diarization = json.load(diarization_file)

        bertopicscsv_file_path = os.path.join(meeting_dir, f"{meeting_id}_bertopics.csv")
        print(f'Loading bertopics CSV data from: {bertopicscsv_file_path}')
        with open(bertopicscsv_file_path, 'r') as bertopicscsv_file:
            bertopicscsv = bertopicscsv_file.read()

        bertopics_file_path = os.path.join(meeting_dir, f"{meeting_id}_bertopics.json")
        print(f'Loading bertopics JSON data from: {bertopics_file_path}')
        with open(bertopics_file_path, 'r') as bertopics_file:
            bertopics = json.load(bertopics_file)
        
        radar_chart_file_path = os.path.join(meeting_dir, f"{meeting_id}_sentiment_predictions.json")
        print(f'Loading radar chart data from: {radar_chart_file_path}')
        with open(radar_chart_file_path, 'r') as radar_chart_file:
            radar_chart_data = json.load(radar_chart_file)

        speakers_participation_file_path = os.path.join(meeting_dir, f"{meeting_id}_speaker-participation.csv")
        print(f'Loading speakers participation data from: {speakers_participation_file_path}')
        with open(speakers_participation_file_path, 'r') as speakers_participation_file:
            speakers_participation_data = speakers_participation_file.read()

        speakers_file_path = os.path.join(meeting_dir, f"{meeting_id}_speakers.json")
        print(f'Loading speakers data from: {speakers_file_path}')
        with open(speakers_file_path, 'r') as speakers_file:
            speakers_data = json.load(speakers_file)

        chord_data_file_path = os.path.join(meeting_dir, f"{meeting_id}_chord_data.json")
        print(f'Loading chord data from: {chord_data_file_path}')
        with open(chord_data_file_path, 'r') as chord_data_file:
            chord_data = json.load(chord_data_file)

        audio_extensions = ['.mp3', '.wav']
        audio_file_path = None

        # Check for both MP3 and WAV files
        for ext in audio_extensions:
            potential_audio_file_path = os.path.join(meeting_dir, f"{meeting_id}_audio{ext}")
            if os.path.exists(potential_audio_file_path):
                audio_file_path = potential_audio_file_path
                break

        if audio_file_path:
            print(f'Loading audio file from: {audio_file_path}')
            with open(audio_file_path, 'rb') as audio_file:
                audio_data = base64.b64encode(audio_file.read()).decode('utf-8')
                print(f"Audio file loaded successfully: {audio_file_path}")
        else:
            audio_data = None
            print(f"No audio file found for meeting ID: {meeting_id}")

        print(f'Successfully loaded data for meeting ID: {meeting_id}')
        return jsonify({
            'transcript': transcript,
            'summary': summary,
            'actionItems': actionItems,
            'diarizationResult': diarization,
            'berTopicsCsv':bertopicscsv,
            'berTopics': bertopics,
            'emojiResult': radar_chart_data,
            'speakersCsv': speakers_participation_data,
            'speakers': speakers_data,
            'chord_data': chord_data,
            'audio': audio_data,
        }), 200

    except Exception as e:
        print(f"Error loading meeting data for {meeting_id}: {str(e)}")
        return jsonify({'error': f'Error loading meeting data: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5080)
