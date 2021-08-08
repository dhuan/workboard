def project(project_obj, tickets):
    return {
        "id": project_obj.id,
        "name": project_obj.name,
        "timestamp": project_obj.timestamp,
        "link": project_link(project_obj),
        "ticket_count": len(tickets),
    }

def list_item(list_obj):
    return {
        "id": list_obj.id,
        "name": list_obj.name,
    }

def ticket(users, ticket_obj):
    return {
        "id": ticket_obj.id,
        "name": ticket_obj.name,
        "description": ticket_obj.description,
        "list_id": ticket_obj.list.id,
        "user_name": find_user_by_id(users, ticket_obj.user.id).username,
        "timestamp": ticket_obj.timestamp,
    }

def ticket_history(users, ticket_history_obj):
    return {
        "id": ticket_history_obj.id,
        "history_type": ticket_history_obj.history_type,
        "metadata": ticket_history_obj.metadata,
        "timestamp": ticket_history_obj.timestamp,
        "user_name": find_user_by_id(users, ticket_history_obj.user.id).username,
    }

def comment(users, comment):
    return {
        "id": comment.id,
        "text": comment.text,
        "timestamp": comment.timestamp,
        "user_name": find_user_by_id(users, comment.user.id).username,
    }

def find_user_by_id(users, user_id):
    filtered_users = list(filter(lambda user: user.id == user_id, users))

    if len(filtered_users) == 0:
        raise ValueError("Could not find user.")

    return filtered_users[0]

def project_link(project):
    return f'/board/{project.id}'
