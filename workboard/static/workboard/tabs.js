const tabbedContent = async (tabIdName, tabConfigs, selected=0) =>
    div(`.tab_wrapper ${toElementId(tabIdName)}`, [], [
        div(".tab_head", [], [
            ...tabConfigs.map(([ tabLabel ], index) => (
                div(index === selected ? ".active" : null, [ onClick(onTabClicked(tabIdName, tabConfigs, index), tabConfigs) ], [ text(tabLabel) ])
            )),
        ]),
        div(".tab_body", [], [
            await (tabConfigs[selected][1]()),
        ]),
    ])

const toElementId = (id) => `#${id}`

const onTabClicked = (tabId, tabConfigs, tabIndex) => async () => {
    const tabBodyElement = window.document.querySelector(`#${tabId} .tab_body`)

    Array.from(window.document.querySelectorAll(`#${tabId} .tab_head > div`)).map(
        element => element.classList.remove("active")
    )

    window.document.querySelectorAll(`#${tabId} .tab_head > div`)[tabIndex].classList.add("active")

    cleanup(tabBodyElement)

    const tabContent = await (tabConfigs[tabIndex][1]())

    tabBodyElement.append(tabContent)
}
