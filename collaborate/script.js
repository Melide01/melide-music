const logo = document.querySelector('#boot .logo');
const code = document.getElementById('code');
const open_selection = document.getElementById('open_selection');
const collaborate_section = document.getElementById('collaborate');

const back_button = document.getElementById('back_button');

const search_bar = document.querySelector('#open_selection [name="search_bar"]');
const search_button = document.querySelector('#open_selection [name="search_button"]');
const code_button = document.querySelector('#open_selection [name="code_button"]');

const formulaire = document.getElementById('formulaire');

const left_nav = document.querySelector('#collaborate .navigation_bar [name="left_nav"]');
const right_nav = document.querySelector('#collaborate .navigation_bar [name="right_nav"]');
const send_button = document.querySelector('#collaborate .navigation_bar [name="send_button"]');
const section_progress = document.querySelector('#collaborate .navigation_bar .progress');

const code_input = document.querySelector('#code [name="code_input"]');
const code_request_button = document.querySelector('#code [name="code_request_button"]');

var as = "https://script.google.com/macros/s/AKfycbzl5D0Oo1pQvXCLXUQlCpWgEOmibb9iaM4_pe-tXWsSl_ImUu2gTXqPR8ZvYEstjFZ8cA/exec"
var global_data;

var url_params;

back_button.addEventListener('click', () => {
    goBack(true);
});

code_button.addEventListener('click', () => {
    code.classList.toggle('visible');
});

code_request_button.addEventListener('click', () => {
    const code_value = code_input.value.trim();
    if (code_value) {
        requestContent(code_value);
    }
});

send_button.addEventListener('click', () => {
    sendData();
})

document.addEventListener('DOMContentLoaded', () => {
    url_params = new URLSearchParams(window.location.search)

    var collabData = localStorage.getItem('collabData');
    if (collabData) {
        global_data = JSON.parse(collabData);
        loadCollaborateSection(global_data);
    } else {
        fetch(as + "?get=collab")
            .then(response => response.json())
            .then(data => {
                global_data = data;
                localStorage.setItem('collabData', JSON.stringify(global_data));
                loadCollaborateSection(global_data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    
});

function loadCollaborateSection(data) {
    open_selection.style.display = 'flex';
    logo.classList.add('loaded');

    const create_item = (data) => {
        const parent = document.createElement('div');
        
        const icon = document.createElement('img');
        const title = document.createElement('h2');
        const i = document.createElement('i');

        icon.src = data.icon;
        title.textContent = data.Titre;

        var i_type = "";
        switch (data.Type) {
            case "Audio":
                i_type = "fa-music";
            case "Jeu vidéo":
                i_type = "fa-gamepad";
        }
        i.classList.add('fa-solid', i_type);
        
        parent.appendChild(icon);
        parent.appendChild(title);
        parent.appendChild(i);

        parent.addEventListener('click', () => {
            handleLoadContent(data);
        });

        return parent;
    }

    for (const item of data.collaborate_data) {
        open_selection.appendChild(create_item(item));
    }
}

function requestContent(string) {
    var content = global_data.collaborate_data.filter(r => r.Code === string);
    
    logo.classList.remove('loaded');
    open_selection.style.display = 'none';
    code.classList.remove('visible');
    
    if (content.length > 0) {
        
        loadContent(content[0]);
        return;
    }

    logo.classList.remove('loaded');
    open_selection.style.display = 'none';
    code.classList.remove('visible');

    fetch(as + `?get=collab&request=${string}`)
        .then(response => response.json())
        .then(data => {
            if (data.Error) {
                logo.classList.add('loaded');
                open_selection.style.display = 'flex';
            } else {
                loadContent(data);
            }
            
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function handleLoadContent(data) {
    logo.classList.remove('loaded');
    open_selection.style.display = 'none';
    setTimeout(() => {
        loadContent(data);
    }, 500);
}

var collab_current;
var current_index = -1;

const construct_section = (titles, contents, inputs, index) => {
    const div = document.createElement('div'); div.classList.add('content_area');
    const title = document.createElement('h1');
    title.textContent = index + "/ " + titles[index];
    const content_div = document.createElement('div'); content_div.classList.add('content');
    
    for (const item of parseBB(contents[index], index)) { content_div.appendChild(item); }
    
    const inputs_container = document.createElement('ul'); inputs_container.classList.add('inputs');
    
    for (const text of inputs[index]) {
        const li = document.createElement('li');
        for (const input of parseBB(text, index)) {
            li.appendChild(input);
            inputs_container.appendChild(li);
        }
    }
    
    div.appendChild(title);
    div.appendChild(content_div);
    div.appendChild(inputs_container);
    return div;
}

var direction_sections = [];
var answers = {};
function loadContent(data) {
    logo.classList.add('loaded');
    
    collab_current = data;
    current_index = -1;

    const titles =      collab_current.Titles.split(/\d\:(.+?)\;/g).filter(v => v);
    const contents =    collab_current.Contents.split(/\d\:(.+?)\;/g).filter(v => v);
    const inputs =      collab_current.Inputs.split(/\d\:(.+?)\;/g).filter(v => v).map(v => v.split(','));

    var length_check = titles.length / contents.length && inputs.length / contents.length && inputs.length / titles.length;

    if (length_check===1) {
        collaborate_section.style.display = 'block';
        url_params.set('id', data.Code);
        window.history.replaceState({}, "", `${location.pathname}?${url_params}`);

        // for (c of document.querySelectorAll('.content_area')) c.remove();
        formulaire.innerHTML = "";

        for (let s=0; s<titles.length; s++) {
            const section = construct_section(titles, contents, inputs, s);
            direction_sections.push(section);
            formulaire.appendChild(section);
        }

        navigateTo(1);
    } else {
        collaborate_section.style.display = 'none';
        open_selection.style.display = 'flex';
    }
}

function navigateTo(dir = 0) {
    var last_i = current_index;
    var new_i = current_index + dir;
    if (new_i >= 0 && new_i < direction_sections.length) {
        if (current_index >= 0) {
            direction_sections[current_index].style.opacity = 0;
        }
        setTimeout(() => {
            if (last_i >= 0) direction_sections[last_i].style.display = 'none';
            
            direction_sections[new_i].style.display = 'flex';
            direction_sections[new_i].getBoundingClientRect();
            direction_sections[new_i].style.opacity = 1;
        }, 500);

        current_index = new_i;

        section_progress.style.width = ((current_index + 1) / direction_sections.length * 100) + "%";

        if (current_index === direction_sections.length - 1) {
            right_nav.classList.add('disabled');
            send_button.classList.remove('disabled');
        } else if (current_index === 0) {
            left_nav.classList.add('disabled');
            right_nav.classList.remove('disabled');
            send_button.classList.add('disabled');
        } else {
            right_nav.classList.remove('disabled');
            left_nav.classList.remove('disabled');
            send_button.classList.add('disabled');
        }
    }
}

const bbcode = new Map();
bbcode.set(/\[LINK=\"(.+?)\"\,?(.+)?\]/g,   (_, i) => {
    var [_, link, text] = _;
    const a = document.createElement('a');
    a.href = link;
    a.textContent = text || link;
    a.name = i + "_link";
    return a;
});
bbcode.set(/\[CHECKBOX NAME=(.+?)\]/g,         (_, i) => {
    var [_, name] = _;
    const c = document.createElement('input'); c.type = 'checkbox';
    c.name = i + "_checkbox" + "_" + name;
    return c;
});
bbcode.set(/\[TEXT NAME=(.+?)\]/g,             (_, i) => {
    var [_, name] = _;
    const t = document.createElement('textarea');
    t.placeholder = "...";
    t.name = i + "_text" + "_" + name;
    return t;
});
bbcode.set(/\[STAR=(.+?)\s?(NAME=(.+?))?\]/g,             (_, i) => {
    var [_, num, name] = _;
    const d = document.createElement('div');
    d.classList.add('star_input');
    for (let index = 0; index < 5; index++) {
        const star = document.createElement('input');
        star.name = i + "_star" + "_" + name;
        star.type = 'radio';
        star.value = index + 1;
        d.appendChild(star);
    }
    return d;
});
bbcode.set(/\[RANGE NAME=(.+?)\]/g,            (_, i) => {
    var [_, name] = _;
    const r = document.createElement('input');
    r.type = 'range';
    r.name = i + "_range" + "_" + name;
    return r;
});
bbcode.set(/\[RADIO NAME=(.+?)\]/g,            (_, i) => {
    var [_, name] = _;
    const r = document.createElement('input');
    r.type = 'radio';
    r.value = name;
    r.name = i + "_radio" + "_" + name ;
    return r;
});

function parseBB(text, index) {
    const output = [];

    for (const [pattern, fn] of bbcode) {
        if (pattern.test(text)) {
            const p = document.createElement('p');
            p.textContent = text.replaceAll(pattern, '');
            
            output.push(p);
            output.push(fn(...text.matchAll(pattern), index));
        };
    }

    return output;
}

function goBack(bool = true) {
    if (!bool) return;
    collaborate_section.style.display = "none";
    open_selection.style.display = "flex";
    direction_sections = [];
    answers = {};
    current_index = -1;
}

function sendData() {
    var output = Object.fromEntries(collab_current.Results.split(';').filter(v=>v).map(r=>r.split(':').map(v=>v.split(','))));
    console.log(collab_current.Results)
    const data = new FormData(formulaire);
    
    var last_i = -1;
    let i=0;
    for (const [name, value] of data) {
        const type = name.replace(/^\d+_(.+?)_(.+)$/, "$1");
        var index = name.replace(/_(.+)$/, "");

        index = parseInt(index);

        if (last_i !== index) {
            last_i = index;
            i=0;
        } else {
            i++;
        }

        var v;

        



        switch (type) {
            case "text":
                v = value;
                break;
            case "checkbox":
                v = parse = value === "on" ? 1: 0;
                break;
            case "range":
                v = Math.round(parseInt(value) * 10.0) / 10.0;
                break;
            case "radio":
                v = value;
                break;
            case "star":
                v = parseInt(value);
                break;
        }
        output[index+1][i] = v;
    }
    var result = Object.entries(output).map(v=>v.join(':')).join(';') + ";";
    console.log(result.toString());

    logo.classList.remove('loaded');
    collaborate_section.style.display = 'none';

    console.log(result);

    return;

    fetch(as + "?get=collab&request=" + collab_current.Code + "&data=" + result)
        .then(res => res.json())
        .then(data => {
            logo.classList.add('loaded');
            goBack();
            alert('Réponse envoyée!')
        })
        .catch(err => console.error(err));
}