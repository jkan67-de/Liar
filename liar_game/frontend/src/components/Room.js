import React, { Component } from "react";
import { Grid, Button, Typography } from "@mui/material";
import CreateRoomPage from "./CreateRoomPage";
import { useParams, useNavigate } from 'react-router-dom';
import GameRoom from './GameRoom';
import PlayerList from './PlayerList';
import QuestionDisplay from './QuestionDisplay';
import VotingInterface from './VotingInterface';

// Create wrapper for hooks
function withRouter(Component) {
    return props => {
        const params = useParams();
        const navigate = useNavigate();
        return <Component {...props} params={params} navigate={navigate} />;
    }
}

class Room extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isHost: false,
            showSettings: false,
            gameStarted: false,
            currentRound: 0,
            roundComplete: false,
            votingPhase: false,
            players: [],
            currentQuestion: null,
            hasAnswered: false,
            hasVoted: false,
            current_player: null,
            answer: '',
            votedFor: null
        };
        this.roomCode = this.props.params.roomCode;
        this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
        this.updateShowSettings = this.updateShowSettings.bind(this);
        this.renderSettingsButton = this.renderSettingsButton.bind(this);
        this.renderSettings = this.renderSettings.bind(this);
        this.getRoomDetails = this.getRoomDetails.bind(this);
        this.startGame = this.startGame.bind(this);
        this.submitAnswer = this.submitAnswer.bind(this);
        this.submitVote = this.submitVote.bind(this);
        this.nextRound = this.nextRound.bind(this);
        this.kickPlayer = this.kickPlayer.bind(this);
    }

    componentDidMount() {
        this.getRoomDetails();
        // Set up polling for room updates
        this.pollInterval = setInterval(() => {
            this.getRoomDetails();
        }, 3000); // Poll every 3 seconds
    }

    componentWillUnmount() {
        // Clean up polling interval
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    getRoomDetails() {
        fetch(`/api/room?code=${this.roomCode}`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
            },
            credentials: "include"
        })
            .then((response) => {
                if (response.status === 403 || response.status === 404) {
                    // Room no longer exists or player no longer has access
                    sessionStorage.removeItem('room_code');
                    this.props.navigate('/');
                    return Promise.reject('Room no longer exists');
                }
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                // Use the current_player data directly from the backend
                const currentPlayer = data.current_player;
                
                // Set isHost based on the current player's host status
                const isHost = currentPlayer?.is_host === true;
                
                this.setState({
                    players: data.players,
                    isHost: isHost,
                    gameStarted: data.game_started,
                    currentRound: data.current_round,
                    roundComplete: data.round_complete,
                    votingPhase: data.voting_phase,
                    currentQuestion: data.current_game_round?.question_pair,
                    current_player: currentPlayer,
                    hasAnswered: currentPlayer?.has_answered || false,
                    hasVoted: currentPlayer?.has_voted || false,
                    answer: currentPlayer?.answer || '',
                    votedFor: currentPlayer?.voted_for || null
                });

                // If round is complete, refresh room details again after a short delay to get updated points
                if (data.round_complete) {
                    setTimeout(() => {
                        this.getRoomDetails();
                    }, 1000);
                }
            })
            .catch((error) => {
                if (error === 'Room no longer exists') {
                    // Don't show error message for room closure, just redirect
                    return;
                }
                alert(error.message);
            });
    }

    leaveButtonPressed() {
        const requestOptions = {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
            },
            credentials: "include"
        };
        
        fetch("/api/leave-room", requestOptions)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to leave room');
                }
                // Clear any room code from session storage
                sessionStorage.removeItem('room_code');
                // Navigate to home page
                this.props.navigate("/");
            })
            .catch((error) => {
                alert(error.message);
            });
    }

  updateShowSettings(value) {
    this.setState({
      showSettings: value,
    });
  }

  renderSettings() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <CreateRoomPage
            update={true}
            votesToSkip={this.state.votesToSkip}
            guestCanPause={this.state.guestCanPause}
            roomCode={this.roomCode}
            updateCallback={this.getRoomDetails}
          />
        </Grid>
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => this.updateShowSettings(false)}
          >
            Close
          </Button>
        </Grid>
      </Grid>
    );
  }

  renderSettingsButton() {
    return (
      <Grid item xs={12} align="center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => this.updateShowSettings(true)}
        >
          Settings
        </Button>
      </Grid>
    );
  }

  startGame() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_code: this.roomCode
      })
    };
    fetch("/api/start-game", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.getRoomDetails();
      });
  }

  submitAnswer(answer) {
    const requestOptions = {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
      },
      credentials: "include",
      body: JSON.stringify({
        room_code: this.roomCode,
        answer: answer
      })
    };
    fetch("/api/submit-answer", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ 
          hasAnswered: true,
          answer: answer
        });
        this.getRoomDetails();
      });
  }

  submitVote(playerId) {
    const requestOptions = {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
      },
      credentials: "include",
      body: JSON.stringify({
        room_code: this.roomCode,
        voted_for: playerId
      })
    };
    
    fetch("/api/submit-vote", requestOptions)
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            try {
              const data = JSON.parse(text);
              throw new Error(data.error || 'Failed to submit vote');
            } catch (e) {
              throw new Error('Failed to submit vote: ' + text);
            }
          });
        }
        return response.text().then(text => {
          try {
            return JSON.parse(text);
          } catch (e) {
            throw new Error('Invalid response from server');
          }
        });
      })
      .then((data) => {
        this.setState({ hasVoted: true });
        // Always refresh room details after voting to get updated points
        this.getRoomDetails();
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  nextRound() {
    const requestOptions = {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
      },
      credentials: "include",
      body: JSON.stringify({
        room_code: this.roomCode
      })
    };
    fetch("/api/next-round", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.setState({
          hasAnswered: false,
          hasVoted: false,
          answer: '',
          votedFor: null
        });
        this.getRoomDetails();
      })
      .catch((error) => {
        console.error('Error starting next round:', error);
      });
  }

  kickPlayer = async (playerId) => {
    try {
      const response = await fetch('/api/kick-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
        },
        credentials: "include",
        body: JSON.stringify({
          room_code: this.roomCode,
          player_id: playerId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to kick player');
      }

      // Check if the kicked player is the current player
      const data = await response.json();
      
      if (data.kicked_player_id === this.state.current_player?.id) {
        // If the current player was kicked, redirect to home
        this.props.navigate('/');
        return;
      }

      // Update room details
      this.getRoomDetails();
    } catch (error) {
      alert(error.message);
    }
  };

  render() {
    if (this.state.showSettings) {
      return this.renderSettings();
    }
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} align="center">
          <Typography variant="h4" component="h4">
            Room Code: {this.roomCode} {this.state.isHost && '⭐'}
          </Typography>
        </Grid>
        
        <Grid item xs={12} align="center">
          <PlayerList
            players={this.state.players}
            isHost={this.state.isHost}
            onKickPlayer={this.kickPlayer}
          />
        </Grid>

        {!this.state.gameStarted && (
          <Grid item xs={12} align="center">
            {this.state.isHost && (
              <>
                {this.state.players.length < 3 ? (
                  <Typography variant="body1" color="textSecondary" style={{ marginTop: "1rem" }}>
                    Waiting for at least 3 players to start the game...
                  </Typography>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={this.startGame}
                    style={{ marginTop: "1rem" }}
                  >
                    Start Game
                  </Button>
                )}
              </>
            )}
          </Grid>
        )}

        {this.state.gameStarted && (
          <Grid item xs={12} align="center">
            <Typography variant="h6">
              Round {this.state.currentRound}
            </Typography>
            {this.state.currentQuestion && !this.state.votingPhase && (
              <QuestionDisplay
                question={this.state.current_player?.is_liar ? this.state.currentQuestion.liar_question : this.state.currentQuestion.truth_question}
                onAnswerSubmit={this.submitAnswer}
                hasAnswered={this.state.hasAnswered}
                players={this.state.players}
              />
            )}
            {!this.state.currentQuestion && !this.state.votingPhase && (
              <Typography variant="body1" color="textSecondary">
                Waiting for question...
              </Typography>
            )}
          </Grid>
        )}

        {this.state.votingPhase && (
          <Grid item xs={12} align="center">
            <Typography variant="h5" gutterBottom>
              {this.state.currentQuestion?.truth_question}
            </Typography>
            <VotingInterface
              players={this.state.players}
              onVoteSubmit={this.submitVote}
              hasVoted={this.state.hasVoted}
            />
          </Grid>
        )}

        {this.state.roundComplete && (
          <Grid item xs={12} align="center">
            <Typography variant="h6" color="primary" gutterBottom>
              Round Complete!
            </Typography>
            <Typography variant="body1" gutterBottom>
              The liar was: {this.state.players.find(p => p.is_liar)?.name}
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Their question was: {this.state.currentQuestion?.liar_question}
            </Typography>
            <Typography variant="body1" color="primary" gutterBottom>
              {this.state.current_player?.is_liar ? 
                "You earned 2 points for fooling everyone!" :
                this.state.current_player?.voted_for === this.state.players.find(p => p.is_liar)?.id ?
                  "You earned 1 point for correctly identifying the liar!" :
                  "You didn't earn any points this round."
              }
            </Typography>
            {this.state.isHost && (
              <Button
                variant="contained"
                color="primary"
                onClick={this.nextRound}
                style={{ marginTop: "1rem" }}
              >
                Next Round
              </Button>
            )}
          </Grid>
        )}

        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={this.leaveButtonPressed}
            style={{ marginTop: "2rem" }}
          >
            Leave Room
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default withRouter(Room);  // Wrap the component with router