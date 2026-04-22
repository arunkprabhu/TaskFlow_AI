/**
 * Push to Monday.com Button Component
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

interface PushToMondayButtonProps {
  disabled: boolean;
  isLoading: boolean;
  onPush: (boardId: string) => void;
  error: string | null;
  success: boolean;
}

const PushToMondayButton: React.FC<PushToMondayButtonProps> = ({
  disabled,
  isLoading,
  onPush,
  error,
  success,
}) => {
  const [open, setOpen] = useState(false);
  const [boardId, setBoardId] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    if (!isLoading) {
      setOpen(false);
      setBoardId('');
    }
  };

  const handlePush = () => {
    if (boardId.trim()) {
      onPush(boardId.trim());
    }
  };

  return (
    <>
      <Button
        variant="contained"
        size="large"
        onClick={handleOpen}
        disabled={disabled}
        startIcon={<UploadIcon />}
        sx={{
          minWidth: 220,
          fontWeight: 700,
          letterSpacing: 0.5,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.55)',
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
          '&.Mui-disabled': {
            background: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
            boxShadow: 'none',
            color: '#fff',
          },
          transition: 'all 0.2s ease',
        }}
      >
        Push to Monday.com
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Push Tasks to Monday.com</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Tasks created successfully in Monday.com!
              </Alert>
            )}

            <TextField
              fullWidth
              label="Monday.com Board ID"
              placeholder="e.g., 123456789"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              disabled={isLoading}
              helperText="Find your board ID in the Monday.com board URL"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="text"
            onClick={handleClose}
            disabled={isLoading}
            sx={{ fontWeight: 600, color: 'text.secondary', '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.08)' } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePush}
            disabled={!boardId.trim() || isLoading}
            startIcon={isLoading && <CircularProgress size={20} sx={{ color: '#fff' }} />}
            sx={{
              fontWeight: 700,
              letterSpacing: 0.5,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.55)',
                transform: 'translateY(-1px)',
              },
              '&:active': { transform: 'translateY(0)' },
              '&.Mui-disabled': {
                background: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
                boxShadow: 'none',
                color: '#fff',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Creating...' : 'Create Tasks'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PushToMondayButton;
