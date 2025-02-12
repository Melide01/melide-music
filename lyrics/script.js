const params = new URLSearchParams(window.location.search)
const songId = params.get("song");

const songTitle = document.getElementById('songTitle');
const songArtists = document.getElementById('songArtists');
const songGenre = document.getElementById('songGenre');

const lyrics_container = document.getElementById('lyrics_container');

var lyricsdata = [];

document.addEventListener('DOMContentLoaded', () => {
    if (songId) {
        fetch(`../songs/${songId}/lyrics.json`)
            .then(response => response.json())
            .then(data => {
                lyricsdata = data;
                initialize();
            })
            .catch(error => {
                lyrics_container.textContent = error + `../songs/${songId}/lyrics.json`;
            });
    }
});

function initialize() {
    if (!!!lyricsdata) {
        setTimeout(() => {
            if (!!!lyricsdata) {
                return
            } else {
                displayLyrics();
            };
        }, 500);
    } else {
        displayLyrics();
    }
}

function displayLyrics() {
    songTitle.textContent = lyricsdata.metadata.title;
    songArtists.textContent = lyricsdata.metadata.artists;
    songGenre.textContent = lyricsdata.metadata.genres;

    var output = "";
    lyricsdata.lyrics.forEach((e, i) => {
        output += `<div class="lyrics_line`;
        if (e.lyrics.startsWith("#")) {
            output += ` special`;
        }
        output += `" onclick="toggleActive(this);">${e.lyrics}`;
        if (e.explain !== '') {
            output += `<div class="lyrics_explanation">${e.explain}</div>`;
        }
        output += "</div>"
    });
    lyrics_container.innerHTML = output;
}

var lastactive = undefined;
function toggleActive(el) {
    if (el === lastactive) {
        el.classList.remove("active");
        lastactive = undefined;
        toggleClass(navigation_menu, 'open');
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