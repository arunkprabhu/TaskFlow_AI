/**
 * Footer Component with BlazeOps Branding
 */

import { Box, Typography, Link, useTheme } from '@mui/material';
import { Bolt as BoltIcon } from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        textAlign: 'center',
        borderTop: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
        background: theme.palette.mode === 'light'
          ? 'rgba(255, 255, 255, 0.5)'
          : 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Powered by
        </Typography>
        <Link
          href="https://blazeops.io"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1.1rem',
            background: theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
              : 'linear-gradient(135deg, #ff8c42 0%, #ffa94d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              filter: 'brightness(1.2)',
            },
          }}
        >
          <BoltIcon
            sx={{
              fontSize: 24,
              color: '#ff6b35',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 1,
                  transform: 'scale(1)',
                },
                '50%': {
                  opacity: 0.8,
                  transform: 'scale(1.1)',
                },
              },
            }}
          />
          BlazeOps
        </Link>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
        AI-Powered Task Management © {new Date().getFullYear()}
      </Typography>
    </Box>
  );
};

export default Footer;
