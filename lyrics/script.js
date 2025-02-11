const params = new URLSearchParams(window.location.search)
const songId = params.get("song");

const lyrics_container = document.getElementById('lyrics_container');
const lyrics_explanation = document.getElementById('lyrics_explanation');

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
    var output = ""
    lyricsdata.forEach((e, i) => {
        output += `<div class="lyrics_line" onclick="if (children.length === 0) {toggleActive(this); this.appendChild(lyrics_explanation) }">${e}</div>`
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