const ticketListIdMatches = (listId) => (ticket) => ticket.list_id === listId

const renderBoard = (window, lists, tickets, options) => {
    const listMenuTriggerClassNames = lists.map((_, i) => `.list_menu_trigger_${i}`)

    const listElements =
        lists.map((listItem, i) => {
            const listTickets = tickets.filter(ticketListIdMatches(listItem.id))

            return (
                div(".list_item", [], [
                    div(".list_item_box", [], [
                        div(".list_head", [], [
                            div(".list_name", [], [ text(listItem.name) ]),
                            div([ ".list_menu_trigger", listMenuTriggerClassNames[i] ].join(" "),
                                [ onClick(onListMenuClicked(
                                    listItem,
                                    i === 0,
                                    lists.length === (i + 1),
                                    listMenuTriggerClassNames[i],
                                    options.onRemoveListClicked,
                                    options.onMoveLeftClicked,
                                    options.onMoveRightClicked,
                                    options.onCreateTicketClicked,
                                )) ],
                                [ text("...") ]
                            ),
                        ]),
                        ...listTickets.map(ticket =>
                            renderTicketItem(ticket, options.onTicketClicked)
                        ),
                        listTickets.length === 0 && (
                            div(".empty_list", [], [
                                text("No tickets in this list.")
                            ])
                        ),
                        div(".create_ticket_button", [ onClick(options.onCreateTicketClicked(listItem)) ], [
                            span(null, [], [ text("+") ]),
                            span(null, [], [ text("Create Ticket") ])
                        ])
                    ])

                ]
                )
            )
        }).concat(
            div(".list_item", [], [
                div(".list_item_box .list_add", [ onClick(options.onCreateListClicked) ], [
                    div(".list_head", [], [
                        span(null, [], [ text("+") ]),
                        span(null, [], [ text("Create New List") ])
                    ])
                ])
            ])
        )

    const boardContentElement = window.document.getElementById("board_content")

    cleanup(boardContentElement)

    appendElements(boardContentElement, listElements)
}

const onListMenuClicked = (
    listItem,
    isFirst,
    isLast,
    triggerClassNameSelector,
    onRemoveListClicked,
    onMoveLeftClicked,
    onMoveRightClicked,
    onCreateTicketClicked,
) => () => {
    showDropdown([
        dropdownItemText("List Actions"),
        dropdownItemButton("Create ticket", onCreateTicketClicked(listItem)),
        dropdownItemButton("Remove List", onRemoveListClicked(listItem)),
        ...(isFirst ? [] : [ dropdownItemButton("Move Left", onMoveLeftClicked(listItem)) ]),
        ...(isLast ? [] : [ dropdownItemButton("Move Right", onMoveRightClicked(listItem)) ]),
    ], window.document.querySelector(triggerClassNameSelector))
}

const showModal = (contentElement, closeModal) => {
    const modalWrapperElement = window.document.getElementById("modal_wrapper")
    const modalBoxElement = window.document.getElementById("modal_box")
    const modalContentElement = window.document.getElementById("modal_content")

    modalWrapperElement.style.display = "flex"

    cleanup(modalContentElement)

    modalContentElement.append(contentElement)

    window.MODAL_CLOSE_CALLBACK = closeModal
}

const closeModal = (e) => {
    const modalWrapperElement = window.document.getElementById("modal_wrapper")
    const modalContentElement = window.document.getElementById("modal_content")

    modalWrapperElement.style.display = "none"

    cleanup(modalContentElement)

    fixupAppBodyForModal(false)

    if (window.MODAL_CLOSE_CALLBACK)
        window.MODAL_CLOSE_CALLBACK()
}

const renderTicketItem = (ticket, onTicketClicked) =>
    div(".ticket_item", [ onClick(() => onTicketClicked(ticket)) ] , [
        div(".ticket_name", [], [
            text(ticket.name)
        ])
    ])

const renderTicketModal = async (ticket, lists, onClose) => {
    showModal(
        div(null, [], [
            div(".ticket_page", [], [
                div(".ticket_head", [], [
                    div(".ticket_title_wrapper", [], [
                        h2(null, [  onClick(onEditTicketTitleClicked(ticket)) ], [ text(ticket.name) ]),
                        div("#ticket_title_edit_form", [], []),
                    ]),
                ]),
                div(".ticket_body", [], [
                    div(".ticket_content", [], [
                        h3(null, [], [ text("Description") ]),
                        div(".ticket_content_block", [], [
                            div("#ticket_description", [], [
                                (ticketHasDescription(ticket)
                                    ? div(".ticket_description #ticket_edit", [ onClick(onEditTicketClicked(ticket)) ], [ text(formatTicketDescription(ticket.description)) ])
                                    : div(".ticket_description_empty #ticket_edit", [ onClick(onEditTicketClicked(ticket)) ], [
                                            text("No description has been written. Click to edit.")
                                      ])
                                ),
                            ]),
                            div("#ticket_edit_form", [], []),
                        ]),
                        div(null, [], [
                            await tabbedContent("tab_ticket", [
                                [ "Comments", renderTicketComments(ticket) ],
                                [ "History", renderTicketHistory(ticket) ],
                            ])
                        ]),
                    ]),
                    div(".ticket_sidebar", [], [
                        div(".sidebar_item", [], [
                            h4(null, [], [ text("Ticket Stage") ]),
                            selectComponent(
                                lists.map(getListName),
                                lists.findIndex(listIdMatches(ticket.list_id)),
                                onTicketListChanged(ticket, lists)
                            )
                        ]),
                        div(".sidebar_item", [], [
                            ticketSidebarInfo("Created by:", ticket.user_name),
                            ticketSidebarInfo("Creation date:", renderDate(ticket.timestamp), ".sidebar_item_date"),
                        ]),
                        div(".sidebar_item .sidebar_item_actions", [], [
                            h4(null, [], [ text("Ticket Actions") ]),
                            div(null, [], [
                                div(".cta", [ onClick(onDeleteTicketClicked(ticket)) ], [ text("Delete Ticket") ])
                            ]),
                        ]),
                    ])
                ]),
            ])
        ]),
        onClose
    )

    fixupAppBodyForModal(true)
}

const ticketSidebarInfo = (textA, textB, extraClassName) =>
    div(ticketSidebarInfoClassName(extraClassName), [], [
        div(null, [], [ text(textA) ]),
        div(null, [], [ text(textB) ]),
    ])

const ticketSidebarInfoClassName = (extraClassName) =>
    [ ".sidebar_item_info" ].concat(extraClassName || []).join(" ")

const onTicketListChanged = (ticket, lists) => async (event) => {
    const chosenList = lists[event.target.value]

    const ticketEdited = {
        ...ticket,
        list_id: chosenList.id,
    }

    await api.editTicket(ticketEdited)

    await loadBoard()
}

const saveEditingTicket = (ticket, ticketProperty, elementToUpdate) => async (newTicketDescription) => {
    const ticketEdited = {
        ...ticket,
        [ticketProperty]: newTicketDescription,
    }

    await api.editTicket(ticketEdited)

    window.document.querySelector(elementToUpdate).innerHTML = formatTicketDescription(newTicketDescription)
}

const onEditTicketClicked = (ticket) =>
    setupTextFieldComponent({
        hide: "#ticket_description",
        target: "#ticket_edit_form",
        placeholder: "Add a more detailed description.",
        initialValue: ticketHasDescription(ticket) ? ticket.description : "",
        validate: (text) => [ text && text.trim() !== "", "Please enter a valid ticket description." ],
        save: saveEditingTicket(ticket, "description", "#ticket_edit"),
        afterSave: loadBoard,
        multiline: true,
        canCancel: true,
        cleanupAfterSave: true,
    })

const onEditTicketTitleClicked = (ticket) =>
    setupTextFieldComponent({
        hide: ".ticket_title_wrapper h2",
        target: "#ticket_title_edit_form",
        placeholder: "Ticket title.",
        initialValue: ticket.name,
        validate: (text) => [ text && text.trim() !== "", "Please enter a valid ticket title." ],
        save: saveEditingTicket(ticket, "name", ".ticket_title_wrapper > h2"),
        afterSave: loadBoard,
        multiline: false,
        canCancel: true,
        cleanupAfterSave: true,
    })

const renderTicketHistory = (ticket) => async () => {
    ui.setAppLoadingState(true)

    const historyRecords = await api.getTicketHistory(ticket)

    ui.setAppLoadingState(false)

    return (
        div(".ticket_history_wrapper", [], [
            ...historyRecords.map(renderTicketHistoryItem)
        ])
    )
}

const renderTicketHistoryItem = (historyRecord) => {
    const { ticketHistoryMessage, ticketHistoryDate } = buildTicketHistoryMessage(historyRecord)

    return (
        div(".ticket_history_item", [], [
            div(null, [], [ text(ticketHistoryMessage) ]),
            div(null, [], [ text(ticketHistoryDate) ]),
        ])
    )
}

const renderTicketComments = (ticket) => async () => {
    ui.setAppLoadingState(true)

    const comments = await api.getTicketComments(ticket)

    ui.setAppLoadingState(false)

    const commentTextFieldElement = formTextFieldComponent({
        hide: "",
        target: ".ticket_comments_wrapper",
        placeholder: "Write a comment...",
        initialValue: "",
        validate: (text) => [ text && text.trim() !== "", "Please enter a valid comment." ],
        save: saveComment(ticket),
        afterSave: loadBoard,
        multiline: true,
        canCancel: false,
        cleanupAfterSave: false,
        submitLabel: "Add comment",
    })

    if (comments.length === 0)
        return (
            div(".ticket_comments_wrapper", [], [
                commentTextFieldElement,
                div(".ticket_comments_empty", [], [
                    text("No comments have been written for this ticket.")
                ])
            ])
        )

    return (
        div(".ticket_comments_wrapper", [], [
            commentTextFieldElement,
            ...comments.map(commentComponent)
        ])
    )
}

const commentComponent = ({ user_name, text: comment_text, timestamp }) => (
    div(".ticket_comment_item", [], [
        span(null, [], [ user_name ]),
        span(null, [], [ comment_text ]),
        div(null, [], [ text(renderDate(timestamp)) ]),
    ])
)

const saveComment = (ticket) => async (commentText) => {
    await api.addComment(ticket, commentText)
}

const onDeleteTicketClicked = (ticket) => async () => {
    const deleteConfirmed = window.confirm("Are you sure that you want to delete this ticket? This action is irrevertible.")

    if (!deleteConfirmed) {
        return
    }

    try {
        ui.setAppLoadingState(true)

        await api.deleteTicket(ticket.id)
    } catch (err) {
        window.alert(
            api.resolveErrorMessage(err.message, "Sorry but an error occurred while deleting this ticket.")
        )

        ui.setAppLoadingState(false)

        throw err
    }

    window.location.reload(true)
}

const setAppLoadingState = (state) => {
    window.document.querySelector("#loading_screen").style.display = state ? "flex" : "none"
}

const fixupAppBodyForModal = (state) => {
    const body = window.document.querySelector(".body")

    const navbarHeight = window.document.querySelector(".navbar").getBoundingClientRect().height

    const bodyHeight = toPx(window.screen.availHeight - navbarHeight)

    if (state) {
        body.style.height = bodyHeight
        body.style.overflow = "hidden"

        return
    }

    body.style.height = "auto"
    body.style.overflow = "visible"
}

const ui = {
    renderBoard,
    renderTicketModal,
    setAppLoadingState,
}
