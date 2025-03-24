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
            answer: ''
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
        fetch("/api/get-room?code=" + this.roomCode, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
            },
            credentials: "include"
        })
            .then((response) => response.json())
            .then((data) => {
                if (data) {
                    // Check if current player still exists in the room
                    if (!data.current_player) {
                        // Player was kicked or doesn't exist in the room
                        this.props.leaveRoomCallback();
                        this.props.navigate("/");
                        return;
                    }

                    const currentRoundChanged = data.current_round !== this.state.currentRound;
                    this.setState({
                        isHost: data.is_host,
                        gameStarted: data.game_started,
                        currentRound: data.current_round,
                        roundComplete: data.round_complete,
                        votingPhase: data.voting_phase,
                        players: data.players || [],
                        currentQuestion: data.current_game_round?.question_pair || null,
                        current_player: data.current_player,
                        hasAnswered: currentRoundChanged ? false : this.state.hasAnswered,
                        hasVoted: currentRoundChanged ? false : this.state.hasVoted,
                        answer: currentRoundChanged ? '' : this.state.answer
                    });
                }
            });
    }

    leaveButtonPressed() {
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        };
        fetch("/api/leave-room", requestOptions).then((_response) => {
            this.props.leaveRoomCallback();
            this.props.navigate("/");  // Changed from history.push
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_code: this.roomCode,
        voted_for: playerId
      })
    };
    fetch("/api/submit-vote", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ hasVoted: true });
        this.getRoomDetails();
      });
  }

  nextRound() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
          answer: ''
        });
        this.getRoomDetails();
      });
  }

  kickPlayer(playerId) {
    const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1];

    const requestOptions = {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken || ''
      },
      credentials: "include",
      body: JSON.stringify({
        player_id: playerId
      })
    };

    fetch("/api/kick-player", requestOptions)
      .then((response) => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to kick player');
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        this.getRoomDetails();
      })
      .catch((error) => {
        console.error('Error kicking player:', error.message);
        // You might want to show this error to the user in the UI
      });
  }

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
            {this.state.isHost ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.startGame}
                  disabled={this.state.players.length < 2}
                >
                  Start Game
                </Button>
                {this.state.players.length < 2 && (
                  <Typography variant="body2" color="error" style={{ marginTop: "0.5rem" }}>
                    Need at least 2 players to start
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body1">
                Waiting for host to start the game...
              </Typography>
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