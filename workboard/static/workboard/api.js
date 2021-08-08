const ERROR_MESSAGES = {
    "PROJECT_NAME_DUPLICATE": "A project with that name already exists. Please choose another name when trying again.",
    "PROJECT_CANNOT_BE_DELETED_NOT_OWNER": "You're not the owner of this project, therefore you can't delete it.",
    "NOT_ALLOWED_TO_DELETE_TICKET": "You can't delete this ticket. Only the ticket creator or the project owner can do this.",
}

const getProjectByName = async (projectName) => {
    const response = await fetch(`/api/project/${projectName}`)

    return await response.json()
}

const editTicket = async (ticket) => {
    const response = await fetch(`/api/ticket/edit/${ticket.id}`, {
        method: "POST",
        body: JSON.stringify({
            "name": ticket.name,
            "description": ticket.description,
            "list_id": ticket.list_id,
        }),
    })

    if (!response.ok)
        throw new Error("Failed to edit ticket.")

}

const getTicketHistory = async (ticket) => {
    const response = await fetch(`/api/ticket/${ticket.id}/history`)

    if (!response.ok)
        throw new Error("Failed to fetch history.")

    return (await response.json()).ticket_history_records
}

const getTicketComments = async (ticket) => {
    const response = await fetch(`/api/ticket/${ticket.id}/comments`)

    if (!response.ok)
        throw new Error("Failed to fetch comments.")

    return (await response.json()).comments
}

const addComment = async (ticket, commentText) => {
    const response = await fetch(`/api/ticket/${ticket.id}/comment`, {
        method: "POST",
        body: JSON.stringify({
            "comment": commentText,
        }),
    })

    if (!response.ok)
        throw new Error("Failed to edit ticket.")

}

const deleteProject = async (projectId) => {
    const response = await fetch(`/api/project/${projectId}/delete`, {
        method: "POST",
    })

    if (!response.ok)
        throw new Error(await retrieveErrorCodeFromResponse(response, "Failed to delete project."))
}

const deleteTicket = async (ticketId) => {
    const response = await fetch(`/api/ticket/${ticketId}/delete`, {
        method: "POST",
    })

    if (!response.ok)
        throw new Error(await retrieveErrorCodeFromResponse(response, "Failed to delete ticket."))
}

const createNewProject = async (projectName) => {
    const response = await fetch(`/api/project/new`, {
        method: "POST",
        body: JSON.stringify({
            "name": projectName,
        }),
    })

    if (!response.ok)
        throw new Error(await retrieveErrorCodeFromResponse(response, "Failed to create new project."))
}

const retrieveErrorCodeFromResponse = async (response, defaultMessage) =>
    (await response.json()).error || defaultMessage

const resolveErrorMessage = (errorCode, defaultMessage) => {
    try {
        return ERROR_MESSAGES[errorCode] || defaultMessage
    } catch(err) {
        console.error(err)

        return defaultMessage
    }
}

const api = {
    getProjectByName,
    editTicket,
    getTicketHistory,
    getTicketComments,
    addComment,
    deleteProject,
    deleteTicket,
    createNewProject,
    resolveErrorMessage,
}
