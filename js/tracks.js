export function create_track(track) {
    const map = ["coverArt", "trackArtists", "trackName", ["youtubeLink", "spotifyLink", "soundCloudLink", "preSaveLink", "deezerLink"]]
    const tr_element = document.createElement('tr');

    const process_content = (parent, text) => {

        if (text && text.endsWith(".webp")) {

            const img = document.createElement('img');
            img.src = img_url_fetch + text;
            parent.appendChild(img);

        } else if (text && text.startsWith("https://")) {

            const icon_map = {
                "open.spotify": "fa-brands fa-spotify",
                "soundcloud": "fa-brands fa-soundcloud"
            }

            const a = document.createElement('a');
            const i = document.createElement('i');
            for (const icon of Object.keys(icon_map)) if (text.startsWith("https://" + icon)) i.classList = icon_map[icon];
            a.appendChild(i);
            a.href = text;
            parent.appendChild(a);

        } else if (/^\d{4}-\d{2}-\d{2}/.test(text)) {

            const d = new Date(text);
            const parse_date = (date) => `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, 0)}/${d.getFullYear()}`
            parent.textContent = parse_date(d);

        } else {

            parent.textContent = text;

        }
    }

    for (const m of map) {
        const td_element = document.createElement('td');

        if (typeof m === "object") {
            for (let t of m) {
                if (track[t]) process_content(td_element, track[t]);
            }
        } else {
            if (track[m]) process_content(td_element, track[m]);
        }

        tr_element.appendChild(td_element);
    }

    return tr_element;
}