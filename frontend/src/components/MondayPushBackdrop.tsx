/**
 * Full-screen backdrop shown while pushing tasks to Monday.com.
 * Displays an animated task counter so the user can see progress.
 */

import React, { useEffect, useState } from 'react';
import {
  Backdrop,
  Box,
  CircularProgress,
  Typography,
  Paper,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

interface MondayPushBackdropProps {
  open: boolean;
  total: number;
}

const MondayPushBackdrop: React.FC<MondayPushBackdropProps> = ({ open, total }) => {
  const [count, setCount] = useState(0);

  // Animate count from 0 → total while the backdrop is open.
  // We spread the ticks over ~80 % of an estimated 3 s per task so the
  // counter reaches "total" just as the real push is finishing.
  useEffect(() => {
    if (!open) {
      setCount(0);
      return;
    }

    const estimatedMs = Math.max(total * 2500, 3000);
    const tickEvery = estimatedMs / total;
    let current = 0;

    const id = setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= total) clearInterval(id);
    }, tickEvery);

    return () => clearInterval(id);
  }, [open, total]);

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 200,
        color: '#fff',
        backdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(0,0,0,0.65)',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          px: 6,
          py: 5,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.15)',
          animation: 'popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
          '@keyframes popIn': {
            '0%': { transform: 'scale(0.7)', opacity: 0 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
        }}
      >
        {/* Spinner with icon overlay */}
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            size={80}
            thickness={3}
            sx={{
              color: '#6366f1',
              filter: 'drop-shadow(0 0 8px #6366f1)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}
        >
          Pushing tasks…
        </Typography>

        {/* Counter */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{
              color: '#818cf8',
              fontWeight: 800,
              lineHeight: 1,
              transition: 'all 0.3s ease',
              animation: count > 0 ? 'countPulse 0.25s ease' : 'none',
              '@keyframes countPulse': {
                '0%': { transform: 'scale(1.3)', opacity: 0.7 },
                '100%': { transform: 'scale(1)', opacity: 1 },
              },
            }}
          >
            {Math.min(count, total)}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
            of {total} task{total !== 1 ? 's' : ''} created
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}
        >
          Please wait, this may take a moment…
        </Typography>
      </Paper>
    </Backdrop>
  );
};

export default MondayPushBackdrop;
