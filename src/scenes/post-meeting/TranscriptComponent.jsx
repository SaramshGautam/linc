import React, { useState, useEffect, useRef } from "react";
import { tokens } from "../../theme";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Paper,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import axios from "axios";

const TranscriptComponent = ({
  selectedLanguageTranscript,
  setSelectedLanguageTranscript,
  transcript,
  seekTimestamp,
  setTranscript,
  originalTranscript,
  searchQueryTranscript,
  setSearchQueryTranscript,
  loadingTranscript,
  setLoadingTranscript,
  speakerNames,
  handleSearch,
  toggleComponent,
  convertMarkdownToHTML,
  extractAnnotations,
  handleLanguageChange,
  meetingId,
  setSpeakerNames,
  highlightedEmotion,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const lineRefs = useRef([]);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [searchIndex, setSearchIndex] = useState(-1);

  const emojiToUnicodeMap = {
    "😁 ": { unicode: "\uf118", color: "#ffd700", backgroundColor: "#ffeb3b" }, // Joy
    "😱 ": { unicode: "\uf5c2", color: "#1aa82b" }, // Surprise
    "😡 ": { unicode: "\uf556", color: "red" }, // Anger
    "😰 ": { unicode: "\uf5b4", color: "#2a5298" }, // Sadness
    "👿 ": { unicode: "\uf5c8", color: "orange" }, // Anxious
    // Add more mappings as needed
  };

  useEffect(() => {
    if (seekTimestamp && lineRefs.current.length > 0) {
      const targetLine = lineRefs.current.find(
        (ref) => ref && ref.dataset && ref.dataset.timestamp === seekTimestamp
      );

      if (targetLine) {
        setHighlightedLine(seekTimestamp);
        targetLine.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [seekTimestamp]);

  useEffect(() => {
    if (highlightedEmotion && lineRefs.current.length > 0) {
      const targetIndex = lineRefs.current.findIndex(
        (ref) => ref && ref.dataset && ref.dataset.icon === highlightedEmotion
      );
      if (targetIndex !== -1) {
        lineRefs.current[targetIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [highlightedEmotion]);

  const handleArrowNavigation = (direction) => {
    if (!searchQueryTranscript) return;

    const searchResults = lineRefs.current.filter(
      (ref) =>
        ref &&
        ref.innerText
          .toLowerCase()
          .includes(searchQueryTranscript.toLowerCase())
    );

    if (searchResults.length > 0) {
      let newIndex = searchIndex;

      if (direction === "up") {
        newIndex =
          (searchIndex - 1 + searchResults.length) % searchResults.length;
      } else if (direction === "down") {
        newIndex = (searchIndex + 1) % searchResults.length;
      }

      setSearchIndex(newIndex);
      // setHighlightedLine(searchResults[newIndex].dataset.timestamp);

      searchResults[newIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const renderTranscript = () => {
    if (!transcript) {
      return "No transcript available.";
    }

    const highlightText = (text, query) => {
      if (!query) return text;
      const parts = text.split(new RegExp(`(${query})`, "gi"));
      return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span
            key={index}
            style={{ backgroundColor: "yellow", color: "black" }}
          >
            {part}
          </span>
        ) : (
          part
        )
      );
    };

    const transcriptLines = transcript.split(/\r?\n/);

    return transcriptLines.map((line, index) => {
      const match = line.match(
        /^(.*?)(\[(\d{2}:\d{2})-\d{2}:\d{2}\])?\s*(\((.*?)\))?\s*:(.*)?$/
      );

      if (match) {
        const [, emoji, , startTime, , speaker, text] = match;

        const displayedTime = startTime ? startTime : "Unknown Time";
        const displayedSpeaker = speaker ? speaker : "Unknown";

        const fontAwesomeIconData = emoji ? emojiToUnicodeMap[emoji] : null;
        const fontAwesomeIcon = fontAwesomeIconData
          ? fontAwesomeIconData.unicode
          : "";
        const iconColor = fontAwesomeIconData ? fontAwesomeIconData.color : "";

        const shouldHighlight =
          highlightedEmotion && fontAwesomeIcon === highlightedEmotion;

        const isCurrentlyHighlighted = highlightedLine === displayedTime;

        return (
          <React.Fragment key={index}>
            {/* Start Time and Speaker */}
            <div
              style={{
                fontSize: "12px",
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.6)"
                    : "rgba(0, 0, 0, 0.6)",
                marginBottom: "2px",
                borderBottom: "2px solid rgba(0, 0, 0, 0.6)",
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.6)"
                    : "rgba(0, 0, 0, 0.6)",
                justifyContent: "space-between",
                width: "120px",
              }}
            >
              {displayedTime} : {displayedSpeaker}
            </div>
            {/* Transcript Text with Font Awesome Icon */}
            <div
              ref={(el) => (lineRefs.current[index] = el)}
              data-timestamp={displayedTime}
              data-icon={fontAwesomeIcon}
              style={{
                fontSize: "18px",
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.87)"
                    : "rgba(0, 0, 0, 0.87)",
                marginBottom: "8px",
                fontFamily: "'Helvetica', sans-serif",
                borderBottom: shouldHighlight ? "2px solid grey" : "none",
                backgroundColor: isCurrentlyHighlighted
                  ? "rgba(255, 255, 0, 0.3)" // Highlight color
                  : "transparent",
              }}
            >
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
              {text ? highlightText(text.trim(), searchQueryTranscript) : ""}
            </div>
            <br />
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment key={index}>
            <div
              style={{
                fontSize: "18px",
                color: "rgba(0, 0, 0, 0.87)",
                marginBottom: "8px",
                fontFamily: "'Helvetica', sans-serif",
              }}
            >
              {highlightText(line.trim(), searchQueryTranscript)}
            </div>
            <br />
          </React.Fragment>
        );
      }
    });
  };

  const loadTranscript = async (meetingId) => {
    setLoadingTranscript(true);
    try {
      const transcriptResponse = await axios.get(
        `/api/transcripts/${meetingId}`
      );
      const transcriptText = transcriptResponse.data.transcript;

      setTranscript(transcriptText);
      setLoadingTranscript(false);
    } catch (error) {
      setLoadingTranscript(false);
    }
  };

  useEffect(() => {
    if (meetingId) {
      loadTranscript(meetingId);
    }
  }, [meetingId]);

  return (
    <Paper
      style={{
        height: "100%",
        overflow: "hidden",
        borderRadius: "8px",
        transition: "height 0.3s ease",
      }}
    >
      <Box
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "grab",
          borderBottom: `1px solid ${colors.grey[700]}`,
          padding: "10px 20px",
          borderRadius: "8px 8px 0 0",
          color: colors.grey[100],
        }}
      >
        <div className="drag-handle" style={{ display: "flex", flex: 1 }}>
          <div className="title">
            <Typography
              variant="h5"
              style={{
                color: colors.grey[100],
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "bold",
              }}
            >
              Meeting Transcript
            </Typography>
            <h5
              style={{
                margin: 0,
                padding: "0",
                lineHeight: "1.2",
                color: colors.grey[700],
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              Meeting's transcript in multiple languages
            </h5>
          </div>
        </div>

        <TextField
          variant="outlined"
          placeholder="Search..."
          value={searchQueryTranscript}
          onChange={(event) => {
            handleSearch(event, "transcript");
            setSearchIndex(-1); // Reset search index on new query
          }}
          size="small"
          sx={{
            ml: 2,
            mr: 2,
            bgcolor: colors.grey[700],
            color: colors.grey[100],
            "& .MuiInputBase-input": {
              color: colors.grey[100],
            },
          }}
          InputLabelProps={{
            style: { color: colors.grey[100] },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {searchQueryTranscript && (
          <Box sx={{ display: "flex", flexDirection: "column", m: 0, p: 0 }}>
            <IconButton
              onClick={() => handleArrowNavigation("up")}
              disabled={!searchQueryTranscript}
              // size="small"
            >
              <KeyboardArrowUpIcon sx={{ fontSize: 15 }} />
            </IconButton>
            <IconButton
              onClick={() => handleArrowNavigation("down")}
              disabled={!searchQueryTranscript}
              size="small"
            >
              <KeyboardArrowDownIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        )}

        <Select
          value={selectedLanguageTranscript}
          onChange={(event) => handleLanguageChange(event, "transcript")}
          displayEmpty
          sx={{
            // ml: 1,
            minWidth: 120,
            color: colors.grey[100],
            "& .MuiSelect-select": {
              color: colors.grey[100],
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.grey[100],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.grey[100],
            },
            "& .MuiSvgIcon-root": {
              color: colors.grey[100],
            },
          }}
          size="small"
          MenuProps={{
            PaperProps: {
              sx: {
                "& .MuiMenuItem-root": {
                  color: colors.grey[100],
                },
              },
            },
          }}
        >
          <MenuItem value="">
            <em>Select Language</em>
          </MenuItem>
          <MenuItem value="Original">Original</MenuItem>
          <MenuItem value="English">English</MenuItem>
          <MenuItem value="Spanish">Spanish</MenuItem>
          <MenuItem value="Mandarin">Mandarin</MenuItem>
          <MenuItem value="Arabic">Arabic</MenuItem>
          <MenuItem value="Hindi">Hindi</MenuItem>
        </Select>

        <IconButton
          onClick={() => toggleComponent("post-transcript")}
          style={{ position: "relative", zIndex: 1000 }}
        >
          <HighlightOffIcon />
        </IconButton>
      </Box>
      <Box
        style={{
          maxHeight: "80%",
          overflowY: "auto",
          padding: "10px",
          color: colors.grey[100],
        }}
      >
        <Typography sx={{ fontSize: "16px" }}>
          {loadingTranscript ? "Loading..." : renderTranscript()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default TranscriptComponent;
