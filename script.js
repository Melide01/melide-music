const sections = {
    "music_section": document.getElementById('music_section'),
    "contact_section": document.getElementById('contact_section'),
    "story_section": document.getElementById('story_section'),
    "langage_section": document.getElementById('langage_section')
}

window.sections = sections;
var userLang = "";
var localFile;
window.userLang = userLang;
window.localFile = localFile;

import { load_fetch } from "./js/utils.js";
import { create_track } from "./js/tracks.js";
import { get_current_language, load_local_file, translate, load_lang_section } from "./js/local.js";

const nav_buttons = [
    { "title": "MENU/ACCUEIL", "onclick": () => { open_home() } },
    { "title": "MENU/MUSIQUE", "onclick": () => { open_section(sections.music_section); load_fetch("tracks", tracks_fetch, tracks_cb); } },
    { "title": "MENU/MERCH", "onclick": () => { window.location = "/merch"; } },
    { "title": "MENU/HISTOIRES", "onclick": () => { window.location = "/books"; } },
    { "type": "separator" },
    { "title": "MENU/HISTOIRE", "onclick": () => { open_section(sections.story_section) } },
    { "type": "separator" },
    { "title": "MENU/CONTACT", "onclick": () => { open_section(sections.contact_section) } },
    { "title": "MENU/LANGUE", "onclick": () => { open_section(sections.langage_section) } }
];

const tracks_cb = (data) => { music_repertoire.querySelector('tbody').innerHTML = ""; for (const t of data.filter(v => v.trackState === "Released" && v.trackType === "Song").sort((a, b) => new Date(b.trackReleaseDate) - new Date(a.trackReleaseDate))) music_repertoire.querySelector('tbody').appendChild(create_track(t)) };
const tracks_fetch = "https://tracks.melide-s-account.workers.dev/tracks";
const img_url_fetch = "https://img.melide.music/";
const music_repertoire = document.getElementById('music_repertoire');

window.tracks_fetch = tracks_fetch;
window.img_url_fetch = img_url_fetch;


document.addEventListener('DOMContentLoaded', () => {
    open_home();
    for (const nav of document.querySelectorAll(".nav")) {
        nav.innerHTML = "";

        for (const b of nav_buttons) {
            const li = document.createElement('li');
            if (b.type) li.classList.add(b.type)
            li.textContent = b.title;
            li.addEventListener('click', b.onclick);
            nav.appendChild(li);
        }
    };

    load_local_file();
});

var current_section;

function open_section(section) {
    if (current_section) current_section.style.display = "none";
    current_section = section;
    current_section.style.display = "block";
    document.querySelector('footer').style.display = "block";
};

function open_home() {
    var openned_main = document.querySelectorAll("main");
    for (const m of openned_main) m.style.display = "none";
    document.querySelector('footer').style.display = "none";
}
