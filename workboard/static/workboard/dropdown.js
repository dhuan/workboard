const DROPDOWN_BUTTON = "DROPDOWN_BUTTON"
const DROPDOWN_TEXT = "DROPDOWN_TEXT"

const DROPDOWN_WIDTH = 300

const showDropdown = async (items, triggerElement) => {
    const triggerPosition = triggerElement.getBoundingClientRect()

    const dropdownAreaElement = window.document.getElementById("dropdown_area")

    cleanup(dropdownAreaElement)

    const dropdownElement = 
        div(".dropdown_container", [], [ ])

    const dropdownBoxElement =
        div(".dropdown_box", [], [
            ...items.map(renderDropdownItem)
        ])

    dropdownElement.append(dropdownBoxElement)

    dropdownElement.style.position = "relative"
    dropdownElement.style.left = toPx(triggerPosition.left)
    dropdownElement.style.top = toPx(triggerPosition.top + triggerPosition.height + 2)

    const overflowsX = (triggerPosition.left + DROPDOWN_WIDTH) > window.innerWidth

    if (overflowsX) {
        dropdownElement.style.left = toPx(triggerPosition.left - DROPDOWN_WIDTH + triggerElement.clientWidth)
    }

    dropdownAreaElement.append(dropdownElement)

    const onClickedAnywhere = (event) => {
        const clickedOutside = (!dropdownBoxElement.contains(event.target) && isVisible(dropdownElement))

        if (clickedOutside) {
            window.removeEventListener("click", onClickedAnywhere)

            removeDropdown()
        }
    }

    await wait(100)

    window.addEventListener("click", onClickedAnywhere)
}

const renderDropdownItem = ({ type, label, onClick: onItemClicked }) => {
    if (type === DROPDOWN_BUTTON)
        return (
            div(".dropdown_item .dropdown_button", [ onClick(() => onItemClicked(closeDropdown)) ], [ text(label) ])
        )

    if (type === DROPDOWN_TEXT)
        return (
            div(".dropdown_item .dropdown_text", [], [ text(label) ])
        )

    throw new Error("Received an unknown dropdown item type.")
}

const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length ) // source (2018-03-11): https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js 

const removeDropdown = () =>
    cleanup(window.document.getElementById("dropdown_area"))

const wait = (timeout) => new Promise(resolve => setTimeout(resolve, timeout))

const dropdownItemText = (label) => ({
    type: DROPDOWN_TEXT,
    label,
    onClick: null,
})

const dropdownItemButton = (label, onClick) => ({
    type: DROPDOWN_BUTTON,
    label,
    onClick,
})

const closeDropdown = () => {
    window.document.body.click()
}
