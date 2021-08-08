const boardNameFromUrl = (window) =>
    regexExtract(/\/board\/([^\/]{1,})/, window.location.pathname, 1)

const ticketIdFromUrl = (window) =>
    regexExtract(/\/ticket\/([^\/]{1,})$/, window.location.pathname, 1)

const regexExtract = (regex, subject, index) => {
    const regexResult = subject.match(regex)

    if (!regexResult || !regexResult[index]) {
        throw new Error(`Failed to extract regex from '${subject}'.`)
    }

    return regexResult[index]
}

const ticketUrl = (window, ticket) =>
    `/board/${boardNameFromUrl(window)}/ticket/${ticket.id}`

const boardUrl = (window, projectName) =>
    `/board/${projectName}`

const stopPropagation = (e) => {
    e.stopPropagation()
}

const isTicketPage = (window) =>
    /\/board\/[^\/]{1,}\/ticket/.test(window.location.pathname)

const ticketIdMatches = (ticketId) => (ticket) => ticket.id === ticketId

const toNumber = x => parseInt(x, 10)

const revertToBoardPage = () => {
    const projectName = boardNameFromUrl(window)

    window.history.pushState({}, "", boardUrl(window, projectName))
}

const toPx = (x) => `${x}px`

const getListName = ({ name }) => name

const listIdMatches = (listId) => ({ id }) => listId === id

const renderDate = (timestamp) =>
    (new Date(timestamp)).toGMTString()

const ticketHasDescription = ({ description }) =>
    description && description.trim() !== ""

const formatTicketDescription = (text) =>
    text.replace(new RegExp("\n", "g",), "<br />")

const split = (divisor) => (subject) => subject.split(divisor)

const parseMetadataListChange = split("|")

const ticketHistoryMessageContent = (historyType, metadata) => {
    if (historyType === "creation") {
        const [ from, to ] = parseMetadataListChange(metadata)
        return `created the ticket.`
    }

    if (historyType === "list_change") {
        const [ from, to ] = parseMetadataListChange(metadata)

        return `moved the ticket from <strong>${from}</strong> to <strong>${to}</strong>.`
    }

    if (historyType === "title_change") {
        const [ from, to ] = parseMetadataListChange(metadata)

        return `changed the ticket's title from <strong>${from}</strong> to <strong>${to}</strong>.`
    }

    if (historyType === "description_change") {
        return `changed the ticket's description.`
    }

    if (historyType === "edit") {
        return `edited the ticket.`
    }

    return "Unknown history record."
}

const buildTicketHistoryMessage = ({ user_name, history_type, metadata, timestamp }) => {
    const ticketHistoryMessage = [
        user_name,
        ticketHistoryMessageContent(history_type, metadata),
    ].join(" ")

    const ticketHistoryDate = renderDate(timestamp)

    return { ticketHistoryMessage, ticketHistoryDate }
}

const hasText = (str) => typeof str === "string" && str.trim() !== ""
