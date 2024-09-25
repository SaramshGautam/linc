import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ValidationContext } from "../../context/ValidationContext";
import { useTheme } from "@mui/material/styles"; // Assuming you are using Material UI Theme
import "./home.css";

const HomePage = () => {
  const [meetingId, setMeetingId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [language, setLanguage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { setIsValidated } = useContext(ValidationContext);
  const { setParticipantDetails } = useContext(ValidationContext);

  const theme = useTheme(); // Using theme for dynamic styling

  const handleSubmit = async (event) => {
    event.preventDefault();
    const requestData = {
      meeting_id: meetingId,
      participant_id: participantId,
    };

    try {
      const response = await fetch("/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.valid) {
        setIsValidated(true);
        setParticipantDetails({ meetingId, participantId, language });
        navigate(`/post-meeting`);
      } else {
        setErrorMessage(data.message);
        setIsValidated(false); // Ensure validation is marked as false
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("An error occurred. Please try again.");
      setIsValidated(false);
    }
  };

  return (
    <div className="main-container">
      <div
        className="auth-container"
        style={{
          backgroundColor: theme.palette.mode === "dark" ? "#000814" : "#eee", // Theme-based background color
          color: theme.palette.mode === "dark" ? "#fff" : "#000", // Theme-based text color
          opacity: "95%",
        }}
      >
        <h1>Enter Meeting Details</h1>
        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-group">
            <label>Meeting ID:</label>
            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="form-input centered-input"
              style={{
                backgroundColor: "#999",
                color: "#fff",
                fontSize: "15px",
              }}
            />
          </div>
          <div className="form-group">
            <label>Participant ID:</label>
            <input
              type="text"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="form-input centered-input"
              style={{
                backgroundColor: "#999",
                color: "#fff",
                fontSize: "15px",
              }}
            />
          </div>

          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

          <button type="submit" className="form-button centered-input">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomePage;
