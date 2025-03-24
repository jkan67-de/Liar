import React, { Component } from 'react';
import { Link, useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import { Collapse, Alert, TextField } from '@mui/material';

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Create a wrapper component to use hooks
function withNavigation(Component) {
    return props => {
        const navigate = useNavigate();
        return <Component {...props} navigate={navigate} />;
    }
}

class CreateRoomPage extends Component {
    static defaultProps = {
        update: false,
        votesToSkip: 2,
        guestCanPause: true,
        roomCode: null,
        updateCallback: () => {},
    };

    constructor(props) {
        super(props);
        this.state = {
            hostName: "",
            errorMessage: "",
            successMessage: "",
        };
        this.handleRoomButtonPressed = this.handleRoomButtonPressed.bind(this);
        this.handleUpdateButtonPressed = this.handleUpdateButtonPressed.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
    }

    handleNameChange(e) {
        this.setState({
            hostName: e.target.value,
        });
    }

    handleRoomButtonPressed = () => {
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                name: this.state.hostName
            }),
            credentials: 'include'
        };
        fetch('/api/create-room', requestOptions)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to create room');
                }
                return response.json();
            })
            .then((data) => {
                if (!data || !data.code) {
                    throw new Error('Invalid room data received');
                }
                this.props.navigate(`/room/${data.code}`);
            })
            .catch((error) => {
                this.setState({
                    errorMessage: error.message || 'Error creating room. Please try again.'
                });
            });
    }

    handleUpdateButtonPressed = () => {
        const requestOptions = {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                code: this.props.roomCode,
                max_players: 10  // Default max players
            }), 
        }
        fetch(`/api/update-room`, requestOptions)
           .then((response) => {
              if (response.ok) {
                  this.setState({
                      successMessage: `Room updated successfully!`,
                  });
                  this.props.updateCallback();
              } else {
                  this.setState({
                      errorMessage: `Could not update room.`,
                  });
               }
               this.props.updateCallback();            
           });
    }

    render() {
        const title = this.props.update ? 'Update Room' : 'Create a Room';
        return (
            <Grid container spacing={3}>
                <Grid item xs={12} align="center">
                    <Typography component="h4" variant="h4">
                        {title}
                    </Typography>
                </Grid>
                <Grid item xs={12} align="center">
                    <TextField
                        label="Your Name"
                        placeholder="Enter your name"
                        value={this.state.hostName}
                        variant="outlined"
                        onChange={this.handleNameChange}
                    />
                </Grid>
                <Grid item xs={12} align="center">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleRoomButtonPressed}
                        disabled={!this.state.hostName}
                    >
                        {this.props.update ? 'Update Room' : 'Create Room'}
                    </Button>
                </Grid>
                <Grid item xs={12} align="center">
                    <Button variant="contained" color="secondary" to="/" component={Link}>
                        Back
                    </Button>
                </Grid>
                {this.state.errorMessage && (
                    <Grid item xs={12} align="center">
                        <Alert severity="error" onClose={() => this.setState({ errorMessage: "" })}>
                            {this.state.errorMessage}
                        </Alert>
                    </Grid>
                )}
                {this.state.successMessage && (
                    <Grid item xs={12} align="center">
                        <Alert severity="success" onClose={() => this.setState({ successMessage: "" })}>
                            {this.state.successMessage}
                        </Alert>
                    </Grid>
                )}
            </Grid>
        );
    }
}

export default withNavigation(CreateRoomPage);


