from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_questionpair_room_current_round_room_game_started_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='current_game_round',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.gameround'),
        ),
    ] 