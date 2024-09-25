import React, { useState, useEffect, useContext } from "react";
import { htmlToText } from "html-to-text";
import RGL, { WidthProvider } from "react-grid-layout";
import {
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  useTheme,
  Button,
  TextField,
  Avatar,
} from "@mui/material";

import { convertMarkdownToHTML } from "./utils";

import axios from "axios";
import Header from "../../components/Header";
import StreamGraphComponent from "./StreamGraphComponent";
import RadarChartComponent from "./RadarChartComponent";
import TranscriptComponent from "./TranscriptComponent";
import SummaryComponent from "./SummaryComponent";
import ActionItemsComponent from "./ActionItemsComponent";
import ChordDiagram from "./ChordDiagram";
import AudioPlayerComponent from "./AudioPlayerComponent";
import { MinimizedContext } from "../../context/MinimizedContext";
import { ColorModeContext, tokens } from "../../theme";
import { ValidationContext } from "../../context/ValidationContext";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ReactGridLayout = WidthProvider(RGL);

const PostMeeting = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const { minimizedComponents, toggleComponent } = useContext(MinimizedContext); //Component Minimization

  const [audioFile, setAudioFile] = useState(null);
  const [audioURL, setAudioURL] = useState("");

  const [meetings, setMeetings] = useState(["meeting1", "meeting2"]);
  const [selectedMeetingName, setSelectedMeetingName] =
    useState("Meeting Name");
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [newMeeting, setNewMeeting] = useState({
    id: "",
    name: "",
    date: "",
  });
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [topics, setTopics] = useState([]);
  const [chordData, setChordData] = useState([]);
  const [emojiPredictions, setEmojiPredictions] = useState([]);

  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingActionItems, setLoadingActionItems] = useState(false);

  const [isEditName, setIsEditName] = useState(false);
  const [showAddMeetingFields, setShowAddMeetingFields] = useState(false);
  const [seekTimestamp, setSeekTimestamp] = useState("");
  // const [selectedMeeting, setSelectedMeeting] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedLanguageTranscript, setSelectedLanguageTranscript] =
    useState("");
  const [selectedLanguageSummary, setSelectedLanguageSummary] = useState("");
  const [selectedLanguageActionItems, setSelectedLanguageActionItems] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [originalTranscript, setOriginalTranscript] = useState("");
  const [bertTranscript, setBertTranscript] = useState("");
  const [originalSummary, setOriginalSummary] = useState("");
  const [originalActionItems, setOriginalActionItems] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [bertopics, setBertopics] = useState([]);
  const [speakerSegments, setSpeakerSegments] = useState([]);
  const [searchQueryTranscript, setSearchQueryTranscript] = useState("");
  const [searchQuerySummary, setSearchQuerySummary] = useState("");
  const [searchQueryActionItems, setSearchQueryActionItems] = useState("");
  const [speakerNames, setSpeakerNames] = useState({});

  const [highlightedEmotion, setHighlightedEmotion] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [dataType, setDataType] = useState("topics");
  // const [speakers, setSpeakers] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [speakerListLoad, setSpeakerListLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [originalSpeakerNames, setOriginalSpeakerNames] = useState({});

  const [isSpeakerSelected, setIsSpeakerSelected] = useState(false);

  const [cachedSpeakerData, setCachedSpeakerData] = useState(null);
  const [cachedTopicData, setCachedTopicData] = useState(null);
  const [meetingId, setMeetingId] = useState(() => {
    // Get the initial meeting ID from local storage or default to 1
    // const storedMeetingId = localStorage.getItem("meetingId");
    const storedMeetingId = 74;
    return storedMeetingId ? parseInt(storedMeetingId) : 1;
  });
  const { participantDetails } = useContext(ValidationContext);
  const dropDownMeetingId = participantDetails.meetingId;

  // useEffect(()=>{

  //   console.log("--- MeetingID input by user---", dropDownMeetingId)
  // },[dropDownMeetingId])

  const handleEmotionClick = (emotion) => {
    setHighlightedEmotion(emotion);
  };

  // Upload Audio button function
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioURL(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (bertTranscript) {
      console.log("--- bertTranscript has been set ---", bertTranscript);
      handleGenerateTopics(newMeeting.id, bertTranscript);
    }
  }, [bertTranscript]);

  useEffect(() => {
    // Update the meeting ID in local storage whenever it changes
    localStorage.setItem("meetingId", meetingId);
  }, [meetingId]);

  const loadBertTranscript = (bertTranscript) => {
    console.log("--- bertTranscript ---", bertTranscript);
    setBertTranscript(bertTranscript);
  };

  const handleStartAudioComputation = async (meetingId) => {
    // const meetingId = "meeting6";
    setSelectedLanguageTranscript("Original");
    setSelectedLanguageSummary("Original");
    setSelectedLanguageActionItems("Original");
    setSelectedMeetingId(meetingId);

    if (!audioFile) {
      alert("Please upload an audio file.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("meeting_id", meetingId);

    setLoadingTranscript(true);
    setLoadingSummary(true);
    setLoadingActionItems(true);

    try {
      const transcriptionResponse = await axios.post(
        "/transcription",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(
        "=== Response from the audio transcription ===",
        transcriptionResponse
      );
      const transcribedText = transcriptionResponse.data.transcript;
      setTranscript(transcribedText);
      setOriginalTranscript(transcribedText);
      // setBertTranscript(transcribedText);
      loadBertTranscript(transcribedText);
      setTranslatedText("");
      console.log(" -- TrancribedTEXT -- \n", transcribedText);
      console.log(" -- bertTranscript -- \n", bertTranscript);

      setLoadingTranscript(false);

      await handleGenerateSummary(meetingId, transcribedText);
      setLoadingSummary(false);

      await handleGenerateActionItems(meetingId, transcribedText);
      setLoadingActionItems(false);

      // await handleGenerateTopics(meetingId, bertTranscript);

      const emojiPredictionResult = await handleEmojiPrediction(
        meetingId,
        transcribedText
      );

      let transcriptWithEmojis = addEmojisToTranscript(
        transcribedText,
        emojiPredictionResult
      );

      // try {
      //   const saveTranscript_with_emojiResponse = await addEmojiPrediction({
      //     meetingId: meetingId,
      //     transcript: transcriptWithEmojis,
      //   });

      //   if (saveTranscript_with_emojiResponse.status === 201) {
      //     console.log("=== Transcript_with_emoji saved successfully ===");
      //     // alert("Transcript_with_emoji saved successfully");
      //   } else {
      //     console.log("=== Transcript_with_emoji not saved ===");
      //     // alert("Failed to save the Transcript_with_emoji.");
      //   }
      // } catch (error) {
      //   console.error("Error saving the Transcript_with_emoji:", error);
      //   // alert("An error occurred while saving the Transcript_with_emoji.");
      // }

      // console.log("--- Transcript WIth EMOJIS:  --- \n", transcriptWithEmojis);
      setTranscript(transcriptWithEmojis);

      const diarizationResult = await handleDiarization(meetingId, audioFile);

      const finalTranscript = addSpeakersToTranscript(
        transcriptWithEmojis,
        diarizationResult
      );
      console.log("--- Transcript WIth SPEAKERS:  --- \n", finalTranscript);

      // try {
      //   const saveTranscript_with_speakersResponse = await addStreamGraph({
      //     meetingId: meetingId,
      //     transcript: finalTranscript,
      //   });

      //   if (saveTranscript_with_speakersResponse.status === 201) {
      //     console.log("=== Transcript_with_speakers saved successfully ===");
      //     // alert("Transcript_with_speakers saved successfully");
      //   } else {
      //     console.log("=== Transcript_with_speakers not saved ===");
      //     // alert("Failed to save the Transcript_with_speakers.");
      //   }
      // } catch (error) {
      //   console.error("Error saving the Transcript_with_speakers:", error);
      //   // alert("An error occurred while saving the Transcript_with_speakers.");
      // }

      setTranscript(finalTranscript);
      setOriginalTranscript(finalTranscript);

      await loadSpeakers(meetingId, finalTranscript);

      await loadSpeakersData(meetingId, finalTranscript);

      // await loadTopicsData(meetingId, bertTranscript);

      console.log(` --- MeetingID Chord = ${meetingId}`);
      console.log(` --- Speaker Segments Chord = ${diarizationResult}`);
      console.log(` --- Bert Topic Chord = ${topics}`);

      // await handleChordDiagram(meetingId, diarizationResult, topics);
      // await handleChordDiagram(meetingId);
      await handleChordDiagram(meetingId);

      // handleChordDiagram(meetingId);

      // const transcriptWithSpeakersAndEmojis = addSpeakersAndEmojisToTranscript(
      //   transcribedText,
      //   diarizationResult,
      //   emojiPredictionResult
      // );
      // setTranscript(transcriptWithSpeakersAndEmojis);
    } catch (error) {
      console.error("Error during transcription:", error);
      alert("Failed to transcribe the meeting audio.");
    }
  };

  useEffect(() => {
    console.log("Speakers data loaded: ", speakers);
  }, [speakers]);

  const loadTopicsData = async (meeting_id, bertTranscript) => {
    const formData = new FormData();
    formData.append("meeting_Id", meeting_id);
    formData.append("transcript", bertTranscript);

    try {
      const topicResponse = await axios.post("/bert-topic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(" --- Topic generation response ---- \n", topicResponse.data);
      return topicResponse.data.topics; // Return topics data to be stored in state
    } catch (error) {
      console.error("Error fetching topic data:", error);
      alert("Failed to fetch topic data.");
      return null;
    }
  };

  const loadSpeakersData = async (meeting_id, transcript) => {
    const formData = new FormData();
    formData.append("meeting_id", meeting_id);
    formData.append("transcript", transcript);

    try {
      const speakerResponse = await axios.post("/speaker-words", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(" --- Speaker csv data ---- \n", speakerResponse.data);
      return speakerResponse.data;
    } catch (error) {
      console.error("Error fetching speaker CSV data:", error);
      alert("Failed to fetch speaker CSV data.");
      return null;
    }
  };

  const handleAudioRemove = () => {
    setAudioFile(null);
    setAudioURL("");
  };

  const handleChordDiagram = async (meetingId) => {
    const formData = new FormData();
    formData.append("meeting_id", meetingId);

    console.log(`MeetingID Chord handleChordDiagram = ${meetingId}`);
    try {
      const chordResponse = await axios.post("/get_chord_data", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const chordResult = chordResponse.data;
      console.log("--- Chord data ---", chordResult);
      setChordData(chordResult);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    console.log("--- chord data", chordData);
  }, [chordData]);

  const handleEmojiPrediction = async (meeting_id, transcript) => {
    if (!transcript) {
      alert(
        "Please transcribe something first or enter text in the transcript box!"
      );
      return;
    }

    const formData = new FormData();
    formData.append("meeting_id", meeting_id);
    formData.append("transcript", transcript);

    try {
      const emojiResponse = await axios.post("/predict-sentiment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const emojiResult = emojiResponse.data;
      console.log(" --- Emoji Prediction Result --- \n", emojiResult);
      setEmojiPredictions(emojiResult);
      return emojiResult;
    } catch (error) {
      console.error("Error during emoji prediction:", error);
      // alert("Failed to predict emoji of the meeting.");
    }
  };

  const handleDiarization = async (meeting_id, audioFile) => {
    const formData = new FormData();
    formData.append("meeting_id", meeting_id);

    formData.append("audio", audioFile);

    try {
      const diarizationResponse = await axios.post("/diarization", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const diarizationResult = diarizationResponse.data;
      setSpeakerSegments(diarizationResult);
      console.log("--- DiarizationResult --- \n", diarizationResult);
      return diarizationResult;
    } catch (error) {
      console.error("Error during speaker diarization:", error);
      alert("Failed to diarize the meeting audio.");
    }
  };

  const handleLanguageChange = async (event, component) => {
    const language = event.target.value;

    switch (component) {
      case "transcript":
        // setSelectedLanguage(language);
        setSelectedLanguageTranscript(language);
        setLoadingTranscript(true);
        if (language === "Original") {
          setTranslatedText(originalTranscript);
          setTranscript(originalTranscript);
          setLoadingTranscript(false);
        } else {
          translateText(
            language,
            originalTranscript,
            setTranscript,
            setLoadingTranscript
          );
          // setLoadingTranscript(false);
        }
        break;

      case "summary":
        // setSelectedLanguage(language);
        setSelectedLanguageSummary(language);
        setLoadingSummary(true);

        if (language === "Original") {
          setSummary(originalSummary);
          setLoadingSummary(false);
        } else {
          translateText(
            language,
            originalSummary,
            setSummary,
            setLoadingSummary
          );
        }
        break;
      case "actionItems":
        // setSelectedLanguage(language);
        setSelectedLanguageActionItems(language);

        setLoadingActionItems(true);

        if (language === "Original") {
          setActionItems(originalActionItems);
          setLoadingActionItems(false);
        } else {
          translateText(
            language,
            originalActionItems,
            setActionItems,
            setLoadingActionItems
          );
        }
        break;
      default:
        break;
    }
  };

  const extractAnnotations = (line) => {
    const match = line.match(
      /(.*?)\s*\[(\d{2}:\d{2})-(\d{2}:\d{2})\]\s*\(?(.*?)\)?:\s*(.*)/
    );
    if (match) {
      const [_, emoji, startStr, endStr, speaker, text] = match;
      console.log(
        `Emoji: ${emoji}, startStr: ${startStr}, endStr: ${endStr}, speaker: ${speaker}, text: ${text}`
      );
      return { emoji, startStr, endStr, speaker, text };
    }
    return null;
  };

  const translateText = async (language, text, setFunction, setLoading) => {
    if (!text) {
      alert("Please upload and transcribe the audio first!");
      return;
    }

    console.log("--- Text to be translated --- \n", text);
    console.log("--- Language --- \n", language);

    setLoading(true);
    const formData = new FormData();
    formData.append("transcript", text);
    formData.append("language", language);

    try {
      const translationResponse = await axios.post("/translate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const translatedLines = translationResponse.data.translated.split("\n");
      const originalLines = text.split("\n");
      const finalTranslatedLines = translatedLines.map(
        (translatedLine, index) => {
          const originalLine = originalLines[index];
          const annotations = extractAnnotations(originalLine);
          if (annotations) {
            const { emoji, startStr, endStr, speaker } = annotations;
            const speakerName = speakerNames[speaker] || speaker;
            // return `${emoji} [${startStr}-${endStr}] (${speakerName}): ${translatedLine}`;
            return `${translatedLine}`;
          }
          return translatedLine;
        }
      );

      const finalTranslatedText = finalTranslatedLines.join("\n");
      setFunction(finalTranslatedText);
      console.log(
        `--- Transcript translated into ${language}: \n ${finalTranslatedText}`
      );
    } catch (error) {
      console.error("Error during translation:", error);
      alert("Failed to translate the text.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateActionItems = async (meeting_id, transcript) => {
    if (!transcript) {
      alert(
        "Transcript is empty. Please upload and transcribe the audio first!"
      );
      return;
    }

    const formData = new FormData();
    formData.append("meeting_id", meeting_id);
    formData.append("transcript", transcript);

    setLoadingActionItems(true);

    try {
      const response = await axios.post("/actions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const actionResult = convertMarkdownToHTML(response.data.actions);
      // setActionItems(actionResult);
      setActionItems(htmlToText(actionResult));

      setOriginalActionItems(htmlToText(actionResult));
      setLoadingActionItems(false);
    } catch (error) {
      console.error("Error during actionItem generation:", error);
      alert("Failed to generate the actionItem.");
      setLoadingActionItems(false);
    }
  };

  const handleGenerateTopics = async (meetingId, transcript) => {
    if (!transcript) {
      alert(
        "Transcript is empty. Please upload and transcribe the audio first! -- handleGenerateTopics"
      );
      return;
    }

    console.log(
      "--- Transcript from inside handleGenerateTopics ---\n",
      transcript
    );

    const formData = new FormData();

    formData.append("meeting_Id", meetingId);
    console.log("--- Bert Transcript ---", transcript);
    formData.append("transcript", transcript);

    try {
      const topicsResponse = await axios.post("/bert-topic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const topicResults = topicsResponse.data.topics;
      console.log("--- Bert Topics --- \n", topicResults);
      setBertopics(topicResults);
      return topicResults;
    } catch (error) {
      console.error("Error during Bert Topics generation:", error);
      alert("Failed to generate the Bert Topics.");
    }
  };

  useEffect(() => {
    console.log("--- Bert Topics ---", bertopics);
  }, [bertopics]);

  const handleGenerateSummary = async (meeting_id, transcript) => {
    if (!transcript) {
      alert(
        "Transcript is empty. Please upload and transcribe the audio first!"
      );
      return;
    }

    const formData = new FormData();
    formData.append("meeting_id", meeting_id);
    formData.append("transcript", transcript);

    try {
      const response = await axios.post("/summarization", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const htmlSummary = convertMarkdownToHTML(response.data.summary);
      setSummary(htmlToText(htmlSummary));
      setOriginalSummary(htmlToText(htmlSummary));
      // setLoadingSummary(false);
    } catch (error) {
      console.error("Error during summary generation:", error);
      alert("Failed to generate the summary.");
      // setLoadingSummary(false);
    }
  };

  const addEmojisToTranscript = (transcript, emojis) => {
    const lines = transcript.split("\n");
    const updatedTranscript = lines.map((line) => {
      const match = line.match(/\[(\d{2}:\d{2})-(\d{2}:\d{2})\]:/);
      if (match) {
        const [_, startStr, endStr] = match;
        const emojiObj = emojis.find(
          (emoji) => emoji.timestamp === `[${startStr}-${endStr}]`
        );
        const emoji = emojiObj ? emojiObj.emoji : "";

        return `${emoji} [${startStr}-${endStr}]: ${line.split("]: ")[1]}`;
      }
      return line;
    });
    console.log("--- Update Transcript with Emojis: \n", updatedTranscript);
    return updatedTranscript.join("\n");
  };

  const addSpeakersToTranscript = (transcript, speakers) => {
    const lines = transcript.split("\n");
    const updatedTranscript = lines.map((line) => {
      const match = line.match(/(.*?)\s*\[(\d{2}:\d{2})-(\d{2}:\d{2})\]:/);

      if (match) {
        const [_, emojiPart, startStr, endStr] = match;
        const [startMin, startSec] = startStr.split(":").map(Number);
        const [endMin, endSec] = endStr.split(":").map(Number);
        const startTime = startMin * 60 + startSec;
        const endTime = endMin * 60 + endSec;

        // console.log(`Start Time: ${startTime} -- End Time: ${endTime}`);
        // console.log(`------ Emoji Part------: ${emojiPart}`);

        const overlappingSegments = speakers.filter(
          (segment) => segment.start < endTime && segment.end > startTime
        );

        if (overlappingSegments.length > 0) {
          const speakerSegment = overlappingSegments.reduce((prev, curr) => {
            const prevOverlap =
              Math.min(prev.end, endTime) - Math.max(prev.start, startTime);
            const currOverlap =
              Math.min(curr.end, endTime) - Math.max(curr.start, startTime);
            return currOverlap > prevOverlap ? curr : prev;
          });

          const speakerName =
            speakerNames[speakerSegment.speaker] || `${speakerSegment.speaker}`;
          console.log(`------ speakerName ------: ${emojiPart}`);

          console.log(`Found speaker: ${speakerName}`);

          return `${emojiPart} [${startStr}-${endStr}] (${speakerName}): ${
            line.split("]: ")[1]
          }`;
        } else {
          console.log("No speaker found");
          return `${emojiPart} [${startStr}-${endStr}]: ${
            line.split("]: ")[1]
          }`;
        }
      }
      return line;
    });
    return updatedTranscript.join("\n");
  };

  const handleSearch = (event, component) => {
    const value = event.target.value;
    switch (component) {
      case "transcript":
        setSearchQueryTranscript(value);
        break;
      case "summary":
        setSearchQuerySummary(value);
        break;
      case "actionItems":
        setSearchQueryActionItems(value);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const fetchMeetingIds = async () => {
      try {
        const response = await axios.get("/get_meeting_ids");
        if (response.status === 200) {
          const fetchedMeetings = response.data.meeting_ids.map((id) => ({
            id,
            name: `${id}`,
          }));
          setMeetings(fetchedMeetings);
        } else {
          console.error("Failed to fetch meeting IDs");
        }
      } catch (error) {
        console.error("Error fetching meeting IDs:", error);
      }
    };

    fetchMeetingIds();
  }, []);

  const handleMeetingSelect = async (event) => {
    const meetingId = event.target.value;
    setSelectedMeetingId(meetingId);
    // setSelectedMeetingName(meetingId);
    const selectedMeeting = meetings.find(
      (meeting) => meeting.id === meetingId
    );
    if (selectedMeeting) {
      setSelectedMeetingName(selectedMeeting.name);
    }

    if (!meetingId) {
      console.log("No meeting ID selected.");
      return;
    }

    const formData = new FormData();
    formData.append("meeting_id", meetingId);

    try {
      const response = await axios.post("/load_meeting_data", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        const data = response.data;
        setTranscript(data.transcript);
        setOriginalTranscript(data.transcript);

        setSummary(data.summary);
        setOriginalSummary(data.summary);

        setActionItems(data.actionItems);
        setOriginalActionItems(data.actionItems);

        setSpeakerSegments(data.diarizationResult);
        setBertopics(data.berTopics);
        setEmojiPredictions(data.emojiResult);
        setSpeakers(data.speakers.speakers);

        // setOriginalSpeakerNames(data.speakers)
        setSpeakerListLoaded(true);

        // const initialNames = {};
        // Object.keys(speakers).forEach((speaker) => {
        //   initialNames[speaker] = speaker;
        // });
        // setSpeakerNames(initialNames);

        setChordData(data.chord_data);

        if (data.audio) {
          const audioBlob = new Blob(
            [Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))],
            { type: "audio/mp3" }
          );
          const audioURL = URL.createObjectURL(audioBlob);
          setAudioURL(audioURL);
          console.log("Audio URL created:", audioURL);
        } else {
          console.log(
            "No audio file found for the selected meeting.",
            meetingId
          );
        }
      } else {
        alert("Failed to load meeting data.");
      }
    } catch (error) {
      console.error("Error loading meeting data:", error);
      alert("An error occurred while loading the meeting data.");
    }

    // const meetingId = event.target.value;
    // setSelectedMeetingId(meetingId);

    // const selectedMeeting = meetings.find(
    //   (meeting) => meeting.id === meetingId
    // );

    // if (selectedMeeting) {
    //   setSelectedMeetingName(selectedMeeting.name);
    // } else {
    //   console.log("No meeting found");
    // }

    // // await loadTranscript(meetingId);
    // // await loadSpeakers(transcript);
    // await handleGenerateTopics(meetingId, bertTranscript);
    // // loadSummary(meetingId);
    // // loadActionItems(meetingId);
    // // loadRadarChart(meetingId);
    // // loadStreamGraph(meetingId);
    // handleChordDiagram(meetingId);
  };

  const filteredMeetings = meetings.filter(
    (meeting) => meeting.id === dropDownMeetingId
  );

  // useEffect(() => {
  //   loadSpeakers(transcript);
  // }, [transcript]);

  const loadSpeakers = async (meeting_id, transcript) => {
    const formData = new FormData();
    formData.append("meeting_id", meeting_id);
    formData.append("transcript", transcript);

    try {
      const speakersResponse = await axios.post(
        "/generate_speakers",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      // speakerResult = speakersResponse.data;

      console.log(
        " === Response from Speakers list backlend === ",
        speakersResponse.data
      );

      setSpeakers(speakersResponse.data.speakers);
      setSpeakerListLoaded(true);

      const initialNames = {};
      Object.keys(speakersResponse.data.speakers).forEach((speaker) => {
        initialNames[speaker] = speaker;
      });
      setSpeakerNames(initialNames);
    } catch (error) {
      console.log(" === Error from Speakers list backlend === ", error);
    }
  };

  useEffect(() => {
    console.log("--- Updated Transcript ---", transcript);
  }, [transcript]);

  const handleNameChange = () => {
    setIsEditName(false);
  };

  const handleEditButtonClick = () => {
    setShowAddMeetingFields(true);
  };

  const handleSaveMeeting = async () => {
    setShowAddMeetingFields(false);
    if (!newMeeting.name || !newMeeting.date || !audioFile) {
      alert("Please fill in all fields before saving the meeting.");
      return;
    }

    const meetingId = newMeeting.id;
    setSelectedMeetingName(newMeeting.name);

    const audioBlob = new Blob([audioFile], { type: audioFile.type });

    await handleStartAudioComputation(meetingId);

    if (!transcript) {
      alert("Transcript generation failed. Please try again.");
      return;
    }

    const radarChartData = JSON.stringify(emojiPredictions);

    const formData = new FormData();
    formData.append("meeting_id", meetingId);
    formData.append("name", newMeeting.name);
    formData.append("date", newMeeting.date);
    formData.append("audio", audioBlob, audioFile.name);
    formData.append(
      "transcript",
      new Blob([transcript], { type: "text/plain" }),
      "transcript.txt"
    );
    formData.append("radar_chart_data", radarChartData);

    const response = await axios.post("/save_meeting_data", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status === 200) {
      alert("Meeting and data saved successfully!");
      // setMeetings({"meeting1", "meeting2", });
    } else {
      alert("Failed to save the meeting data.");
    }
  };

  const handleCancel = () => {
    setNewMeeting({ name: "", date: "", description: "" });
    setShowAddMeetingFields(false);
  };

  const handleEditSpeaker = (speaker) => {
    setEditingSpeaker(speaker);
  };

  const handleSpeakerNameChange = (event, speaker) => {
    setSpeakerNames({
      ...speakerNames,
      [speaker]: event.target.value,
    });
  };

  const handleSpeakerNameBlur = (speaker) => {
    setEditingSpeaker(null);
    const newSpeakerName = speakerNames[speaker];
    if (newSpeakerName !== speaker) {
      // Update originalSpeakerNames mapping
      setOriginalSpeakerNames((prev) => ({
        ...prev,
        [speaker]: newSpeakerName,
      }));

      // Update the transcript
      const updatedTranscript = transcript.replace(
        new RegExp(
          `\\(${speaker}\\)|\\(${originalSpeakerNames[speaker]}\\)`,
          "g"
        ),
        `(${newSpeakerName})`
      );

      console.log("=== Transcript after names added === ", updatedTranscript);
      setTranscript(updatedTranscript);
    }
    setEditingSpeaker(null);
  };

  const handleSeekBar = (timestamp) => {
    setSeekTimestamp(timestamp);
  };

  return (
    <Box className="Main">
      <Box
        className="Header"
        display="flex"
        bgcolor="#000814"
        p="5px"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          boxShadow: 3, // This is a shorthand for a medium shadow in MUI
        }}
      >
        <Box
          className="DashBoard and Meeting Name"
          display="flex"
          // justifyContent="space-between"
          // flexDirection="column"
        >
          <Box className="DashBoard">
            <Header title="POST MEETING DASHBOARD" />
          </Box>
        </Box>

        <Box
          className="add meeting and select"
          display="flex"
          alignItems="center"
          // justifyContent="space-evenly"
        >
          <Box className="Meeting Name" mr="10px">
            {isEditName ? (
              <TextField
                variant="outlined"
                value={selectedMeetingName}
                onChange={(e) => setSelectedMeetingName(e.target.value)}
                onBlur={handleNameChange}
                autoFocus
                sx={{
                  ml: 2,
                  bgcolor: colors.grey[900],
                  color: colors.grey[900],
                }}
                inputProps={{ style: { color: colors.grey[100] } }}
              />
            ) : (
              <Typography
                variant="h4"
                color={"#a3a3a3"}
                fontWeight="bold"
                sx={{ ml: 2 }}
              >
                {selectedMeetingName}
              </Typography>
            )}
          </Box>
          <Box
            className="New meeting add container"
            display="flex"
            justifyContent="space-between"
          >
            {!showAddMeetingFields && (
              <Box className="Add meeting button">
                <Button
                  onClick={handleEditButtonClick}
                  sx={{
                    bgcolor: "#FFC300",
                    color: "#000814",
                    minWidth: 200,
                    "&:hover": {
                      bgcolor: "#FFC300",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Add new Meeting
                </Button>
              </Box>
            )}

            {showAddMeetingFields && (
              <Box
                className="Meeting Details"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mt={2}
              >
                <Box padding="5px">
                  <TextField
                    label="id"
                    placeholder="Meeting id..."
                    value={newMeeting.id}
                    onChange={(e) =>
                      setNewMeeting({
                        ...newMeeting,
                        id: e.target.value,
                      })
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: colors.grey[300], // Outline color when not focused
                        },
                        "&:hover fieldset": {
                          borderColor: "#FFD60A", // Outline color on hover
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#FFC300", // Outline color when focused
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: colors.grey[500], // Label color
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: colors.blueAccent[600], // Label color when focused
                      },
                      color: colors.grey[100],
                    }}
                    InputProps={{
                      style: { color: "#FFC300" },
                    }}
                    InputLabelProps={{
                      style: { color: "#FFC300" },
                    }}
                  />
                </Box>
                <Box padding="5px">
                  <TextField
                    label="Name"
                    placeholder="Meeting Name..."
                    value={newMeeting.name}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, name: e.target.value })
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: colors.grey[300], // Outline color when not focused
                        },
                        "&:hover fieldset": {
                          borderColor: "#FFD60A", // Outline color on hover
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#FFC300", // Outline color when focused
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: colors.grey[500], // Label color
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: colors.blueAccent[600], // Label color when focused
                      },
                      color: colors.grey[100],
                    }}
                    InputProps={{
                      style: { color: "#FFC300" },
                    }}
                    InputLabelProps={{
                      style: { color: "#FFC300" },
                    }}
                  />
                </Box>
                <Box padding="5px">
                  <TextField
                    label="Date"
                    placeholder="YYYY-MM-DD"
                    value={newMeeting.date}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, date: e.target.value })
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: colors.grey[300], // Outline color when not focused
                        },
                        "&:hover fieldset": {
                          borderColor: "#FFD60A", // Outline color on hover
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#FFC300", // Outline color when focused
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: colors.grey[500], // Label color
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: colors.blueAccent[600], // Label color when focused
                      },
                      color: colors.grey[100],
                    }}
                    InputProps={{
                      style: { color: "#FFC300" },
                    }}
                    InputLabelProps={{
                      // style: { color: colors.grey[500] },
                      style: { color: "#FFC300" },
                    }}
                  />
                </Box>

                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  padding="20px"
                >
                  <Box padding="5px">
                    <input
                      accept="audio/*"
                      style={{ display: "none" }}
                      id="upload-audio"
                      type="file"
                      onChange={handleAudioUpload}
                    />
                    <label htmlFor="upload-audio">
                      <Button
                        variant="contained"
                        component="span"
                        sx={{
                          bgcolor: "#FFC300",
                          color: "#000814",
                          minWidth: 200,
                          "&:hover": {
                            bgcolor: "#FFD60A",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        Upload Audio
                      </Button>
                    </label>
                  </Box>
                  {audioFile && (
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      mt="20px"
                    >
                      <Typography sx={{ color: colors.grey[100] }}>
                        {audioFile.name}
                      </Typography>
                      <audio
                        controls
                        src={audioURL}
                        style={{ marginTop: "10px" }}
                      >
                        Your browser does not support the audio element.
                      </audio>
                      <Button
                        onClick={handleAudioRemove}
                        sx={{
                          mt: 2,
                          bgcolor: "#FFC300",
                          color: "#000814",
                          minWidth: 200,
                          "&:hover": {
                            bgcolor: "#FFD60A",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        Remove Audio
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Save and Cancel buttons */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <Button
                    onClick={handleSaveMeeting}
                    sx={{
                      ml: 2,
                      bgcolor: "#FFC300",
                      color: "#000814",
                      minWidth: 200,
                      "&:hover": {
                        bgcolor: "#FFD60A",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    Save Meeting
                  </Button>

                  <Button
                    onClick={handleCancel}
                    sx={{
                      ml: 2,
                      bgcolor: "transparent",
                      border: "1px solid #FFD60A",
                      color: "#FFD60A",
                      minWidth: 200,
                      "&:hover": {
                        // bgcolor: "#FFC300",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
          {/* //New meeting add container */}

          {speakerListLoad && (
            <Box
              className="speakers list"
              display="flex"
              alignItems="center"
              padding="0px"
            >
              <Box display="flex" flexDirection="column">
                <Box
                  sx={{
                    ml: 2,
                    borderRadius: "5%",
                    border: `1px solid ${"#a3a3a3"}`,
                    height: "100%",
                    maxHeight: "80px",
                  }}
                >
                  <Typography variant="h6" sx={{ ml: 2, color: "#a3a3a3" }}>
                    Speakers List:
                  </Typography>

                  <Box display="flex" gap={1}>
                    {Object.entries(speakers).map(([speaker, count]) => (
                      <Box key={speaker} textAlign="center">
                        {editingSpeaker === speaker ? (
                          <TextField
                            variant="outlined"
                            value={speakerNames[speaker]}
                            onChange={(e) =>
                              handleSpeakerNameChange(e, speaker)
                            }
                            onBlur={() => handleSpeakerNameBlur(speaker)}
                            autoFocus
                            sx={{
                              mb: 1,
                              bgcolor: colors.grey[500],
                              color: colors.grey[800],
                            }}
                            inputProps={{ style: { color: colors.grey[100] } }}
                          />
                        ) : (
                          <>
                            <IconButton
                              onClick={() => handleEditSpeaker(speaker)}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "#a3a3a3",
                                  color: "#2a2d64",
                                  border: `1px solid ${"#2a2d64"}`,
                                }}
                              >
                                {speakerNames[speaker] === speaker
                                  ? speaker.match(/\d+/)[0]
                                  : speakerNames[speaker] &&
                                    speakerNames[speaker][0]}
                              </Avatar>
                            </IconButton>
                            {/* <Typography>
                        {speakerNames[speaker] || speaker}
                      </Typography> */}
                            {showDetails && (
                              <>{/* <Typography>{count}</Typography> */}</>
                            )}
                          </>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* )} */}
            </Box>
          )}
          {/* Speaker list */}

          <Box className="Meeting Select Menu">
            <Select
              value={selectedMeetingId}
              onChange={handleMeetingSelect}
              displayEmpty
              sx={{
                ml: 2,
                color: "#FFC300",
                padding: 2,
                borderRadius: 2,
                border: `1px solid ${"#FFC300"}`,
                height: "100%",
                maxHeight: "60px",
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    "& .MuiMenuItem-root": {
                      color: "#FFC300",
                    },
                  },
                },
              }}
            >
              <MenuItem value="">
                <span style={{ fontStyle: "normal", color: "#FFC300" }}>
                  Select a meeting
                </span>
              </MenuItem>
              {/* {meetings.map((meeting) => (
                <MenuItem
                  key={meeting.id}
                  value={meeting.id}
                  style={{ color: "#858585" }}
                >
                  {meeting.name}
                </MenuItem>
              ))} */}
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map((meeting) => (
                  <MenuItem
                    key={meeting.id}
                    value={meeting.id}
                    style={{ color: "#858585" }}
                  >
                    {meeting.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  <span style={{ color: "#858585" }}>
                    No matching meetings found
                  </span>
                </MenuItem>
              )}
            </Select>
          </Box>
          {/* Meeting Select Menu */}
        </Box>
        {/* Add meeting and select */}
      </Box>
      {/* Header */}

      <ReactGridLayout
        className="layout"
        rowHeight={30}
        cols={12}
        width={1200}
        draggableHandle=".drag-handle"
        isResizable
      >
        {minimizedComponents.map((component) => {
          if (component.key === "audio" && component.isActive) {
            return (
              <div key="audio" data-grid={{ x: 0, y: 24, w: 12, h: 5 }}>
                <AudioPlayerComponent
                  audioURL={audioURL}
                  audioFileName={audioFile ? audioFile.name : ""}
                  onSeekBar={handleSeekBar}
                  toggleComponent={toggleComponent}
                />
              </div>
            );
          }

          if (component.key === "streamgraph" && component.isActive) {
            const handleSpeakerChange = async (event) => {
              setSelectedItem(event.target.value);
              // setSelectedItem("speakers");
              setDataType("speakers");
              setIsSpeakerSelected(true);
              console.log("Transcript sent to 5017", transcript);
            };

            const handleTopicChange = async (event) => {
              setSelectedItem(event.target.value);
              setDataType("topics");
              setIsSpeakerSelected(false);

              console.log(
                "Transcript sent to 5015 for topic generation",
                bertTranscript
              );

              if (cachedTopicData) {
                console.log("Using cached topic data");
                // setTopics(cachedTopicData); // Use the cached data
                // handleItemsLoaded(cachedTopicData);
                return;
              }
            };

            const handleItemsLoaded = (loadedItems) => {
              setTopics(loadedItems);
            };

            return (
              <div key="streamGraph" data-grid={{ x: 0, y: 0, w: 12, h: 12 }}>
                <StreamGraphComponent
                  selectedItem={selectedItem}
                  setSelectedItem={setSelectedItem}
                  dataType={dataType}
                  handleItemsLoaded={handleItemsLoaded}
                  topics={topics}
                  isSpeakerSelected={isSpeakerSelected}
                  handleSpeakerChange={handleSpeakerChange}
                  handleTopicChange={handleTopicChange}
                  toggleComponent={toggleComponent}
                  component={component}
                  speakerNames={speakerNames}
                  meeting_id={selectedMeetingId}
                  transcript={transcript}
                  bertTranscript={bertTranscript}
                />
              </div>
            );
          }

          if (component.key === "radar" && component.isActive) {
            const emojiToLabelMap = {
              "😁": "Joy 😁",
              "😱": "Surprise 😱",
              " ": "Neutral 😐",
              "😡": "Anger 😡",
              "😰": "Sadness 😰",
              "👿": "Anxious 👿",
            };

            const emotionCounts = {
              "Joy 😁": 0,
              "Surprise 😱": 0,
              // "Neutral 😐": 0,
              "Anger 😡": 0,
              "Sadness 😰": 0,
              "Anxious 👿": 0,
            };

            emojiPredictions.forEach((pred) => {
              if (pred.emoji && emojiToLabelMap[pred.emoji]) {
                const label = emojiToLabelMap[pred.emoji];
                emotionCounts[label]++;
              }
            });

            const maxCount = Math.max(...Object.values(emotionCounts));
            const normalize = (count) =>
              maxCount ? (count / maxCount) * 5 : 0;
            const normalizedEmotionData =
              Object.values(emotionCounts).map(normalize);

            console.log(
              "--- Normal Emotion Data : --- \n ",
              normalizedEmotionData
            );

            console.log(
              "Rendering RadarChartComponent with the following props:"
            );
            console.log("emojiPredictions:", emojiPredictions);
            console.log("theme:", theme);
            console.log("colors:", colors);
            console.log("toggleComponent:", toggleComponent);
            console.log("handleEmotionClick:", handleEmotionClick);

            return (
              <div key="radar" data-grid={{ x: 6, y: 12, w: 3, h: 12 }}>
                <RadarChartComponent
                  emojiPredictions={emojiPredictions}
                  theme={theme}
                  colors={colors}
                  toggleComponent={toggleComponent}
                  handleEmotionClick={handleEmotionClick}
                />
              </div>
            );
          }

          if (component.key === "chord" && component.isActive) {
            return (
              <div key="chord" data-grid={{ x: 9, y: 12, w: 3, h: 12 }}>
                <ChordDiagram
                  data={chordData}
                  colors={colors}
                  theme={theme}
                  toggleComponent={toggleComponent}
                  speakerNames={speakerNames}
                />
              </div>
            );
          }

          if (component.key === "post-transcript" && component.isActive) {
            return (
              <div
                key="post-transcript"
                data-grid={{ x: 0, y: 12, w: 6, h: 12 }}
              >
                <TranscriptComponent
                  selectedLanguageTranscript={selectedLanguageTranscript}
                  setSelectedLanguageTranscript={setSelectedLanguageTranscript}
                  transcript={transcript}
                  setTranscript={setTranscript}
                  seekTimestamp={seekTimestamp}
                  originalTranscript={originalTranscript}
                  searchQueryTranscript={searchQueryTranscript}
                  setSearchQueryTranscript={setSearchQueryTranscript}
                  loadingTranscript={loadingTranscript}
                  setLoadingTranscript={setLoadingTranscript}
                  speakerNames={speakerNames}
                  handleSearch={handleSearch}
                  toggleComponent={toggleComponent}
                  convertMarkdownToHTML={convertMarkdownToHTML}
                  extractAnnotations={extractAnnotations}
                  handleLanguageChange={handleLanguageChange}
                  colors={colors}
                  meetingId={selectedMeetingId}
                  emojiPredictions={emojiPredictions}
                  highlightedEmotion={highlightedEmotion}
                />
              </div>
            );
          }

          if (component.key === "summary" && component.isActive) {
            return (
              <div key="summary" data-grid={{ x: 0, y: 29, w: 6, h: 12 }}>
                <SummaryComponent
                  selectedLanguageSummary={selectedLanguageSummary}
                  setSelectedLanguageSummary={setSelectedLanguageSummary}
                  summary={summary}
                  searchQuerySummary={searchQuerySummary}
                  setSearchQuerySummary={setSearchQuerySummary}
                  loadingSummary={loadingSummary}
                  handleSearch={handleSearch}
                  handleLanguageChange={handleLanguageChange}
                  toggleComponent={toggleComponent} // Pass your toggleComponent function
                  colors={colors} // Pass the colors from your theme
                />
              </div>
            );
          }

          if (component.key === "actions" && component.isActive) {
            return (
              <div key="actions" data-grid={{ x: 6, y: 29, w: 6, h: 12 }}>
                <ActionItemsComponent
                  selectedLanguageActionItems={selectedLanguageActionItems}
                  setSelectedLanguageActionItems={
                    setSelectedLanguageActionItems
                  }
                  actionItems={actionItems}
                  searchQueryActionItems={searchQueryActionItems}
                  setSearchQueryActionItems={setSearchQueryActionItems}
                  loadingActionItems={loadingActionItems}
                  handleSearch={handleSearch}
                  handleLanguageChange={handleLanguageChange}
                  toggleComponent={toggleComponent} // Pass your toggleComponent function
                  colors={colors} // Pass the colors from your theme
                />
              </div>
            );
          }

          return null;
        })}
      </ReactGridLayout>
    </Box>
    // Main container
  );
};

export default PostMeeting;
