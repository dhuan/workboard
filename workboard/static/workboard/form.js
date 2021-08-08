const setupTextFieldComponent = (options) => () => {
    const targetElement = window.document.querySelector(options.target)
    const hideElement = window.document.querySelector(options.hide)

    hideElement.style.display = "none"

    cleanup(targetElement)

    targetElement.append(
        formTextFieldComponent(options)
    )
}

const formTextFieldComponent = (options) =>
    div(formTextFieldClassName(options), [], [
        div(".field_wrapper", [], [
            options.multiline
                ? textarea(null, [ type("text"), value(options.initialValue), placeholder(options.placeholder) ], [])
                : input(null, [ type("text"), value(options.initialValue), placeholder(options.placeholder) ], [])
        ]),
        div(".actions", [], [
            (options.canCancel ? (
                div(".cta .secondary", [ onClick(preventIfClass("disabled", cleanupTextFieldForm(options))) ], [ text("Cancel") ])
            ) : null),
            div(".cta", [ onClick(preventIfClass("disabled", onTextFieldSaveClicked(options))) ], [ text(options.submitLabel || "Save") ]),
        ]),
        div(".error_message", [], [])
    ])

const formTextFieldClassName = (options) =>
    options.multiline ? ".form_text_field" : ".form_text_field .form_text_field_single_line"

const cleanupTextFieldForm = (options) => () => {
    window.document.querySelector(options.hide).style.display = "block"

    cleanup(window.document.querySelector(options.target))
}

const onTextFieldSaveClicked = (options) => async () => {
    const fieldSelector = options.multiline ? `textarea` : `input[type=text]`
    const textValue = window.document.querySelector(`${options.target} ${fieldSelector}`).value
    const errorMessageElement = window.document.querySelector(`${options.target} .error_message`)

    errorMessageElement.style.display = "none"
    errorMessageElement.innerHTML = ""

    const [ validationResult, validationError ] = options.validate(textValue)

    if (!validationResult) {
        errorMessageElement.style.display = "block"
        errorMessageElement.innerHTML = validationError

        return
    }

    setTextFieldSavingState(options, true)

    await options.save(textValue)

    setTextFieldSavingState(options, false)

    if (options.cleanupAfterSave)
        cleanupTextFieldForm(options)()

    await options.afterSave()
}

const setTextFieldSavingState = (options, state) => {
    const fieldSelector = options.multiline ? `textarea` : `input[type=text]`
    window.document.querySelector(`${options.target} ${fieldSelector}`).disabled = state ? "true" : false

    const formCtas = Array.from(window.document.querySelectorAll(`${options.target} .cta`))

    if (state)
        formCtas.map(element => element.classList.add("disabled"))
    else
        formCtas.map(element => element.classList.remove("disabled"))
}

const preventIfClass = (className, func) => (event) => {
    if (Array.from(event.srcElement.classList.values()).indexOf(className) > -1)
        return

    func(event)
}
