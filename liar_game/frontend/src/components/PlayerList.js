import React from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Paper } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const PlayerList = ({ players, isHost, onKickPlayer }) => {
  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 400, mx: 'auto', mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Players
      </Typography>
      <List>
        {players.map((player) => (
          <ListItem key={player.id}>
            <ListItemText
              primary={
                <Typography component="span">
                  {player.name}
                  {player.is_host && <StarIcon sx={{ ml: 1, color: 'gold' }} />}
                </Typography>
              }
              secondary={`Points: ${player.points}`}
            />
            {isHost && !player.is_host && (
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="kick"
                  onClick={() => onKickPlayer(player.id)}
                  color="error"
                >
                  <PersonRemoveIcon />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default PlayerList;