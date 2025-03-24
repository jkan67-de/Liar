from django.db.models import query
from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer, PlayerSerializer, QuestionPairSerializer
from .models import Room, Player, QuestionPair, GameRound
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
import random
from django.urls import path

class RoomView(generics.ListAPIView):  # Changed from ListAPIView to ListCreateAPIView
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class GetRoom(APIView):
    serializer_class = RoomSerializer
    lookup_url_kwarg = 'code'

    def get(self, request, format=None):
        code = request.GET.get(self.lookup_url_kwarg)
        if code != None:
            room = Room.objects.filter(code=code).first()
            if room:
                # Get all players in the room
                players = Player.objects.filter(room=room)
                print(f"GetRoom: Found {players.count()} players in room {room.code}")
                print(f"GetRoom: Room has current_game_round {room.current_game_round.id if room.current_game_round else None}")
                
                data = RoomSerializer(room).data
                current_player = Player.objects.filter(
                    session_key=self.request.session.session_key,
                    room=room
                ).first()
                if current_player:
                    data['current_player'] = PlayerSerializer(current_player).data
                    # Add is_host information
                    data['is_host'] = current_player.is_host
                    print(f"GetRoom: Current player {current_player.name} is_liar={current_player.is_liar}")
                
                print(f"GetRoom: Sending data with current_game_round {data.get('current_game_round', {}).get('id') if data.get('current_game_round') else None}")
                return Response(data, status=status.HTTP_200_OK)
            return Response({'Room Not Found': 'Invalid Room Code.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad Request': 'Code parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)

class JoinRoom(APIView):
    lookup_url_kwarg = 'code'

    def post(self, request, format=None):
        # Ensure session is created and saved
        if not request.session.exists(request.session.session_key):
            request.session.create()
            request.session.save()
        request.session.modified = True

        code = request.data.get(self.lookup_url_kwarg)
        player_name = request.data.get('name')

        if not player_name:
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)

        if code != None:
            room_result = Room.objects.filter(code=code)
            if len(room_result) > 0:
                room = room_result[0]
                # Check if name is already taken in this room
                if Player.objects.filter(room=room, name=player_name).exists():
                    return Response({'error': 'This name is already taken in this room'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if player already exists
                player = Player.objects.filter(session_key=self.request.session.session_key, room=room).first()
                if not player:
                    player = Player(
                        room=room,
                        name=player_name,
                        session_key=self.request.session.session_key
                    )
                    player.save()
                self.request.session['room_code'] = code
                return Response({'message': 'Room Joined!'}, status=status.HTTP_200_OK)
            return Response({'Bad Request': 'Invalid Room Code'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'Bad Request': 'Invalid post data, did not find a code key'}, status=status.HTTP_400_BAD_REQUEST)

class CreateRoomView(APIView):
    serializer_class = CreateRoomSerializer

    def post(self, request, format=None):
        # Ensure session is created and saved
        if not request.session.exists(request.session.session_key):
            request.session.create()
            request.session.save()
        request.session.modified = True

        host = self.request.session.session_key
        if not host:
            return Response({'error': 'Invalid session'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if host already has a room
        queryset = Room.objects.filter(host=host)
        if queryset.exists():
            room = queryset[0]
            self.request.session['room_code'] = room.code
            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

        try:
            # Get host name from request
            host_name = request.data.get('name', f'Host_{host[:6]}')

            # Create new room
            room = Room(host=host)
            room.save()

            # Create host player
            player = Player.objects.create(
                room=room,
                name=host_name,
                session_key=host,
                is_host=True
            )

            self.request.session['room_code'] = room.code
            return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            if 'room' in locals():
                room.delete()
            return Response(
                {'error': f'Failed to create room or host player: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserInRoom(APIView):
    def get(self, request, format=None):
        # Ensure session is created and saved
        if not request.session.exists(request.session.session_key):
            request.session.create()
            request.session.save()
        request.session.modified = True

        data = {
            'code': self.request.session.get('room_code')
        }
        return JsonResponse(data, status=status.HTTP_200_OK)

class LeaveRoom(APIView):
    def post(self, request, format=None):
        if 'room_code' in self.request.session:
            code = self.request.session.pop('room_code')
            host_id = self.request.session.session_key
            room_results = Room.objects.filter(host=host_id)
            if len(room_results) > 0:
                room = room_results[0]
                room.delete()
            return Response({'Message': 'Success'}, status=status.HTTP_200_OK)

        return Response({'Message': 'Not in a room'}, status=status.HTTP_404_NOT_FOUND)

class StartGame(APIView):
    def post(self, request, format=None):
        room = Room.objects.filter(host=self.request.session.session_key).first()
        if not room:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        if room.game_started:
            return Response({'error': 'Game already started'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create a question pair
        question_pair = QuestionPair.objects.first()  # In production, implement proper question selection
        if not question_pair:
            question_pair = QuestionPair.objects.create(
                truth_question='What did you eat for breakfast today?',
                liar_question='What did you eat for dinner yesterday?',
                created_by=self.request.session.session_key
            )

        # Randomly select a liar
        players = list(Player.objects.filter(room=room))
        if len(players) < 2:
            return Response({'error': 'Not enough players'}, status=status.HTTP_400_BAD_REQUEST)

        liar = random.choice(players)
        liar.is_liar = True
        liar.save()

        # Create game round
        game_round = GameRound.objects.create(
            room=room,
            question_pair=question_pair,
            liar=liar,
            round_number=room.current_round + 1
        )

        room.game_started = True
        room.current_round += 1
        room.current_game_round = game_round
        room.save()

        print(f"StartGame: Created game round {game_round.id} with question pair {question_pair.id}")
        print(f"StartGame: Room {room.code} now has current_game_round {room.current_game_round.id}")

        return Response(RoomSerializer(room).data)

class SubmitAnswer(APIView):
    def post(self, request, format=None):
        room_code = request.data.get('room_code')
        answer = request.data.get('answer')

        if not room_code or not answer:
            return Response({'error': 'Missing data'}, status=status.HTTP_400_BAD_REQUEST)

        room = Room.objects.filter(code=room_code).first()
        if not room:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        player = Player.objects.filter(
            session_key=self.request.session.session_key,
            room=room
        ).first()

        if not player:
            return Response({'error': 'Player not found'}, status=status.HTTP_404_NOT_FOUND)

        player.answer = answer
        player.has_answered = True
        player.save()

        # Check if all players have answered
        all_answered = all(p.has_answered for p in room.player_set.all())
        if all_answered:
            room.voting_phase = True
            room.save()

        return Response(RoomSerializer(room).data)

class SubmitVote(APIView):
    def post(self, request, format=None):
        room_code = request.data.get('room_code')
        voted_for_id = request.data.get('voted_for')

        if not room_code or not voted_for_id:
            return Response({'error': 'Missing data'}, status=status.HTTP_400_BAD_REQUEST)

        room = Room.objects.filter(code=room_code).first()
        if not room:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        player = Player.objects.filter(
            session_key=self.request.session.session_key,
            room=room
        ).first()

        voted_for = Player.objects.filter(id=voted_for_id, room=room).first()
        if not player or not voted_for:
            return Response({'error': 'Player not found'}, status=status.HTTP_404_NOT_FOUND)

        player.voted_for = voted_for
        player.has_voted = True
        player.save()

        # Check if all players have voted
        all_voted = all(p.has_voted for p in room.player_set.all())
        if all_voted:
            room.round_complete = True
            room.save()

        return Response(RoomSerializer(room).data)

class NextRound(APIView):
    def post(self, request, format=None):
        room = Room.objects.filter(host=self.request.session.session_key).first()
        if not room:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        # Reset player states
        Player.objects.filter(room=room).update(
            is_liar=False,
            has_answered=False,
            has_voted=False,
            answer=None,
            voted_for=None
        )

        # Get or create a question pair
        question_pair = QuestionPair.objects.first()  # In production, implement proper question selection
        if not question_pair:
            question_pair = QuestionPair.objects.create(
                truth_question='What did you eat for breakfast today?',
                liar_question='What did you eat for dinner yesterday?',
                created_by=self.request.session.session_key
            )

        # Randomly select a liar
        players = list(Player.objects.filter(room=room))
        liar = random.choice(players)
        liar.is_liar = True
        liar.save()

        # Create new game round
        game_round = GameRound.objects.create(
            room=room,
            question_pair=question_pair,
            liar=liar,
            round_number=room.current_round + 1
        )

        # Reset room state and set new game round
        room.voting_phase = False
        room.round_complete = False
        room.current_round += 1
        room.current_game_round = game_round
        room.save()

        print(f"NextRound: Created game round {game_round.id} with question pair {question_pair.id}")
        print(f"NextRound: Room {room.code} now has current_game_round {room.current_game_round.id}")

        return Response(RoomSerializer(room).data)

class UpdateRoom(APIView):
    serializer_class = UpdateRoomSerializer

    def patch(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            code = serializer.data.get('code')
            game_started = serializer.data.get('game_started')
            current_round = serializer.data.get('current_round')
            round_complete = serializer.data.get('round_complete')
            voting_phase = serializer.data.get('voting_phase')
        
            queryset = Room.objects.filter(code=code)
            if not queryset.exists():
                return Response({'msg': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

            room = queryset[0]
            user_id = self.request.session.session_key
            if room.host != user_id:
                return Response({'msg': 'You are not the host of this room.'}, status=status.HTTP_403_FORBIDDEN)

            if game_started is not None:
                room.game_started = game_started
            if current_round is not None:
                room.current_round = current_round
            if round_complete is not None:
                room.round_complete = round_complete
            if voting_phase is not None:
                room.voting_phase = voting_phase
                
            room.save()
            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

        return Response({'Bad Request': 'Invalid data...'}, status=status.HTTP_400_BAD_REQUEST)

class KickPlayer(APIView):
    def post(self, request, format=None):
        try:
            room = Room.objects.filter(host=self.request.session.session_key).first()
            if not room:
                return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

            player_id = request.data.get('player_id')
            if not player_id:
                return Response({'error': 'Player ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            player = Player.objects.get(id=player_id, room=room)
            if player.is_host:
                return Response({'error': 'Cannot kick the host'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Delete the player
            player.delete()
            return Response({'message': 'Player kicked successfully'}, status=status.HTTP_200_OK)
        except Player.DoesNotExist:
            return Response({'error': 'Player not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in KickPlayer: {str(e)}")  # Add logging
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)