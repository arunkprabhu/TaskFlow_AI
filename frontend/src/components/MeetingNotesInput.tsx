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
import { PlayArrow as ExtractIcon, AutoFixHigh as SampleIcon } from '@mui/icons-material';

const SAMPLE_NOTES = `Q2 Product Launch — Engineering Sync
Date: April 22, 2026 | Attendees: Alice, Bob, Carol, David, Eve, Frank, Grace, Henry

== ACTION ITEMS ==

1. [HIGH PRIORITY] Alice Chen will redesign the user onboarding flow to reduce drop-off rates.
   Assignee: Alice Chen
   Due: May 2, 2026
   Description: Revamp the 3-step onboarding wizard with progress indicators, skip options, and a personalized welcome screen. Coordinate with UX team for mockups.

2. [CRITICAL] Bob Martinez must fix the payment gateway timeout issue causing checkout failures.
   Assignee: Bob Martinez
   Due: April 25, 2026
   Description: Investigate Stripe webhook latency above 30s. Implement retry logic with exponential backoff and add alerting for failures exceeding 5% error rate.

3. [MEDIUM] Carol Singh to write API documentation for the new v3 endpoints before release.
   Assignee: Carol Singh
   Due: May 5, 2026
   Description: Document all REST endpoints including request/response schemas, auth headers, rate limits and error codes. Publish to developer portal.

4. [HIGH] David Kim will set up CI/CD pipeline for the mobile app repository.
   Assignee: David Kim
   Due: April 30, 2026
   Description: Configure GitHub Actions with automated tests, code coverage reports, and deployment to TestFlight (iOS) and Play Store internal track (Android).

5. [LOW] Eve Nguyen should conduct performance testing on the new search feature.
   Assignee: Eve Nguyen
   Due: May 8, 2026
   Description: Run load tests simulating 10k concurrent users on the Elasticsearch-backed search. Identify and resolve any queries exceeding 200ms p95 latency.

6. [HIGH PRIORITY] Frank Okafor to migrate legacy user data from PostgreSQL to the new schema.
   Assignee: Frank Okafor
   Due: May 3, 2026
   Description: Write migration scripts with rollback capability. Validate data integrity post-migration with automated checksums. Schedule maintenance window for zero-downtime migration.

7. [MEDIUM] Grace Liu will create a dashboard for monitoring real-time system health metrics.
   Assignee: Grace Liu
   Due: May 10, 2026
   Description: Build a Grafana dashboard covering CPU, memory, request latency, error rates and queue depths. Set up PagerDuty alerts for critical thresholds.

8. [CRITICAL] Henry Patel must complete security audit of all third-party dependencies.
   Assignee: Henry Patel
   Due: April 28, 2026
   Description: Run OWASP dependency check across all services. Patch any CVEs rated High or Critical. Produce a security report for the compliance team.
`;

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
          variant="outlined"
          size="large"
          onClick={() => setNotes(SAMPLE_NOTES)}
          disabled={isLoading}
          startIcon={<SampleIcon />}
          sx={{
            borderWidth: 2,
            borderColor: '#7c3aed',
            color: '#7c3aed',
            fontWeight: 700,
            letterSpacing: 0.5,
            borderRadius: 2.5,
            '&:hover': {
              borderWidth: 2,
              borderColor: '#6d28d9',
              background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
              color: '#6d28d9',
            },
          }}
        >
          Sample Notes
        </Button>

        <Button
          variant="contained"
          size="large"
          onClick={handleExtract}
          disabled={!notes.trim() || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <ExtractIcon />}
          sx={{
            minWidth: 180,
            fontWeight: 700,
            letterSpacing: 0.5,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
              boxShadow: '0 6px 20px rgba(139, 92, 246, 0.55)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'translateY(0)' },
            '&.Mui-disabled': {
              background: 'linear-gradient(135deg, #c4b5fd 0%, #d8b4fe 100%)',
              boxShadow: 'none',
              color: '#fff',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? 'Extracting...' : 'Extract Tasks'}
        </Button>

        <Button
          variant="text"
          onClick={() => setNotes('')}
          disabled={isLoading || !notes}
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.08)' },
          }}
        >
          Clear
        </Button>
      </Box>
    </Paper>
  );
};

export default MeetingNotesInput;
