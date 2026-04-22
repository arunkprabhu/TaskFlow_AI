/**
 * Main Application Component
 */

import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Snackbar,
  AppBar,
  Toolbar,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  CheckCircle as CheckIcon,
  WbSunny as SunIcon,
  NightsStay as MoonIcon,
  Refresh as RefreshIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import MeetingNotesInput from './components/MeetingNotesInput';
import TaskPreviewTable from './components/TaskPreviewTable';
import PushToMondayButton from './components/PushToMondayButton';
import MondayPushBackdrop from './components/MondayPushBackdrop';
import DisconnectedBanner from './components/DisconnectedBanner';
import ConnectionCheckModal from './components/ConnectionCheckModal';
import ProjectManagementConnectModal from './components/ProjectManagementConnectModal';
import Footer from './components/Footer';
import { useTaskExtraction } from './hooks/useTaskExtraction';
import { useMondayPush } from './hooks/useMondayPush';
import { useThemeContext } from './theme/ThemeContext';
import type { Task } from './types/task.types';
import { getHealthStatus } from './services/api';

function App() {
  const { mode, toggleTheme } = useThemeContext();
  const tableRef = useRef<HTMLDivElement>(null);
  const [editableTasks, setEditableTasks] = useState<Task[]>([]);
  const [pushedSuccessfully, setPushedSuccessfully] = useState<boolean>(false);
  const [_healthStatus, setHealthStatus] = useState<string>('unknown');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(!!localStorage.getItem('MONDAY_API_TOKEN'));
  const [showConnectionCheck, setShowConnectionCheck] = useState<boolean>(false);
  const [showPMConnect, setShowPMConnect] = useState<boolean>(false);

  const {
    tasks,
    isLoading: isExtracting,
    error: extractError,
    extractTasksFromNotes,
    clearError: clearExtractError,
  } = useTaskExtraction();

  const {
    isLoading: isPushing,
    error: pushError,
    success: pushSuccess,
    pushTasks,
    clearStatus,
  } = useMondayPush();

  // Update editable tasks when extraction completes
  useEffect(() => {
    if (tasks.length > 0) {
      setEditableTasks(tasks);
      setPushedSuccessfully(false);
      // Smooth scroll to table after a brief render delay
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [tasks]);

  // Clear table after a successful push
  useEffect(() => {
    if (pushSuccess) {
      const timer = setTimeout(() => {
        setEditableTasks([]);
        setPushedSuccessfully(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pushSuccess]);

  const [backendDown, setBackendDown] = useState(false);

  // Check backend health on mount and poll every 15 s
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await getHealthStatus();
        setHealthStatus(status.status);
        setBackendDown(false);
      } catch {
        setHealthStatus('unhealthy');
        setBackendDown(true);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);

    // Check if PM tool is connected (check localStorage)
    const connectedTool = localStorage.getItem('pm_tool_connected');
    if (!connectedTool) {
      setShowConnectionCheck(true);
    } else {
      setIsConnected(true);
    }

    return () => clearInterval(interval);
  }, []);

  const handleOpenPMConnect = () => {
    setShowConnectionCheck(false);
    setShowPMConnect(true);
  };

  const handleClosePMConnect = () => {
    // Only allow closing if API key is configured
    const apiToken = localStorage.getItem('MONDAY_API_TOKEN');
    if (apiToken) {
      setShowPMConnect(false);
    } else {
      // Keep modal open if no API key
      setShowConnectionCheck(false);
      setShowPMConnect(true);
    }
  };

  const handlePMConnect = (tool: string, credentials: any) => {
    // Save connection to localStorage
    localStorage.setItem('pm_tool_connected', tool);
    localStorage.setItem('pm_tool_credentials', JSON.stringify(credentials));
    setIsConnected(true);
    setShowPMConnect(false);
    setShowConnectionCheck(false);
    
    // If it's Monday.com, update the environment
    if (tool === 'monday' && credentials.apiToken) {
      localStorage.setItem('MONDAY_API_TOKEN', credentials.apiToken);
      if (credentials.boardId) {
        localStorage.setItem('MONDAY_BOARD_ID', credentials.boardId);
      }
    }
    setHasApiKey(!!localStorage.getItem('MONDAY_API_TOKEN'));
  };

  // Keep hasApiKey in sync — re-check after modal closes (covers Clear action)
  const handleClosePMConnectWithSync = () => {
    setHasApiKey(!!localStorage.getItem('MONDAY_API_TOKEN'));
    setIsConnected(!!localStorage.getItem('pm_tool_connected'));
    handleClosePMConnect();
  };

  const handleTaskUpdate = (taskId: string, field: string, value: any) => {
    setEditableTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
  };

  const handlePushToMonday = async (boardId: string) => {
    await pushTasks(editableTasks, boardId);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: mode === 'light'
          ? 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fce7f3 100%)'
          : 'linear-gradient(135deg, #080d1a 0%, #050d1f 40%, #0a1020 70%, #080d1a 100%)',
        animation: 'gradientShift 15s ease infinite',
        '@keyframes gradientShift': {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
        backgroundSize: '200% 200%',
      }}
    >
      {/* Connection Check Modal */}
      <ConnectionCheckModal
        open={showConnectionCheck}
        onConnect={handleOpenPMConnect}
      />

      {/* Project Management Connect Modal */}
      <ProjectManagementConnectModal
        open={showPMConnect}
        onClose={handleClosePMConnectWithSync}
        onConnect={handlePMConnect}
      />

      {/* App Bar */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          animation: 'slideDown 0.5s ease-out',
          '@keyframes slideDown': {
            '0%': {
              transform: 'translateY(-100%)',
              opacity: 0,
            },
            '100%': {
              transform: 'translateY(0)',
              opacity: 1,
            },
          },
        }}
      >
        <Toolbar>
          <AIIcon 
            sx={{ 
              mr: 2,
              animation: 'rotate 3s linear infinite',
              '@keyframes rotate': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }} 
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 800,
              letterSpacing: '1px',
              fontSize: { xs: '1.1rem', sm: '1.4rem' },
              background: 'linear-gradient(90deg, #f97316, #ec4899, #a855f7, #3b82f6, #06b6d4, #10b981, #f97316)',
              backgroundSize: '300% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmerTitle 4s linear infinite',
              filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.5))',
              '@keyframes shimmerTitle': {
                '0%': { backgroundPosition: '0% center' },
                '100%': { backgroundPosition: '300% center' },
              },
            }}
          >
            ✦ Taskflow AI ✦
          </Typography>
          <Chip
            label={isConnected ? 'Connected' : 'Not Connected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            icon={isConnected ? <CheckIcon /> : undefined}
            onClick={() => setShowPMConnect(true)}
            sx={{ 
              mr: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            }}
          />
          <IconButton onClick={toggleTheme} sx={{ color: '#ffffff' }}>
            {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Backend unreachable banner */}
      {backendDown && (
        <Alert
          severity="error"
          icon={<WifiOffIcon />}
          sx={{ borderRadius: 0, fontWeight: 600 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>Backend unreachable</AlertTitle>
          The API server on port 8000 is not responding. Run{' '}
          <code style={{ background: 'rgba(0,0,0,0.15)', padding: '1px 6px', borderRadius: 4 }}>
            uvicorn app.main:app --port 8000
          </code>{' '}
          in the <strong>backend/</strong> folder, then click Retry.
        </Alert>
      )}

      <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>

        {/* Disconnected banner — shown when API key is missing */}
        {!hasApiKey && (
          <DisconnectedBanner onConnect={() => setShowPMConnect(true)} />
        )}

        {/* All main content — only when connected */}
        {hasApiKey && (<>

        {/* Monday.com push backdrop with progress counter */}
        <MondayPushBackdrop open={isPushing} total={editableTasks.length} />

        {/* Error Alert */}
        {extractError && (
          <Alert 
            severity="error" 
            onClose={clearExtractError} 
            sx={{ 
              mb: 3,
              animation: 'slideIn 0.3s ease-out',
              '@keyframes slideIn': {
                '0%': { transform: 'translateX(-100%)', opacity: 0 },
                '100%': { transform: 'translateX(0)', opacity: 1 },
              },
            }}
          >
            {extractError}
          </Alert>
        )}

        {/* Meeting Notes Input */}
        <Box 
          sx={{ 
            mb: 4,
            animation: 'fadeInUp 0.6s ease-out',
            '@keyframes fadeInUp': {
              '0%': { transform: 'translateY(30px)', opacity: 0 },
              '100%': { transform: 'translateY(0)', opacity: 1 },
            },
          }}
        >
          <MeetingNotesInput
            onExtract={extractTasksFromNotes}
            isLoading={isExtracting}
          />
        </Box>

        {/* Animated empty state after successful push */}
        {pushedSuccessfully && !isPushing && editableTasks.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 10,
              gap: 2,
              animation: 'fadeInScale 0.6s cubic-bezier(0.175,0.885,0.32,1.275)',
              '@keyframes fadeInScale': {
                '0%': { transform: 'scale(0.6)', opacity: 0 },
                '100%': { transform: 'scale(1)', opacity: 1 },
              },
            }}
          >
            <Box
              sx={{
                fontSize: 72,
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-12px)' },
                },
              }}
            >
              🎉
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              All tasks pushed!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your tasks are now live in your project management tool. Paste new meeting notes to start again.
            </Typography>
          </Box>
        )}

        {/* Task Preview Table */}
        {editableTasks.length > 0 && (
          <Box 
            ref={tableRef}
            sx={{ 
              mb: 4,
              scrollMarginTop: '80px',
              animation: 'fadeInUp 0.8s ease-out',
              '@keyframes fadeInUp': {
                '0%': { transform: 'translateY(30px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 },
              },
            }}
          >
            <TaskPreviewTable
              tasks={editableTasks}
              onTaskUpdate={handleTaskUpdate}
            />
          </Box>
        )}

        {/* Push to Monday Button */}
        {editableTasks.length > 0 && (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              animation: 'fadeInUp 1s ease-out',
              '@keyframes fadeInUp': {
                '0%': { transform: 'translateY(30px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 },
              },
            }}
          >
            <PushToMondayButton
              disabled={editableTasks.length === 0}
              isLoading={isPushing}
              onPush={handlePushToMonday}
              error={pushError}
              success={pushSuccess}
            />
          </Box>
        )}

        {/* Success Snackbar */}
        <Snackbar
          open={pushSuccess}
          autoHideDuration={6000}
          onClose={clearStatus}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={clearStatus} 
            severity="success" 
            sx={{ 
              width: '100%',
              animation: 'bounce 0.5s ease-out',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-10px)' },
              },
            }}
          >
            Tasks successfully created! 🎉
          </Alert>
        </Snackbar>

        </>)}
      </Container>
      
      {/* Footer */}
      <Footer />
    </Box>
  );
}

export default App;
