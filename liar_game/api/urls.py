from django.urls import path
from . import views

urlpatterns = [
    path('room', views.RoomView.as_view()),
    path('create-room', views.CreateRoomView.as_view()),
    path('join-room', views.JoinRoom.as_view()),
    path('user-in-room', views.UserInRoom.as_view()),
    path('leave-room', views.LeaveRoomView.as_view()),
    path('start-game', views.StartGame.as_view()),
    path('submit-answer', views.SubmitAnswer.as_view()),
    path('submit-vote', views.SubmitVote.as_view()),
    path('next-round', views.NextRound.as_view()),
    path('update-room', views.UpdateRoom.as_view()),
    path('kick-player', views.KickPlayer.as_view()),
]