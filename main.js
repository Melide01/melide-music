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
import { handleSearchParam } from '/js/urlEngine.js';

// Data
const canon_modal_info = new ModalData({
    title: "C'est quoi un Canon?",
    content: [,
        "![Placeholder](/assets/placeholder.webp)",
        "# Découvrez les univers !",
        "Un Canon regroupe différents média entre eux, créant un univers connecté."
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
var img_url_fetch = "https://img.melide.music/";

var info_rules = {
    "header": {
        "Accueil": { "sitetype": "home", "href": "/home/" },
        "Musiques": { "sitetype": "audios", "href": "/audios/?type=song&state=released&filter=croissant" },
        "Contact": { "sitetype": "contact", "href": "/contact/" }
    },
    "footer": [
        {
            "Accueil": { "href": "/home/" },
            "Tout les sons": { "href": "/audios/" }
        },
        {
            "Contact": { "href": "/contact/" },
            "Mentions légales": { "href": "/page/?page=mentions-legales" },
            "Politique de confidentialité": { "href": "/page/?page=politique-confidentialite" },
        }
    ]
};

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
    search_content.classList.add('open');
    page_content.classList.remove('open');
    handleSearchParam({delete_all: true})
}
window.return_home = return_home;

document.addEventListener('DOMContentLoaded', async () => {
    load(
        'tracks_data',
        fetchable_google_sheet + "?get=tracks",
        () => {
            setup_selection();
            toggle_selection();
            handleTracksLoader();
        }
    );

    project_container.appendChild(loading_block);
})

function handleTracksLoader() {
    if (!global_data['tracks_data']) return;
    loading_block.classList.add('load');
    project_container.innerHTML = "";

    for (const track of global_data['tracks_data']) {

        var param = {
            title: track["Track Name"],
            subtitle: track["Album"],
            author: track["Track Artists"],
            data: track
        };

        if (track["Cover Art"]) param['image'] = img_url_fetch + track["Cover Art"];

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

async function load(name, fetch, cb = () => {}) {
    var cached = localStorage.getItem(name);
    
    if (cached) { global_data[name] = JSON.parse(cached) }
    else {
        var data = await fetch_json(fetch);
        global_data[name] = data;
        if (data) localStorage.setItem(name, JSON.stringify(data));
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
var renderer = new Renderer3D("Main");
renderer.create();

var camera = new Camera3D("Camera 1");
camera.create();
camera.camera.position.z = -3.0

var scene = new Scene3D("Scene 1");
scene.create();

var melide = new Model3D({name: "Melide", file: "models/melide.glb"});
melide.scene = scene;
melide.create();

objects_3d.push([melide, scene, camera, renderer]);
for (const object of objects_3d) { console.log(object) }

// document.getElementById('container_3d').appendChild(renderer.renderer.domElement)