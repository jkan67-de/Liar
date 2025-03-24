import React, { useState, useEffect } from 'react';
import { Grid, Typography, TextField, Button, Paper, LinearProgress } from '@mui/material';

const QuestionDisplay = ({ question, onAnswerSubmit, hasAnswered, players }) => {
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds to answer
  const [isTimeUp, setIsTimeUp] = useState(false);
  const maxAnswerLength = 200;

  useEffect(() => {
    if (!hasAnswered && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimeUp(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [hasAnswered, timeLeft]);

  const handleSubmit = () => {
    if (answer.trim() && !isTimeUp) {
      onAnswerSubmit(answer);
      setAnswer('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const answeredCount = players.filter(p => p.has_answered).length;
  const progress = (answeredCount / players.length) * 100;

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        {question}
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        You have 60 seconds to answer
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={(timeLeft / 60) * 100} 
        sx={{ mb: 2 }}
      />
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {timeLeft} seconds remaining
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        placeholder="Type your answer here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value.slice(0, maxAnswerLength))}
        onKeyPress={handleKeyPress}
        disabled={hasAnswered}
        sx={{ mb: 2 }}
      />
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {answer.length}/200 characters
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={!answer.trim() || hasAnswered || timeLeft === 0}
      >
        Submit Answer
      </Button>
      {hasAnswered && (
        <Typography variant="body1" color="success.main" sx={{ mt: 2 }}>
          Answer submitted!
        </Typography>
      )}
      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
        {answeredCount}/{players.length} players have answered
      </Typography>
    </div>
  );
};

export default QuestionDisplay;