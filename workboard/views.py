from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from . import repository
from . import config
from . import serializer
from .models import Project, List, Ticket, TICKET_HISTORY_TYPE_CREATION
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
import copy
from . import utils
from . import validators

from .models import User


def index(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse("projects"))

    return render(request, "workboard/index.html")

def projects_view(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse("login"))

    projects = repository.get_all_projects()

    tickets = list(map(
        lambda project: utils.get_tickets_for_project(repository, project.id),
        projects
    ))

    projects_serialized = list(map(
        lambda project_enumerated: serializer.project(project_enumerated[1], tickets[project_enumerated[0]]),
        enumerate(projects),
    ))

    projects_serialized_transformed = list(map(
        lambda project_serialized: utils.add_last_activity_to_project(project_serialized, utils.get_project_id_from_serialized, repository),
        projects_serialized
    ))

    projects_participants = utils.get_project_participants(repository, projects, tickets, 0, [])

    projects_serialized_transformed = utils.add_as_property(
        projects_serialized_transformed,
        projects_participants,
        "participants",
        utils.join_by_comma,
    )

    return render(request, "workboard/projects.html", {
        "projects": projects_serialized_transformed,
        "has_projects": len(projects_serialized) > 0,
    })

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "workboard/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "workboard/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "workboard/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "workboard/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "workboard/register.html")

@login_required(login_url='/login')
def board_view(request, project_id):
    project_exists = True
    project = None

    try:
        project = repository.get_project_by_id(project_id)
    except Project.DoesNotExist:
        project_exists = False

    return render(request, "workboard/board.html", {
        "project_exists": project_exists,
    })

@login_required(login_url='/login')
def ticket_view(request, project_id, ticket_id):
    try:
        repository.get_ticket_by_id(ticket_id)
    except Ticket.DoesNotExist:
        return HttpResponseRedirect(reverse("board", kwargs={'project_id': project_id}))

    return board_view(request, project_id)

def api_project(request, project_id):
    try:
        project = repository.get_project_by_id(project_id)
    except Project.DoesNotExist:
        project_exists = False
        return JsonResponse({}, status=400)

    return JsonResponse(project_response(project))

@csrf_exempt
def api_project_by_name(request, project_name):
    try:
        project = repository.get_project_by_name(project_name)
    except Project.DoesNotExist:
        project_exists = False
        return JsonResponse({}, status=400)

    return JsonResponse(project_response(project))

@csrf_exempt
@login_required(login_url='/login')
def api_project_new(request):
    if request.method != "POST":
        return JsonResponse({}, status=400)

    try:
        payload = utils.parse_payload(request, {
            "name": validators.is_text,
        })
    except (utils.PayloadValidationError, KeyError) as err:
        return JsonResponse({
            "error": "Invalid field: {}".format(str(err))
        }, status=400)

    project_name = payload["name"]

    if utils.project_exists_with_name(repository, project_name):
        return JsonResponse({
            "error": "PROJECT_NAME_DUPLICATE"
        }, status=400)

    project = repository.create_project(project_name, request.user)

    list(map(
        lambda list_item: repository.create_list(list_item, project),
        config.DEFAULT_LISTS
    ))

    return JsonResponse({})

@csrf_exempt
@login_required(login_url='/login')
def api_project_delete(request, project_id):
    if request.method != "POST":
        return JsonResponse({}, status=400)

    project = repository.get_project_by_id(project_id)

    if project.user.id != request.user.id:
        return JsonResponse({
            "error": "PROJECT_CANNOT_BE_DELETED_NOT_OWNER"
        }, status=400)

    tickets = utils.get_tickets_for_project(repository, project.id)

    lists = repository.get_lists_by_project_id(project.id)

    utils.remove_entities(tickets)
    utils.remove_entities(lists)
    utils.remove_entities([ project ])

    return JsonResponse({})

@csrf_exempt
@login_required(login_url='/login')
def api_list_new(request):
    if request.method != "POST":
        return JsonResponse({}, status=400)

    try:
        payload = utils.parse_payload(request, {
            "name": validators.is_text,
            "project": validators.is_number,
        })
    except (utils.PayloadValidationError, KeyError) as err:
        return JsonResponse({
            "error": "Invalid field: {}".format(str(err))
        }, status=400)

    list_name = payload["name"]
    project_id = payload["project_id"]

    try:
        project = repository.get_project_by_id(int(project_id))
    except Project.DoesNotExist:
        return JsonResponse({
            "error": "Project does not exist.",
        }, status=400)

    repository.create_list(list_name, project)

    return JsonResponse({})

@csrf_exempt
@login_required(login_url='/login')
def api_list_delete(request):
    if request.method != "POST":
        return JsonResponse({}, status=400)

    payload = utils.parse_payload(request, {
        "id": validators.is_number,
    })

    list_id = payload["id"]

    repository.delete_tickets_by_list_id(list_id)

    repository.delete_list_by_id(list_id)

    return JsonResponse({})

@csrf_exempt
@login_required(login_url='/login')
def api_list_move_left(request, list_id):
    return api_list_move(
        request,
        list_id,
        lambda list_order: list_order - 1,
        lambda list_order, _: list_order > 0,
    )

@csrf_exempt
@login_required(login_url='/login')
def api_list_move_right(request, list_id):
    return api_list_move(
        request,
        list_id,
        lambda list_order: list_order + 1,
        lambda list_order, lists_amount: list_order != (lists_amount - 1),
    )

def api_list_move(request, list_id, func_list_move, func_should_move):
    if request.method != "POST":
        return JsonResponse({}, status=400)

    try:
        list_to_be_moved = repository.get_list_by_id(list_id)
    except List.DoesNotExist:
        return JsonResponse({}, status=400)

    lists = repository.get_lists_by_project_id(list_to_be_moved.project.id)

    lists = list(sorted(lists, key=lambda list_item: list_item.order))

    list_ids = list(map(lambda list_item: list_item.id, lists))

    list_current_index = utils.index_of(list_ids, list_to_be_moved.id, 0)

    if func_should_move(list_current_index, len(lists)) == False:
        return JsonResponse({})

    list_new_index = func_list_move(list_current_index)

    lists = utils.remove_index(lists, list_current_index)

    lists = utils.add_at(lists, list_to_be_moved, list_new_index)

    lists = utils.reset_lists_order(lists, 0)

    utils.save_entities(lists)

    return JsonResponse({})

@csrf_exempt
@login_required(login_url='/login')
def api_ticket_new(request):
    project = None
    list_item = None

    if request.method != "POST":
        return JsonResponse({}, status=400)

    try:
        payload = utils.parse_payload(request, {
            "name": validators.is_text,
            "description": validators.is_text,
            "list_id": validators.is_number,
        })
    except (utils.PayloadValidationError, KeyError) as err:
        return JsonResponse({
            "error": "Invalid field: {}".format(str(err))
        }, status=400)

    ticket_name = payload["name"]
    ticket_description = payload["description"]
    list_id = payload["list_id"]

    try:
        list_item = repository.get_list_by_id(list_id)
        project = repository.get_project_by_id(list_item.project.id)
    except Project.DoesNotExist:
        return JsonResponse({}, status=400)
    except List.DoesNotExist:
        return JsonResponse({}, status=400)

    new_ticket = repository.create_ticket(ticket_name, ticket_description, list_item, request.user)

    repository.create_ticket_history(
        new_ticket.id,
        request.user.id,
        TICKET_HISTORY_TYPE_CREATION,
        ""
    )

    return JsonResponse({})

@csrf_exempt
@login_required(login_url='/login')
def api_ticket_edit(request, ticket_id):
    try:
        ticket = repository.get_ticket_by_id(ticket_id)
    except Ticket.DoesNotExist:
        return JsonResponse({}, status=400)

    try:
        payload = utils.parse_payload(request, {
            "name": validators.is_text,
            "description": validators.is_text,
            "list_id": validators.is_number,
        })
    except (utils.PayloadValidationError, KeyError) as err:
        return JsonResponse({
            "error": "Invalid field: {}".format(str(err))
        }, status=400)

    ticket_name = payload["name"]
    ticket_description = payload["description"]
    ticket_list_id = payload["list_id"]

    try:
        list_item = repository.get_list_by_id(ticket_list_id)
    except List.DoesNotExist:
        return JsonResponse({}, status=400)

    ticket_copy = copy.copy(ticket)

    ticket.name = ticket_name
    ticket.description = ticket_description
    ticket.list = list_item

    ticket.save()

    history_type = utils.resolve_ticket_history_record_type(ticket, ticket_copy)

    history_metadata = utils.resolve_ticket_history_record_metadata(ticket, ticket_copy, history_type)

    repository.create_ticket_history(
        ticket.id,
        request.user.id,
        history_type,
        history_metadata
    )

    return JsonResponse({})

@csrf_exempt
@login_required(login_url='/login')
def api_ticket_delete(request, ticket_id):
    try:
        ticket = repository.get_ticket_by_id(ticket_id)
        list_item = repository.get_list_by_id(ticket.list.id)
        project = repository.get_project_by_id(list_item.project.id)
    except (Ticket.DoesNotExist, Project.DoesNotExist, List.DoesNotExist):
        return JsonResponse({}, status=400)

    can_delete = utils.user_can_delete_ticket(request.user, ticket, project)

    if not can_delete:
        return JsonResponse({
            "error": "NOT_ALLOWED_TO_DELETE_TICKET"
        }, status=400)

    history_records = repository.get_ticket_history_records(ticket.id)

    utils.remove_entities(history_records + [ ticket ])

    return JsonResponse({})

@csrf_exempt
@login_required(login_url='/login')
def api_ticket_history(request, ticket_id):
    history_records = repository.get_ticket_history_records(ticket_id)

    user_ids = utils.unique(list(map(lambda ticket_history_record: ticket_history_record.user.id, history_records)))

    users = list(map(lambda user_id: repository.get_user_by_id(user_id), user_ids))

    history_records_serialized = list(map(
        lambda ticket_history_record: serializer.ticket_history(users, ticket_history_record),
        history_records
    ))

    return JsonResponse({
        "ticket_history_records": history_records_serialized,
    })

@csrf_exempt
@login_required(login_url='/login')
def api_ticket_comments(request, ticket_id):
    comments = repository.get_ticket_comments(ticket_id)

    user_ids = utils.unique(list(map(lambda comment: comment.user.id, comments)))

    users = list(map(lambda user_id: repository.get_user_by_id(user_id), user_ids))

    comments_serialized = list(map(
        lambda comment: serializer.comment(users, comment),
        comments,
    ))

    return JsonResponse({
        "comments": comments_serialized,
    })

@csrf_exempt
@login_required(login_url='/login')
def api_ticket_comment(request, ticket_id):
    if request.method != "POST":
        return JsonResponse({}, status=400)

    try:
        payload = utils.parse_payload(request, {
            "comment": validators.is_text,
        })
    except (utils.PayloadValidationError, KeyError) as err:
        return JsonResponse({
            "error": "Invalid field: {}".format(str(err))
        }, status=400)

    comment = payload["comment"]

    try:
        ticket = repository.get_ticket_by_id(ticket_id)
    except Ticket.DoesNotExist:
        return JsonResponse({
            "error": "Ticket does not exist.",
        }, status=400)

    repository.create_comment(request.user, ticket, comment)

    return JsonResponse({})

def project_response(project):
    lists = repository.get_lists_by_project_id(project.id)

    lists = list(sorted(lists, key=lambda list_item: list_item.order))

    lists_serialized = list(map(lambda list_item: serializer.list_item(list_item), lists))

    tickets = flatten(list(map(
        lambda list_item: repository.get_tickets_by_list_id(list_item.id),
    lists)))

    user_ids = utils.unique(list(map(lambda ticket: ticket.user.id, tickets)))

    users = list(map(lambda user_id: repository.get_user_by_id(user_id), user_ids))

    tickets_serialized = list(map(lambda ticket_item: serializer.ticket(users, ticket_item), tickets))

    return {
        "project": serializer.project(project, []),
        "lists": lists_serialized,
        "tickets": tickets_serialized,
    }

def flatten(arr):
    if len(arr) == 0:
        return []

    return list(arr[0]) + (flatten(arr[1:]))
