# Generated by Django 3.2.3 on 2021-07-09 21:30

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('workboard', '0008_comment'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='user',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='project_user', to='workboard.user'),
            preserve_default=False,
        ),
    ]
