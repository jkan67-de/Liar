from django.db import models
import string
import random


def generate_unique_code():
    length = 6

    while True:
        code = ''.join(random.choices(string.ascii_uppercase, k=length))
        if Room.objects.filter(code=code).count() == 0:
            break

    return code


class Room(models.Model):
    code = models.CharField(max_length=8, default=generate_unique_code, unique=True)
    host = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    game_started = models.BooleanField(default=False)
    current_round = models.IntegerField(default=0)
    round_complete = models.BooleanField(default=False)
    voting_phase = models.BooleanField(default=False)
    current_game_round = models.ForeignKey('GameRound', on_delete=models.SET_NULL, null=True, blank=True, related_name='current_in_room')

    def __str__(self):
        return f"Room {self.code}"

    @property
    def players(self):
        return self.player_set.all()


class Player(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    session_key = models.CharField(max_length=50)
    is_host = models.BooleanField(default=False)
    is_liar = models.BooleanField(default=False)
    has_answered = models.BooleanField(default=False)
    has_voted = models.BooleanField(default=False)
    answer = models.TextField(null=True, blank=True)
    voted_for = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    points = models.IntegerField(default=0)


class QuestionPair(models.Model):
    truth_question = models.CharField(max_length=200)
    liar_question = models.CharField(max_length=200)
    created_by = models.CharField(max_length=50)  # Host's session key
    created_at = models.DateTimeField(auto_now_add=True)


class GameRound(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    question_pair = models.ForeignKey(QuestionPair, on_delete=models.CASCADE)
    liar = models.ForeignKey(Player, on_delete=models.CASCADE)
    round_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)