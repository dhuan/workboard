import json
from .models import Project, TICKET_HISTORY_TYPE_TITLE_CHANGE, TICKET_HISTORY_TYPE_DESCRIPTION_CHANGE, TICKET_HISTORY_TYPE_EDIT, TICKET_HISTORY_TYPE_LIST_CHANGE

def parse_payload(request, payload_structure):
    payload = json.loads(request.body)

    payload_structure_keys = list(payload_structure.keys())

    validate_payload(payload, payload_structure, payload_structure_keys)

    return payload

def validate_payload(payload, payload_structure, payload_structure_keys):
    if len(payload_structure_keys) == 0:
        return

    key = payload_structure_keys[0]

    validator = payload_structure[key]

    if validator(payload[key]) is not True:
        raise PayloadValidationError(key)

class PayloadValidationError(Exception):
    pass

class ItemNotFoundError(Exception):
    pass

def remove_index(arr, index_to_remove):
    return remove_enumerate(list(filter(
        lambda item: item[0] != index_to_remove,
        list(enumerate(arr))
    )))

def add_at(arr, element, index):
    return arr[0:index] + [element] + arr[index:]

def remove_enumerate(arr):
    return list(map(lambda item: item[1], arr))

def index_of(items, find, i):
    if len(items) == 0:
        return -1

    if items[0] == find:
        return i

    return index_of(items[1:], find, i + 1)

def reset_lists_order(lists, i):
    if len(lists) == 0:
        return []

    lists[0].order = i

    return [ lists[0] ] + reset_lists_order(lists[1:], i + 1)

def save_entities(entities):
    if len(entities) == 0:
        return

    entities[0].save()

    return save_entities(entities[1:])

def unique(arr):
    return list(dict.fromkeys(arr))

def resolve_ticket_history_record_type(ticket_edited, ticket_original):
    list_changed = ticket_edited.list.id != ticket_original.list.id
    title_changed = ticket_edited.name != ticket_original.name
    description_changed = ticket_edited.description != ticket_original.description
    only_list_changed = list_changed and not title_changed and not description_changed
    only_title_changed = title_changed and not list_changed and not description_changed
    only_description_changed = description_changed and not list_changed and not title_changed

    if only_list_changed:
        return TICKET_HISTORY_TYPE_LIST_CHANGE

    if only_title_changed:
        return TICKET_HISTORY_TYPE_TITLE_CHANGE

    if only_description_changed:
        return TICKET_HISTORY_TYPE_DESCRIPTION_CHANGE

    return TICKET_HISTORY_TYPE_EDIT

def resolve_ticket_history_record_metadata(ticket_edited, ticket_original, ticket_history_type):
    if ticket_history_type == TICKET_HISTORY_TYPE_LIST_CHANGE:
        return "{}|{}".format(ticket_original.list.name, ticket_edited.list.name)

    if ticket_history_type == TICKET_HISTORY_TYPE_TITLE_CHANGE:
        return "{}|{}".format(ticket_original.name, ticket_edited.name)

    return ""

def get_tickets_for_project(repository, project_id):
    lists = repository.get_lists_by_project_id(project_id)

    tickets = flatten(list(map(
        lambda list: repository.get_tickets_by_list_id(list.id),
        lists
    )))

    return tickets

def flatten(arr):
    if len(arr) == 0:
        return []

    return list(arr[0]) + (flatten(arr[1:]))

def remove_entities(entities):
    list(map(lambda entity: entity.delete(), entities))

def get_ticket_history_records_for_tickets(repository, tickets):
    return flatten(list(map(
        lambda ticket: repository.get_ticket_history_records(ticket.id),
        tickets
    )))

def add_last_activity_to_project(project_obj, get_project_id, repository):
    project_id = get_project_id(project_obj)

    tickets = get_tickets_for_project(repository, project_id)

    ticket_history_records = get_ticket_history_records_for_tickets(repository, tickets)

    if len(ticket_history_records) == 0:
        return project_obj

    ticket_history_records_sorted = sorted(ticket_history_records, key=lambda record: record.timestamp)

    last_activity_timestamp = ticket_history_records_sorted[len(ticket_history_records_sorted) - 1].timestamp

    project_obj["last_activity_timestamp"] = last_activity_timestamp

    return project_obj

def get_project_id_from_serialized(project_serialized):
    return project_serialized["id"]

def get_project_participants(repository, projects, tickets, index, user_cache):
    if len(projects) == 0:
        return []

    project = projects[0]

    project_tickets = tickets[0]

    user_ids = unique(list(map(lambda ticket: ticket.user_id, project_tickets)))

    if index_of(user_ids, project.user_id, 0) == -1:
        user_ids = [ project.user_id ] + user_ids

    user_cache_ids = list(map(lambda user: user.id, user_cache))

    user_ids_new = list(filter(
        lambda user_id: index_of(user_cache_ids, user_id, 0) == -1,
        user_ids
    ))

    users_new = list(map(
        lambda user_id: repository.get_user_by_id(user_id),
        user_ids_new
    ))

    user_cache_new = user_cache + users_new

    ticket_users = list(map(
        lambda user_id: find_user_by_id_from_list(user_cache_new, user_id),
        user_ids
    ))

    ticket_users_names = list(map(
        lambda user: f'{user.username} (owner)' if project.user_id == user.id else user.username,
        ticket_users
    ))

    return [ ticket_users_names ] + (get_project_participants(
        repository,
        projects[1:],
        tickets[1:],
        index + 1,
        user_cache_new
    ))

def find_user_by_id_from_list(users, user_id):
    users_filtered = list(filter(lambda user: user.id == user_id, users))

    if len(users_filtered) == 0:
        raise ValueError("Could not find user.")

    return users_filtered[0]

def add_as_property(objects, values, property_name, transform_value):
    return list(map(
        lambda obj_enumerated: set_property(obj_enumerated[1], property_name, transform_value(values[obj_enumerated[0]])),
        enumerate(objects)
    ))

def set_property(obj, property_name, value):
    obj_a = {}

    obj_b = {}
    obj_b[property_name] = value

    obj_a.update(obj)
    obj_a.update(obj_b)

    return obj_a

def join_by_comma(arr):
    return ",".join(arr)

def project_exists_with_name(repository, project_name):
    try:
        return len(repository.get_projects_by_name(project_name)) > 0
    except Project.DoesNotExist:
        return False

def user_can_delete_ticket(user, ticket, project):
    return user.id == ticket.user.id or user.id == project.user.id
