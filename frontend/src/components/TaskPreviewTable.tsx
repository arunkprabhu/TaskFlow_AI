/**
 * Task Preview Table Component
 */

import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Box,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as HighIcon,
  Circle as MediumIcon,
  RadioButtonUnchecked as LowIcon,
} from '@mui/icons-material';
import type { Task, PriorityLevel } from '../types/task.types';

interface TaskPreviewTableProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, field: string, value: any) => void;
}

const priorityIcons = {
  High: <HighIcon color="error" fontSize="small" />,
  Medium: <MediumIcon color="warning" fontSize="small" />,
  Low: <LowIcon color="action" fontSize="small" />,
};

const TaskPreviewTable: React.FC<TaskPreviewTableProps> = ({
  tasks,
  onTaskUpdate,
}) => {
  if (tasks.length === 0) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.5) return 'warning';
    return 'error';
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        ✅ Extracted Tasks ({tasks.length})
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review and edit tasks before pushing to Monday.com
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="5%">#</TableCell>
              <TableCell width="30%">Title</TableCell>
              <TableCell width="25%">Description</TableCell>
              <TableCell width="15%">Assignee</TableCell>
              <TableCell width="12%">Due Date</TableCell>
              <TableCell width="10%">Priority</TableCell>
              <TableCell width="8%">
                <Tooltip title="AI Confidence Score">
                  <span>Conf.</span>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task, index) => (
              <TableRow key={task.id} hover>
                <TableCell>{index + 1}</TableCell>
                
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={task.title}
                    onChange={(e) =>
                      onTaskUpdate(task.id, 'title', e.target.value)
                    }
                    variant="standard"
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    maxRows={3}
                    value={task.description || ''}
                    onChange={(e) =>
                      onTaskUpdate(task.id, 'description', e.target.value)
                    }
                    variant="standard"
                    placeholder="Add description..."
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={task.owner || ''}
                    onChange={(e) =>
                      onTaskUpdate(task.id, 'owner', e.target.value)
                    }
                    variant="standard"
                    placeholder="Assignee"
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={task.due_date || ''}
                    onChange={(e) =>
                      onTaskUpdate(task.id, 'due_date', e.target.value)
                    }
                    variant="standard"
                    InputLabelProps={{ shrink: true }}
                  />
                </TableCell>

                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={task.priority}
                      onChange={(e) =>
                        onTaskUpdate(
                          task.id,
                          'priority',
                          e.target.value as PriorityLevel
                        )
                      }
                      variant="standard"
                    >
                      <MenuItem value="High">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {priorityIcons.High} High
                        </Box>
                      </MenuItem>
                      <MenuItem value="Medium">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {priorityIcons.Medium} Medium
                        </Box>
                      </MenuItem>
                      <MenuItem value="Low">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {priorityIcons.Low} Low
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>

                <TableCell>
                  <Chip
                    label={`${Math.round(task.confidence * 100)}%`}
                    size="small"
                    color={getConfidenceColor(task.confidence)}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TaskPreviewTable;
