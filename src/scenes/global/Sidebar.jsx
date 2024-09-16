import { useState, useContext, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Button, Typography, useTheme } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { ColorModeContext, tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import SsidChartIcon from "@mui/icons-material/SsidChart";
import RadarIcon from "@mui/icons-material/Radar";
import AddTaskIcon from "@mui/icons-material/AddTask";
import MicIcon from "@mui/icons-material/Mic";
import ClosedCaptionIcon from "@mui/icons-material/ClosedCaption";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import Divider from "@mui/material/Divider";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";

import { MinimizedContext } from "../../context/MinimizedContext";

import TranscriptIcon from "@mui/icons-material/DescriptionOutlined";
import MultilingualIcon from "@mui/icons-material/TranslateOutlined";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { ValidationContext } from "../../context/ValidationContext";

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[500],
        marginTop: 20,
      }}
      onClick={() => setSelected(title)}
      icon={icon}
      sx={{
        color: selected === title ? "#000814" : colors.grey[500],
        backgroundColor: selected === title ? "#FFC300" : "transparent",
        "&:hover": {
          backgroundColor: "#FFC300",
          color: "#000814",
        },
        "& .MuiSvgIcon-root": {
          color: selected === title ? "#000814" : colors.grey[500],
        },
      }}
    >
      <Typography sx={{ fontSize: "1rem" }}>{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const { minimizedComponents, toggleComponent } = useContext(MinimizedContext);
  const [selected, setSelected] = useState("dashboard");
  const [currentDashboard, setCurrentDashboard] = useState("post-meeting");
  const [showRealTimeComponents, setShowRealTimeComponents] = useState(false);
  const [showPostMeetingComponents, setShowPostMeetingComponents] =
    useState(false);
  const location = useLocation();
  // const language = location.state?.language || "Default User";
  const { participantDetails } = useContext(ValidationContext);

  const participantId = participantDetails.participantId;
  const language = participantDetails.language;

  useEffect(() => {
    if (selected === "Post Meeting") {
      setCurrentDashboard("post-meeting");
      setShowPostMeetingComponents(true);
      setShowRealTimeComponents(false);
    } else if (selected === "Real-time Meeting") {
      setCurrentDashboard("real-time");
      setShowPostMeetingComponents(false);
      setShowRealTimeComponents(true);
    }
  }, [selected]);

  const componentNameMap = {
    transcript: "Trans cript",
    "multi-transcript": "Multi Lingual",
    speak: "Push to Talk",
    "multi-speak": "Multi Lingual Talk",
    "post-transcript": "Trans cript",
    streamgraph: "Stream Graph",
    summary: "Meeting Summary",
    radar: "Radar Chart",
    actions: "Action Items",
    chord: "Chord Diagram",
    audio: "Audio",
  };

  const getIconForComponent = (key) => {
    switch (key) {
      case "transcript":
        return <TranscriptIcon style={{ width: "20px", height: "20px" }} />;
      case "multi-transcript":
        return <MultilingualIcon style={{ width: "20px", height: "20px" }} />;
      case "speak":
        return <MicIcon style={{ width: "20px", height: "20px" }} />;
      case "multi-speak":
        return <ClosedCaptionIcon style={{ width: "20px", height: "20px" }} />;

      case "post-transcript":
        return <TranscriptIcon style={{ width: "20px", height: "20px" }} />;
      case "streamgraph":
        return <SsidChartIcon style={{ width: "20px", height: "20px" }} />;
      case "summary":
        return <SummarizeIcon style={{ width: "20px", height: "20px" }} />;
      case "radar":
        return <RadarIcon style={{ width: "20px", height: "20px" }} />;
      case "actions":
        return <AddTaskIcon style={{ width: "20px", height: "20px" }} />;
      case "chord":
        return <DonutLargeIcon style={{ width: "20px", height: "20px" }} />;
      case "audio":
        return <AudiotrackIcon style={{ width: "20px", height: "20px" }} />;

      default:
        return <PeopleOutlinedIcon style={{ width: "20px", height: "20px" }} />;
    }
  };

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `#000814 !important`,
          height: "100vh",
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 20px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: `#FFD60A !important`,
        },
        "& .pro-menu-item.active": {
          color: `#FFC300 !important`,
        },
      }}
    >
      <ProSidebar
        collapsed={isCollapsed}
        style={{
          height: "100vh",
          overflowY: "auto",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
        }}
      >
        <Menu iconShape="square">
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "5px 0 5px 0",
              color: `#FFC300`,
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Box borderColor="#FFC300">
                  <img
                    src="/assets/images/logo.jpg"
                    alt="LINC Logo"
                    style={{ width: "90px", height: "40px" }}
                  />
                </Box>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon sx={{ color: "#FFC300" }} />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          <Divider />

          {/* {menu items} */}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="Real-time Meeting"
              to="/real-time-meeting"
              icon={<PeopleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              // onClick={() => setShowRealTimeComponents(true)}
              sx={{
                background: colors.primary[700],
                color: colors.grey[800],
              }}
            />

            {showRealTimeComponents && (
              <Box
                display={isCollapsed ? "flex" : "grid"}
                flexDirection={isCollapsed ? "column" : "row"}
                gridTemplateColumns={isCollapsed ? "1fr" : "repeat(2, 1fr)"}
                alignItems="center"
                gap={1}
                mt={2}
              >
                {minimizedComponents
                  .filter((component) => {
                    return component.dashboardKey === "real-time";
                  })
                  .map((component) => (
                    <MenuItem
                      key={component.key}
                      icon={null}
                      style={{ margin: 0, padding: 0 }}
                    >
                      <Button
                        onClick={() => toggleComponent(component.key)}
                        sx={{
                          width: 55,
                          height: 55,
                          minWidth: 0,
                          borderRadius: "30%",
                          background: component.isActive
                            ? "#FFC300"
                            : "transparent",
                          color: component.isActive ? "#000814" : "#FFC300",
                          border: "2px solid",
                          borderColor: component.isActive
                            ? "#FFC300"
                            : colors.grey[600],
                          position: "relative",
                          overflow: "hidden",

                          "&:hover": {
                            "& .icon": {
                              opacity: 0,
                              visibility: "hidden",
                              transition:
                                "opacity 0.3s ease, visibility 0s ease",
                            },
                            "& .component-text": {
                              opacity: 1,
                              visibility: "visible",
                              transition:
                                "opacity 0.3s ease, visibility 0s ease",
                            },
                          },
                        }}
                      >
                        <Box
                          className="icon"
                          sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -40%)",
                            transition: "opacity 0.3s ease, visibility 0s ease",
                          }}
                        >
                          {getIconForComponent(component.key)}
                        </Box>
                        <Typography
                          className="component-text"
                          sx={{
                            position: "absolute",
                            // padding: "10px",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "0.5rem",
                            color: "#FFC300",
                            textAlign: "center",
                            width: "100%",
                            opacity: 0,
                            visibility: "hidden",
                            transition: "opacity 0.3s ease, visibility 0s ease",
                            whiteSpace: "wrap", // Prevents text wrapping
                            overflow: "hidden", // Hides overflowing text
                            // textOverflow: "ellipsis",
                          }}
                        >
                          {componentNameMap[component.key] || component.key}
                        </Typography>
                      </Button>
                    </MenuItem>
                  ))}
              </Box>
            )}

            <Item
              title="Post Meeting"
              to="/post-meeting"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
              onClick={() =>
                setShowPostMeetingComponents(!showPostMeetingComponents)
              }
              sx={{
                background: "#FFC300",
                color: "#FFC300",
              }}
            />
            {showPostMeetingComponents && (
              <Box
                display={isCollapsed ? "flex" : "grid"}
                flexDirection={isCollapsed ? "column" : "row"}
                gridTemplateColumns={isCollapsed ? "1fr" : "repeat(2, 1fr)"}
                alignItems="center"
                gap={1}
                mt={2} // Add top margin to ensure proper spacing from the menu items above
              >
                {minimizedComponents
                  .filter(
                    (component) => component.dashboardKey === "post-meeting"
                  )
                  .map((component) => (
                    <MenuItem
                      key={component.key}
                      icon={null}
                      style={{ margin: 0, padding: 0 }}
                    >
                      <Button
                        onClick={() => toggleComponent(component.key)}
                        sx={{
                          width: 55,
                          height: 55,
                          minWidth: 0,

                          borderRadius: "30%",
                          background: component.isActive
                            ? "#FFC300"
                            : "transparent",
                          color: component.isActive ? "#000814" : "#FFC300",
                          border: "2px solid",
                          borderColor: component.isActive
                            ? "#FFC300"
                            : colors.grey[600],
                          position: "relative",
                          overflow: "hidden",
                          "&:hover": {
                            "& .icon": {
                              opacity: 0,
                              visibility: "hidden",
                              transition:
                                "opacity 0.3s ease, visibility 0s ease",
                            },
                            "& .component-text": {
                              opacity: 1,
                              visibility: "visible",
                              transition:
                                "opacity 0.3s ease, visibility 0s ease",
                            },
                          },
                        }}
                      >
                        <Box
                          className="icon"
                          sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -40%)",
                            transition: "opacity 0.3s ease, visibility 0s ease",
                          }}
                        >
                          {getIconForComponent(component.key)}
                        </Box>
                        <Typography
                          className="component-text"
                          sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "0.5rem",
                            color: "#FFC300",
                            textAlign: "center",
                            width: "100%",
                            opacity: 0,
                            visibility: "hidden",
                            transition: "opacity 0.3s ease, visibility 0s ease",
                            whiteSpace: "wrap", // Prevents text wrapping
                            overflow: "hidden",
                          }}
                        >
                          {componentNameMap[component.key] || component.key}
                        </Typography>
                      </Button>
                    </MenuItem>
                  ))}
              </Box>
            )}
          </Box>
        </Menu>
        <Divider />

        <Menu
          iconShape="square"
          style={{ position: "absolute", bottom: 0, width: "100%" }}
        >
          {!isCollapsed && (
            <Box mb="10px">
              {currentDashboard === "post-meeting" && (
                <div className="profile">
                  <Box textAlign="center" padding="20px">
                    <Typography
                      variant="h2"
                      color="#FFC300"
                      fontWeight="bold"
                      sx={{ m: "10px 0 0 0" }}
                    >
                      {/* Saramsh Gautam */}
                      {participantId}
                    </Typography>
                    <Typography variant="h5" color={colors.grey[500]}>
                      {language}
                    </Typography>
                  </Box>
                </div>
              )}

              <Divider />
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                padding="10px"
              >
                <IconButton onClick={colorMode.toggleColorMode}>
                  {theme.palette.mode === "light" ? (
                    <DarkModeOutlinedIcon sx={{ color: "#FFC300" }} />
                  ) : (
                    <LightModeOutlinedIcon sx={{ color: "#FFC300" }} />
                  )}
                </IconButton>
              </Box>
            </Box>
          )}
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
