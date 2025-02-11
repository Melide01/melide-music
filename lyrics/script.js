const pathParts = window.location.pathname.split("/");
const songId = pathParts[pathParts.length - 1];

const lyrics_container = document.getElementById('lyrics_container');
const lyrics_explanation = document.getElementById('lyrics_explanation');

var lyricsdata;

document.addEventListener('DOMContentLoaded', () => {
    fetch(`songs/${songId}/lyrics.json`)
        .then(response => response.json())
        .then(data => {
            lyricsdata = data;
            displayLyrics();
        })
        .catch(error => {
            console.error("Error loading song:", error);
        });
});

function displayLyrics(arr) {
    var output = ""
    arr.forEach((e, i) => {
        output += `<div class="lyrics_line">${e}</div>`
    });
    lyrics_container.innerHTML = output;

    addEventListener();
}

addListeners();

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

function addListeners() {
    var lyrics_lines = document.querySelectorAll('.lyrics_line');

    lyrics_lines.forEach((e, i) => {
        e.addEventListener('click', () => {
            if (e.children.length === 0) {
                toggleActive(e)
                setTimeout(() => {
                    
                    e.appendChild(lyrics_explanation)
                }, 100);
            };
        })
    });
}