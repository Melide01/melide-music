function toggleClass(el, cla) {
    if (el.classList.contains(cla)) {
        el.classList.remove(cla);
    } else {
        el.classList.add(cla);
    }
}

function playToggleSong(el) {
    var audio_tracks = document.querySelectorAll('.audio_track');

    if (el.classList.contains("play")) {
        el.classList.remove("play");
        audio_tracks.forEach((e) => {
            e.pause();
        })    
        return;
    } else {
        el.classList.add("play");
    }

    var input_toggles = document.querySelectorAll('.input_toggle');
    

    input_toggles.forEach((e, i) => {
        if (e.classList.contains("active")) {
            audio_tracks[i].volume = 1
        } else {
            audio_tracks[i].volume = 0
        }
    });

    audio_tracks.forEach((e) => {
        e.play();
    })
}