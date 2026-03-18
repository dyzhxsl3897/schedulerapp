import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Button, CircularProgress, Snackbar, Alert, Menu, MenuItem,
    Typography, Box
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import api from '../api/axios';

interface GoogleCalendarButtonProps {
    weekStart: string;
    weekEnd: string;
    onSyncComplete: () => void;
}

const GoogleCalendarButton: React.FC<GoogleCalendarButtonProps> = ({
    weekStart,
    weekEnd,
    onSyncComplete,
}) => {
    const [connected, setConnected] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success'
    });
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const popupRef = useRef<Window | null>(null);
    const popupCheckInterval = useRef<number | null>(null);

    const checkStatus = useCallback(async () => {
        try {
            const res = await api.get('/google/status');
            setConnected(res.data.connected);
            setEmail(res.data.email || '');
        } catch {
            // Ignore - API may not be configured
        }
    }, []);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);


    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                checkStatus();
                setSnackbar({ open: true, message: 'Google Calendar connected!', severity: 'success' });
            } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
                setSnackbar({
                    open: true,
                    message: `Google auth failed: ${event.data.error || 'Unknown error'}`,
                    severity: 'error'
                });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            if (popupCheckInterval.current) {
                clearInterval(popupCheckInterval.current);
            }
        };
    }, [checkStatus]);

    const handleConnect = async () => {
        try {
            const res = await api.get('/google/auth-url');
            const popup = window.open(res.data.url, 'google-auth', 'width=500,height=600');

            if (!popup) {
                setSnackbar({
                    open: true,
                    message: 'Popup blocked. Please allow popups for this site.',
                    severity: 'error'
                });
                return;
            }

            popupRef.current = popup;

            // Check if popup was closed without completing
            popupCheckInterval.current = window.setInterval(() => {
                if (popup.closed) {
                    if (popupCheckInterval.current) {
                        clearInterval(popupCheckInterval.current);
                        popupCheckInterval.current = null;
                    }
                    popupRef.current = null;
                }
            }, 1000);
        } catch {
            setSnackbar({ open: true, message: 'Failed to start Google auth', severity: 'error' });
        }
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await api.post(`/google/sync?start=${weekStart}&end=${weekEnd}`);
            setSnackbar({
                open: true,
                message: `Synced ${res.data.count} events from Google Calendar`,
                severity: 'success'
            });
            onSyncComplete();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to sync Google Calendar';
            setSnackbar({ open: true, message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setAnchorEl(null);
        try {
            await api.delete('/google/disconnect');
            setConnected(false);
            setEmail('');
            setSnackbar({ open: true, message: 'Google Calendar disconnected', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to disconnect', severity: 'error' });
        }
    };

    return (
        <>
            {!connected ? (
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={handleConnect}
                >
                    Connect Google Calendar
                </Button>
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={loading ? <CircularProgress size={16} /> : <SyncIcon />}
                        onClick={handleSync}
                        disabled={loading}
                    >
                        Sync
                    </Button>
                    <Button
                        size="small"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ minWidth: 'auto', px: 1 }}
                    >
                        <Typography variant="caption" noWrap sx={{ maxWidth: 120 }}>
                            {email || 'Connected'}
                        </Typography>
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem onClick={handleDisconnect}>
                            <LinkOffIcon fontSize="small" sx={{ mr: 1 }} />
                            Disconnect
                        </MenuItem>
                    </Menu>
                </Box>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default GoogleCalendarButton;
