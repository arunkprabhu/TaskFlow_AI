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
        color="success"
        size="large"
        onClick={handleOpen}
        disabled={disabled}
        startIcon={<UploadIcon />}
        sx={{ minWidth: 200 }}
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
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePush}
            disabled={!boardId.trim() || isLoading}
            startIcon={isLoading && <CircularProgress size={20} />}
          >
            {isLoading ? 'Creating...' : 'Create Tasks'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PushToMondayButton;
