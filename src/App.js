// App.js
import React, { useState, useContext } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Sidebar from "./scenes/global/Sidebar";
import PostMeeting from "./scenes/post-meeting";
import RealTimeMeeting from "./scenes/real-time-meeting";
import HomePage from "./scenes/home";
import { ValidationProvider, ValidationContext } from "./context/ValidationContext";
import "@fortawesome/fontawesome-free/css/all.min.css";

function App() {
  const [theme, colorMode] = useMode();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isSidebar, setIsSidebar] = useState(true);
  const sidebarWidth = isCollapsed ? "80px" : "250px";

  return (
    <ValidationProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="app">
            <Sidebar
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              sx={{
                boxShadow: "4px 0px 10px rgba(0, 0, 0, 0.85)",
              }}
            />
            <main
              className="content"
              style={{
                marginLeft: isCollapsed ? "80px" : "270px",
                transition: "margin-left 0.3s ease",
                flex: 1,
              }}
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/post-meeting" element={
                  <ProtectedRoute>
                    <PostMeeting />
                  </ProtectedRoute>
                } />
                <Route path="/real-time-meeting" element={
                  <ProtectedRoute>
                    <RealTimeMeeting />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </ValidationProvider>
  );
}

const ProtectedRoute = ({ children }) => {
  const { isValidated } = useContext(ValidationContext);
  return isValidated ? children : <Navigate to="/" />;
};

export default App;
