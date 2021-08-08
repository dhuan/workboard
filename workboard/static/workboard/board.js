const ERROR_INVALID_TICKET_NAME = "ERROR_INVALID_TICKET_NAME"

const loadBoard = async () => {
    ui.setAppLoadingState(true)

    const { project, lists, tickets } = await getProjectByName(boardNameFromUrl(window))

    ui.setAppLoadingState(false)

    ui.renderBoard(window, lists, tickets, {
        onTicketClicked: onTicketClicked(lists),
        onCreateListClicked: onCreateListClicked(project),
        onRemoveListClicked,
        onMoveLeftClicked: dropdownButtonApiCallHandler(listItem => `/api/list/${listItem.id}/move/left`),
        onMoveRightClicked: dropdownButtonApiCallHandler(listItem => `/api/list/${listItem.id}/move/right`),
        onCreateTicketClicked: dropdownButtonApiCallHandler(() => `/api/ticket/new`, newTicketPayload),
    })

    if (isTicketPage(window)) {
        loadTicketModal(tickets, lists)
    }
}

const newTicketPayload = (listItem) => {
    const ticketName = prompt("Ticket name:")

    if (!ticketName || ticketName.trim() === "")
        throw new Error(ERROR_INVALID_TICKET_NAME)

    return { name: ticketName, list_id: listItem.id, description: "" }
}

const onRemoveListClicked = (listItem) => async (closeDropdown) => {
    closeDropdown()

    const removeListConfirmed = confirm("Are you sure that you want to delete this list? All tickets inside will removed as well.")

    if (!removeListConfirmed) {
        return
    }

    const response = await fetch(`/api/list/delete`, {
        method: "POST",
        body: JSON.stringify({
            "id": listItem.id,
        }),
    })

    if (!response.ok)
        throw new Error("Failed to delete list.")

    loadBoard()
}

const dropdownButtonApiCallHandler = (generateApiUrl, generatePayload) => (listItem) => async (closeDropdown) => {
    const apiUrl = generateApiUrl(listItem)

    if (closeDropdown && typeof closeDropdown === "function") {
        closeDropdown()
    }

    const requestOptions = { method: "POST" }

    if (generatePayload)
        requestOptions

    const requestOptionsFinal = generatePayload
        ? { ...requestOptions, body: JSON.stringify(generatePayload(listItem)) }
        : requestOptions

    ui.setAppLoadingState(true)

    const response = await fetch(apiUrl, requestOptionsFinal)

    ui.setAppLoadingState(false)

    if (!response.ok)
        throw new Error(`Failed to call ${apiUrl}.`)

    loadBoard()
}

const onTicketClicked = (lists) => (ticket) => {
    window.history.pushState({}, "", ticketUrl(window, ticket))

    ui.renderTicketModal(ticket, lists, revertToBoardPage)
}


const onCreateListClicked = (project) => async () => {
    const listName = prompt("Name of the new list:")

    const response = await fetch(`/api/list/new`, {
        method: "POST",
        body: JSON.stringify({
            "name": listName,
            "project_id": project.id,
        }),
    })

    if (!response.ok)
        throw new Error("Failed to create new list.")

    loadBoard()
}

const loadTicketModal = (tickets, lists) => {
    const ticket = tickets.find(ticketIdMatches(toNumber(ticketIdFromUrl(window))))

    if (!ticket)
        throw new Error("Could not find this ticket!")

    ui.renderTicketModal(ticket, lists, revertToBoardPage)
}
