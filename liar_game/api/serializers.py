from rest_framework import serializers
from .models import Room, Player, QuestionPair, GameRound

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'name', 'is_host', 'is_liar', 'has_answered', 'has_voted', 'answer')

class QuestionPairSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionPair
        fields = ('id', 'truth_question', 'liar_question', 'created_by', 'created_at')

class GameRoundSerializer(serializers.ModelSerializer):
    question_pair = QuestionPairSerializer()
    liar = PlayerSerializer()
    
    class Meta:
        model = GameRound
        fields = ('id', 'room', 'question_pair', 'liar', 'round_number', 'created_at')

class RoomSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    current_game_round = GameRoundSerializer(read_only=True)

    class Meta:
        model = Room
        fields = ('id', 'code', 'host', 'game_started', 'current_round', 
                 'round_complete', 'voting_phase', 'created_at', 
                 'players', 'current_game_round')

class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('code',)

class UpdateRoomSerializer(serializers.ModelSerializer):
    code = serializers.CharField(validators=[])

    class Meta:
        model = Room
        fields = ('code', 'game_started', 'current_round', 'round_complete', 'voting_phase')