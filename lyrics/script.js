const params = new URLSearchParams(window.location.search)
const songId = params.get("song");
const project_style = document.getElementById('project_style');

const side_bar_backdrop = document.getElementById('side_bar_backdrop');

const songTitle = document.getElementById('songTitle');
const songArtists = document.getElementById('songArtists');
const songGenre = document.getElementById('songGenre');

const song_player = document.getElementById('song_player');

const lyrics_container = document.getElementById('lyrics_container');

var lyricsdata = [];
var lyrics;

function toggleClass(el, cla) {
    if (el.classList.contains(cla)) {
        el.classList.remove(cla);
    } else {
        el.classList.add(cla);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (songId) {
        loadLyricsJson();
        setTimeout(() => {
            loadLyricsMd();
        }, 100);    
    };
});

function loadLyricsJson() {
    fetch(`../songs/${songId}/lyrics.json`)
        .then(response => response.json())
        .then(data => {
            lyricsdata = data;
        })
        .catch(error => {
            lyrics_container.textContent = error + `../songs/${songId}/lyrics.json`;
        });
}

function loadLyricsMd() {
    fetch(`../songs/${songId}/lyrics.md`)
        .then(response => response.text())
        .then(data => {
            lyrics = data;
            displayLyrics();
        })
        .catch(error => {
            lyrics_container.textContent = error + `../songs/${songId}/lyrics.md`;
        });
};

var domlines = [];
var time_code = [];
function displayLyrics() {
    setTimeout(() => {
        side_bar_backdrop.classList.add('hide');
    }, 5500);
    // lyrics_container.textContent = lyricsarr;
    var ldata = lyrics.split('\n');
    console.log(ldata);

    var output = "";

    ldata.forEach((e) => {
        output += e.replace(/^(#\s*)?([^[\]{}]+?)\s*(?:\[(.*?)\])?\s*(?:\{(.*?)\})?\s*$/, (match, hash, mainText, subText, timecode) => {
            let specialClass = hash ? 'special' : '';
            let explanationDiv = subText ? `<div class="lyrics_explanation">${subText}</div>` : '';

            time_code.push(timecode?.trim() || "")

            return `<div class="lyrics_line ${specialClass}" onclick="toggleActive(this)">${mainText}${explanationDiv}</div>`;
        })
    });

    console.log(time_code);

    song_player.querySelector('source').src = lyricsdata.metadata.src;
    song_player.src = lyricsdata.metadata.src;

    songTitle.textContent = lyricsdata.metadata.title;
    songArtists.textContent = lyricsdata.metadata.artists;
    songGenre.textContent = lyricsdata.metadata.genres;

    var style_output = "";

    lyricsdata.metadata.style.forEach((e, i) => {
       style_output += e; 
    });

    project_style.innerHTML = style_output;

    lyrics_container.innerHTML = output;
    domlines = lyrics_container.querySelectorAll(".lyrics_line");
};

var lastIndex = 0;
var isLyricsSync = true;
function updateSyncLyrics(time) {
    if (!isLyricsSync) return;
    if (time < 0 || !time_code || !time_code.length) return;

    // let lyrics = lyricsdata.lyrics;
    let newIndex = lastIndex;

    while (newIndex < time_code.length - 1 && time >= time_code[newIndex + 1]) {
        newIndex++;
    }

    while (newIndex > 0 && time < time_code[newIndex]) {
        newIndex--;
    }

    if (newIndex !== lastIndex) {
        toggleActive(domlines[lastIndex]);
        lastIndex = newIndex;
        toggleActive(domlines[lastIndex]);
    };
}

var lastactive = undefined;
function toggleActive(el) {
    if (el === lastactive) {
        el.classList.remove("active");
        lastactive = undefined;
        /* toggleClass(navigation_menu, 'open'); */
        return;
    }
    if (!!lastactive) {
        lastactive.classList.remove("active");
    } else {
        // pass
    }
    el.classList.add("active");
    lastactive = el;
}