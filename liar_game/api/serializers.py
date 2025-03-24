from rest_framework import serializers
from .models import Room, Player, QuestionPair, GameRound

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'name', 'is_host', 'is_liar', 'has_answered', 'has_voted', 'answer', 'voted_for', 'points')
        read_only_fields = ('id', 'name', 'is_host', 'is_liar', 'has_answered', 'has_voted', 'answer', 'voted_for', 'points')

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
    host = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ('code', 'host', 'players', 'game_started', 'current_round', 'round_complete', 'voting_phase', 'current_game_round')
        read_only_fields = ('code', 'host', 'players', 'game_started', 'current_round', 'round_complete', 'voting_phase', 'current_game_round')

    def get_host(self, obj):
        host_player = obj.player_set.filter(is_host=True).first()
        return host_player.name if host_player else None

class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('code',)

class UpdateRoomSerializer(serializers.ModelSerializer):
    code = serializers.CharField(validators=[])

    class Meta:
        model = Room
        fields = ('code', 'game_started', 'current_round', 'round_complete', 'voting_phase')