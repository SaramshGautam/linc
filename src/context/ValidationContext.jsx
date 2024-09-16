import React, { createContext, useState } from "react";

export const ValidationContext = createContext();

export const ValidationProvider = ({ children }) => {
  const [isValidated, setIsValidated] = useState(false);
  const [participantDetails, setParticipantDetails] = useState({
    meetingId : "meeting0",
    participantId: "Default User",
    language: "Default Language"
  })

  return (
    <ValidationContext.Provider value={{ participantDetails, setParticipantDetails, isValidated, setIsValidated }}>
      {children}
    </ValidationContext.Provider>
  );
};
