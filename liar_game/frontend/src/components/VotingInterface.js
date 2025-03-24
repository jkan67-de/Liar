import React from 'react';
import { Grid, Typography, Button } from '@mui/material';

const VotingInterface = ({ players, onVoteSubmit, hasVoted }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} align="center">
        <Typography variant="h5" gutterBottom>
          Time to vote! Who do you think is the liar?
        </Typography>
      </Grid>
      
      {!hasVoted ? (
        <Grid item xs={12} align="center">
          <Grid container spacing={2} justifyContent="center">
            {players.map((player) => (
              <Grid item key={player.id} xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={() => onVoteSubmit(player.id)}
                  disabled={!player.has_answered}
                  style={{ padding: '1rem', marginBottom: '1rem' }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    {player.name}
                  </Typography>
                  <Typography variant="body2">
                    Answer: {player.answer}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Grid>
      ) : (
        <Grid item xs={12} align="center">
          <Typography variant="subtitle1" color="primary">
            Vote submitted! Waiting for other players...
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default VotingInterface;