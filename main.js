// Three.js Import
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.180.0/three.module.js"
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js"
window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.GLTFLoader = GLTFLoader;

// Loaded 3D
var objects_3d = [];

// Local Import
import { Model3D, Camera3D, Scene3D, Renderer3D, Light3D } from '/js/3dLogic.js'

// Audio Engine
import { AudioProject } from '/js/AudioProject.js'
export async function loadProject(url) {
  const res = await fetch(url)
  const json = await res.json()
  return new AudioProject(json)
}

// Other utilities
import { reveal_modal, fetch_json } from '/js/Utils.js';
import { toggle_selection, setup_selection, section_results } from '/js/searchLogic.js'
import{ ProjectNode, TrackNode } from '/js/ProjectNode.js'
import { ModalData, toggle_modal, open_modal, open_file_modal } from '/js/modalManager.js'
import { parseMarkdown, parseMarkdownLite } from '/js/parseMarkdown.js'
import { handleSearchParam, animateTransition } from '/js/urlEngine.js'

// Some data
const canon_modal_info = new ModalData({
    title: "C'est quoi un Canon?",
    content: [,
        "![img](/assets/placeholder.webp)",
        "# Découvrez les univers !",
        "Un Canon regroupe différents média entre eux, créant un univers connecté."
    ],
    actions: []
});

const dataupdate_modal_info = new ModalData({
    title: "Bienvenue !",
    content: [
        "Merci de votre visite sur mon site.",
        "Vous y trouverez mes musiques, mes jeux et mon actualité."
    ],
    actions: []
});

const image_modal_template = new ModalData({
    title: "Image",
    content: [
        "![img](/assets/placeholder.webp)"
    ]
});
window.image_modal_template = image_modal_template;

// Project
var global_data = {};
var global_nodes = {};
var choice_map = { "all": [] };

// Nodes
var page_arrow = document.querySelectorAll('input[type="button"][name="page_arrow"]');

const search_panel = document.getElementById('search_panel');
var search_text = search_panel.querySelector('input[type="search"]');
var search_button = search_panel.querySelector('input[type="button"]');
var search_filter = search_panel.querySelector('select');

const loading_block = document.getElementById('loading_block');
const search_content = document.getElementById('search_content');
const page_content = document.getElementById('page_content');

// Generalize
window.loading_block = loading_block;
window.page_arrow = page_arrow;
window.search_content = search_content;
window.page_content = page_content;
window.canon_modal_info = canon_modal_info;
window.animateTransition = animateTransition;
window.open_file_modal = open_file_modal;

// Helpers
var fetchable_google_sheet = "https://script.google.com/macros/s/AKfycbzl5D0Oo1pQvXCLXUQlCpWgEOmibb9iaM4_pe-tXWsSl_ImUu2gTXqPR8ZvYEstjFZ8cA/exec";
var tracks_fetch = "https://tracks.melide-s-account.workers.dev/tracks";
var img_url_fetch = "https://img.melide.music/";

const selection_choice_data = {
    "selection_music": {
        "from": "piece",
        "section_name": "music",
        "onclick": () => { console.log("Clicked"); }
    },
    "selection_artwork": {
        "from": "piece",
        "section_name": "artwork",
        "onclick": () => { console.log("Clicked"); }
    },
    "selection_application": {
        "from": "piece",
        "onclick": () => { console.log("Clicked"); }
    },
    "selection_book": {
        "from": "piece",
        "onclick": () => { console.log("Clicked"); }
    },

    "selection_article": {
        "from": "blog",
        "section_name": "blog",
        "onclick": () => { console.log("Clicked"); }
    },
    "selection_doc": {
        "from": "blog",
        "section_name": "blog",
        "onclick": () => { console.log("Clicked"); }
    },
    "selection_course": {
        "from": "blog",
        "section_name": "blog",
        "onclick": () => { console.log("Clicked"); }
    },

    "selection_font": {
        "from": "resources",
        "onclick": () => { console.log("Clicked"); }
    },
    "selection_beat": {
        "from": "resources",
        "onclick": () => { console.log("Clicked"); }
    },
    "selection_pack": {
        "from": "resources",
        "onclick": () => { console.log("Clicked"); }
    }
}

window.reveal_modal = reveal_modal;
window.toggle_selection = toggle_selection;
window.selection_choice_data = selection_choice_data;
window.choice_map = choice_map;
window.global_data = global_data;
window.global_nodes = global_nodes;

var mouseX = window.innerWidth / 2;
var mouseY = window.innerHeight / 2;
window.mouseX = mouseX;
window.mouseY = mouseY;

const project_container = document.getElementById('project_container');

function return_home() {
    document.querySelector('.page_navigation').classList.add('open');
    search_content.classList.add('open');
    page_content.classList.remove('open');
    handleSearchParam({delete_all: true})
}
window.return_home = return_home;

var tracks_version;

async function load_music_data() {
    // La dernière version de la base de donnée
    tracks_version = localStorage.getItem('tracks_version');
    var refetch = false;

    // Nouvelle version
    if (!tracks_version) {
        var res_new_version = (await fetch(tracks_fetch + '/version'));
        tracks_version = await res_new_version.json();
        localStorage.setItem('tracks_version', JSON.stringify(tracks_version));
    }

    // Prepare le future refetch
    if (new Date() > new Date(tracks_version.expiration_date)) { refetch = true; }

    // Retravailler refetch
    // if (parseInt(new_version.version) > parseInt(tracks_version)) {    
    //     refetch = true;
    // };

    // Chargement intelligent
    load(
        'tracks_data',
        tracks_fetch,
        handleTracksLoader(),
        refetch
    );

    // Simple display de chargement
    project_container.appendChild(loading_block);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Message, si première visite
    const first_time = localStorage.getItem('first_time');
    setup_selection();
    toggle_selection();
    
    if (!first_time) {
        open_modal(dataupdate_modal_info);
        localStorage.setItem('first_time', true);
    };
})

function handleTracksLoader() {
    if (!global_data['tracks_data']) return;
    loading_block.classList.add('load');
    project_container.innerHTML = "";

    for (const track of global_data['tracks_data'].filter(v => ["Released"].includes(v.trackState) && ["Song"].includes(v.trackType)).sort((a,b) => parseInt(a.trackID) - parseInt(b.trackID)).sort((a,b) => new Date(a['trackReleaseDate']) - new Date(b['trackReleaseDate']))) {

        var param = {
            title: track["trackName"],
            subtitle: track["album"],
            author: track["trackArtists"],
            data: track
        };

        if (track["coverArt"]) param['image'] = img_url_fetch + track["coverArt"];

        if (!global_nodes['tracks_data']) global_nodes['tracks_data'] = [];
        global_nodes['tracks_data'].push(new TrackNode(param));
    }

    for (const track of global_nodes['tracks_data']) {
        var card = track.create()
        project_container.appendChild(card);
    }

    section_results();
    loading_block.classList.remove('load');
}

async function load(name, fetch, cb = () => {}, force_fetch = false) {
    var cached = sessionStorage.getItem(name);
    if (localStorage.getItem(name)) localStorage.removeItem(name); // Remove old persistent data

    if (cached && !force_fetch) { global_data[name] = JSON.parse(cached) }
    else {
        var data = await fetch_json(fetch);
        if (data) {
            global_data[name] = data;
            sessionStorage.setItem(name, JSON.stringify(data));
        }
    };

    cb();
}

search_text.addEventListener('input', () => {
    loading_block.classList.add('load')
})

search_button.addEventListener('click', () => {
    loading_block.classList.add('load')
})

search_filter.addEventListener('change', () => {
    loading_block.classList.add('load')
})


// Animation and 3D
function animate() {
    for (const object of objects_3d) {
        switch (object.constructor.name) {
            case "Renderer3D":
                var renderer = object.renderer;
                renderer.render(render.scene, render.camera);
                break;
        }
    }
    requestAnimationFrame(animate);
};

window.addEventListener('resize', () => {
    for (const object of objects_3d) {
        switch (object.constructor.name) {
            case "Camera3D":
                var camera = object.camera;
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                break
            case "Renderer3D":
                var renderer = object.renderer;
                renderer.setSize(window.innerWidth, window.innerHeight);
                break
        }
    }
});

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
})

animate();

async function download_track(track_id) {
    var data = global_data.tracks_data.find(v => v['trackID'] === track_id);
    if (data['downloadable']) { console.log(data['downloadable']); };
};

window.download_track = download_track;