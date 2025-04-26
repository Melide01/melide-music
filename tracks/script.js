const search_panel = document.getElementById('search_panel');
const track_display = document.getElementById('track_display');

const logo_icon = document.getElementById('logo_icon');
const goBack_button = document.getElementById('goBack_button');

function loadTrack(index) {
    const params = new URLSearchParams(window.location.search);
    const track = params.get("track");
    const data = song_data.tracks_data.filter(v => String(v[0]) === String(index))[0];

    search_panel.style.display = "none";
    track_display.style.display = "block";
    logo_icon.style.display = "none";
    goBack_button.style.display = "block";

    const track_ui_coverart = track_display.querySelector('[name="track_ui_coverart"]');
    const track_ui_title = track_display.querySelector('[name="track_ui_title"]');
    const track_ui_album = track_display.querySelector('[name="track_ui_album"]');
    const track_ui_artists = track_display.querySelector('[name="track_ui_artists"]');

    const track_ui_listen_preview = track_display.querySelector('[name="track_ui_listen_preview"]');
    const track_ui_presave = track_display.querySelector('[name="track_ui_presave"]');
    const track_ui_spotify = track_display.querySelector('[name="track_ui_spotify"]');
    const track_ui_youtube = track_display.querySelector('[name="track_ui_youtube"]');
    const track_ui_soundcloud = track_display.querySelector('[name="track_ui_soundcloud"]');

    const track_ui_current_state = track_display.querySelector('[name="track_ui_current_state"]');
    const track_ui_release_date = track_display.querySelector('[name="track_ui_release_date"]');
    const track_ui_genres = track_display.querySelector('[name="track_ui_genres"]');
    const track_ui_download = track_display.querySelector('[name="track_ui_download"]');

    if (data[10] !== "") {
        track_ui_coverart.src = `https://drive.google.com/thumbnail?sz=w1920&id=${data[10]}`;
        track_ui_coverart.style.display = "block";
        track_display.querySelector('[name="track_ui_meta"]').style = "grid-column: 2/2";
    } else {
        track_ui_coverart.style.display = "none";
        track_display.querySelector('[name="track_ui_meta"]').style = "grid-column: 1/3";
    }

    // PREVIEW BUTTON
    if (data[14] !== "") {
        track_ui_listen_preview.style.display = "block";
    } else {
        track_ui_listen_preview.style.display = "none";
    };

    // SPOTIFY BUTTON
    if (data[15] !== "") {
        track_ui_spotify.style.display = "block";
    } else {
        track_ui_spotify.style.display = "none";
    }

    // YOUTUBE BUTTON
    if (data[16] !== "") {
        track_ui_youtube.style.display = "block";
    } else {
        track_ui_youtube.style.display = "none";
    }

    // SOUNDCLOUD BUTTON
    if (data[17] !== "") {
        track_ui_soundcloud.style.display = "block";
    } else {
        track_ui_soundcloud.style.display = "none";
    }

    track_ui_title.textContent = data[1];
    track_ui_album.textContent = data[2];
    track_ui_artists.textContent = data[7];
    
    track_ui_current_state.textContent = data[6] + " - " + data[3];
    track_ui_release_date.textContent = "Date de sortie : " + data[4];
    track_ui_genres.textContent = data[8];

    
}

function goBack() {
    url_params.delete("track");
    window.history.replaceState({}, "", `${location.pathname}`);
    search_panel.style.display = "block";
    track_display.style.display = "none";
    logo_icon.style.display = "block";
    goBack_button.style.display = "none";
    loadTracksPanel();
}

// 0: (21) [6, 'Intrigue', 'Jadys', 'Removed', '2021-02-10T10:00:00.000Z', '2025-04-21T10:00:00.000Z', 'Soundtrack', 'Melide', 'Acoustic, Mix, Retro', '', '17XqVxwBKh0I0MT9JJxAGLSnxLNElWpEU', false, false, false, '', '', '', '', 0, 0, '']