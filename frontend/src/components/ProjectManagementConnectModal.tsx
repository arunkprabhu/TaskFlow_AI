/**
 * Project Management Connection Modal with Tabs
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  useTheme,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountTree as MondayIcon,
  BugReport as JiraIcon,
  CheckCircle as AsanaIcon,
  Dashboard as TrelloIcon,
  Speed as ClickUpIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  DeleteForever as ClearIcon,
  WifiTethering as TestIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pm-tabpanel-${index}`}
      aria-labelledby={`pm-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ProjectManagementConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (tool: string, credentials: any) => void;
}

const ProjectManagementConnectModal: React.FC<ProjectManagementConnectModalProps> = ({
  open,
  onClose,
  onConnect,
}) => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [credentials, setCredentials] = useState({
    monday: { apiToken: '', boardId: '' },
    jira: { email: '', apiToken: '', domain: '' },
    asana: { accessToken: '', workspaceId: '' },
    trello: { apiKey: '', token: '', boardId: '' },
    clickup: { apiToken: '', listId: '' },
  });

  // Pre-populate fields from localStorage whenever the modal opens
  useEffect(() => {
    if (open) {
      const savedToken = localStorage.getItem('MONDAY_API_TOKEN') || '';
      const savedBoard = localStorage.getItem('MONDAY_BOARD_ID') || '';
      setCredentials((prev) => ({
        ...prev,
        monday: { apiToken: savedToken, boardId: savedBoard },
      }));
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [open]);

  // Check if API key exists to determine if modal can be closed
  const hasApiKey = localStorage.getItem('MONDAY_API_TOKEN');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleClose = () => {
    // Only allow closing if API key is configured
    if (hasApiKey) {
      onClose();
    }
  };

  const handleCredentialChange = (tool: string, field: string, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [tool]: {
        ...prev[tool as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleConnect = (tool: string) => {
    onConnect(tool, credentials[tool as keyof typeof credentials]);
    onClose();
  };

  const handleTestConnection = async () => {
    const token = credentials.monday.apiToken.trim();
    if (!token) return;
    setTestStatus('testing');
    setTestMessage('');
    try {
      const res = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({ query: '{ me { id name } }' }),
      });
      const data = await res.json();
      if (data?.data?.me?.name) {
        setTestStatus('ok');
        setTestMessage(`Connected as ${data.data.me.name}`);
      } else {
        setTestStatus('fail');
        setTestMessage('Invalid API token or no access.');
      }
    } catch {
      setTestStatus('fail');
      setTestMessage('Network error — could not reach Monday.com.');
    }
  };

  const handleClear = () => {
    localStorage.removeItem('MONDAY_API_TOKEN');
    localStorage.removeItem('MONDAY_BOARD_ID');
    localStorage.removeItem('pm_tool_connected');
    localStorage.removeItem('pm_tool_credentials');
    setCredentials((prev) => ({ ...prev, monday: { apiToken: '', boardId: '' } }));
    setTestStatus('idle');
    setTestMessage('');
  };

  const pmTools = [
    { name: 'Monday', icon: <MondayIcon />, key: 'monday', color: '#ff3d57' },
    { name: 'Jira', icon: <JiraIcon />, key: 'jira', color: '#0052cc' },
    { name: 'Asana', icon: <AsanaIcon />, key: 'asana', color: '#f06a6a' },
    { name: 'Trello', icon: <TrelloIcon />, key: 'trello', color: '#0079bf' },
    { name: 'ClickUp', icon: <ClickUpIcon />, key: 'clickup', color: '#7b68ee' },
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={!hasApiKey}
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          minHeight: '500px',
        },
      }}
      BackdropProps={{
        onClick: hasApiKey ? undefined : (e) => e.stopPropagation(),
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)'
            : 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
          color: '#ffffff',
          pb: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Connect Project Management Tool
          {!hasApiKey && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.9 }}>
              API Key Required to Continue
            </Typography>
          )}
        </Typography>
        {hasApiKey && (
          <IconButton onClick={handleClose} sx={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            },
            '& .Mui-selected': {
              background: theme.palette.mode === 'light'
                ? 'rgba(99, 102, 241, 0.1)'
                : 'rgba(129, 140, 248, 0.1)',
            },
            '& .Mui-disabled': {
              opacity: 0.5,
            },
          }}
        >
          {pmTools.map((tool, index) => (
            <Tab
              key={tool.key}
              icon={tool.icon}
              label={
                <Box>
                  <div>{tool.name}</div>
                  {index !== 0 && (
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      Coming Soon
                    </Typography>
                  )}
                </Box>
              }
              id={`pm-tab-${index}`}
              iconPosition="start"
              disabled={index !== 0}
              sx={{
                '& .MuiSvgIcon-root': {
                  fontSize: 28,
                  color: tool.color,
                },
              }}
            />
          ))}
        </Tabs>
      </Box>

      <DialogContent>
        {/* Monday.com Tab */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {!hasApiKey && (
              <Alert severity="warning">
                <strong>Required:</strong> Please configure your Monday.com API token to use this application.
              </Alert>
            )}
            <Alert severity="info">
              Get your API token from Monday.com → Profile → Admin → API
            </Alert>

            {/* API Token field with show/hide toggle */}
            <TextField
              fullWidth
              label="API Token *"
              type={showToken ? 'text' : 'password'}
              value={credentials.monday.apiToken}
              onChange={(e) => {
                handleCredentialChange('monday', 'apiToken', e.target.value);
                setTestStatus('idle');
                setTestMessage('');
              }}
              variant="outlined"
              required
              helperText="Required to connect to Monday.com"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowToken((v) => !v)} edge="end">
                      {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Board ID (Optional)"
              value={credentials.monday.boardId}
              onChange={(e) => handleCredentialChange('monday', 'boardId', e.target.value)}
              variant="outlined"
              helperText="Leave empty to select board when pushing tasks"
            />

            {/* Test status feedback */}
            {testMessage && (
              <Alert severity={testStatus === 'ok' ? 'success' : 'error'}>
                {testMessage}
              </Alert>
            )}

            {/* Action buttons row */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => handleConnect('monday')}
                disabled={!credentials.monday.apiToken}
                startIcon={<CheckCircleIcon />}
                sx={{ flex: 1, minWidth: 160 }}
              >
                Connect Monday.com
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={handleTestConnection}
                disabled={!credentials.monday.apiToken || testStatus === 'testing'}
                startIcon={testStatus === 'testing' ? <CircularProgress size={18} /> : <TestIcon />}
                color="info"
                sx={{ flex: 1, minWidth: 160 }}
              >
                {testStatus === 'testing' ? 'Testing…' : 'Test Connection'}
              </Button>

              <Button
                variant="outlined"
                size="large"
                color="error"
                onClick={handleClear}
                startIcon={<ClearIcon />}
                sx={{ flex: 1, minWidth: 120 }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Jira Tab */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', py: 8 }}>
            <JiraIcon sx={{ fontSize: 80, color: '#0052CC', opacity: 0.5 }} />
            <Typography variant="h5" fontWeight="bold" color="text.secondary">
              Jira Integration
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 500 }}>
              Jira integration is coming soon! We're working hard to bring you seamless project management integration.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Stay tuned for updates!
            </Typography>
          </Box>
        </TabPanel>

        {/* Asana Tab */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', py: 8 }}>
            <AsanaIcon sx={{ fontSize: 80, color: '#F06A6A', opacity: 0.5 }} />
            <Typography variant="h5" fontWeight="bold" color="text.secondary">
              Asana Integration
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 500 }}>
              Asana integration is coming soon! We're working hard to bring you seamless project management integration.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Stay tuned for updates!
            </Typography>
          </Box>
        </TabPanel>

        {/* Trello Tab */}
        <TabPanel value={currentTab} index={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', py: 8 }}>
            <TrelloIcon sx={{ fontSize: 80, color: '#0079BF', opacity: 0.5 }} />
            <Typography variant="h5" fontWeight="bold" color="text.secondary">
              Trello Integration
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 500 }}>
              Trello integration is coming soon! We're working hard to bring you seamless project management integration.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Stay tuned for updates!
            </Typography>
          </Box>
        </TabPanel>

        {/* ClickUp Tab */}
        <TabPanel value={currentTab} index={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', py: 8 }}>
            <ClickUpIcon sx={{ fontSize: 80, color: '#7B68EE', opacity: 0.5 }} />
            <Typography variant="h5" fontWeight="bold" color="text.secondary">
              ClickUp Integration
            </Typography>
            <Alert severity="info" sx={{ maxWidth: 500 }}>
              ClickUp integration is coming soon! We're working hard to bring you seamless project management integration.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Stay tuned for updates!
            </Typography>
          </Box>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectManagementConnectModal;
