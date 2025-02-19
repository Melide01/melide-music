const params = new URLSearchParams(window.location.search)
const songId = params.get("song");
const project_style = document.getElementById('project_style');

const boot_splash = document.getElementById('boot_splash');

const side_bar_backdrop = document.getElementById('side_bar_backdrop');
const compact_logo = document.getElementById('compact_logo');

const songTitle = document.getElementById('songTitle');
const songArtists = document.getElementById('songArtists');
const songGenre = document.getElementById('songGenre');

const song_player = document.getElementById('song_player');

const lyrics_container = document.getElementById('lyrics_container');
const audio_time_text = document.getElementById('audio_time_text');

var lyricsdata = [];
var lyrics;

function toggleClass(el, cla) {
    if (el.classList.contains(cla)) {
        el.classList.remove(cla);
    } else {
        el.classList.add(cla);
    };
};

document.addEventListener('DOMContentLoaded', () => {
    if (songId) {
        loadLyricsJson();
    } else {
        window.location.href = "../index.html";
    };
});

function loadLyricsJson() {
    fetch(`../songs/${songId}/lyrics.json`)
        .then(response => response.json())
        .then(data => {
            lyricsdata = data;
            loadLyricsMd();
        })
        .catch(error => {
            displayError("Aucune paroles n'a été trouvé");
        })
}

function displayError(error) {
    console.log(error);
    boot_splash.querySelector('i').style.color = "#ccc";
    boot_splash.querySelector('i').textContent = error;
    compact_logo.classList.remove("loading");
    compact_logo.style.animation = "none";
    compact_logo.offsetHeight = "none";
    compact_logo.classList.add("error");
}

function loadLyricsMd() {
    fetch(`../songs/${songId}/lyrics.md`)
        .then(response => response.text())
        .then(data => {
            lyrics = data;
            displayLyrics();
            setTimeout(() => {
                side_bar_backdrop.classList.add('hide');
            }, 2500);
        })
        .catch(error => {
            displayError("Aucune paroles n'a été trouvé");
        });
};

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(Math.round(secs)).padStart(2, '0')}`;
    } else {
        return `${minutes}:${String(Math.round(secs)).padStart(2, '0')}`;
    };
}

var domlines = [];
var time_code = [];
let player;
function displayLyrics() {
    var ldata = lyrics.split('\n');
    var output = "";

    ldata.forEach((e) => {
        output += e.replace(/^(#\s*)?([^[\]{}]+?)\s*(?:\[(.*?)\])?\s*(?:\{(.*?)\})?\s*$/, (match, hash, mainText, subText, timecode) => {
            let specialClass = hash ? 'special' : '';
            let explanationDiv = subText ? `<div class="lyrics_explanation">${lyricsdata.metadata.lyrics_author} : “ ${subText} ”</div>` : '';

            time_code.push(timecode?.trim() || "")
            return `<div class="lyrics_line ${specialClass}" onclick="toggleActive(this)">${formatTime(parseInt(timecode))} - ${mainText}${explanationDiv}</div>`;
        });
    });

    songTitle.textContent = lyricsdata.metadata.title;
    songArtists.textContent = lyricsdata.metadata.artists;
    songGenre.textContent = lyricsdata.metadata.genres;
    
    console.log(lyricsdata.metadata.src)
    player = new AudioSyncPlayer([
        "../songs/est_elle/ee_others.mp3",
        "../songs/est_elle/ee_bass.mp3", 
        "../songs/est_elle/ee_drums.mp3"
    ]);;
    player.loadAudioFiles();

    var style_output = "";

    lyricsdata.metadata.style.forEach((e, i) => {
       style_output += e; 
    });

    project_style.innerHTML = style_output;

    lyrics_container.innerHTML = output;
    domlines = lyrics_container.querySelectorAll(".lyrics_line");
};
console.log("im shit", player)


var lastIndex = 0;
var isLyricsSync = true;
function updateSyncLyrics(time) {
    if (!isLyricsSync) return;
    if (time < 0 || !time_code || !time_code.length) return;

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
        return;
    };
    if (!!lastactive) {
        lastactive.classList.remove("active");
    };
    el.classList.add("active");
    el.scrollIntoView({ behavior: "smooth", block: "center"});
    lastactive = el;
}

class AudioSyncPlayer {
    constructor(audioFiles) {
        this.audioFiles = audioFiles;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.buffers = [];
        this.sources = [];
        this.isPlaying = false;
        this.startTime = 0;
        this.pausedAt = 0;
        this.duration = 0;
        this.lastSeekTime = 0;
    }

    async loadAudioFiles() {
        const promises = this.audioFiles.map(file => this.loadAudioBuffer(file));
        this.buffers = await Promise.all(promises);
        this.duration = Math.max(...this.buffers.map(buffer => buffer.duration));
    }

    async loadAudioBuffer(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return this.audioContext.decodeAudioData(arrayBuffer);
    }

    play(startFrom = 0) {
        if (this.isPlaying) return;

        this.startTime = this.audioContext.currentTime - startFrom;
        this.lastSeekTime = startFrom;

        this.sources = this.buffers.map(buffer => {
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0, startFrom);
            return source;
        });

        this.isPlaying = true;

        // Monitor track: Stop all if any tracks ends
        this.sources.forEach(source => {
            source.onended = () => this.stop();
        });

        requestAnimationFrame(updateProgressBar);
    }

    stop() {
        if (!this.isPlaying) return;

        this.pausedAt = this.audioContext.currentTime - this.startTime;
        this.sources.forEach(source => source.stop());
        this.sources = [];
        this.isPlaying = false;
    }

    seek(time) {
        if (this.buffers.length === 0) return;
        this.stop();
        this.play(time);
    }

    getCurrentTime() {
        return this.isPlaying ? this.audioContext.currentTime - this.startTime : this.pausedAt;
    }
};

console.log(lyricsdata)

// const player = new AudioSyncPlayer([
    // "../songs/est_elle/ee_others.mp3",
    // "../songs/est_elle/ee_bass.mp3",
    // "../songs/est_elle/ee_voc.mp3"
// ]);



const cap_controls = document.querySelector('.custom-audio-player').querySelector('.controls');
const progress = cap_controls.querySelector('.time-bar').querySelector('.progress');
let isDragging = false;

function updateProgressBar() {
    if (player.isPlaying && !isDragging) {
        // const rect = cap_controls.querySelector('.time-bar').getBoundingClientRect();
        // const offsetX = event.clientX - rect.left;
        // const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);
        const percentage = player.getCurrentTime() / player.duration;
        progress.style.width = `${percentage * 100}%`;
        audio_time_text.textContent = formatTime(player.getCurrentTime());
        updateSyncLyrics(player.getCurrentTime());
        requestAnimationFrame(updateProgressBar);
    }
}

function updateVisualProgress(event, seek = false) {
    const rect = cap_controls.querySelector('.time-bar').getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);
    progress.style.width = `${percentage * 100}%`;

    if (seek) {
        return percentage * player.duration;
    }
};