import React, { useRef, useEffect } from "react";
import { Box, Typography, IconButton, Paper, useTheme } from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { tokens } from "../../theme";

const AudioPlayerComponent = ({
  audioURL,
  audioFileName,
  onSeekBar,
  toggleComponent,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && audioURL) {
      console.log("--- Audio URL Changed and noticed --- ");
      audioRef.current.load(); // Reload the audio source
    }
  }, [audioURL]);

  const handleSeekBarChange = (event) => {
    const currentTime = audioRef.current.currentTime;
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const timestamp = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;

    if (onSeekBar) {
      onSeekBar(timestamp); // Call the onSeekBar function with the timestamp
    }
  };

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
              Meeting Audio
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
              Listen to the meeting audio
            </h5>
          </div>
        </div>

        <IconButton
          onClick={() => toggleComponent("audio")}
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
        {audioURL ? (
          <Box>
            <Typography sx={{ color: colors.grey[100], marginBottom: "10px" }}>
              {audioFileName}
            </Typography>
            <audio
              ref={audioRef}
              controls
              src={audioURL}
              style={{ width: "100%" }}
              onTimeUpdate={handleSeekBarChange} // Call onSeekBar whenever the time updates
            >
              Your browser does not support the audio element.
            </audio>
          </Box>
        ) : (
          <Typography sx={{ color: colors.grey[100] }}>
            No audio uploaded yet.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default AudioPlayerComponent;
