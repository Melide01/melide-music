const fetchable_google_sheet = "https://script.google.com/macros/s/AKfycbxUxJcHeYWkjr72cOEcu-IU91rOWLv6kX-Vtb8BK0eGPJpiwGK51S6EaEQOy3C99hSvyA/exec";
const project_container = document.getElementById('project_container');
var projects_data;

const timeleft_update_element = document.getElementById('update_notify').querySelectorAll('p')[1];

document.addEventListener('DOMContentLoaded', () => {
    // SETUP
    document.getElementById('update_notify').addEventListener('click', () => {open_modal(_explain_countdown)});


    if (sessionStorage.getItem('projects')) {
        projects_data = JSON.parse(sessionStorage.getItem('projects'));
        handle_build_projects(projects_data);
    } else {
        open_modal(_bienvenue);
        fetch(fetchable_google_sheet + "?get=projects")
            .then(res => res.json())
            .then(data => {
                projects_data = data;
                sessionStorage.setItem('projects', JSON.stringify(projects_data));
                handle_build_projects(projects_data);
            })
            .catch(err => console.error(err));
    };

    updateTime();
});

function updateTime() {
    const nowUTC10 = new Date(
        new Intl.DateTimeFormat("en-US", {
            timeZone: "Pacific/Honolulu",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(new Date())
    );

    const midnightUTC10 = new Date(nowUTC10);
    midnightUTC10.setHours(24, 0, 0, 0);

    const diff = midnightUTC10 - nowUTC10;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    timeleft_update_element.textContent = `${hours} h ${minutes} m ${seconds}`;

    setTimeout(() => {
        requestAnimationFrame(updateTime);    
    }, 1000);
}

var project_description;
var description_title;
var description_content;
var return_button;

function handle_build_projects(projects = projects_data) {
    project_container.innerHTML = "";
    var project_list = projects.projects_data;
    let header = project_list.splice(0, 1);

    project_description = document.createElement('div');
    description_title = document.createElement('h1');
    description_content = document.createElement('p');
    return_button = document.createElement('button');

    project_description.appendChild(return_button);
    project_description.appendChild(description_title);
    project_description.appendChild(description_content);

    return_button.addEventListener('click', () => {current_selected_project.classList.remove('reveal')})
    return_button.textContent = "Retour";
    project_description.id = "project_description";
    project_container.appendChild(project_description);

    for (let project of projects.projects_data) {
        project_container.appendChild(build_project(project));
    }; 
}

const type_to_icon = {
    "Livre": "fa-solid fa-book",
    "Jeux Vidéo": "fa-solid fa-gamepad",
    "Album": "fa-solid fa-music",
    "Musique": "fa-solid fa-compact-disc",
    "Web": "fa-solid fa-globe"
}
const icon_color_theme = {
    "Livre": "--icon-bg-color: #962; --icon-fg-color: #FFF;",
    "Jeux Vidéo": "--icon-bg-color: var(--ac-color); --icon-fg-color: var(--ac-color-shade-2);"
};

var current_selected_project;
function build_project(project) {
    function add_trackdown() {
        const div = document.createElement('div');
        div.classList.add('track_down');
        return div;
    };

    const p_div = document.createElement('div'); p_div.classList.add('project')
    const a_button = document.createElement('a'); a_button.classList.add('support_button')
    const span_title = document.createElement('span');
    const img_p = document.createElement('img');
    const icon_type = document.createElement('i');
    icon_type.classList = type_to_icon[project['Production Type']];
    icon_type.classList.add('icon_type');
    icon_type.style = icon_color_theme[project['Production Type']];

    a_button.textContent = "SOUTENIR";
    span_title.textContent = project['Nom'];
    img_p.src = project['Image Thumbnail'] ? "https://drive.google.com/thumbnail?sz=w1920&id=" + project['Image Thumbnail'] : "/assets/placeholder.webp";

    p_div.appendChild(icon_type);
    p_div.appendChild(a_button);
    p_div.appendChild(span_title);
    p_div.appendChild(img_p);
    p_div.appendChild(add_trackdown());

    // WRITING
    const writing_bloc_div = document.createElement('div');
    const writing_p_info = document.createElement('p');
    const writing_span_progress = document.createElement('span');
    const progress_bar_div = document.createElement('div');

    writing_p_info.textContent = "Écriture";
    writing_span_progress.textContent = Math.round(project['Writing Progress'] * project['Writing Chapters']) + " / " + project['Writing Chapters'];
    progress_bar_div.classList.add('progress_bar');
    progress_bar_div.style.setProperty("--value", (parseFloat(project['Writing Progress']) * 100) + "%");

    writing_bloc_div.appendChild(writing_p_info);
    writing_bloc_div.appendChild(writing_span_progress);
    writing_bloc_div.appendChild(progress_bar_div);
    p_div.appendChild(writing_bloc_div);

    // Event Listeners
    p_div.addEventListener('click', (e) => {
        if (p_div.classList.contains('reveal')) return;
        p_div.classList.add('reveal')
        /* p_div.classList.toggle('reveal');*/
        current_selected_project = p_div;
        description_title.textContent = project.Nom;
        description_content.textContent = project.Description;

        if (window.innerWidth <= 650) {}
    })

    // FOLLOW UP
    // p_div.appendChild(add_trackdown());

    return p_div;
}



const modal_section = document.getElementById('modal_section');
function open_modal(page_text) {
    const content_element= modal_section.querySelector('.content');
    const wipe_all = content_element.querySelectorAll('div');
    for (const container_wipe of wipe_all) container_wipe.remove();

    const text_content = parseMarkdown(page_text);
    const div_content = document.createElement('div');

    for (let el of text_content) div_content.appendChild(el);
    content_element.appendChild(div_content);
    modal_section.classList.add('open');
}



const _bienvenue = `# Bienvenue dans les projets!
Vous pourrez assister sur cette page à l'avancé de chaque projet individuel.
Vous aurez aussi l'occasion de soutenir un projet, ça signifie :
* Avoir le choix de voter pour un projet que vous préférez;
* Avoir le choix de demander des mises à jour automatiques dans votre boîte mail concernant le projet;
* Avoir le choix de soutenir financièrement, si un projet le demande et si vous le souhaiter;

Chaque moyen de soutenir est expliqué avec transparence dans chaque projet, c'est à dire à quoi serviront les moyens donnés et un rapport régulier des moyens utilisés.`;

const _explain_countdown = `# Les mises à jours
Pour éviter de surcharger le serveur, les mises à jour se font automatiquement tous les jours à minuit UTC-10.
Le compteur indique dans combien de temps la prochaine mise à jour sera faite.
De ce fait, les informations de chaques projets sont susceptible d'être radicalement modifier.
Les informations des projets ne sont absolument pas en direct.

Merci de votre compréhension.`;