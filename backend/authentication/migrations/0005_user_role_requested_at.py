# Generated by Django 5.1.7 on 2025-03-20 13:02

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0004_alter_user_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='role_requested_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
