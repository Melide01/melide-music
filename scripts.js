// GLOBALS
var siteType;
var song_data;
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

    siteType = document.documentElement.dataset.site;
    mini_melide = document.getElementById('mini_melide');

    const cached_tracks = sessionStorage.getItem("tracks");

    if (!!!cached_tracks) {
        // IF THE DATAS ARE NOT CACHED
        // FROM DIFFERENT SITE TYPE
        if (siteType === "home") {
            // MINI MELIDE
            var toggle_debug = -1;
            mini_melide.addEventListener('click', () => {
                if (toggle_debug === -1) {
                    toggle_debug = 1;
                } else if (toggle_debug === 1) {
                    toggle_debug = -1;
                }
            
                moveMelide(toggle_debug, true, true);
            });
            moveMelide(0, false);

            current_melide = Object.keys(mini_melide_anim)[Math.round(Math.random() * (Object.keys(mini_melide_anim).length - 1))];
            console.log(current_melide)
            mini_melide.src = mini_melide_anim[current_melide].greet;
            setTimeout(() => {
                mini_melide.src = mini_melide_anim[current_melide].idle;
            }, 2800);
    
            fetch(fetchable_google_sheet + "?get=tracks")
                .then(res => res.json())
                .then(data => {
                    console.log(data)
                    sessionStorage.setItem("tracks", JSON.stringify(data));
                    song_data = data;
                    loadDashboard(data);
                })
                .catch(err => {notify("Erreur", "Une erreur s'est produite", "top", "center", "bad"); console.error(err)})
        } else if (siteType === "tracks") {
            
            fetch(fetchable_google_sheet + "?get=tracks")
                .then(res => res.json())
                .then(data => {
                    sessionStorage.setItem("tracks", JSON.stringify(data));
                    song_data = data;
                    
                    const params = new URLSearchParams(window.location.search);
                    const track = params.get("track");
                    if (track) {
                        loadTrack(track);
                    } else {
                        loadTracksPanel();
                    };
                })
                .catch(err => {notify("Erreur", "Une erreur s'est produite", "top", "center", "bad"); console.error(err)})
        }
    } else {
        // IF THE DATAS ARE CACHED
        song_data = JSON.parse(cached_tracks);

        if (siteType === "home") {
            // MINI MELIDE
            var toggle_debug = -1;
            mini_melide.addEventListener('click', () => {
                if (toggle_debug === -1) {
                    toggle_debug = 1;
                } else if (toggle_debug === 1) {
                    toggle_debug = -1;
                }
            
                moveMelide(toggle_debug, true, true);
            });

            mini_melide.src = mini_melide_anim[current_melide].greet;
            moveMelide(0, false);
            setTimeout(() => {
                // moveMelide(0);
                mini_melide.src = mini_melide_anim[current_melide].idle;
            }, 2800);
            
            loadDashboard(song_data)
        } else if (siteType === "tracks") {
            const params = new URLSearchParams(window.location.search);
            const track = params.get("track");
            console.log("debug", song_data.tracks_data.filter(v => String(v[0]) === String(track)))
            if (track) {
                loadTrack(track);
            } else {
                loadTracksPanel();
            };
        }
    }

    
});

function sortPannel(type = "date", index = 4, filter = "") {
    const track_container = document.getElementById('track_container');
    const range = song_data.tracks_data.slice(1);

    // RESET
    if (filter === "Trier...") {
        Object.keys(track_element).forEach((i) => {
            track_container.append(track_element[i]);
        });
        return;
    }

    const indexedRange = range.map((val, i) => ({ val, originalIndex: i }));

    if (type === "text") {
        const search = filter.toLowerCase();

        const ranked = indexedRange
            .map(({ val, originalIndex }) => {
                // You can change which fields to search here
                const matchCount = val.reduce((count, field) => {
                    if (typeof field === "string" && field.toLowerCase().includes(search) || filter === "") {
                        return count + 1;
                    }
                    return count;
                }, 0);

                return { val, originalIndex, matchCount };
            })
            .filter(({ matchCount }) => matchCount > 0)
            .sort((a, b) => b.matchCount - a.matchCount);
        
        Object.keys(track_element).forEach((i) => {
            track_element[i].style.display = "none";
        });

        ranked.forEach(({ originalIndex }) => {
            const el = track_element[originalIndex];
            if (el) {
                el.style.display = "grid";
                track_container.prepend(el);
            }
        });

        if (filter === "") {
            sortPannel("date", 4, "Trier...");
        }
        //loadTracksPanel(index, search, "text");
    }

    if (type === "date") {
        const direction = filter === "Décroissant" ? -1 : 1;
        indexedRange.sort((a, b) => {
            const dateA = new Date(a.val[index]); 
            const dateB = new Date(b.val[index]);
            return (dateA - dateB) * direction;
        });
    }

    // RENDERS SORTED ELEMENTS
    indexedRange.forEach(({ originalIndex }) => {
        const el = track_element[originalIndex];
        if (el) track_container.prepend(el);
    });
}

// 0: (20) ['Track ID', 'Track Name', 'Album', 'Track State', 'Track Release Date', 'Track Creation Date', 'Track Type', 'Track Artists', 'Genres', 'Mood', 'Cover Art', 'Explicit', 'Is Up', 'Downloadable', 'Audio Preview', 'Spotify Link', 'YouTube Link', 'SoundCloud Link', 'Views', 'Downloads']
var track_element = {};
var search_argument = {};
function loadTracksPanel(index = 3, filter = "Released", type = "list") {
    search_argument[index] = filter;

    const track_container = document.getElementById('track_container');
    const range = song_data.tracks_data.slice(1);

    const search_results = range.reduce((acc, val, idx) => {
        const is_match = Object.entries(search_argument).every(([key, expected]) => {
            return expected === "Trier..." || val[key] === expected;
        })

        if (is_match) {
            acc[idx] = val;
        }

        return acc;
    }, {});
    
    track_container.querySelector('.loading_balls').style.display = "none"

    range.forEach((e, i) => {
        if (!!track_element[i]) {
            if (!!search_results[i]) {
                track_element[i].style.display = "grid";
            } else {
                track_element[i].style.display = "none";
            }
            return
        };
        const track_card_div = document.createElement('div'); track_card_div.classList.add('track_card', 'mini', 'clickable'); track_card_div.style.opacity = "1";
        track_element[i] = track_card_div;

        var conditional_style_coverart = "";
        if (e[10] !== "") {
            const img_track_cover = document.createElement('img'); img_track_cover.style.opacity = "1";
            img_track_cover.src = `https://drive.google.com/thumbnail?sz=w1920&id=${e[10]}`;
            track_card_div.appendChild(img_track_cover);
        } else {
            conditional_style_coverart = "grid-column: 1/3;";
        }

        const tracks_meta = document.createElement('div'); tracks_meta.classList.add('vertical');
        tracks_meta.style = "gap: 0;" + conditional_style_coverart;
        tracks_meta.innerHTML = `<b>${e[1]}</b><i>${e[7]}</i>`;

        track_card_div.appendChild(tracks_meta);


        const action_div = document.createElement('div'); action_div.classList.add('vertical');

        const is_onplatform = e[15] !== "" || e[16] !== "" || e[17] !== "";
        if (is_onplatform) {
            // PEUT ETRE ECOUTER SUR UNE PLATEFORME
            const platform_button = document.createElement('input'); platform_button.type = "button"; platform_button.value = "Écouter";
            action_div.appendChild(platform_button);
            platform_button.addEventListener('click', () => {
                window.open(e[16])
            })
        }

        if (e[13] === "true") {
            const download_button = document.createElement('input'); download_button.type = "button"; download_button.value = "Download";
            action_div.appendChild(download_button);
        }

        track_card_div.appendChild(action_div);
        
        if (e[9] !== "") {
            const mood_div = document.createElement('div'); mood_div.classList.add('horizontal'); mood_div.style = "grid-column: 1/4; gap: .5em; justify-content: end;"
            const mood_list = e[9].split(', ').map(v => `<span class="capsule minim">${v}</span>`).join("");
            mood_div.innerHTML = mood_list;
            track_card_div.appendChild(mood_div);
        }

        track_container.appendChild(track_card_div);

        // EVENT LISTENER
        track_card_div.addEventListener("click", (event) => {
            if (event.target.tagName !== "INPUT") {
                url_params.set("track", e[0]);  
                window.history.replaceState({}, "", `${location.pathname}?${url_params}`)
                loadTrack(e[0]);
            }
        })
    })
}

var evermade_songs = {};
// 0: (15) Track ID   	Track Name  	Album	 Track State	 Track Release Date 	Track Creation Date	   Track Type	Track Artists	Genres	Cover Art	Explicit	Is Up	Audio File	Spotify Link	YouTube Link	SoundCloud Link	Likes	UPC	ISRC
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
}

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