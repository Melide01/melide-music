// Three.js Import
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.180.0/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.GLTFLoader = GLTFLoader;

var objects_3d = [];

// Local Import
import { Model3D, Camera3D, Scene3D, Renderer3D, Light3D } from '/js/3dLogic.js';

import { reveal_modal, fetch_json } from '/js/Utils.js';
import { toggle_selection, setup_selection, section_results } from '/js/searchLogic.js'
import{ ProjectNode, TrackNode } from '/js/ProjectNode.js';
import { ModalData, toggle_modal, open_modal } from '/js/modalManager.js';
import { parseMarkdown, parseMarkdownLite } from '/js/parseMarkdown.js';
import { handleSearchParam, animateTransition } from '/js/urlEngine.js';

window.animateTransition = animateTransition;

// Data
const canon_modal_info = new ModalData({
    title: "C'est quoi un Canon?",
    content: [,
        "![Placeholder](/assets/placeholder.webp)",
        "# Découvrez les univers !",
        "Un Canon regroupe différents média entre eux, créant un univers connecté."
    ],
    actions: []
});
const dataupdate_modal_info = new ModalData({
    title: "Information générale !",
    content: [
        "Le site est actuellement en train de migrer sa base de donnée publique vers un autre service. Nous sommes désolé pour les problèmes technique rencontrés ultérieurement ainsi que pour ceux à venir.",
        "Nous vous remercions sincèrement de votre compréhension !"
    ],
    actions: []
})
window.canon_modal_info = canon_modal_info;

// Project
var global_data = {};
var global_nodes = {};
var choice_map = { "all": [] };

var page_arrow = document.querySelectorAll('input[type="button"][name="page_arrow"]');

const search_panel = document.getElementById('search_panel');
var search_text = search_panel.querySelector('input[type="search"]');
var search_button = search_panel.querySelector('input[type="button"]');
var search_filter = search_panel.querySelector('select');

const loading_block = document.getElementById('loading_block');
const search_content = document.getElementById('search_content');
const page_content = document.getElementById('page_content');

window.loading_block = loading_block;
window.page_arrow = page_arrow;
window.search_content = search_content;
window.page_content = page_content;

// Helpers
var fetchable_google_sheet = "https://script.google.com/macros/s/AKfycbzl5D0Oo1pQvXCLXUQlCpWgEOmibb9iaM4_pe-tXWsSl_ImUu2gTXqPR8ZvYEstjFZ8cA/exec";
var tracks_fetch = "https://tracks.melide-s-account.workers.dev/tracks";
var img_url_fetch = "https://img.melide.music/";

// var info_rules = {
//     "header": {
//         "Accueil": { "sitetype": "home", "href": "/home/" },
//         "Musiques": { "sitetype": "audios", "href": "/audios/?type=song&state=released&filter=croissant" },
//         "Contact": { "sitetype": "contact", "href": "/contact/" }
//     },
//     "footer": [
//         {
//             "Accueil": { "href": "/home/" },
//             "Tout les sons": { "href": "/audios/" }
//         },
//         {
//             "Contact": { "href": "/contact/" },
//             "Mentions légales": { "href": "/page/?page=mentions-legales" },
//             "Politique de confidentialité": { "href": "/page/?page=politique-confidentialite" },
//         }
//     ]
// };

const selection_choice_name = [
    ["selection_music", "piece"],
    ["selection_artwork", "piece"],
    ["selection_application", "piece"],
    ["selection_book", "piece"],

    // ["selection_indeterminate", "canon"],
    // ["selection_ongoing", "canon"],
    // ["selection_finished", "canon"],

    ["selection_font", "other"],
    ["selection_beat", "other"],
    ["selection_pack", "other"]
];

// Globals
window.reveal_modal = reveal_modal;
window.toggle_selection = toggle_selection;
window.selection_choice_name = selection_choice_name;
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

document.addEventListener('DOMContentLoaded', async () => {
    tracks_version = localStorage.getItem('tracks_version');
    var res_new_version = (await fetch(tracks_fetch + '/version'));
    var new_version = await res_new_version.json();
    var refetch = false;

    if (!tracks_version) { tracks_version = new_version.version; localStorage.setItem('tracks_version', tracks_version);
    } else if (parseInt(new_version.version) > parseInt(tracks_version)) { refetch = true; }

    const first_time = localStorage.getItem('first_time');
    if (!first_time) {
        open_modal(dataupdate_modal_info);
        localStorage.setItem('first_time', true);
    }
    
    load(
        'tracks_data',
        tracks_fetch,
        () => {
            setup_selection();
            toggle_selection();
            handleTracksLoader();
        },
        refetch
    );

    project_container.appendChild(loading_block);
})

function handleTracksLoader() {
    if (!global_data['tracks_data']) return;
    loading_block.classList.add('load');
    project_container.innerHTML = "";

    for (const track of global_data['tracks_data']) {

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
    }

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
}
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
})

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
})

animate();

// Test Setup
// var renderer = new Renderer3D("Main");
// renderer.create();
// 
// var camera = new Camera3D("Camera 1");
// camera.create();
// camera.camera.position.z = -3.0
// 
// var scene = new Scene3D("Scene 1");
// scene.create();
// 
// var melide = new Model3D({name: "Melide", file: "models/melide.glb"});
// melide.scene = scene;
// melide.create();
// 
// objects_3d.push([melide, scene, camera, renderer]);
// for (const object of objects_3d) { console.log(object) }
// 
// document.getElementById('container_3d').appendChild(renderer.renderer.domElement)

async function download_track(track_id) {
    var data = global_data.tracks_data.find(v => v['Track ID'] === track_id);
    if (data['Downloadable']) {
        var res = await fetch(fetchable_google_sheet + "?get=download_request&id=" + track_id);
        var d = await res.json();
        location.href = "drive.google.com/file/d/" + d;
    }
}
window.download_track = download_track;