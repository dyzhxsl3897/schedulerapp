import React, { useState, useEffect } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemText, ListItemSecondaryAction, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Paper, Alert
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import NavigationDrawer from '../components/NavigationDrawer';
import AppBarUserSection from '../components/AppBarUserSection';
import { ChildInfo } from '../types';
import { getChildren, addChild, removeChild } from '../api/parentChildApi';

const ChildrenPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [childUsername, setChildUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadChildren = async () => {
    try {
      const data = await getChildren();
      setChildren(data);
    } catch {
      setError('Failed to load children list.');
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const handleAdd = async () => {
    if (!childUsername.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      await addChild(childUsername.trim());
      setSuccess(`"${childUsername.trim()}" has been added as your child.`);
      setChildUsername('');
      setAddDialogOpen(false);
      loadChildren();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add child.';
      setError(msg);
    }
  };

  const handleRemove = async (child: ChildInfo) => {
    setError(null);
    setSuccess(null);
    try {
      await removeChild(child.id);
      setSuccess(`"${child.username}" has been removed.`);
      loadChildren();
    } catch {
      setError('Failed to remove child.');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My Children
          </Typography>
          <AppBarUserSection />
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', width: '100%' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Child
          </Button>
        </Box>

        {children.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No children added yet. Click "Add Child" to add your first child.
            </Typography>
          </Paper>
        ) : (
          <Paper>
            <List>
              {children.map((child, index) => (
                <React.Fragment key={child.id}>
                  {index > 0 && <Box component="hr" sx={{ border: 'none', borderTop: '1px solid', borderColor: 'divider', m: 0 }} />}
                  <ListItem>
                    <ListItemText
                      primary={child.username}
                      secondary={`Added: ${new Date(child.createdAt).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" color="error" onClick={() => handleRemove(child)} title="Remove child">
                        <PersonRemoveIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Add Child Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Child</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Child's Username"
            fullWidth
            value={childUsername}
            onChange={(e) => setChildUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={!childUsername.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
};

export default ChildrenPage;