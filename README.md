# Liar

A multiplayer web party game — create a room, invite friends with a 6-letter code, play rounds, vote on who's bluffing. Built as a full-stack learning project; not actively maintained.

**Stack:** Django · Django REST Framework · React · Vercel

## What it does

- Host creates a game room; players join via a unique code
- - Rounds have a play phase and a voting phase
  - - Server enforces round/voting state and broadcasts updates to all players in the room
   
    - ## Architecture
   
    - ```
      liar_game/
      ├── api/          Django REST API — rooms, players, game rounds, voting
      │   ├── models.py          (Room, Player, GameRound)
      │   ├── views.py           (game logic + endpoints)
      │   └── serializers.py
      ├── frontend/     Django-served React app
      │   ├── src/components/    (room, lobby, round, voting views)
      │   └── src/index.js
      ├── liar_game/    Django project config
      └── manage.py
      ```

      Deployed to Vercel; Django + REST backend, React + Babel frontend served from the same project.

      ## Run locally

      ```bash
      pip install -r requirements.txt
      python liar_game/manage.py migrate
      python liar_game/manage.py runserver
      ```

      ## Status

      ⚠️ **Archived in spirit, not in git** — I stopped working on this in early 2025 when my focus shifted to agentic systems and developer tooling. The code works but isn't being updated. Kept public as a reference / learning artifact.
      
