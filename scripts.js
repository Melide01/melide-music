var siteType;

// GLOBALS
var info_rules = {
    "header": {
        "Accueil":  {"sitetype": "home", "href": "/home/"},
        "Musiques": {"sitetype": "audios", "href": "/audios/?type=song&state=released&filter=croissant"},
        "Contact":  {"sitetype": "contact", "href": "/contact/"}
    },
    "footer": [
        {
            "Accueil": {"href": "/home/"},
            "Tout les sons": {"href": "/audios/"}
        },
        {
            "Contact": {"href": "/contact/"},
            "Mentions légales": {"href": "/page/?page=mentions-legales"},
            "Politique de confidentialité": {"href": "/page/?page=politique-confidentialite"},
        }
    ]
}

var song_data;
var blog_data;

var cached_tracks;
var cached_blogs;

var fetchable_google_sheet = "https://script.google.com/macros/s/AKfycbxUxJcHeYWkjr72cOEcu-IU91rOWLv6kX-Vtb8BK0eGPJpiwGK51S6EaEQOy3C99hSvyA/exec";

// HTML ELEMENTS
var mini_melide;
const screen_loader = document.getElementById('screen_loader');
const evermade_tracks = document.getElementById('evermade_tracks');
const notification = document.getElementById('notification');
const header_banner = document.getElementById('header_banner');

// NOTIFICATION
function notify(title, description, dirY, dirX, type = "") {
    notification.querySelector('[name="notif_title"]').textContent = title;
    notification.querySelector('[name="notif_desc"]').textContent = description;
    notification.classList = "";
    notification.offsetWidth;
    notification.classList.add(dirY, dirX, type);
}

// CUSTOM MODAL DISPLAY
const custom_modal = document.getElementById('custom_modal');
const custom_modal_title = custom_modal.querySelector('[name="custom_modal_title"]');
const custom_modal_content = custom_modal.querySelector('[name="custom_modal_content"]');
const custom_modal_btn1 = custom_modal.querySelector('[name="custom_modal_btn1"]');
const custom_modal_btn2 = custom_modal.querySelector('[name="custom_modal_btn2"]');
var btn1cb = () => {};
var btn2cb = () => {};
custom_modal_btn1.addEventListener('click', () => btn1cb());
custom_modal_btn2.addEventListener('click', () => btn2cb());
function customModal(title, content, btn1, btn1Callback = btn1cb, btn2, btn2Callback = btn2cb) {
    custom_modal_title.textContent = title;
    custom_modal_content.textContent = content;
    custom_modal_btn1.textContent = btn1;
    custom_modal_btn2.textContent = btn2;
    btn1cb = btn1Callback;
    btn2cb = btn2Callback;
    revealModal("custom_modal");
}

// MODAL REVEAL AND CLOSING
var opened_modal;
function revealModal(id = "", callback = false) {
    const modal = document.getElementById(id);
    
    if (id !== "" && !opened_modal?.parentElement.classList.contains("reveal") && !callback) {
        opened_modal = modal;
        opened_modal.style.display = "flex";
        opened_modal.parentElement.classList.add('reveal');
    } else {
        opened_modal.style.display = "none";
        opened_modal.parentElement.classList.remove('reveal');
        opened_modal = undefined;
    }
}

// LOADING SYSTEMS
function handleLoading(callback = false) {
    screen_loader.classList.remove('loaded');
    if (!callback) {
        screen_loader.classList.add('loading');
    } else {
        screen_loader.classList.remove('loading');
    }
};

function forceReloadData() {
    sessionStorage.setItem("tracks", undefined);
}

// DOM CONTENT LOADED
var url_params;
const header_buttons = document.getElementById('header_buttons');
const page_footer = document.getElementById('page_footer');
document.addEventListener("DOMContentLoaded", () => {
    url_params = new URLSearchParams(window.location.search);

    const load_header_buttons = () => {
        const header_btn_list_key = Object.keys(info_rules.header);
        var sitetype = document.documentElement.dataset.site;
        
        header_btn_list_key.forEach(e => {
            const a_el = document.createElement('a');
            a_el.textContent = e;
            a_el.classList = "papernote sepia clickable";

            if (!!info_rules.header[e].href && info_rules.header[e].sitetype !== sitetype) {
                a_el.href = info_rules.header[e].href;
                a_el.addEventListener('click', (event) => {
                    event.preventDefault(); 
                    handleLoading(); 
                    setTimeout(() => {
                        window.location.href = event.target.href;
                    }, 1000);
                })
            } else if (info_rules.header[e].sitetype !== sitetype) {
                a_el.classList.add('disabled');
            } else {
                a_el.style.filter = 'brightness(.7) contrast(1)';
                a_el.classList.remove('clickable');
            }
            
            header_buttons.appendChild(a_el);
        });
    }
    

    const load_footer = () => {
        page_footer.style.gridTemplateColumns = `repeat(auto-fill, minmax(10em, auto))`

        for (let group of info_rules.footer) {
            const footer_list_keys = Object.keys(group);
            const footer_group = document.createElement('ul');

            footer_list_keys.forEach(e => {
                const li_el = document.createElement('li');
                var text_el = li_el;

                if (!!group[e].href) {
                    var a_el = document.createElement('a');
                    a_el.href = group[e].href;
                    text_el = a_el;
                    li_el.appendChild(a_el);
                };

                text_el.textContent = e;
                footer_group.appendChild(li_el);
            })
            page_footer.appendChild(footer_group);
        }
    }

    

    // VARS
    siteType = document.documentElement.dataset.site;
    mini_melide = document.getElementById('mini_melide');
    cached_tracks = sessionStorage.getItem("tracks");
    cached_blogs = sessionStorage.getItem("blogs");

    const setupMiniMelide = () => {
        let toggle_debug = 1;
        
        mini_melide.addEventListener('click', () => {
            if (mini_melide_is_moving) return;
            toggle_debug = -toggle_debug;
            moveMelide(toggle_debug, true, true);
        });
        
        // RANDOM MELIDE
        current_melide = Object.keys(mini_melide_anim)[Math.floor(Math.random() * Object.keys(mini_melide_anim).length)];
        moveMelide(0, true, false);
        mini_melide_is_moving = true;
        mini_melide.src = mini_melide_anim[current_melide].greet;
        

        setTimeout(() => {
            mini_melide.src = mini_melide_anim[current_melide].idle;
            moveMelide(1, true, false)
        }, 2800)
    };

    const handleHome = (data) => {
        setupMiniMelide();

        if (!cached_tracks) {
            notify('Bienvenue !', 'Les musiques sont en cours de chargement.', "top", "center", "good")
            fetch(fetchable_google_sheet + "?get=tracks")
                .then(res => res.json())
                .then(data => {
                    sessionStorage.setItem("tracks", JSON.stringify(data));
                    song_data = data;
                    loadDashboard(data);
                })
                .catch(err => {
                    notify("Erreur", "Une erreur s'est produite", "top", "center", "bad");
                    console.error(err);
                });
        } else {
            loadDashboard(song_data);
        }
    };

    const handleTracks = (data) => {
        const loadTracks = () => {
            const track = url_params.get("track");
            const filter = !!url_params.get("filter") ? url_params.get("filter") : "Trier..."; // Trier..., Croissant, Decroissant
            const state = !!url_params.get("state") ? url_params.get("state") : "Trier..."; // Trier..., Released, Unreleased, Work, Removed
            const type = !!url_params.get("type") ? url_params.get("type") : "Trier..."; // Trier..., Song, Beat/Instrumental, Remix, Cover, Soundtrack
            const search = !!url_params.get("search") ? url_params.get("search") : ""; // Any search

            if (track) {
                loadTrack(track)
            } else {
                const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

                if (search !== "") {
                    loadTracksPanel();
                    sortPannel("text", 1, search.replace("_", " "));
                } else {
                    loadTracksPanel(3, capitalize(state).replace("_", " "));
                    loadTracksPanel(6, capitalize(type).replace("_", " "));
                    sortPannel("date", 4, capitalize(filter).replace("_", " "));
                }
            }
        }

        if (!cached_tracks) {
            fetch(fetchable_google_sheet + "?get=tracks")
                .then(res => res.json())
                .then(data => {
                    sessionStorage.setItem("tracks", JSON.stringify(data));
                    song_data = data;
                    loadTracks();
                })
                .catch(err => {
                    notify("Erreur", "Une erreur s'est produite", "top", "center", "bad");
                    console.error(err);
                });
        } else {
            loadTracks();
        }
    };

    song_data = cached_tracks ? JSON.parse(cached_tracks) : null;
    blog_data = cached_blogs ? JSON.parse(cached_blogs) : null;

    console.log(siteType);
    if (["home", "audios", "pages", "contact"].includes(siteType)) { load_header_buttons(); load_footer(); }

    switch(siteType) {
        case "home":
            handleHome();
            break;
        case "audios":
            handleTracks();
            break;
        case "pages":
            const docEl = document.getElementById('pageContent');
            fetch(`/page/pages/${url_params.get('page')}.md`)
                .then((response) => {
                    console.log('Response status:', response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status : ${response.status}`)
                    }
                    return response.text();
                })
                .then((data) => {
                    docEl.innerHTML = "";
                    parseMarkdown(data).forEach(el => docEl.appendChild(el));
                })
                .catch((err) => {
                    console.error(err);
                });
            break;
        case "contact":
            break;
    }
});

var evermade_songs = {};
const random_colors = ['color1', 'color3', 'color3', 'color2']

function loadDashboard(data) {
    // SETS DATA
    song_data = data;
    document.querySelector('[name="dashboard_everytrack_number"]').textContent = `${data.tracks_data.length - 1} morceaux enregistrer`

    // PREPARE AND SET LATEST RELEASE INFO
    evermade_songs = {
        "Postés": {
            "value": Math.round(data.tracks_data.filter(a => a[3] === "Released").length / data.tracks_data.length * 100) + "%",
            "animation": "flicker2 2s infinite linear"
        },
        "Inaccessibles": {
            "value": Math.round(data.tracks_data.filter(a => a[3] === "Unreleased").length / data.tracks_data.length * 100) + "%",
            "animation": "flicker1 2s infinite linear"
        },
        "En travaux": {
            "value": Math.round(data.tracks_data.filter(a => a[3] === "Work").length / data.tracks_data.length * 100) + "%",
        },
        "Retirés": {
            "value": Math.round(data.tracks_data.filter(a => a[3] === "Removed").length / data.tracks_data.length * 100) + "%",
        }
    }
    getLatestRelease(data);

    // SETSUP THE STATISTIC BAR
    Object.keys(evermade_songs).forEach((key, index) => {
        const segment = document.createElement('div');
        segment.classList.add('bar-segment', random_colors[index % random_colors.length]);
        segment.style.width = evermade_songs[key].value;
        segment.textContent = evermade_songs[key].value + " - " + key;

        if (!!evermade_songs[key]?.animation && evermade_songs[key]?.animation !== "") {
            segment.style.animation = evermade_songs[key].animation;
        }
        evermade_tracks.appendChild(segment);
    });
};

const latest_song_progressbar = document.getElementById('latest_song_progressbar');

var creation_date;
var release_date;
function updateRemainingTime() {
    const now = new Date();
    const diffMs = release_date - now;

    const diffSec = Math.floor(diffMs / 1000);
    const days = Math.floor(diffSec / (60 * 60 * 24));
    const hours = Math.floor((diffSec % (60 * 60 * 24)) / (60 * 60));
    const minutes = String(Math.floor((diffSec % (60 * 60)) / 60));
    const seconds = String(diffSec % 60);

    document.querySelector('[name="latest_song_timer"]').textContent = `${days} jours, ${hours}h${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;

    const creation_date_date = new Date(creation_date);
    const release_date_date = new Date(release_date);

    const total_duration_ms = release_date_date - creation_date_date;
    const time_passed_ms = now - creation_date_date;

    const progression_percentage = Math.min(
        100,
        Math.max(0, (time_passed_ms / total_duration_ms) * 100)
    );

    latest_song_progressbar.textContent = Math.round(progression_percentage) + "%";
    latest_song_progressbar.style.width = progression_percentage + "%";

    setTimeout(() => {
        requestAnimationFrame(updateRemainingTime)
    }, 1000);
}

function getLatestRelease(data) {
    const latest_track = data.tracks_data.filter(a => a[3] === "Released" && a[6] === "Song").sort((a, b) => new Date(b[4])- new Date(a[4]));
    const today_date = new Date();
 
    release_date = new Date(latest_track[0][4]);
    creation_date = new Date(latest_track[0][5]);

    // CHECK IF ITS RELEASED OR NOT YET
    if (release_date.getTime() < today_date.getTime()) {
        document.querySelector('[name="latest_song_announce"]').textContent = "Dernière sortie :";
    } else {
        document.querySelector('[name="latest_song_announce"]').textContent = "Prochaine sortie :";
    };

    // GET REMAINING TIME
    if (release_date - today_date > 0) {
        updateRemainingTime(release_date);
    }

    const latest_action = document.getElementById('latest_action');
    var latest_buttons = `
        ${latest_track[0][15] !== "" ? '<a target="_blank" style="cursor: pointer; font-size: 1.2em; padding: 0; text-align: center; outline: 1px solid #222" class="capsule minim clickable" href="' + latest_track[0][15] + '"><i class="fa-solid fa-bookmark"></i></a>' : ""}
        ${latest_track[0][16] !== "" ? '<a target="_blank" style="cursor: pointer; font-size: 1.2em; padding: 0; text-align: center; outline: 1px solid #222" class="capsule minim clickable" href="' + latest_track[0][16] + '"><i class="fa-brands fa-spotify"></i></a>' : ""}
        ${latest_track[0][17] !== "" ? '<a target="_blank" style="cursor: pointer; font-size: 1.2em; padding: 0; text-align: center; outline: 1px solid #222" class="capsule minim clickable" href="' + latest_track[0][17] + '"><i class="fa-brands fa-youtube"></i></a>' : ""}
        ${latest_track[0][18] !== "" ? '<a target="_blank" style="cursor: pointer; font-size: 1.2em; padding: 0; text-align: center; outline: 1px solid #222" class="capsule minim clickable" href="' + latest_track[0][18] + '"><i class="fa-brands fa-soundcloud"></i></a>' : ""}
        ${latest_track[0][19] !== "" ? '<a target="_blank" style="cursor: pointer; font-size: 1.2em; padding: 0; text-align: center; outline: 1px solid #222" class="capsule minim clickable" href="' + latest_track[0][19] + '"><i class="fa-solid fa-paperclip"></i></a>' : ""}
        `;
    latest_action.innerHTML = latest_buttons;
    document.querySelector('[name="latest_song_cover"]').title = "Ouvrir.";
    document.querySelector('[name="latest_song_cover"]').style.cursor = "pointer";
    document.querySelector('[name="latest_song_cover"]').addEventListener('click', () => location.href = "/audios/?track=" + latest_track[0][0])
    document.querySelector('[name="latest_song_title"]').textContent = latest_track[0][1];
    document.querySelector('[name="latest_song_artist"]').textContent = latest_track[0][7];
    document.querySelector('[name="latest_song_cover"]').src = `https://drive.google.com/thumbnail?sz=w1920&id=${latest_track[0][10]}`;
    document.querySelector('[name="latest_song_card"]').style.backgroundImage = `url("https://drive.google.com/thumbnail?sz=w1920&id=${latest_track[0][10]}")`;
}

// MINI MELIDE RELATED
var mini_melide_is_moving = false;
var mini_melide_last_position;

var current_melide = "melide01";

const mini_melide_anim = {
    "melide01": {
        "walk_to_left":     "/assets/mini_melide/mini_melide_walk_to_left.gif",
        "walk_to_right":    "/assets/mini_melide/mini_melide_walk_to_right.gif",
        "run_to_left":      "/assets/mini_melide/mini_melide_run_to_left.gif",
        "run_to_right":     "/assets/mini_melide/mini_melide_run_to_right.gif",
        "idle":             "/assets/mini_melide/mini_melide_idle.gif",
        "greet":            "/assets/mini_melide/mini_melide_greets.gif"
    },
    "melide_minecraft": {
        "walk_to_left":     "/assets/mini_melide/minecraft/mini_melide_minecraft_walk_to_left.gif",
        "walk_to_right":    "/assets/mini_melide/minecraft/mini_melide_minecraft_walk_to_right.gif",
        "run_to_left":      "/assets/mini_melide/minecraft/mini_melide_minecraft_walk_to_left.gif",
        "run_to_right":     "/assets/mini_melide/minecraft/mini_melide_minecraft_walk_to_right.gif",
        "idle":             "/assets/mini_melide/minecraft/idle0000.png",
        "greet":            "/assets/mini_melide/minecraft/mini_melide_minecraft_greet.gif"
    }
};

function moveMelide(dir = 0.5, playanim = true, is_playerdriven = false) {
    if (mini_melide_is_moving) return;

    if (playanim) {
        if (is_playerdriven) {
            // GET MINI MELIDES DATA 
            notify("Mini-melide", "Mini-melide à marcher " + window.innerWidth + " pixels", "bottom", "right", "game");
        }

        mini_melide_is_moving = true;
        
        if (dir > mini_melide_last_position) {
            if (window.innerWidth < 750) {
                mini_melide.src = mini_melide_anim[current_melide].walk_to_right;
            } else if (window.innerWidth < 1250) {
                mini_melide.src = mini_melide_anim[current_melide].run_to_right;;
            }
            
        } else if (dir < mini_melide_last_position) {
            if (window.innerWidth < 750) {
                mini_melide.src = mini_melide_anim[current_melide].walk_to_left;
            } else if (window.innerWidth < 1250) {
                mini_melide.src = mini_melide_anim[current_melide].run_to_left;
            }
        } else {
            mini_melide.src = mini_melide_anim[current_melide].idle;
        }

        setTimeout(() => {
            mini_melide_is_moving = false;
            mini_melide.src = mini_melide_anim[current_melide].idle;
        }, 2000);
    };
    
    mini_melide_last_position = dir;
    const direction = String((dir + 1) * 50) + "%";
    const counter_anchor = String((dir + 1) * -50) + "%";

    mini_melide.style.left = direction;
    mini_melide.style.transform = `TranslateX(${counter_anchor})`;
};