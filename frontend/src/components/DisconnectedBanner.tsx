/**
 * Shown when no API key is configured.
 * Animated two-hooks-not-joining illustration + CTA.
 */

import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CableIcon from '@mui/icons-material/Cable';

interface DisconnectedBannerProps {
  onConnect: () => void;
}

const DisconnectedBanner: React.FC<DisconnectedBannerProps> = ({ onConnect }) => {
  // Oscillate a value 0→1→0 to drive the "reaching but not touching" motion
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      setTick(Math.sin((frame * Math.PI) / 40)); // smooth sine wave
    }, 30);
    return () => clearInterval(id);
  }, []);

  // leftX moves toward center, rightX moves toward center — but never meet
  const gap = 28 + 18 * (1 - Math.abs(tick)); // gap shrinks with the beat
  const leftX = 50 - gap;
  const rightX = 50 + gap;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
        gap: 3,
        animation: 'fadeInScale 0.7s cubic-bezier(0.175,0.885,0.32,1.275)',
        '@keyframes fadeInScale': {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      }}
    >
      {/* SVG hook animation */}
      <Box sx={{ width: 220, height: 110, position: 'relative' }}>
        <svg
          viewBox="0 0 100 50"
          width="100%"
          height="100%"
          overflow="visible"
        >
          {/* Left plug / hook */}
          <g
            style={{
              transform: `translateX(${(leftX - (50 - 28)) * 1}px)`,
              transition: 'transform 0.08s linear',
            }}
          >
            {/* cable line */}
            <line x1="0" y1="25" x2={leftX} y2="25" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
            {/* plug head */}
            <rect x={leftX - 6} y="18" width="6" height="14" rx="2" fill="#6366f1" />
            {/* prongs */}
            <rect x={leftX} y="21" width="4" height="3" rx="1" fill="#818cf8" />
            <rect x={leftX} y="26" width="4" height="3" rx="1" fill="#818cf8" />
          </g>

          {/* Right plug / hook (mirrored) */}
          <g
            style={{
              transform: `translateX(${-((50 + 28) - rightX) * 1}px)`,
              transition: 'transform 0.08s linear',
            }}
          >
            <line x1="100" y1="25" x2={rightX} y2="25" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
            <rect x={rightX} y="18" width="6" height="14" rx="2" fill="#ec4899" />
            <rect x={rightX - 4} y="21" width="4" height="3" rx="1" fill="#f9a8d4" />
            <rect x={rightX - 4} y="26" width="4" height="3" rx="1" fill="#f9a8d4" />
          </g>

          {/* Spark / gap indicator — pulses in the gap */}
          <g opacity={0.7 + 0.3 * Math.abs(tick)}>
            <text
              x="50"
              y="29"
              textAnchor="middle"
              fontSize="8"
              fill="#fbbf24"
              style={{ userSelect: 'none' }}
            >
              ✕
            </text>
          </g>
        </svg>
      </Box>

      {/* Icon + headline */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LinkOffIcon
          sx={{
            fontSize: 40,
            color: 'error.main',
            animation: 'wobble 1.8s ease-in-out infinite',
            '@keyframes wobble': {
              '0%, 100%': { transform: 'rotate(0deg)' },
              '25%': { transform: 'rotate(-12deg)' },
              '75%': { transform: 'rotate(12deg)' },
            },
          }}
        />
        <Typography variant="h5" fontWeight={800} color="text.primary">
          Not Connected
        </Typography>
      </Box>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ textAlign: 'center', maxWidth: 380 }}
      >
        Connect your project management tool to start pushing tasks.
        <br />
        Your API key is required to continue.
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={onConnect}
        startIcon={<CableIcon />}
        sx={{
          mt: 1,
          px: 4,
          borderRadius: 3,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { boxShadow: '0 4px 20px rgba(99,102,241,0.4)' },
            '50%': { boxShadow: '0 4px 32px rgba(236,72,153,0.6)' },
          },
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)',
            transform: 'scale(1.05)',
          },
          transition: 'transform 0.2s ease',
        }}
      >
        Connect Tool to Access
      </Button>
    </Box>
  );
};

export default DisconnectedBanner;
