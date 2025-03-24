import React from 'react';
import { Grid, Typography, Button } from '@mui/material';

const PlayerList = ({ players, isHost, onKickPlayer }) => {
  return (
    <Grid container spacing={2} justifyContent="center">
      {players.map((player) => (
        <Grid item xs={12} sm={6} md={4} key={player.id}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '0.5rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <Typography variant="body1">
              {player.name} {player.is_host && '⭐'}
            </Typography>
            {isHost && !player.is_host && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => onKickPlayer(player.id)}
              >
                Kick
              </Button>
            )}
          </div>
        </Grid>
      ))}
    </Grid>
  );
};

export default PlayerList;