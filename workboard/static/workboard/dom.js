const startsWith = (startingMatch) => (subject) =>
    subject.indexOf(startingMatch) === 0

const identifierIsId = startsWith("#")

const identifierIsClassName = startsWith(".")

const replace = (find, replace) => (subject) => subject.replace(find, replace)

const formatIdentifier = replace(new RegExp('^[\.\#]'), '')

const assignIdentifiers = (target, identifiers) => {
    if (identifiers.length === 0)
        return

    const identifier = identifiers[0]

    const identifierFormatted = formatIdentifier(identifier)

    if (identifierIsId(identifier))
        target.id = identifierFormatted

    if (identifierIsClassName(identifier))
        target.classList.add(identifierFormatted)

    assignIdentifiers(target, identifiers.slice(1))
}

const isValidChild = (value) => value !== false

const createElement = (tagName) => (identifier, options, children) => {
    const element = window.document.createElement(tagName)

    const hasIdentifier = typeof identifier === "string"

    if (hasIdentifier)
        assignIdentifiers(element, identifier.split(" "))

    if(children && children.length)
        children.filter(isValidChild).map(handleChild(element))

    if(options && options.length)
        options.map(handleOption(element))

    return element
}

const div = createElement("div")

const span = createElement("span")

const img = createElement("img")

const h2 = createElement("h2")

const h3 = createElement("h3")

const h4 = createElement("h4")

const form = createElement("form")

const input = createElement("input")

const select = createElement("select")

const option = createElement("option")

const textarea = createElement("textarea")

const text = (content) => ({
    text: content
})

const isTextDefinition = (node) =>
    typeof node === "object" && node.hasOwnProperty("text")

const handleChild = (target) => (child) => {
    if (!child)
        return

    if (isTextDefinition(child)) {
        target.innerHTML = child.text

        return
    }

    target.append(child)
}

const handleOption = (target) => (option) => {
    if (option.optionType === "on_click") {
        target.addEventListener('click', (e) =>{
            option.func(e)
        })

        return
    }

    if (option.optionType === "on_change") {
        target.addEventListener('change', (e) => {
            option.func(e)
        })

        return
    }

    if (option.optionType === "type") {
        target.type = option.value

        return
    }

    if (option.optionType === "placeholder") {
        target.placeholder = option.value

        return
    }

    if (option.optionType === "src") {
        target.src = option.value

        return
    }

    if (option.optionType === "disabled") {
        target.disabled = option.value

        return
    }

    if (option.optionType === "value") {
        target.value = option.value

        return
    }

    throw new Error("Failed to handle option.")
}

const onClick = (func) => ({
    optionType: "on_click",
    func,
})

const onChange = (func) => ({
    optionType: "on_change",
    func,
})

const placeholder = (value) => ({
    optionType: "placeholder",
    value,
})

const src = (value) => ({
    optionType: "src",
    value,
})

const type = (value) => ({
    optionType: "type",
    value,
})

const disabled = () => ({
    optionType: "disabled",
    value: "true",
})

const value = (valueB) => ({
    optionType: "value",
    value: valueB,
})

const cleanup = (target) => {
    target.innerHTML = ""
}

const appendElements = (targetElement, elements) => {
    if (elements.length === 0)
        return

    targetElement.append(elements[0])

    return appendElements(targetElement, elements.slice(1))
}

const selectComponent = (options, selectedIndex, onSelectChange) =>
    select(null, [ value(selectedIndex), onChange(onSelectChange) ], [
        ...options.map((optionItem, index) => (
            option(null, [ value(index) ], [ text(optionItem) ])
        )),
    ])
