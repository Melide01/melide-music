const params = new URLSearchParams(window.location.search)
const songId = params.get("song");

const songTitle = document.getElementById('songTitle');
const songArtists = document.getElementById('songArtists');
const songGenre = document.getElementById('songGenre');

const song_player = document.getElementById('song_player');

const lyrics_container = document.getElementById('lyrics_container');

var lyricsdata = [];

function toggleClass(el, cla) {
    if (el.classList.contains(cla)) {
      el.classList.remove(cla);
    } else {
      el.classList.add(cla);
    }
  }

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

var domlines = [];

function displayLyrics() {
    song_player.querySelector('source').src = lyricsdata.metadata.src;
    song_player.src = lyricsdata.metadata.src;

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


    domlines = lyrics_container.querySelectorAll(".lyrics_line");
};

var lastIndex = 0;
var isLyricsSync = false;
function updateSyncLyrics(time) {
    if (!isLyricsSync) return;
    if (time < 0 || !lyricsdata || !lyricsdata.lyrics.length) return;

    let lyrics = lyricsdata.lyrics;
    let newIndex = lastIndex;

    while (newIndex < lyrics.length - 1 && time >= lyrics[newIndex + 1].timecode) {
        newIndex++;
    }

    while (newIndex > 0 && time < lyrics[newIndex].timecode) {
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