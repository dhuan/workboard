document.addEventListener('DOMContentLoaded', () => {
    const projectActionTriggerElements = document.querySelectorAll(".project_item .actions_trigger") 

    if (projectActionTriggerElements.length > 0) {
        projectActionTriggerElements.forEach((element) => {
            element.addEventListener("click", (e) => {
                e.preventDefault()

                const projectId = element.dataset.projectId

                openProjectMenu(projectId, element)
            })
        })
    }

    document.querySelectorAll(".create_project_button").forEach(element => {
        element.addEventListener("click", onCreateProjectClicked)
    })
})

const openProjectMenu = (projectId, triggerElement) => {
    showDropdown([
        dropdownItemText("Project Actions"),
        dropdownItemButton("Remove Project", onRemoveProjectClicked(projectId)),
    ], triggerElement)
}

const onRemoveProjectClicked = (projectId) => async (closeDropdown) => {
    if (window.confirm("Are you sure that you want to remove this project? All tickets inside it will also be removed.")) {
        try {
            ui.setAppLoadingState(true)

            await api.deleteProject(projectId)

            window.location.reload(true)
        } catch (err) {
            console.error(err)

            ui.setAppLoadingState(false)

            window.alert(
                api.resolveErrorMessage(err.message, "Sorry but an error occurred while deleting this project.")
            )
        }
    }

    closeDropdown()
}

const onCreateProjectClicked = async () => {
    const projectName = prompt("Name of your new project:")

    if (projectName === null) {
        return
    }

    if (!hasText(projectName)) {
        window.alert("You can't create a project without a name.")

        return
    }

    try {
        ui.setAppLoadingState(true)

        await api.createNewProject(projectName)

        window.location.reload(true)
    } catch (err) {
        ui.setAppLoadingState(false)

        console.error(err)

        window.alert(
            api.resolveErrorMessage(err.message, "Sorry but an error occurred while creating the new project.")
        )
    }
}
