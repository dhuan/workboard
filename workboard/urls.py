
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("projects", views.projects_view, name="projects"),
    path("board/<int:project_id>", views.board_view, name="board"),
    path("board/<int:project_id>/ticket/<str:ticket_id>", views.ticket_view, name="ticket"),
    path("api/project/new", views.api_project_new, name="api_project_new"),
    path("api/project/<int:project_id>", views.api_project, name="api_project"),
    path("api/project/<str:project_name>", views.api_project_by_name, name="api_project_by_name"),
    path("api/project/<int:project_id>/delete", views.api_project_delete, name="api_project_delete"),
    path("api/list/new", views.api_list_new, name="api_list_new"),
    path("api/list/delete", views.api_list_delete, name="api_list_delete"),
    path("api/list/<int:list_id>/move/left", views.api_list_move_left, name="api_list_move_left"),
    path("api/list/<int:list_id>/move/right", views.api_list_move_right, name="api_list_move_right"),
    path("api/ticket/new", views.api_ticket_new, name="api_ticket_new"),
    path("api/ticket/edit/<int:ticket_id>", views.api_ticket_edit, name="api_ticket_edit"),
    path("api/ticket/<int:ticket_id>/delete", views.api_ticket_delete, name="api_ticket_delete"),
    path("api/ticket/<int:ticket_id>/history", views.api_ticket_history, name="api_ticket_history"),
    path("api/ticket/<int:ticket_id>/comments", views.api_ticket_comments, name="api_ticket_comments"),
    path("api/ticket/<int:ticket_id>/comment", views.api_ticket_comment, name="api_ticket_comment"),
]
