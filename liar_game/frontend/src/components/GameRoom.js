import React, { useState, useEffect } from 'react';
import { Grid, Typography, Button, TextField } from '@mui/material';

const GameRoom = ({ roomCode, isHost, players, currentQuestion, votingPhase, roundComplete }) => {
  const [answer, setAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleAnswerSubmit = () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_code: roomCode,
        answer: answer
      })
    };

    fetch('/api/submit-answer', requestOptions)
      .then(response => response.json())
      .then(data => {
        setHasAnswered(true);
      });
  };

  const handleVote = (playerId) => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_code: roomCode,
        voted_for: playerId
      })
    };

    fetch('/api/submit-vote', requestOptions)
      .then(response => response.json())
      .then(data => {
        setHasVoted(true);
      });
  };

  const handleNextRound = () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_code: roomCode
      })
    };

    fetch('/api/next-round', requestOptions)
      .then(response => response.json());
  };

  return (
    <Grid container spacing={2}>
      {currentQuestion && (
        <Grid item xs={12} align="center">
          <Typography variant="h6" gutterBottom>
            Question: {currentQuestion.truth_question}
          </Typography>
          {!hasAnswered && (
            <div>
              <TextField
                fullWidth
                label="Your Answer"
                variant="outlined"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAnswerSubmit}
                disabled={!answer}
              >
                Submit Answer
              </Button>
            </div>
          )}
        </Grid>
      )}

      {votingPhase && !hasVoted && (
        <Grid item xs={12} align="center">
          <Typography variant="h6" gutterBottom>
            Time to vote! Who is the liar?
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {players.map((player) => (
              <Grid item key={player.id}>
                <Button
                  variant="outlined"
                  onClick={() => handleVote(player.id)}
                  disabled={!player.has_answered}
                >
                  {player.name}: {player.answer}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Grid>
      )}

      {roundComplete && isHost && (
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleNextRound}
          >
            Next Round
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default GameRoom;