export { ModalData, toggle_modal, open_modal }
import { parseMarkdown, parseMarkdownLite } from '/js/parseMarkdown.js';

class ModalData {
    constructor({
        modal = document.getElementById('main_modal'),
        title,
        content,
        actions
    }) {
        this.modal = modal;
        this.title = title;
        this.content = content;
        this.actions = actions;
    }

    toggle() { toggle_modal(this.modal); }
    open() { open_modal({
        "modal": this.modal,
        "title": this.title,
        "content": this.content,
        "actions": this.actions
    }); }
}

function toggle_modal(modal) {
    
    if (modal.open) {
        modal.open = false;
    } else {
        modal.open = true;
    }
}

window.toggle_modal = toggle_modal;

function open_modal({
    modal,
    title = "Titre d'exemple",
    content = [
        "Un texte",
        "Puis un autre"
    ],
    actions = [
        { "text": "Action 1", "fn": () => { console.log('Activé 1') } },
        { "text": "Action 2", "fn": () => { console.log('Activé 2') } }
    ]
}) {
    modal = document.getElementById(modal) ?? modal;
    modal.querySelector('.header>h2').textContent = title;

    modal.querySelector('.body').innerHTML = "";
    let are_content_nodes = content.filter(v => typeof v !== 'string').length > 0;
    var content_filtered = are_content_nodes ? content : parseMarkdownLite(content);
    for (const line of content_filtered) if (line) modal.querySelector('.body').appendChild(line);
    
    modal.querySelector('.footer').innerHTML = "";

    if (actions.length) {
        modal.querySelector('.footer').style.display = "flex";
        modal.style.paddingBottom = "calc(3em + var(--padding) * 2)";

        for (const button of actions) {
            const button_element = document.createElement('button');
            button_element.textContent = button.text;
            button_element.addEventListener('click', button.fn);
            modal.querySelector('.footer').appendChild(button_element);
        };
    } else {
        modal.querySelector('.footer').style.display = "none";
        modal.style.paddingBottom = "var(--padding)";
    }

    toggle_modal(modal);
}

window.open_modal = open_modal;