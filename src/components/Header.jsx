import React from "react";
import {
  Typography,
  Box,
  useTheme,
  IconButton,
  InputBase,
} from "@mui/material";
import { tokens } from "../theme";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

const Header = ({ title, subtitle }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Typography
      variant="h3"
      color="grey"
      fontWeight="bold"
      sx={{ m: "5px 0 5px 10px" }}
    >
      {title}
    </Typography>
  );
};

export default Header;
