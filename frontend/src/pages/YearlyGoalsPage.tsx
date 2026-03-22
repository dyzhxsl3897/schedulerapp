import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NavigationDrawer from '../components/NavigationDrawer';
import AppBarUserSection from '../components/AppBarUserSection';

const YearlyGoalsPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 0.5 }}>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div">
            Yearly Goals
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <AppBarUserSection />
        </Toolbar>
      </AppBar>
      <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        <Typography variant="h4">Yearly Goals</Typography>
      </Box>
    </Box>
  );
};

export default YearlyGoalsPage;
