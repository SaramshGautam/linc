import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  TextField,
  Avatar,
  useTheme,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TimerIcon from "@mui/icons-material/Timer";
import { tokens } from "../../theme";

const initialColorsSet = [
  "#FF5733", // Red
  "#33FF57", // Green
  "#3357FF", // Blue
  "#F3FF33", // Yellow
  "#FF33A1", // Pink
];

const MemberManagement = ({
  recording,
  handleToggleRecording,
  meetingTime,
  audioBlobUrl,
  // isTranscriptLanguageSelected,
  selectedTranscriptLanguage,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [meetingName, setMeetingName] = useState("Meeting #1: Pilot");
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [availableColors, setAvailableColors] = useState(initialColorsSet);
  const [isEditingName, setIsEditingName] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  //   const [audioBlobUrl, setAudioBlobUrl] = useState("");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleAddMember = () => {
    if (newMember.trim() !== "" && members.length < 5) {
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      const newColor = availableColors[randomIndex];
      const newMemberObject = { name: newMember.trim(), color: newColor };

      setMembers([...members, newMemberObject]);
      setAvailableColors(
        availableColors.filter((_, index) => index !== randomIndex)
      );
      setNewMember("");
    }
  };

  const handleNameChange = () => {
    setIsEditingName(false);
  };

  return (
    <Box pl="10px" width="100%" bgcolor="#000814">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
      >
        <Box display="flex" alignItems="center" flexWrap="wrap">
          {isEditingName ? (
            <TextField
              variant="outlined"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              onBlur={handleNameChange}
              autoFocus
              sx={{
                mr: "10px",
                bgcolor: colors.grey[700],
                color: colors.grey[100],
              }}
              inputProps={{ style: { color: colors.grey[100] } }}
            />
          ) : (
            <Typography
              variant="h4"
              color={colors.grey[600]}
              fontWeight="bold"
              sx={{ ml: 2 }}
            >
              {meetingName}
              <IconButton
                onClick={() => setIsEditingName(true)}
                sx={{
                  m: "10px",
                  background: "#FFC300",
                  borderRadius: "25%",
                  p: 1,
                  transition: "all 0.3s ease",

                  "&:hover": {
                    background: "#FFC300",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <EditOutlinedIcon
                  sx={{
                    color: "#000814",
                  }}
                />
              </IconButton>
            </Typography>
          )}
          <Box display="flex" alignItems="center" flexWrap="wrap" ml={2}>
            {members.map((member, index) => (
              <Avatar key={index} sx={{ bgcolor: member.color, mr: 1 }}>
                {member.name.charAt(0).toUpperCase()}
              </Avatar>
            ))}
            {members.length < 5 && (
              <IconButton
                onClick={() => setNewMember("new member")}
                sx={{
                  mr: "10px",
                  background: "#FFC300",
                  borderRadius: "50%",
                  p: 1,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "#FFC300",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <PersonAddIcon
                  sx={{
                    color: "#000814",
                  }}
                />
              </IconButton>
            )}
          </Box>
        </Box>
        <Box
          id="Start-Recording-Box"
          display="flex"
          alignItems="center"
          ml="10px"
        >
          <div
            className="Recording-Button"
            onClick={(e) => {
              if (selectedTranscriptLanguage === "") {
                e.stopPropagation(); // Prevents the click event from propagating to the button
                alert(
                  "Please select a language before starting the recording!"
                );
              }
            }}
          >
            <Button
              sx={{
                background: "#FFC300",
                color: "#000814",
                fontSize: "14px",
                fontWeight: "bold",
                padding: "10px 20px",
                height: "100%",
                mr: 2,
                borderRadius: "8px",

                transition: "all 0.3s ease",
                "&:hover": {
                  background: "#FFC300",
                  color: "#000814",
                  boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
                  transform: "translateY(-2px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                },
                "&.Mui-disabled": {
                  background: "#333",
                  color: "#aaa", // Adjust text color if needed
                  boxShadow: "none",
                  transform: "none",
                },
              }}
              onClick={handleToggleRecording}
              disabled={selectedTranscriptLanguage === ""}
            >
              {recording ? "Stop Recording" : "Start Recording"}
            </Button>
          </div>
          <TimerIcon sx={{ color: "#FFC300" }} />

          <Typography variant="h5" color="#FFC300">
            Time: {formatTime(meetingTime)}
          </Typography>

          {audioBlobUrl && (
            <Button
              sx={{
                background: `linear-gradient(135deg, ${colors.blueAccent[700]} 0%, ${colors.blueAccent[500]} 100%)`,
                color: colors.grey[100],
                fontSize: "14px",
                fontWeight: "bold",
                padding: "10px 20px",
                height: "100%",
                ml: 2,
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: `linear-gradient(135deg, ${colors.blueAccent[600]} 0%, ${colors.blueAccent[400]} 100%)`,
                  boxShadow: `0 6px 12px rgba(0, 0, 0, 0.2)`,
                  transform: "translateY(-2px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                },
              }}
              href={audioBlobUrl}
              download="meeting-recording.wav"
            >
              Download Audio
            </Button>
          )}
        </Box>
      </Box>
      {newMember && (
        <Box mt="10px" display="flex" alignItems="center">
          <TextField
            variant="outlined"
            label="Add Member"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            sx={{
              flexGrow: 1,
              mr: 1,
              bgcolor: colors.grey[700],
              "& .MuiInputBase-input": {
                color: colors.grey[100],
              },
              "& .MuiInputLabel-root": {
                color: colors.grey[100],
              },
            }}
            InputLabelProps={{
              style: { color: colors.grey[100] },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{
              backgroundColor: colors.blueAccent[700],
              "&:hover": {
                backgroundColor: colors.blueAccent[600],
              },
            }}
            onClick={handleAddMember}
          >
            Add
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MemberManagement;
