import { Metadata } from "/js/Metadata.js";
import { getRemainingTime } from "/js/Utils.js";

export class Track {
    constructor(project = {}, options = {}) {
        this.data = project && typeof project === "object" ? project : {};
        this.id = this.data.id;
        this.title = this.data.title || (this.data.metadata && this.data.metadata.title) || "";
        this.authors = Array.isArray(this.data.authors) ? this.data.authors : [];
        this.type = this.data.type || "track";
        this.creation_date = this.data.creation_date;
        this.released_date = this.data.released_date;
        this.state = this.data.state || "draft";
        this.metadataData = this.data.metadata && typeof this.data.metadata === "object" ? this.data.metadata : {};
        this.thumbnail = this.metadataData.thumbnail || "/assets/placeholder.webp";
        this.albumTrackCount = Array.isArray(this.data.album_tracks) ? this.data.album_tracks.length : 0;
        this.isExplicit = this.albumTrackCount
            ? this.data.album_tracks.some(track => track?.metadata?.explicit === true || track?.explicit === true)
            : this.metadataData.explicit === true || this.data.explicit === true;
        this.albumRenderer = options.albumRenderer || null;
        this.links = this.normalizeLinks(this.metadataData.links);
        this.track_card = null;
        this.track_element = null;
        this.metadata = new Metadata({
            ...this.data,
            title: this.title,
            authors: this.authors,
            links: this.links
        });
        this.releaseTimer = null;
    }

    normalizeLinks(links) {
        if (!Array.isArray(links)) return [];
        return links
            .map(link => {
                const value = typeof link === "string" ? { url: link } : { ...link };
                const markdown = String(value.url || "").match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (markdown) return { ...value, label: value.label || markdown[1], url: markdown[2] };
                return value;
            })
            .filter(link => link && typeof link.url === "string" && link.url.trim());
    }

    authorProfiles() {
        const availableAuthors = Array.isArray(window.authors) ? window.authors : [];
        return this.authors
            .map(authorId => availableAuthors.find(author => String(author.id) === String(authorId)))
            .filter(Boolean);
    }

    load(alert = "", from = null) {
        this.unload();
        const section = document.createElement("section");
        section.className = "ver";
        if (from) section.appendChild(this.createNavigation());

        if (alert) {
            const pill = document.createElement("span");
            pill.className = "pill";
            pill.textContent = alert;
            section.appendChild(pill);
        }

        const track = document.createElement("div");
        track.className = "track ver";
        const wrapper = document.createElement("div");
        wrapper.className = "ver";

        const image = document.createElement("img");
        image.src = this.thumbnail;
        image.alt = this.title;

        const content = document.createElement("div");
        content.className = "ver";
        const release = this.createReleaseDisplay();
        if (release) content.appendChild(release.element);

        const title = document.createElement("h2");
        title.textContent = this.title;
        content.appendChild(title);
        content.appendChild(this.createAuthorDisplay());
        content.appendChild(this.createLinkDisplay());

        wrapper.append(image, content);
        track.appendChild(wrapper);
        section.appendChild(track);
        const contentController = this.createContentController();
        if (contentController) section.appendChild(contentController);

        this.track_element = section;
        document.querySelector("header")?.after(section);
        return section;
    }

    createContentController() {
        const lyrics = this.metadataData.lyrics ?? this.data.lyrics;
        const contents = [];
        if (this.albumTrackCount) {
            contents.push({ label: "Morceaux", render: panel => this.renderAlbumTracks(panel) });
        }
        if (typeof lyrics === "string" && lyrics.trim()) {
            contents.push({ label: "Paroles", render: panel => this.renderLyrics(panel, lyrics) });
        }
        if (!contents.length && !this.albumRenderer) return null;

        const controller = document.createElement("section");
        controller.className = "content_controller ver";
        if (this.albumRenderer) {
            const albumLink = document.createElement("a");
            albumLink.className = "content_album_link";
            albumLink.href = "#";
            albumLink.textContent = `Depuis "${this.albumRenderer.title}"`;
            albumLink.addEventListener("click", event => {
                event.preventDefault();
                albumLink.dispatchEvent(new CustomEvent("project:open-content", {
                    bubbles: true,
                    detail: { renderer: this.albumRenderer }
                }));
            });
            controller.appendChild(albumLink);
        }

        if (!contents.length) return controller;
        const tabs = document.createElement("div");
        tabs.className = "content_tabs hor";
        tabs.setAttribute("role", "tablist");
        const panel = document.createElement("div");
        panel.className = "content_panel";

        contents.forEach((content, index) => {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.className = "content_tab";
            tab.textContent = content.label;
            tab.setAttribute("role", "tab");
            tab.setAttribute("aria-selected", String(index === 0));
            tab.addEventListener("click", () => {
                tabs.querySelectorAll("[role='tab']").forEach(item => item.setAttribute("aria-selected", "false"));
                tab.setAttribute("aria-selected", "true");
                content.render(panel);
            });
            tabs.appendChild(tab);
        });

        controller.append(tabs, panel);
        contents[0].render(panel);
        return controller;
    }

    renderLyrics(panel, lyrics) {
        const text = document.createElement("p");
        text.className = "track_lyrics";
        text.textContent = lyrics;
        panel.replaceChildren(text);
    }

    renderAlbumTracks(panel) {
        const list = document.createElement("ol");
        list.className = "album_tracks_list ver";
        this.data.album_tracks.forEach(track => {
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.className = "album_track hor";
            const url = new URL(window.location.href);
            url.search = "";
            url.searchParams.set("project", String(track.id));
            link.href = url;
            link.textContent = track.title || track.metadata?.title || "Untitled track";
            link.addEventListener("click", event => {
                event.preventDefault();
                const renderer = new Track(track, { albumRenderer: this });
                link.dispatchEvent(new CustomEvent("project:select", {
                    bubbles: true,
                    detail: { project: track, renderer }
                }));
            });
            item.appendChild(link);
            list.appendChild(item);
        });
        panel.replaceChildren(list);
    }

    createReleaseDisplay() {
        const releasedAt = new Date(this.released_date).getTime();
        if (!Number.isFinite(releasedAt) || releasedAt <= Date.now()) return null;

        const row = document.createElement("div");
        row.className = "hor align fill";
        const progress = document.createElement("div");
        progress.className = "progress";
        const remaining = document.createElement("span");
        remaining.className = "except";
        row.append(progress, remaining);

        const creationAt = new Date(this.creation_date).getTime();
        const update = () => {
            const time = getRemainingTime(this.released_date);
            if (!time) {
                row.remove();
                this.releaseTimer = null;
                return;
            }

            const total = Number.isFinite(creationAt) && releasedAt > creationAt ? releasedAt - creationAt : releasedAt - Date.now();
            const elapsed = Number.isFinite(creationAt) ? Date.now() - creationAt : 0;
            const percentage = Math.max(0, Math.min(100, (elapsed / total) * 100));
            progress.style.setProperty("--progress", `${percentage}%`);
            remaining.textContent = `${time.value} ${time.unit}${time.value > 1 ? "s" : ""}`;
            this.releaseTimer = window.setTimeout(update, Math.min(time.milliseconds, 60000));
        };

        update();
        return { element: row };
    }

    createAuthorDisplay() {
        const display = document.createElement("div");
        display.className = "hor pfp_display";
        this.authorProfiles().forEach(author => {
            const span = document.createElement("span");
            span.dataset.name = author.name || "Auteur";
            const image = document.createElement("img");
            image.src = author.thumbnail || "/assets/mld_logo_all_white.png";
            image.alt = author.name || "";
            span.appendChild(image);
            display.appendChild(span);
        });
        return display;
    }

    createLinkDisplay() {
        const actions = document.createElement("div");
        actions.className = "ver call_action align";
        this.links.forEach(link => {
            const service = this.linkService(link.url);
            const anchor = document.createElement("a");
            anchor.href = link.url;
            anchor.target = "_blank";
            anchor.rel = "noreferrer";
            const icon = document.createElement("i");
            icon.className = service.icon;
            const label = document.createElement("p");
            label.textContent = service.label || link.label || this.linkLabel(link.url) || "Lien";
            anchor.append(icon, label);
            actions.appendChild(anchor);
        });
        return actions;
    }

    linkService(url) {
        if (/youtube\.com|youtu\.be/i.test(url)) return { icon: "fa-brands fa-youtube", label: "YouTube" };
        if (/spotify\.com/i.test(url)) return { icon: "fa-brands fa-spotify", label: "Spotify" };
        if (/deezer\.com/i.test(url)) return { icon: "fa-brands fa-deezer", label: "Deezer" };
        if (/soundcloud\.com/i.test(url)) return { icon: "fa-brands fa-soundcloud", label: "SoundCloud" };
        return { icon: "fa-solid fa-arrow-up-right-from-square", label: "" };
    }

    linkLabel(url) {
        const match = String(url).match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return match ? match[1] : "";
    }

    createNavigation() {
        const button = document.createElement("button");
        button.className = "nav back";
        button.type = "button";
        button.textContent = "Retour";
        button.addEventListener("click", () => button.dispatchEvent(new CustomEvent("project:back", { bubbles: true, detail: { renderer: this } })));
        return button;
    }

    unload() {
        if (this.releaseTimer) window.clearTimeout(this.releaseTimer);
        this.releaseTimer = null;
        if (this.metadata) this.metadata.unload();
        if (this.track_element) this.track_element.remove();
        this.track_element = null;
    }

    processContents(child, map) {
        var arr = [];
        for (const text of map) {
            const child_element = document.createElement(child);

            if (text && text.endsWith(".webp")) {

                const img = document.createElement('img');
                img.src = text;
                child_element.appendChild(img);

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
                child_element.appendChild(a);

            } else if (/^\d{4}-\d{2}-\d{2}/.test(text)) {

                const d = new Date(text);
                const parse_date = (date) => `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, 0)}/${d.getFullYear()}`
                child_element.textContent = parse_date(d);

            } else {

                child_element.textContent = text;
                
            }
            arr.push(child_element);
        }
        return arr;
    }


    create(onSelect = null, element = "div") {
        
        const parent_element = document.createElement(element);
        parent_element.classList.add(this.albumTrackCount ? "album" : "track", "hor");

        const thumbnail = document.createElement("div");
        thumbnail.className = "track_thumbnail";
        thumbnail.setAttribute("role", "img");
        thumbnail.setAttribute("aria-label", this.title);
        thumbnail.style.backgroundImage = `url(${JSON.stringify(this.thumbnail)})`;
        parent_element.appendChild(thumbnail);

        const metadata = document.createElement("div");
        metadata.classList.add("ver");
        const title = document.createElement("div");
        title.classList = "hor align";
        const pfpDisplay = document.createElement("div");
        
        metadata.appendChild(title);
        if (this.albumTrackCount) {
            const trackCount = document.createElement("p");
            trackCount.textContent = `${this.albumTrackCount} ${this.albumTrackCount === 1 ? "track" : "tracks"}`;
            metadata.appendChild(trackCount);
        }
        metadata.appendChild(pfpDisplay);
        
        if (this.isExplicit) {
            const explicitTag = document.createElement("span");
            explicitTag.className = "explicit_tag";
            explicitTag.textContent = "E";
            title.appendChild(explicitTag);
        }
        const title_text = document.createElement('h2');
        title_text.textContent = this.title;
        title.appendChild(title_text);
        
        pfpDisplay.classList = "pfp_display hor";

        if (this.authors.length) {
            const pfps = this.authorProfiles().map(author => {
                const span = document.createElement("span");
                span.dataset.name = author.name;
                const img = document.createElement("img");
                img.src = author.thumbnail || "/assets/mld_logo_all_white.png";
                span.appendChild(img);
                return span;
            });
            pfpDisplay.append(...pfps);
        };
        
        parent_element.appendChild(metadata);
        this.track_card = parent_element;
        parent_element.addEventListener("click", () => {
            parent_element.dispatchEvent(new CustomEvent("project:select", { bubbles: true, detail: { project: this.data, renderer: this } }));
            if (typeof onSelect === "function") onSelect(this.data, this);
        });

        return parent_element;

    }
}
