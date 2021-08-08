from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass
    avatar = models.TextField(blank=True, null=True)

class Ticket(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user")
    list = models.ForeignKey("List", on_delete=models.CASCADE, related_name="list")
    name = models.TextField(blank=True)
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

class Project(models.Model):
    name = models.TextField(blank=True)
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="project_user")
    timestamp = models.DateTimeField(auto_now_add=True)

class List(models.Model):
    name = models.TextField(blank=False)
    project = models.ForeignKey("Project", on_delete=models.CASCADE, related_name="list_project")
    order = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

class TicketHistory(models.Model):
    ticket = models.ForeignKey("Ticket", on_delete=models.CASCADE, related_name="history_ticket")
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="history_user")
    history_type = models.TextField(blank=True)
    metadata = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    ticket = models.ForeignKey("Ticket", on_delete=models.CASCADE, related_name="comment_ticket")
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="comment_user")
    text = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

TICKET_HISTORY_TYPE_CREATION = "creation"
TICKET_HISTORY_TYPE_LIST_CHANGE = "list_change"
TICKET_HISTORY_TYPE_TITLE_CHANGE = "title_change"
TICKET_HISTORY_TYPE_DESCRIPTION_CHANGE = "description_change"
TICKET_HISTORY_TYPE_EDIT = "edit"
