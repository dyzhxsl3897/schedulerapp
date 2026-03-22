import React from 'react';
import {
  Drawer, Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, Divider
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FlagIcon from '@mui/icons-material/Flag';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Weekly Planner', icon: <CalendarMonthIcon />, path: '/planner' },
  { label: 'Yearly Goals', icon: <FlagIcon />, path: '/goals' },
];

const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer variant="temporary" anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 250 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
          <Typography variant="h6" fontWeight="bold">Scheduler</Typography>
          <IconButton onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={pathname === item.path}
              onClick={() => handleNavigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default NavigationDrawer;
