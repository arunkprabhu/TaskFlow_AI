/**
 * Meeting Notes Input Component
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { PlayArrow as ExtractIcon } from '@mui/icons-material';

interface MeetingNotesInputProps {
  onExtract: (notes: string) => void;
  isLoading: boolean;
}

const MeetingNotesInput: React.FC<MeetingNotesInputProps> = ({
  onExtract,
  isLoading,
}) => {
  const theme = useTheme();
  const [notes, setNotes] = useState('');

  const handleExtract = () => {
    if (notes.trim()) {
      onExtract(notes);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        background: theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.9)'
          : 'rgba(30, 41, 59, 0.9)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(51, 65, 85, 0.8)'}`,
        boxShadow: theme.palette.mode === 'light'
          ? '0 4px 24px rgba(99, 102, 241, 0.1)'
          : '0 4px 24px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            : 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>📝</span> Meeting Notes
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Paste your meeting notes below. Tasks, owners, due dates and priorities will be extracted instantly.
        {isLoading && (
          <Box
            component="span"
            sx={{
              display: 'block',
              mt: 1,
              color: 'success.main',
              fontWeight: 600,
            }}
          >
            ⚡ Extracting tasks instantly...
          </Box>
        )}
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={12}
        variant="outlined"
        placeholder={`Paste meeting notes here...\n\nExamples:\n- Tom will fix the login bug by Friday\n- Sarah committed to preparing the report by April 30\n- TODO: @john update documentation\n- [ ] Schedule client meeting next Tuesday`}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isLoading}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            background: theme.palette.mode === 'light'
              ? 'rgba(248, 250, 252, 0.8)'
              : 'rgba(15, 23, 42, 0.8)',
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: '2px',
            },
          },
        }}
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleExtract}
          disabled={!notes.trim() || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <ExtractIcon />}
          sx={{
            minWidth: 180,
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            '&:before': isLoading ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 1.5s infinite',
            } : {},
            '@keyframes shimmer': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' },
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          {isLoading ? 'Extracting...' : 'Extract Tasks'}
        </Button>

        <Button
          variant="text"
          onClick={() => setNotes('')}
          disabled={isLoading || !notes}
          sx={{
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
            },
          }}
        >
          Clear
        </Button>
      </Box>
    </Paper>
  );
};

export default MeetingNotesInput;
