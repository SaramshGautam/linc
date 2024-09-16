import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5030",
  headers: {
    "Content-Type": "application/json",
  },
});

// Meeting Endpoints
export const getMeetings = () => api.get("/meetings");
export const addMeeting = (meeting) => api.post("/meetings", meeting);

// Audio recording endpoints
export const getAudioRecordings = (meetingId) =>
  api.get(`/audio_recordings/${meetingId}`);
export const addAudioRecording = (audioRecording) =>
  api.post("/audio_recordings", audioRecording);

// Transcript endpoints
export const getTranscripts = (meetingId) =>
  api.get(`/transcripts/${meetingId}`);
export const addTranscript = (transcript) =>
  api.post("/transcripts", transcript);

// Summary endpoints
export const getSummaries = (meetingId) => api.get(`/summaries/${meetingId}`);
export const addSummary = (summary) => api.post("/summaries", summary);

// Speakers  endpoints
export const getSpeakers = (meetingId) => api.get(`/speakers/${meetingId}`);
export const addSpeakers = (speakers) => api.post("/speakers", speakers);

//Action item endpoints
export const getActionItems = (meetingId) =>
  api.get(`/action_items/${meetingId}`);
export const addActionItem = (actionItem) =>
  api.post("/action_items", actionItem);

// Stream graph endpoints
export const getStreamGraphs = (meetingId) =>
  api.get(`/stream_graphs/${meetingId}`);
export const addStreamGraph = (streamGraph) =>
  api.post("/stream_graphs", streamGraph);

// Emoji prediction endpoints
export const getEmojiPredictions = (meetingId) =>
  api.get(`/emoji_predictions/${meetingId}`);
export const addEmojiPrediction = (emojiPrediction) =>
  api.post("/emoji_predictions", emojiPrediction);

// Chord chart endpoints
export const getChordCharts = (meetingId) =>
  api.get(`/chord_charts/${meetingId}`);
export const addChordChart = (chordChart) =>
  api.post("/chord_charts", chordChart);
