# Generated by Django 5.1.7 on 2025-03-24 15:06

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_add_current_game_round'),
    ]

    operations = [
        migrations.AlterField(
            model_name='room',
            name='current_game_round',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='current_in_room', to='api.gameround'),
        ),
    ]
