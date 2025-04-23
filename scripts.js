const mini_melide = document.getElementById('mini_melide');
const screen_loader = document.getElementById('screen_loader');

function handleLoading(callback = false) {
    if (!callback) {
        screen_loader.classList.add('loading');
    } else {
        screen_loader.classList.remove('loading');
    }
}

var toggle_debug = -1;
mini_melide.addEventListener('click', () => {
    if (toggle_debug === -1) {
        toggle_debug = 1;
    } else if (toggle_debug === 1) {
        toggle_debug = -1;
    }

    moveMelide(toggle_debug);
});

var evermade_songs = {};
// 0: (15) ['Track ID', 'Track Name', 'Album', 'Track State', 'Track Release Date', 'Track Type', 'Track Artists', 'Genres', 'Cover Art', 'Explicit', 'Is Up', 'Audio File', 'Spotify Link', 'YouTube Link', 'SoundCloud Link']
const random_colors = ['color1', 'color2', 'color3']
const evermade_tracks = document.getElementById('evermade_tracks');
function loadDashboard(data) {
    // SETS DATA
    song_data = data;
    document.querySelector('[name="dashboard_everytrack_number"]').textContent = `${data.tracks_data.length - 1} morceaux enregistrer`

    // PREPARE AND SET LATEST RELEASE INFO
    evermade_songs = {
        "Postés": Math.round(data.tracks_data.filter(a => a[3] === "Released").length / data.tracks_data.length * 100) + "%",
        "Inaccessibles": Math.round(data.tracks_data.filter(a => a[3] === "Unreleased").length / data.tracks_data.length * 100) + "%",
        "En travaux": Math.round(data.tracks_data.filter(a => a[3] === "Work").length / data.tracks_data.length * 100) + "%",
    }
    getLatestRelease(data);

    // SETSUP THE STATISTIC BAR
    Object.keys(evermade_songs).forEach((key, index) => {
        const segment = document.createElement('div');
        segment.classList.add('bar-segment', random_colors[index % random_colors.length]);
        segment.style.width = evermade_songs[key];
        segment.textContent = evermade_songs[key] + " - " + key;
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
    document.querySelector('[name="latest_song_cover"]').src = `https://drive.google.com/thumbnail?sz=w1920&id=${latest_track[0][9]}`;
    document.querySelector('[name="latest_song_card"]').style.backgroundImage = `url("https://drive.google.com/thumbnail?sz=w1920&id=${latest_track[0][9]}")`;
}

// LOADED
document.addEventListener("DOMContentLoaded", () => {
    moveMelide(0, false);

    fetch(fetchable_google_sheet)
        .then(res => res.json())
        .then(data => {
            song_data = data;
            loadDashboard(data);
        })
        .catch(err => console.error(err))
})

var song_data;
var fetchable_google_sheet = "https://script.google.com/macros/s/AKfycbyUG1NPXehB9_Ytzor6oLoIQn9rOjwt3XJ3CM4F12mVboXRirT39cfcbhMk9jGu9cQ7/exec";


// MINI MELIDE RELATED
var mini_melide_is_moving = false;
var mini_melide_last_position;
function moveMelide(dir = 0.5, playanim = true) {
    if (mini_melide_is_moving) return;
    if (playanim) {
        mini_melide_is_moving = true;
        if (window.innerWidth < 750) {
            if (dir > mini_melide_last_position) {
                mini_melide.src = 'assets/mini_melide/mini_melide_walk_to_right.gif';
            } else if (dir < mini_melide_last_position) {
                mini_melide.src = 'assets/mini_melide/mini_melide_walk_to_left.gif';
            } else {
                mini_melide.src = 'assets/mini_melide/mini_melide_idle.gif';
            }
        }

        mini_melide_last_position = dir;

        setTimeout(() => {
            mini_melide_is_moving = false;
            mini_melide.src = 'assets/mini_melide/mini_melide_idle.gif';
        }, 2000);
    };
    
    
    const direction = String((dir + 1) * 50) + "%";
    const counter_anchor = String((dir + 1) * -50) + "%";

    mini_melide.style.left = direction;
    mini_melide.style.transform = `TranslateX(${counter_anchor})`;
}

setTimeout(() => {
    mini_melide.src = 'assets/mini_melide/mini_melide_idle.gif';
}, 2800);