import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Fab,
  CircularProgress,
  Button,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../api/assistant';
import { executeAssistantAction } from '../api/assistantActions';
import { useIsMobile } from '../hooks/useIsMobile';

const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 480;

const AssistantChat: React.FC = () => {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right
  useEffect(() => {
    if (!initialized) {
      setPosition({
        x: window.innerWidth - PANEL_WIDTH - 24,
        y: window.innerHeight - PANEL_HEIGHT - 24,
      });
      setInitialized(true);
    }
  }, [initialized]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: position.x,
        posY: position.y,
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const newX = Math.max(0, Math.min(window.innerWidth - PANEL_WIDTH, dragRef.current.posX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - PANEL_HEIGHT, dragRef.current.posY + dy));
        setPosition({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [isMobile, position]
  );

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { reply, action } = await sendChatMessage(trimmed, messages);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        pendingAction: action,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I was unable to get a response. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (messageId: string) => {
    const target = messages.find((m) => m.id === messageId);
    if (!target?.pendingAction) return;
    const action = target.pendingAction;

    try {
      const { message } = await executeAssistantAction(action);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.pendingAction
            ? {
                ...m,
                pendingAction: {
                  ...m.pendingAction,
                  status: 'executed' as const,
                  resultMessage: message,
                },
              }
            : m
        )
      );
      const confirmMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Done — ${message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err) {
      console.error('Failed to execute assistant action', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.pendingAction
            ? {
                ...m,
                pendingAction: {
                  ...m.pendingAction,
                  status: 'failed' as const,
                  resultMessage: 'Action failed. Please try again.',
                },
              }
            : m
        )
      );
    }
  };

  const handleReject = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.pendingAction
          ? { ...m, pendingAction: { ...m.pendingAction, status: 'rejected' as const } }
          : m
      )
    );
    const rejectMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'I rejected the previous proposed action. Do not propose it again unless I ask.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, rejectMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setExpanded(false);
  };

  // FAB button when collapsed
  if (!expanded) {
    return (
      <Fab
        color="primary"
        onClick={() => setExpanded(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
        }}
      >
        <SmartToyIcon />
      </Fab>
    );
  }

  // Expanded chat panel
  const panelSx = isMobile
    ? {
        position: 'fixed' as const,
        bottom: 0,
        left: 0,
        right: 0,
        height: '70vh',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column' as const,
        borderRadius: '16px 16px 0 0',
      }
    : {
        position: 'fixed' as const,
        left: position.x,
        top: position.y,
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column' as const,
        borderRadius: 2,
        overflow: 'hidden',
      };

  return (
    <Paper ref={panelRef} elevation={8} sx={panelSx}>
      {/* Title bar / drag handle */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          backgroundColor: 'primary.main',
          color: 'white',
          cursor: isMobile ? 'default' : 'move',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <SmartToyIcon sx={{ mr: 1, fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
          AI Assistant
        </Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'white' }}>
          <MinimizeIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => {
            setMessages([]);
            handleClose();
          }}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 1,
          backgroundColor: '#f5f5f5',
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
            <SmartToyIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
            <Typography variant="body2">
              Hi! I'm your scheduling assistant. How can I help you today?
            </Typography>
          </Box>
        )}

        {messages.map((msg) => (
          <Box key={msg.id} sx={{ mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                sx={{
                  maxWidth: '85%',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: msg.role === 'user' ? 'primary.main' : 'white',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  boxShadow: msg.role === 'assistant' ? 1 : 0,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                </Typography>
              </Box>
            </Box>

            {/* Action preview + Approve / Reject buttons */}
            {msg.pendingAction && (
              <Box sx={{ mt: 0.5, ml: 0.5 }}>
                <Box
                  sx={{
                    p: 1,
                    mb: 0.5,
                    borderRadius: 1,
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    border: '1px solid',
                    borderColor: 'primary.light',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                    Proposed action: {msg.pendingAction.type}
                  </Typography>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}
                  >
                    {JSON.stringify(msg.pendingAction.payload, null, 2)}
                  </Typography>
                </Box>
                {msg.pendingAction.status === 'pending' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckIcon />}
                      onClick={() => handleApprove(msg.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<ClearIcon />}
                      onClick={() => handleReject(msg.id)}
                    >
                      Reject
                    </Button>
                  </Box>
                )}
                {msg.pendingAction.status === 'executed' && (
                  <Typography variant="caption" sx={{ color: 'success.main' }}>
                    ✓ {msg.pendingAction.resultMessage ?? 'Executed'}
                  </Typography>
                )}
                {msg.pendingAction.status === 'failed' && (
                  <Typography variant="caption" sx={{ color: 'error.main' }}>
                    ✗ {msg.pendingAction.resultMessage ?? 'Failed'}
                  </Typography>
                )}
                {msg.pendingAction.status === 'rejected' && (
                  <Typography variant="caption" sx={{ color: 'error.main' }}>
                    Rejected
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Thinking...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'white',
          flexShrink: 0,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          multiline
          maxRows={3}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={loading || !input.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default AssistantChat;
