function reveal_modal() {
    const modal = document.getElementById('modal');
    modal.classList.toggle('open');
}

const selection_choice_name = [
    ["selection_music", "piece"],
    ["selection_artwork", "piece"],
    ["selection_application", "piece"],
    ["selection_book", "piece"],

    ["selection_indeterminate", "canon"],
    ["selection_ongoing", "canon"],
    ["selection_finished", "canon"],

    ["selection_font", "other"],
    ["selection_beat", "other"],
    ["selection_pack", "other"]
]

var choice_map = {"all": []};
document.addEventListener('DOMContentLoaded', () => {
    for (const choice of selection_choice_name) {
        if (!!!choice_map[choice[1]]) choice_map[choice[1]] = [];
        choice_map[choice[1]].push(document.querySelector(`[name="${choice[0]}"]`))
        choice_map["all"].push(document.querySelector(`[name="${choice[0]}"]`))
    }
    toggle_selection()
})

function toggle_selection(name = "all") {
    if (!choice_map[name]) return;
    for (const all of Object.entries(choice_map)) { for (const e of all[1]) e.style.display = "none" }
    for (const e of choice_map[name]) e.style.display = "flex";
}