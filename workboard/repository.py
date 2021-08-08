from .models import Project, List, Ticket, User, TicketHistory, Comment

def get_project_by_name(project_name):
    return Project.objects.get(name=project_name)

def get_projects_by_name(project_name):
    return list(Project.objects.filter(name=project_name))

def get_project_by_user(user_id):
    return list(Project.objects.filter(user_id=user_id))

def get_all_projects():
    return list(Project.objects.all())

def get_project_by_id(project_id):
    return Project.objects.get(id=project_id)

def get_list_by_id(list_id):
    return List.objects.get(id=list_id)

def get_lists_by_project_id(project_id):
    return list(List.objects.filter(project_id=project_id))

def get_ticket_by_id(ticket_id):
    return Ticket.objects.get(id=ticket_id)

def get_tickets_by_list_id(list_id):
    return list(Ticket.objects.filter(list_id=list_id))

def get_ticket_history_records(ticket_id):
    return list(TicketHistory.objects.filter(ticket_id=ticket_id))

def get_ticket_comments(ticket_id):
    return list(Comment.objects.filter(ticket_id=ticket_id).order_by("-timestamp"))

def delete_tickets_by_list_id(list_id):
    Ticket.objects.filter(list_id=list_id).delete()

def delete_list_by_id(list_id):
    List.objects.filter(id=list_id).delete()

def get_user_by_id(user_id):
    return User.objects.get(id=user_id)

def create_project(project_name, user):
    project = Project()

    project.name = project_name
    project.user_id = user.id

    project.save()

    return project

def create_list(list_name, project):
    list = List()

    list.name = list_name
    list.project = project
    list.order = (get_list_highest_order(project.id)) + 1

    list.save()

    return list

def create_ticket(ticket_name, ticket_description, list_item, user):
    ticket = Ticket()

    ticket.name = ticket_name
    ticket.description = ticket_description
    ticket.list = list_item
    ticket.user = user

    ticket.save()

    return ticket

def create_comment(user, ticket, comment_text):
    comment = Comment()

    comment.text = comment_text
    comment.user = user
    comment.ticket = ticket

    comment.save()

    return comment

def create_ticket_history(ticket_id, user_id, history_type, metadata):
    ticket_history = TicketHistory()

    ticket_history.ticket_id = ticket_id
    ticket_history.user_id = user_id
    ticket_history.history_type = history_type
    ticket_history.metadata = metadata

    ticket_history.save()

    return ticket_history

def get_list_highest_order(project_id):
    lists = get_lists_by_project_id(project_id)

    if len(lists) == 0:
        return 0

    return (sorted(lists, key=lambda list_item: list_item.order)[len(lists) - 1]).order
