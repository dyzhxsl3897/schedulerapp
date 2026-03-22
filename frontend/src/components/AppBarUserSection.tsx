import React, { useState } from 'react';
import { Chip, IconButton } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import ChangePasswordDialog from './ChangePasswordDialog';

const AppBarUserSection: React.FC = () => {
  const { user, logout } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <>
      <Chip
        icon={<AccountCircleIcon />}
        label={user?.username}
        variant="outlined"
        sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '& .MuiChip-icon': { color: 'white' } }}
      />
      <IconButton color="inherit" onClick={() => setChangePasswordOpen(true)} title="Change Password">
        <VpnKeyIcon />
      </IconButton>
      <IconButton color="inherit" onClick={logout}>
        <LogoutIcon />
      </IconButton>
      <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </>
  );
};

export default AppBarUserSection;
