from django.urls import path
from . import views

urlpatterns = [
    path('create-room', views.CreateRoomView.as_view()),
    path('get-room', views.GetRoom.as_view()),
    path('join-room', views.JoinRoom.as_view()),
    path('leave-room', views.LeaveRoom.as_view()),
    path('start-game', views.StartGame.as_view()),
    path('submit-answer', views.SubmitAnswer.as_view()),
    path('submit-vote', views.SubmitVote.as_view()),
    path('next-round', views.NextRound.as_view()),
    path('kick-player', views.KickPlayer.as_view()),
]