// GLOBALS
var siteType;
var song_data;
var cached_tracks;
var fetchable_google_sheet = "https://script.google.com/macros/s/AKfycbzl6oTE0XKLbS9SnDb-IkkMeEp9iOTc7K9DFJPTyyRQSBFxlSjgPHc1V12ZMteQ9aglFQ/exec";

// HTML ELEMENTS
var mini_melide;
const screen_loader = document.getElementById('screen_loader');
const evermade_tracks = document.getElementById('evermade_tracks');
const notification = document.getElementById('notification');

function notify(title, description, dirY, dirX, type = "") {
    notification.querySelector('[name="notif_title"]').textContent = title;
    notification.querySelector('[name="notif_desc"]').textContent = description;
    notification.classList = "";
    notification.offsetWidth;
    notification.classList.add(dirY, dirX, type);
}

var opened_modal;
function revealModal(id = "", callback = false) {
    const modal = document.getElementById(id);
    
    if (id !== "" && !opened_modal?.parentElement.classList.contains("reveal") && !callback) {
        opened_modal = modal;
        opened_modal.parentElement.classList.add('reveal');
    } else {
        opened_modal.parentElement.classList.remove('reveal');
        opened_modal = undefined;
    }
}

function handleLoading(callback = false) {
    if (!callback) {
        screen_loader.classList.add('loading');
    } else {
        screen_loader.classList.remove('loading');
    }
};

function forceReloadData() {
    sessionStorage.setItem("tracks", undefined);
}

// LOADED
var url_params;
document.addEventListener("DOMContentLoaded", () => {
    url_params = new URLSearchParams(window.location.search);

    // VARS
    siteType = document.documentElement.dataset.site;
    mini_melide = document.getElementById('mini_melide');
    cached_tracks = sessionStorage.getItem("tracks");

    const setupMiniMelide = () => {
        let toggle_debug = -1;
        mini_melide.addEventListener('click', () => {
            toggle_debug = -toggle_debug;
            moveMelide(toggle_debug, true, true);
        });
        
        // RANDOM MELIDE
        current_melide = Object.keys(mini_melide_anim)[Math.floor(Math.random() * Object.keys(mini_melide_anim).length)];

        mini_melide.src = mini_melide_anim[current_melide].greet;
        moveMelide(0, false);

        setTimeout(() => {
            mini_melide.src = mini_melide_anim[current_melide].idle;
        }, 2800)
    };

    const handleHome = (data) => {
        if (!cached_tracks) {
            setupMiniMelide();
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
            setupMiniMelide();
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
                // search_argument[4] = capitalize(filter);
                // search_argument[3] = capitalize(state);
                // search_argument[6] = capitalize(type);

                if (search !== "") {
                    loadTracksPanel();
                    sortPannel("text", 1, search.replace("_", " "));
                } else {
                    loadTracksPanel(3, capitalize(state));
                    loadTracksPanel(6, capitalize(type));
                    sortPannel("date", 4, capitalize(filter));
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

    // REDIRECTS
    if (siteType === "home") {
        handleHome();
    } else if (siteType === "tracks") {
        handleTracks();
    }

});

var evermade_songs = {};
const random_colors = ['color1', 'color2', 'color3']

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
    const latest_track = data.tracks_data.filter(a => a[3] === "Released").sort((a, b) => new Date(b[4])- new Date(a[4]));
    const today_date = new Date();
 
    release_date = new Date(latest_track[0][4]);
    creation_date = new Date(latest_track[0][5]);

    if (release_date.getTime() < today_date.getTime()) {
        document.querySelector('[name="latest_song_announce"]').textContent = "Dernière sortie :";
    } else {
        document.querySelector('[name="latest_song_announce"]').textContent = "Prochaine sortie :";
    };

    // GET REMAINING TIME
    if (release_date - today_date > 0) {
        updateRemainingTime(release_date);
    }

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
        "walk_to_left": "assets/mini_melide/mini_melide_walk_to_left.gif",
        "walk_to_right": "assets/mini_melide/mini_melide_walk_to_right.gif",
        "run_to_left": "assets/mini_melide/mini_melide_run_to_left.gif",
        "run_to_right": "assets/mini_melide/mini_melide_run_to_right.gif",
        "idle": "assets/mini_melide/mini_melide_idle.gif",
        "greet": "assets/mini_melide/mini_melide_greets.gif"
    },
    "melide_minecraft": {
        "walk_to_left": "assets/mini_melide/minecraft/mini_melide_minecraft_walk_to_left.gif",
        "walk_to_right": "assets/mini_melide/minecraft/mini_melide_minecraft_walk_to_right.gif",
        "run_to_left": "assets/mini_melide/minecraft/mini_melide_minecraft_walk_to_left.gif",
        "run_to_right": "assets/mini_melide/minecraft/mini_melide_minecraft_walk_to_right.gif",
        "idle": "assets/mini_melide/minecraft/idle0000.png",
        "greet": "assets/mini_melide/minecraft/mini_melide_minecraft_greet.gif"
    }
};

function moveMelide(dir = 0.5, playanim = true, is_playerdriven = false) {
    if (mini_melide_is_moving) return;

    if (is_playerdriven) {
        // GET MINI MELIDES DATA 
        notify("Mini-melide", "Mini-melide à marcher " + window.innerWidth + " pixels", "bottom", "right", "game");
    }

    if (playanim) {
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