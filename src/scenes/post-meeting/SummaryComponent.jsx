import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { useTheme } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import rehypeRaw from "rehype-raw";

const SummaryComponent = ({
  selectedLanguageSummary,
  setSelectedLanguageSummary,
  summary,
  searchQuerySummary,
  setSearchQuerySummary,
  loadingSummary,
  handleSearch,
  handleLanguageChange,
  toggleComponent,
  colors,
}) => {
  const theme = useTheme();
  const [searchIndex, setSearchIndex] = useState(-1);
  const lineRefs = useRef([]);

  const highlightText = (text, query) => {
    console.log("Text received:", text); // For debugging

    // Ensure text is a string
    if (typeof text !== "string") {
      return text;
    }

    // If there's no search query, return the original text
    if (!query) return text;

    // Split and highlight the text if it is a string
    const parts = text.split(new RegExp(`(${query})`, "gi"));

    return parts
      .map((part, index) =>
        part.toLowerCase() === query.toLowerCase()
          ? `<span style="background-color: yellow; color: black;">${part}</span>`
          : part
      )
      .join(""); // Join the parts back into a string
  };

  const handleArrowNavigation = (direction) => {
    if (!searchQuerySummary) return; // If there's no query, return early

    // Find all refs where the content matches the search query
    const searchResults = lineRefs.current.filter(
      (ref) =>
        ref &&
        ref.innerText.toLowerCase().includes(searchQuerySummary.toLowerCase())
    );

    // If we have search results, proceed with navigation
    if (searchResults.length > 0) {
      let newIndex = searchIndex;

      // Adjust the index based on the direction
      if (direction === "up") {
        newIndex =
          (searchIndex - 1 + searchResults.length) % searchResults.length;
      } else if (direction === "down") {
        newIndex = (searchIndex + 1) % searchResults.length;
      }

      setSearchIndex(newIndex); // Update the state with the new index

      // Scroll the selected match into view smoothly
      searchResults[newIndex].scrollIntoView({
        behavior: "smooth",
        block: "center", // Scrolls the element into the center of the view
      });
    }
  };

  const renderSummary = () => {
    const highlightedMarkdown = highlightText(summary, searchQuerySummary); // Apply the highlighting to the markdown text

    return (
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]} // Use the rehypeRaw plugin to allow safe raw HTML rendering
        children={highlightedMarkdown}
        components={{
          p: ({ children, node, ...props }) => (
            <Typography
              ref={(el) => {
                if (node && node.position && node.position.start.line) {
                  lineRefs.current[node.position.start.line - 1] = el;
                }
              }}
              variant="body1"
              sx={{
                fontSize: "18px",
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.87)"
                    : "rgba(0, 0, 0, 0.87)",
                marginBottom: "8px",
                fontFamily: "'Helvetica', sans-serif",
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          h1: ({ children, node, ...props }) => (
            <Typography
              ref={(el) => {
                if (node && node.position && node.position.start.line) {
                  lineRefs.current[node.position.start.line - 1] = el;
                }
              }}
              variant="h4"
              sx={{
                fontWeight: "bold",
                marginBottom: "12px",
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.87)"
                    : "rgba(0, 0, 0, 0.87)",
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          h2: ({ children, node, ...props }) => (
            <Typography
              ref={(el) => {
                if (node && node.position && node.position.start.line) {
                  lineRefs.current[node.position.start.line - 1] = el;
                }
              }}
              variant="h5"
              sx={{
                fontWeight: "bold",
                marginBottom: "10px",
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.87)"
                    : "rgba(0, 0, 0, 0.87)",
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          li: ({ children, node, ...props }) => (
            <Typography
              ref={(el) => {
                if (node && node.position && node.position.start.line) {
                  lineRefs.current[node.position.start.line - 1] = el;
                }
              }}
              component="li"
              sx={{
                fontSize: "18px",
                marginBottom: "8px",
                listStyleType: "disc",
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.87)"
                    : "rgba(0, 0, 0, 0.87)",
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: "20px" }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: "20px" }}>{children}</ol>
          ),
        }}
      />
    );
  };

  return (
    <Paper
      sx={{
        height: "100%",
        overflow: "hidden",
        borderRadius: "8px",
        transition: "height 0.3s ease",
      }}
    >
      <Box
        sx={{
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
              sx={{
                color: colors.grey[100],
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "bold",
              }}
            >
              Meeting Summary
            </Typography>
            <Typography
              sx={{
                margin: 0,
                padding: "0",
                lineHeight: "1.2",
                color: colors.grey[700],
                fontFamily: "'Roboto', sans-serif",
              }}
            >
              Concise overview of meeting discussions
            </Typography>
          </div>
        </div>

        {/* Search Input */}
        <TextField
          variant="outlined"
          placeholder="Search..."
          value={searchQuerySummary}
          onChange={(event) => handleSearch(event, "summary")}
          size="small"
          sx={{
            ml: 2,
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

        {/* Navigation for Search */}
        {searchQuerySummary && (
          <Box sx={{ display: "flex", flexDirection: "column", m: 0, p: 0 }}>
            <IconButton onClick={() => handleArrowNavigation("up")}>
              <KeyboardArrowUpIcon sx={{ fontSize: 15 }} />
            </IconButton>
            <IconButton onClick={() => handleArrowNavigation("down")}>
              <KeyboardArrowDownIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        )}

        {/* Language Selection */}
        <Select
          value={selectedLanguageSummary}
          onChange={(event) => handleLanguageChange(event, "summary")}
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

        <IconButton onClick={() => toggleComponent("summary")}>
          <HighlightOffIcon />
        </IconButton>
      </Box>

      {/* Summary Content */}
      <Box sx={{ maxHeight: "80%", overflowY: "auto", padding: "10px" }}>
        {loadingSummary ? (
          <Typography sx={{ fontSize: "16px" }}>Loading...</Typography>
        ) : (
          renderSummary()
        )}
      </Box>
    </Paper>
  );
};

export default SummaryComponent;
