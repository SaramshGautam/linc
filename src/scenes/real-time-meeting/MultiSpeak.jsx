import React from "react";
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  IconButton,
  useTheme,
} from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { tokens } from "../../theme";

const MultiSpeak = ({
  multiSpeakTranscript,
  selectedSpeakLanguage,
  handleSpeakLanguageChange,
  toggleComponent,
  multiSpeakRef,
  handleScroll,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Paper
      style={{
        height: "100%",
        overflow: "hidden",
        borderRadius: "8px",
        transition: "height 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "grab",
          borderBottom: `1px solid ${colors.grey[700]}`,
          padding: "10px 20px",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <div
          className="drag-handle"
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            cursor: "grab",
            color: theme.palette.text.primary,
          }}
        >
          {/* <Typography variant="h6" style={{ color: colors.grey[100] }}>
            Multilingual Transcript of the Push to Speak
          </Typography> */}

          <div
            className="title"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 0,
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h5"
              style={{
                color: colors.grey[100],
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "bold",
              }}
            >
              Transcript of Push to Speak
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
              Multilingual Transcript of the Push to Speak, choose a language
            </h5>
          </div>
        </div>
        <Select
          value={selectedSpeakLanguage}
          onChange={handleSpeakLanguageChange}
          displayEmpty
          sx={{
            ml: 1,
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
          <MenuItem value="English">English</MenuItem>
          <MenuItem value="Spanish">Spanish</MenuItem>
          <MenuItem value="Mandarin">Mandarin</MenuItem>
          <MenuItem value="Arabic">Arabic</MenuItem>
          <MenuItem value="Hindi">Hindi</MenuItem>
          <MenuItem value="Bengali">Bengali</MenuItem>
          <MenuItem value="French">French</MenuItem>
          <MenuItem value="Nepali">Nepali</MenuItem>
          <MenuItem value="Portuguese">Portuguese</MenuItem>
        </Select>

        <IconButton
          onClick={() => toggleComponent("multi-speak")}
          style={{ position: "relative", zIndex: 1000 }}
        >
          <HighlightOffIcon />
        </IconButton>
      </div>
      <Box
        ref={multiSpeakRef}
        onScroll={() => handleScroll("multiSpeak")}
        style={{
          maxHeight: "85%",
          overflowY: "auto",
          padding: "10px",
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            whiteSpace: "pre-line",
            color: colors.grey[100],
          }}
        >
          {multiSpeakTranscript.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </Typography>
      </Box>
    </Paper>
  );
};

export default MultiSpeak;
