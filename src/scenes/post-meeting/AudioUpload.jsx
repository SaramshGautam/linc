import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

const AudioUploadAndPlay = ({ colors }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [audioURL, setAudioURL] = useState("");

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioURL(URL.createObjectURL(file));
    }
  };

  const handleAudioRemove = () => {
    setAudioFile(null);
    setAudioURL("");
  };

  return (
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
              bgcolor: colors.redAccent[700],
              color: colors.grey[100],
              minWidth: 200,
              "&:hover": {
                bgcolor: colors.redAccent[800],
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
          <audio controls src={audioURL} style={{ marginTop: "10px" }}>
            Your browser does not support the audio element.
          </audio>
          <Button
            onClick={handleAudioRemove}
            sx={{
              mt: 2,
              bgcolor: colors.redAccent[600],
              color: colors.grey[100],
              minWidth: 200,
              "&:hover": {
                bgcolor: colors.redAccent[800],
              },
            }}
          >
            Remove Audio
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AudioUploadAndPlay;
