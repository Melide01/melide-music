const search_panel = document.getElementById('search_panel');
const track_display = document.getElementById('track_display');

const logo_icon = document.getElementById('logo_icon');
const goBack_button = document.getElementById('goBack_button');

// QUICK UPDATE URL
function updateURL(type = "", value = "") {
    if (value !== "" && value !== "Trier...") {
        url_params.set(type, String(value).toLowerCase().replace(" ", "_"));
    } else {
        url_params.delete(type);
    }
    window.history.replaceState({}, "", `${location.pathname}?${url_params}`);
}

// HANDLE EVENT LISTENERS
const track_ui_listen_preview = track_display.querySelector('[name="track_ui_listen_preview"]');

const track_ui_presave = track_display.querySelector('[name="track_ui_presave"]');
const track_ui_spotify = track_display.querySelector('[name="track_ui_spotify"]');
const track_ui_youtube = track_display.querySelector('[name="track_ui_youtube"]');
const track_ui_soundcloud = track_display.querySelector('[name="track_ui_soundcloud"]');
const track_ui_other = track_display.querySelector('[name="track_ui_other"]');
const track_ui_download = track_display.querySelector('[name="track_ui_download"]');
const track_ui_content = track_display.querySelector('[name="track_ui_content"]')

var preview_id;
track_ui_listen_preview.addEventListener('click', () => {
    document.getElementById('preview_anything').querySelector('iframe').src = "https://drive.google.com/file/d/" + preview_id + "/preview";
    revealModal("preview_anything");
});

var presave_link;
track_ui_presave.addEventListener('click', () => {
    window.open(presave_link)
});

var spotify_link;
track_ui_spotify.addEventListener('click', () => {
    window.open(spotify_link)
});

var youtube_link;
track_ui_youtube.addEventListener('click', () => {
    window.open(youtube_link)
});

var soundcloud_link;
track_ui_soundcloud.addEventListener('click', () => {
    window.open(soundcloud_link)
});

var other_link;
track_ui_other.addEventListener('click', () => {
    customModal("Accès à un lien externe", `Êtes-vous sûr de vouloir être rediriger vers ${other_link}?`, "Annuler", () => {revealModal('custom_modal', true);}, "Oui", () => {window.open(other_link)})
    
});

var current_track;

track_ui_download.addEventListener('click', () => {
    // Download Track
    notify('', 'Veuillez patienter. Votre téléchargement va débuter.', 'center', 'top', 'neutral');
    fetch(fetchable_google_sheet + "?get=download_request&data=" + current_track[0])
        .then(res => res.json())
        .then(data => {
            const a_download = document.createElement('a');
            a_download.href = "https://drive.google.com/uc?export=download&id=" + data.download_id;
            a_download.download;
            a_download.click();
            a_download.remove();
            notify('Merci', 'Votre téléchargement va débuter.', 'center', 'top', 'good');
            customModal("Merci !", "Merci d'avoir télécharger l'instru.", "Accueil", () => {location.href = "/"}, "Revenir au registre", () => {revealModal('custom_modal', true);})
        })
        .catch(err => console.error(err));
    return;
    
    // customModal("Désolé", "La fonctionnalité de téléchargement est bientôt prête", "Ok", () => {revealModal('custom_modal', true); notify('', 'Merci de votre patience', 'center', 'top', 'good')}, "Mince, pourquoi?", () => {revealModal('custom_modal', true); notify('', 'Un peu de patience.', 'center', 'top', 'neutral')})
});

function loadTrack(index) {
    header_banner.classList.add('minim');

    const params = new URLSearchParams(window.location.search);
    const track = params.get("track");
    const data = song_data.tracks_data.filter(v => String(v[0]) === String(index))[0];
    current_track = data;

    if (data[20]) {
        track_ui_content.innerHTML = parseMarkdown(data[20], '\\n');
    } else {
        track_ui_content.innerHTML = '<br><em style="color: #AAA">Contenu manquant.</em>';
    }
    

    search_panel.style.display = "none";
    track_display.style.display = "block";
    logo_icon.style.display = "none";
    goBack_button.style.display = "block";

    const track_ui_coverart = track_display.querySelector('[name="track_ui_coverart"]');
    const track_ui_title = track_display.querySelector('[name="track_ui_title"]');
    const track_ui_album = track_display.querySelector('[name="track_ui_album"]');
    const track_ui_artists = track_display.querySelector('[name="track_ui_artists"]');

    const track_ui_current_state = track_display.querySelector('[name="track_ui_current_state"]');
    const track_ui_release_date = track_display.querySelector('[name="track_ui_release_date"]');
    const track_ui_genres = track_display.querySelector('[name="track_ui_genres"]');
    

    if (data[10] !== "") {
        track_ui_coverart.src = `https://drive.google.com/thumbnail?sz=w1920&id=${data[10]}`;
        track_ui_coverart.style.display = "block";
        track_display.querySelector('[name="track_ui_meta"]').style = "grid-column: 2/2";
    } else {
        track_ui_coverart.style.display = "none";
        track_display.querySelector('[name="track_ui_meta"]').style = "grid-column: 1/3";
    }
    // https://drive.google.com/uc?export=download&id=[YOUR_FILE_ID]

    // PREVIEW BUTTON
    if (data[14] !== "") {
        track_ui_listen_preview.style.display = "block";
        preview_id = data[14];
    } else {
        track_ui_listen_preview.style.display = "none";
    };

    if (data[15] !== "") {
        presave_link = data[15];
        track_ui_presave.style.display = "block";
    } else {
        track_ui_presave.style.display = "none";
    };

    // SPOTIFY BUTTON
    if (data[16] !== "") {
        spotify_link = data[16];
        track_ui_spotify.style.display = "block";
    } else {
        track_ui_spotify.style.display = "none";
    }

    // YOUTUBE BUTTON
    if (data[17] !== "") {
        youtube_link = data[17];
        track_ui_youtube.style.display = "block";
    } else {
        track_ui_youtube.style.display = "none";
    }

    // SOUNDCLOUD BUTTON
    if (data[18] !== "") {
        soundcloud_link = data[18];
        track_ui_soundcloud.style.display = "block";
    } else {
        track_ui_soundcloud.style.display = "none";
    }

    // OTHER BUTTON
    if (data[19] !== "") {
        other_link = data[19];
        track_ui_other.style.display = "block";
    } else {
        track_ui_other.style.display = "none";
    }

    // DOWNLOAD BUTTON
    if (String(data[13]) === "true" && (data[23] === "" || parseInt(data[23]) === 0)) {
        track_ui_download.style.display = "block";
    } else {
        track_ui_download.style.display = "none";
    }

    track_ui_title.textContent = data[1];
    track_ui_album.textContent = data[2];
    track_ui_artists.textContent = data[7];
    
    track_ui_current_state.textContent = data[6] + " - " + data[3];
    track_ui_release_date.textContent = "Date de sortie : " + new Date(data[4]).toLocaleDateString();
    track_ui_genres.innerHTML = data[8].split(', ').map(v => `<a class="capsule minim">${v}</a>`).join("");
}

function goBack() {
    header_banner.classList.remove('minim');
    updateURL("track");
    search_panel.style.display = "block";
    track_display.style.display = "none";
    logo_icon.style.display = "block";
    goBack_button.style.display = "none";
    loadTracksPanel();
}

// 0: (21) [6, 'Intrigue', 'Jadys', 'Removed', '2021-02-10T10:00:00.000Z', '2025-04-21T10:00:00.000Z', 'Soundtrack', 'Melide', 'Acoustic, Mix, Retro', '', '17XqVxwBKh0I0MT9JJxAGLSnxLNElWpEU', false, false, false, '', '', '', '', 0, 0, '']

function sortPannel(type = "date", index = 4, filter = "Trier...") {
    if (!!id_rules[index]) {
        document.getElementById(id_rules[index]).value = filter;
    }
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

const id_rules = {
    4: "time_filter",
    3: "state_filter",
    6: "type_filter"
}

function loadTracksPanel(index = 3, filter = "Trier...", type = "list") {
    search_argument[index] = filter;

    if (!!id_rules[index]) {
        document.getElementById(id_rules[index]).value = filter;
    }

    const track_container = document.getElementById('track_container');
    const range = song_data.tracks_data.slice(1);

    const search_results = range.reduce((acc, val, idx) => {
        const is_match = Object.entries(search_argument).every(([key, expected]) => {
            return expected === "Trier..." || String(val[key]).toLowerCase() === String(expected).toLowerCase();
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

        // PEUT ETRE ECOUTER SUR UNE PLATEFORME
        if (e[21] && e[22]) {
            const platform_button = document.createElement('div');
            platform_button.style = "display: grid; grid-template-columns: repeat(3, calc(100% / 3)); opacity: .7; gap: .25em"
            platform_button.innerHTML = `<p>${e[21]} <img style="opacity: 1; height: .6em" src="../assets/icons/vues.png"></p><p>${e[22]} <img style="opacity: 1; height: .8em" src="../assets/icons/download.png"></p>${e[23] !== "" ? '<p>' + (e[23] + ".00€" === "0.00€" ? "FREE" : e[23] + ".00€") + "</p>" : ""}`;
            action_div.appendChild(platform_button);
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