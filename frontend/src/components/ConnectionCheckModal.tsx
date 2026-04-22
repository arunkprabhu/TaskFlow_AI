/**
 * Connection Check Modal - Shows when no PM tool is connected
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import {
  LinkOff as DisconnectedIcon,
} from '@mui/icons-material';

interface ConnectionCheckModalProps {
  open: boolean;
  onConnect: () => void;
}

const ConnectionCheckModal: React.FC<ConnectionCheckModalProps> = ({ open, onConnect }) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
        },
        onClick: (e) => e.stopPropagation(),
      }}
    >
      <DialogContent sx={{ py: 6, px: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 3,
          }}
        >
          {/* Icon with gradient background */}
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 1,
                },
                '50%': {
                  opacity: 0.7,
                },
              },
            }}
          >
            <DisconnectedIcon
              sx={{
                fontSize: 64,
                color: theme.palette.mode === 'light' ? '#dc2626' : '#f87171',
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #1e293b 0%, #475569 100%)'
                : 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            No Connection Found
          </Typography>

          {/* Description */}
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
            Connect your <strong>Monday.com</strong> account to start converting meeting notes into actionable tasks.
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 400, fontStyle: 'italic' }}>
            (Other project management tools coming soon)
          </Typography>

          {/* Connect Button */}
          <Button
            variant="contained"
            size="large"
            onClick={onConnect}
            sx={{
              mt: 2,
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                : 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
              '&:hover': {
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px 0 rgba(99, 102, 241, 0.5)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            Connect Now
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionCheckModal;
