import React, { Component } from 'react';
import { TextField,Button,Grid,Typography } from '@mui/material';
import { Link, useNavigate } from "react-router-dom";

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

function withNavigation(Component) {
    return props => {
        const navigate = useNavigate();
        return <Component {...props} navigate={navigate} />;
    }
}

class RoomJoinPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            roomCode: "",
            playerName: "",
            error: "",
        }
        this.handleTextFieldChange = this.handleTextFieldChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.roomButtonPressed = this.roomButtonPressed.bind(this);
    }
    render() {
        return (<Grid container spacing={1}>
            <Grid item xs={12} align="center">
                <Typography component="h4" variant="h4">
                    Join a Room
                </Typography>
            </Grid>
            <Grid item xs={12} align="center">
                <TextField
                    error={this.state.error}
                    label="Code"
                    placeholder="Enter a Room Code"
                    value={this.state.roomCode}
                    helperText={this.state.error}
                    variant="outlined"
                    onChange={this.handleTextFieldChange}
                />
            </Grid>
            <Grid item xs={12} align="center">
                <TextField
                    label="Your Name"
                    placeholder="Enter your name"
                    value={this.state.playerName}
                    variant="outlined"
                    onChange={this.handleNameChange}
                />
            </Grid>
            <Grid item xs={12} align="center">
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={this.roomButtonPressed}
                    disabled={!this.state.roomCode || !this.state.playerName}
                >
                    Enter Room
                </Button>
            </Grid>
            <Grid item xs={12} align="center">
                <Button variant="contained" color="secondary" to="/" component={Link}>
                    Back
                </Button>
            </Grid>
            </Grid>
            )
    }

    handleTextFieldChange(e) {
        this.setState({
            roomCode: e.target.value,
        }); 
    }

    handleNameChange(e) {
        this.setState({
            playerName: e.target.value,
        });
    }

    roomButtonPressed() {
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            credentials: "include",
            body: JSON.stringify({
                code: this.state.roomCode,
                name: this.state.playerName,
            }),
        };
        fetch("/api/join-room", requestOptions).then((response) => {
            if (response.ok) {
                this.setState({
                    error: "",
                });
                this.props.navigate(`/room/${this.state.roomCode}`);
            } else {
                response.json().then(data => {
                    this.setState({
                        error: data.error || "Room not found",
                    });
                });
            }
        }).catch((error) => {
            // Handle error silently
        });
    }
}

export default withNavigation(RoomJoinPage);


