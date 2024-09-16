import React, { useState, useEffect, useRef, useContext } from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import {
  Box,
  useTheme,
  Paper,
  Button,
  Select,
  MenuItem,
  Typography,
  IconButton,
} from "@mui/material";
import io from "socket.io-client";
import Recorder from "recorder-js";
import wavEncoder from "wav-encoder";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { MinimizedContext } from "../../context/MinimizedContext";
import MemberManagement from "./MemberManagement";
import Transcript from "./Transcript";
import MultiTranscript from "./MultiTranscript";
import Speak from "./Speak";
import MultiSpeak from "./MultiSpeak";

import "./index.css";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ReactGridLayout = WidthProvider(RGL);

const RealTimeMeeting = () => {
  const theme = useTheme();
  const [displayedTranscript, setDisplayedTranscript] = useState([]);
  const [recording, setRecording] = useState(false);
  const [meetingTime, setMeetingTime] = useState(0);
  const [translatedText, setTranslatedText] = useState([]);
  const [selectedTranscriptLanguage, setSelectedTranscriptLanguage] =
    useState("");
  const [selectedSpeakLanguage, setSelectedSpeakLanguage] = useState("");
  const [pushToSpeakLanguage, setPushToSpeakLanguage] = useState("");
  const [pushToSpeakStartTime, setPushToSpeakStartTime] = useState(null);
  const [originalTranscript, setOriginalTranscript] = useState([]);
  const [audioBlobUrl, setAudioBlobUrl] = useState("");
  const [pushToSpeakTranscript, setPushToSpeakTranscript] = useState([]);
  const [multiSpeakTranscript, setMultiSpeakTranscript] = useState([]);
  const [isPushToSpeakActive, setIsPushToSpeakActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [countdownEnded, setCountdownEnded] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const [isTranscriptLanguageSelected, setIsTranscriptLanguageSelected] =
    useState(false);

  const normalRecorderRef = useRef(null);
  const pushToSpeakRecorderRef = useRef(null);

  const audioContextRef = useRef(null);
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const allAudioChunksRef = useRef([]);
  const pushToSpeakChunksRef = useRef([]);

  const transcriptionSocket = useRef(null);
  const pushToSpeakSocket = useRef(null);
  const translationSocket = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const transcriptRef = useRef(null);
  const multiTranscriptRef = useRef(null);
  const pushToSpeakRef = useRef(null);
  const multiSpeakRef = useRef(null);

  const { minimizedComponents, toggleComponent } = useContext(MinimizedContext);

  const autoScroll = useRef({
    transcript: true,
    multiTranscript: true,
    pushToSpeak: true,
    multiSpeak: true,
  });

  const adjustTimestamp = (startTime, offset, isPushtoSpeak = false) => {
    const baseTime = isPushtoSpeak ? pushToSpeakStartTime : startTime;

    const [minutes, seconds] = offset.split(":").map(Number);
    const offsetInSeconds = minutes * 60 + seconds;

    const adjustedTimeInSeconds = baseTime + offsetInSeconds;
    const adjustedMinutes = Math.floor(adjustedTimeInSeconds / 60);
    const adjustedSeconds = adjustedTimeInSeconds % 60;
    const formattedAdjustedTime = `${String(adjustedMinutes).padStart(
      2,
      "0"
    )}:${String(adjustedSeconds).padStart(2, "0")}`;

    console.log(
      `Adjusting timestamp: startTime = ${startTime}, offset = ${offset}, adjustedTime = ${formattedAdjustedTime}`
    );

    return formattedAdjustedTime;
  };

  useEffect(() => {
    transcriptionSocket.current = io("ws://localhost:5010");
    pushToSpeakSocket.current = io("ws://localhost:5010");
    translationSocket.current = io("ws://localhost:5010");

    transcriptionSocket.current.on("connect", () => {
      console.log("Connected to Transcription WebSocket");
    });

    transcriptionSocket.current.on("transcript", (data) => {
      if (!data || !Array.isArray(data)) {
        return;
      }

      const adjustedData = data.map(({ start, end, text, emoji }) => {
        const adjustedStart = adjustTimestamp(meetingTime, start);
        const adjustedEnd = adjustTimestamp(meetingTime, end);
        console.log(
          `Transcript received: start = ${start}, end = ${end}, adjustedStart = ${adjustedStart}, adjustedEnd = ${adjustedEnd}, text = ${text}`
        );
        return { start: adjustedStart, end: adjustedEnd, text, emoji };
      });

      if (!isPushToSpeakActive) {
        setDisplayedTranscript((prevTranscript) => [
          ...prevTranscript,
          ...adjustedData,
          // ...formattedTranscript,
        ]);
        handleTranslateText(
          selectedTranscriptLanguage,
          adjustedData,
          setTranslatedText
        );
      }
      setOriginalTranscript((prevOriginal) => [
        ...prevOriginal,
        ...adjustedData,
        // ...formattedTranscript,
      ]);
    });

    transcriptionSocket.current.on("disconnect", () => {
      console.log("Disconnected from Transcription WebSocket");
    });

    pushToSpeakSocket.current.on("connect", () => {
      console.log("Connected to Push-To-Speak WebSocket");
    });

    pushToSpeakSocket.current.on("transcript", (data) => {
      if (!data || !Array.isArray(data)) {
        alert("Please try that again!!");
        return;
      }

      const adjustedData = data.map(({ start, end, text, emoji }) => {
        const adjustedStart = adjustTimestamp(meetingTime, start);
        const adjustedEnd = adjustTimestamp(meetingTime, end);
        console.log(
          `Push-To-Speak received: start = ${start}, end = ${end}, adjustedStart = ${adjustedStart}, adjustedEnd = ${adjustedEnd}, text = ${text}`
        );
        return { start: adjustedStart, end: adjustedEnd, text, emoji };
      });

      const formattedTranscript = adjustedData.map(
        // ({ text, emoji }) => `${text.trim()} ${emoji}`
        ({ start, end, text, emoji }) => `[${start}]: ${text.trim()} ${emoji}`
      );

      setPushToSpeakTranscript((prevTranscript) => [
        ...prevTranscript,
        ...adjustedData,
      ]);
      handleTranslateText(
        selectedSpeakLanguage,
        adjustedData,
        setMultiSpeakTranscript,
        "object"
      );

      setOriginalTranscript((prevOriginal) => [
        ...prevOriginal,
        ...adjustedData,
      ]);

      setIsTranscribing(false);
    });

    pushToSpeakSocket.current.on("disconnect", () => {
      console.log("Disconnected from Push-To-Speak WebSocket");
    });

    translationSocket.current.on("connect", () => {
      console.log("Connected to Translation WebSocket");
    });

    translationSocket.current.on("translation", (data) => {
      if (!data || !Array.isArray(data)) {
        return;
      }
      // appendEmojiToTranslation(data);
    });

    translationSocket.current.on("disconnect", () => {
      console.log("Disconnected from Translation WebSocket");
    });

    return () => {
      transcriptionSocket.current.disconnect();
      pushToSpeakSocket.current.disconnect();
      translationSocket.current.disconnect();
    };
  }, [selectedTranscriptLanguage, selectedSpeakLanguage, isPushToSpeakActive]);

  useEffect(() => {
    // This useEffect will run whenever the theme changes, triggering a re-render
    setDisplayedTranscript([...displayedTranscript]);
    setPushToSpeakTranscript([...pushToSpeakTranscript]);
  }, [theme.palette.mode]); // Depend on the theme mode

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "KeyM" && !isPushToSpeakActive && !countdownEnded) {
        startPushToSpeakRecording();
        // setShowRecordingPopup(true);
        startCountdown();
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === "KeyM" && isPushToSpeakActive) {
        if (countdownEnded) {
          event.preventDefault();
          event.stopPropagation();
          setCountdownEnded(false);
        } else {
          stopPushToSpeakRecording();
          // setShowRecordingPopup(false);
          clearCountdown();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPushToSpeakActive, countdownEnded]);

  const startCountdown = () => {
    setCountdown(6); // Start from 6 seconds
    countdownRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown === 1) {
          // stopPushToSpeakRecording();
          clearCountdown();
          setCountdownEnded(true);
          alert("Please try again. Keep sentences short.");
        }
        return prevCountdown - 1;
      });
    }, 1000); // Decrease countdown every second
  };

  const clearCountdown = () => {
    clearInterval(countdownRef.current);
    setCountdown(6);
  };

  const emojiToUnicodeMap = {
    "😊": { unicode: "\uf118", color: "#ffd700" }, // Joy
    "😱": { unicode: "\uf5c2", color: "#1aa82b" }, // Surprise
    "😡": { unicode: "\uf556", color: "red" }, // Anger
    "😰": { unicode: "\uf5b4", color: "#2a5298" }, // Sadness
    "👿": { unicode: "\uf5c8", color: "orange" }, // Anxious
  };

  const renderTranscript = (transcriptData) => {
    console.log("-- render transcript transcriptData -- ", transcriptData);
    return transcriptData.map(({ start, text, emoji }, index) => {
      const fontAwesomeIconData = emoji ? emojiToUnicodeMap[emoji] : null;
      const fontAwesomeIcon = fontAwesomeIconData
        ? fontAwesomeIconData.unicode
        : "";
      const iconColor = fontAwesomeIconData ? fontAwesomeIconData.color : "";
      return (
        <React.Fragment key={index}>
          <div
            style={{
              fontSize: "12px",
              color:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.6)"
                  : "rgba(0, 0, 0, 0.6)",
              marginBottom: "2px",
              borderBottom: "2px solid",
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.6)"
                  : "rgba(0, 0, 0, 0.6)",
              width: "30px",
            }}
          >
            {start}
          </div>
          <div
            data-icon={fontAwesomeIcon}
            style={{
              fontSize: "18px",
              color:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.87)"
                  : "rgba(0, 0, 0, 0.87)",
              marginBottom: "8px",
              fontFamily: "'Helvetica', sans-serif",
            }}
          >
            {text.trim()}
            {fontAwesomeIcon && (
              <span
                style={{
                  fontFamily: '"Font Awesome 5 Free"',
                  fontWeight: 900,
                  marginRight: "8px",
                  color: iconColor,
                }}
              >
                {fontAwesomeIcon}
              </span>
            )}
          </div>
        </React.Fragment>
      );
    });
  };

  const renderTranslatedText = (translatedData) =>
    translatedData.map(({ start, text }, index) => {
      console.log(`Processing item at index ${index}`);
      console.log(`Original text: ${text}`);

      // Regex to detect emojis
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;

      // Extract emojis from the text and replace them with Font Awesome icons
      const updatedText = text.replace(emojiRegex, (match) => {
        console.log(`Found emoji: ${match}`);
        const fontAwesomeIconData = emojiToUnicodeMap[match] || null;
        console.log(`Mapped FontAwesome data: `, fontAwesomeIconData);

        if (fontAwesomeIconData) {
          return `<span style="font-family: 'Font Awesome 5 Free'; font-weight: 900; color: ${fontAwesomeIconData.color};">${fontAwesomeIconData.unicode}</span>`;
        }
        return match; // Return the original emoji if no match found in the map
      });

      console.log(`Updated text: ${updatedText}`);

      return (
        <React.Fragment key={index}>
          <div
            style={{
              fontSize: "12px",
              color:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.6)"
                  : "rgba(0, 0, 0, 0.6)",
              marginBottom: "2px",
              borderBottom: "2px solid",
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.6)"
                  : "rgba(0, 0, 0, 0.6)",
              width: "30px",
            }}
          >
            {start}
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: updatedText }}
            style={{
              fontSize: "18px",
              color:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.87)"
                  : "rgba(0, 0, 0, 0.87)",
              marginBottom: "8px",
              fontFamily: "'Helvetica', sans-serif",
            }}
          ></div>
        </React.Fragment>
      );
    });

  // const renderPushToSpeakTranscript = (transcriptData) =>
  //   transcriptData.map(({ start, text }, index) => (
  //     <React.Fragment key={index}>
  //       <div
  //         style={{
  //           fontSize: "12px",
  //           color:
  //             theme.palette.mode === "dark"
  //               ? "rgba(255, 255, 255, 0.6)"
  //               : "rgba(0, 0, 0, 0.6)",
  //           marginBottom: "2px",
  //           borderBottom: "2px solid",
  //           borderColor:
  //             theme.palette.mode === "dark"
  //               ? "rgba(255, 255, 255, 0.6)"
  //               : "rgba(0, 0, 0, 0.6)",
  //           width: "30px",
  //         }}
  //       >
  //         {start}
  //       </div>
  //       <div
  //         style={{
  //           fontSize: "18px",
  //           color:
  //             theme.palette.mode === "dark"
  //               ? "rgba(255, 255, 255, 0.87)"
  //               : "rgba(0, 0, 0, 0.87)",
  //           marginBottom: "8px",
  //           fontFamily: "'Helvetica', sans-serif",
  //         }}
  //       >
  //         {text}

  //       </div>
  //     </React.Fragment>
  //   ));

  const renderPushToSpeakTranscript = (transcriptData) => {
    // Check if we're still transcribing
    const dataWithEllipsis = isTranscribing
      ? [...transcriptData, { start: "", text: "..." }]
      : transcriptData;

    return dataWithEllipsis.map(({ start, text }, index) => (
      <React.Fragment key={index}>
        <div
          style={{
            fontSize: "12px",
            color:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.6)"
                : "rgba(0, 0, 0, 0.6)",
            marginBottom: "2px",
            borderBottom: "2px solid",
            borderColor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.6)"
                : "rgba(0, 0, 0, 0.6)",
            width: "30px",
          }}
        >
          {start}
        </div>
        <div
          style={{
            fontSize: "18px",
            color:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.87)"
                : "rgba(0, 0, 0, 0.87)",
            marginBottom: "8px",
            fontFamily: "'Helvetica', sans-serif",
          }}
        >
          {text}
        </div>
      </React.Fragment>
    ));
  };

  // const renderMultiSpeakTranscript = (translatedData) =>
  //   // translatedData.map(({ start, text }, index) => (
  //   translatedData.map((line, index) => (
  //     <React.Fragment key={index}>
  //       <div
  //         style={{
  //           fontSize: "12px",
  //           color:
  //             theme.palette.mode === "dark"
  //               ? "rgba(255, 255, 255, 0.6)"
  //               : "rgba(0, 0, 0, 0.6)",
  //           marginBottom: "2px",
  //           borderBottom: "2px solid",
  //           borderColor:
  //             theme.palette.mode === "dark"
  //               ? "rgba(255, 255, 255, 0.6)"
  //               : "rgba(0, 0, 0, 0.6)",
  //           width: "30px",
  //         }}
  //       >
  //         {/* {start} */}
  //         {line.split("]: ")[0].replace("[", "")}
  //       </div>
  //       <div
  //         style={{
  //           fontSize: "18px",
  //           color:
  //             theme.palette.mode === "dark"
  //               ? "rgba(255, 255, 255, 0.87)"
  //               : "rgba(0, 0, 0, 0.87)",
  //           marginBottom: "8px",
  //           fontFamily: "'Helvetica', sans-serif",
  //         }}
  //       >
  //         {/* {text} */}
  //         {line.split("]: ")[1]}
  //       </div>
  //     </React.Fragment>
  //   ));

  const renderMultiSpeakTranscript = (translatedData) =>
    translatedData.map((line, index) => {
      console.log(`Processing item at index ${index}`);
      console.log(`Original text: ${line}`);

      // Regex to detect emojis
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;

      // Split the line into the speaker and text parts
      const speaker = line.split("]: ")[0].replace("[", "");
      const text = line.split("]: ")[1];

      // Extract emojis from the text and replace them with Font Awesome icons
      const updatedText = text.replace(emojiRegex, (match) => {
        console.log(`Found emoji: ${match}`);
        const fontAwesomeIconData = emojiToUnicodeMap[match] || null;
        console.log(`Mapped FontAwesome data: `, fontAwesomeIconData);

        if (fontAwesomeIconData) {
          return `<span style="font-family: 'Font Awesome 5 Free'; font-weight: 900; color: ${fontAwesomeIconData.color};">${fontAwesomeIconData.unicode}</span>`;
        }
        return match; // Return the original emoji if no match found in the map
      });

      console.log(`Updated text: ${updatedText}`);

      return (
        <React.Fragment key={index}>
          <div
            style={{
              fontSize: "12px",
              color:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.6)"
                  : "rgba(0, 0, 0, 0.6)",
              marginBottom: "2px",
              borderBottom: "2px solid",
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.6)"
                  : "rgba(0, 0, 0, 0.6)",
              width: "30px",
            }}
          >
            {speaker}
          </div>
          <div
            dangerouslySetInnerHTML={{ __html: updatedText }}
            style={{
              fontSize: "18px",
              color:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.87)"
                  : "rgba(0, 0, 0, 0.87)",
              marginBottom: "8px",
              fontFamily: "'Helvetica', sans-serif",
            }}
          ></div>
        </React.Fragment>
      );
    });

  const handleToggleRecording = async () => {
    if (isPushToSpeakActive) {
      return;
    }
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        normalRecorderRef.current = new Recorder(audioContextRef.current);

        normalRecorderRef.current.init(stream);

        normalRecorderRef.current.start().then(() => {
          setRecording(true);
          allAudioChunksRef.current = [];
          timerRef.current = setInterval(() => {
            setMeetingTime((prevTime) => prevTime + 1);
          }, 1000);
        });

        audioChunksRef.current = setInterval(() => {
          if (normalRecorderRef.current) {
            normalRecorderRef.current.stop().then(({ buffer }) => {
              sendAudioChunk(buffer, "english");
              allAudioChunksRef.current.push(buffer);
              normalRecorderRef.current.start();
            });
          }
        }, 3000);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else {
      if (normalRecorderRef.current) {
        clearInterval(audioChunksRef.current);
        clearInterval(timerRef.current);
        normalRecorderRef.current.stop().then(async ({ buffer }) => {
          sendAudioChunk(buffer, "english");
          allAudioChunksRef.current.push(buffer);

          const concatenatedBuffer = concatenateAudioChunks(
            allAudioChunksRef.current
          );
          const { encodedWav, blobUrl: fullBlobUrl } = await createBlobUrl(
            concatenatedBuffer
          );
          setAudioBlobUrl(fullBlobUrl);

          setRecording(false);
          normalRecorderRef.current = null;
        });
      }
    }
  };

  // Concatenate multiple audio buffers
  const concatenateAudioChunks = (chunks) => {
    // Calculate the total length of all buffers combined
    const totalLength = chunks.reduce(
      (acc, buffer) => acc + buffer[0].length,
      0
    );

    // Allocate a new array to hold all the data
    const result = new Float32Array(totalLength);

    // Interleave the buffers into the result array
    let offset = 0;
    chunks.forEach((buffer) => {
      result.set(buffer[0], offset);
      offset += buffer[0].length;
    });

    return [result];
  };

  // Generate the audio from the raw buffer to wav format
  const createBlobUrl = async (buffer) => {
    const encodedWav = await wavEncoder.encode({
      sampleRate: audioContextRef.current.sampleRate,
      channelData: buffer,
    });

    const wavBlob = new Blob([encodedWav], { type: "audio/wav" });
    const blobUrl = URL.createObjectURL(wavBlob);
    return { encodedWav, blobUrl };
  };

  // converts the audio from the raw buffer to wav format and sends it to the backend
  const sendAudioChunk = async (buffer, language) => {
    try {
      const encodedWav = await wavEncoder.encode({
        sampleRate: audioContextRef.current.sampleRate,
        channelData: buffer,
      });

      const wavBlob = new Blob([encodedWav], { type: "audio/wav" });
      if (isPushToSpeakActive) {
        return;
      } else {
        transcriptionSocket.current.emit("audio", { wavBlob, language });
      }
      buffer = null;
    } catch (error) {
      console.error("Error sending audio chunk:", error);
    }
  };

  const startPushToSpeakRecording = async () => {
    if (!isPushToSpeakActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        // audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        pushToSpeakRecorderRef.current = new Recorder(audioContextRef.current);

        pushToSpeakRecorderRef.current.init(stream);

        pushToSpeakRecorderRef.current.start().then(() => {
          setIsPushToSpeakActive(true);
          // setIsTranscribing(true);
        });
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }
  };

  const stopPushToSpeakRecording = async () => {
    if (pushToSpeakRecorderRef.current) {
      try {
        pushToSpeakRecorderRef.current.stop().then(async ({ buffer }) => {
          await sendAudioChunksPushToSpeak(buffer, pushToSpeakLanguage);
          pushToSpeakChunksRef.current.push(buffer);
          buffer = null;
          setIsTranscribing(true);
          pushToSpeakChunksRef.current = [];
        });
      } catch (error) {
        console.error("Error stopping push-to-speak recording:", error);
      } finally {
        setIsPushToSpeakActive(false);
      }
    }
  };

  const sendAudioChunksPushToSpeak = async (buffer, language) => {
    try {
      const encodedWav = await wavEncoder.encode({
        sampleRate: audioContextRef.current.sampleRate,
        channelData: buffer,
      });

      const wavBlob = new Blob([encodedWav], { type: "audio/wav" });

      pushToSpeakSocket.current.emit("audio", { wavBlob, language });
      buffer = null;

      // if (pushToSpeakSocket.current.connected) {
      //   pushToSpeakSocket.current.emit("audio", { wavBlob, language });
      //   console.log("Audio data sent to server.");
      //   buffer = null;
      // } else {
      //   console.error("Push-to-speak socket is not connected.");
      // }
      // pushToSpeakChunksRef.current.push(buffer);
    } catch (error) {
      console.error("Error sending audio chunk:", error);
    }
  };

  const handleTranslateText = async (
    language,
    transcriptData,
    updateTranscript,
    formatType = "default"
  ) => {
    const textWithEmoji = transcriptData.map(({ start, text, emoji }) => ({
      start,
      text: `${text} ${emoji}`,
    }));

    translationSocket.current.emit("translate", {
      text: textWithEmoji,
      to: language,
    });

    const translationHandler = (data) => {
      if (!data || !Array.isArray(data)) {
        return;
      }
      // const formattedTranslation = data.map(
      //   ({ start, end, text }) => `[${start}]: ${text.trim()}`
      // );

      // const formattedTranslation = data.map(({ start, end, text }) => ({
      //   start,
      //   text: text.trim(),
      // }));
      let formattedTranslation;

      if (formatType === "default") {
        formattedTranslation = data.map(({ start, end, text }) => ({
          start,
          text: text.trim(),
        }));
      } else if (formatType === "object") {
        formattedTranslation = data.map(
          ({ start, end, text }) => `[${start}]: ${text.trim()}`
        );
      }

      updateTranscript((prevTranscript) => [
        ...prevTranscript,
        ...formattedTranslation,
      ]);
    };

    translationSocket.current.once("translation", translationHandler);

    return () => {
      translationSocket.current.off("translation", translationHandler);
    };
  };

  const handleTranscriptLanguageChange = async (event) => {
    const language = event.target.value;
    setSelectedTranscriptLanguage(language);
    setIsTranscriptLanguageSelected(true); // Set language as selected
  };

  const handleSpeakLanguageChange = async (event) => {
    const language = event.target.value;
    setSelectedSpeakLanguage(language);
    // setIsMultiPushToSpeakLanguageSelected(true);
  };

  const handlePushToSpeakLanguageChange = async (event) => {
    const language = event.target.value;
    setPushToSpeakLanguage(language);
    // setIsPushToSpeakLanguageSelected(true);
  };

  const handleScroll = (type) => {
    if (
      !transcriptRef.current &&
      !multiTranscriptRef.current &&
      !pushToSpeakRef.current &&
      !multiSpeakRef.current
    )
      return;
    const refs = {
      transcript: transcriptRef,
      multiTranscript: multiTranscriptRef,
      pushToSpeak: pushToSpeakRef,
      multiSpeak: multiSpeakRef,
    };
    const ref = refs[type];
    if (!ref || !ref.current) return;
    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    autoScroll.current[type] = scrollHeight - scrollTop === clientHeight;
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
      >
        <Box className="DashBoard Name">
          <Header
            title="REAL TIME MEETING DASHBOARD"
            subtitle="Welcome to your dashboard"
          ></Header>
        </Box>
        {/* DashBoard Name */}

        <Box className="Member Management">
          <MemberManagement
            recording={recording}
            handleToggleRecording={handleToggleRecording}
            meetingTime={meetingTime}
            audioBlobUrl={audioBlobUrl}
            // isTranscriptLanguageSelected={isTranscriptLanguageSelected}
            selectedTranscriptLanguage={selectedTranscriptLanguage}
          />
        </Box>
        {/* Member Management */}
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
          if (component.key === "transcript" && component.isActive) {
            return (
              <div
                className="Transcript"
                key="transcript"
                data-grid={{
                  x: 0,
                  y: 0,
                  w: 6,
                  h: 11,
                  isResizable: true,
                  resizeHandles: ["se"],
                }}
              >
                <Transcript
                  // key="transcript"
                  displayedTranscript={renderTranscript(displayedTranscript)}
                  toggleComponent={toggleComponent}
                  transcriptRef={transcriptRef}
                  handleScroll={handleScroll}
                />
              </div>
            );
          }

          if (component.key === "multi-transcript" && component.isActive) {
            return (
              <div
                className="MultiTranscript"
                key="multi-transcript"
                data-grid={{
                  x: 6,
                  y: 0,
                  w: 6,
                  h: 11,
                  isResizable: true,
                  resizeHandles: ["se"],
                }}
              >
                <MultiTranscript
                  key="multi-transcript"
                  translatedText={renderTranslatedText(translatedText)}
                  selectedTranscriptLanguage={selectedTranscriptLanguage}
                  handleTranscriptLanguageChange={
                    handleTranscriptLanguageChange
                  }
                  toggleComponent={toggleComponent}
                  multiTranscriptRef={multiTranscriptRef}
                  handleScroll={handleScroll}
                />
              </div>
            );
          }

          if (component.key === "speak" && component.isActive) {
            return (
              <div
                className="Speak"
                key="speak"
                data-grid={{
                  x: 0,
                  y: 10,
                  w: 6,
                  h: 11,
                  isResizable: true,
                  resizeHandles: ["se"],
                }}
              >
                <Speak
                  pushToSpeakLanguage={pushToSpeakLanguage}
                  selectedSpeakLanguage={selectedSpeakLanguage}
                  handlePushToSpeakLanguageChange={
                    handlePushToSpeakLanguageChange
                  }
                  // isPushToSpeakLanguageSelected={isPushToSpeakLanguageSelected}
                  // isMultiPushToSpeakLanguageSelected={
                  //   isMultiPushToSpeakLanguageSelected
                  // }
                  startPushToSpeakRecording={startPushToSpeakRecording}
                  stopPushToSpeakRecording={stopPushToSpeakRecording}
                  toggleComponent={toggleComponent}
                  pushToSpeakTranscript={renderPushToSpeakTranscript(
                    pushToSpeakTranscript
                  )}
                  pushToSpeakRef={pushToSpeakRef}
                  handleScroll={handleScroll}
                  isPushToSpeakActive={isPushToSpeakActive}
                />
              </div>
            );
          }

          if (component.key === "multi-speak" && component.isActive) {
            return (
              <div
                className="MultiSpeak"
                key="multi-speak"
                data-grid={{
                  x: 6,
                  y: 10,
                  w: 6,
                  h: 11,
                  isResizable: true,
                  resizeHandles: ["se"],
                }}
              >
                <MultiSpeak
                  // multiSpeakTranscript={multiSpeakTranscript}
                  multiSpeakTranscript={renderMultiSpeakTranscript(
                    multiSpeakTranscript
                  )}
                  selectedSpeakLanguage={selectedSpeakLanguage}
                  handleSpeakLanguageChange={handleSpeakLanguageChange}
                  toggleComponent={toggleComponent}
                  multiSpeakRef={multiSpeakRef}
                  handleScroll={handleScroll}
                />
              </div>
            );
          }

          return null;
        })}
      </ReactGridLayout>
    </Box>
  );
};

export default RealTimeMeeting;
