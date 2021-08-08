window.document.addEventListener("DOMContentLoaded", async () => {
    window.document.querySelector("#modal_controls_close").addEventListener("click", closeModal)
    window.document.querySelector("#modal_wrapper").addEventListener("click", closeModal)
    window.document.querySelector("#modal_box").addEventListener("click", stopPropagation)
})
