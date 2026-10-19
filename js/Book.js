import { getRemainingTime } from "/js/Utils.js";

export class Book {
    constructor(project = {}) {
        this.data = project && typeof project === "object" ? project : {};
        this.id = this.data.id;
        this.title = this.data.title || (this.data.metadata && this.data.metadata.title) || "";
        this.authors = Array.isArray(this.data.authors) ? this.data.authors : [];
        this.type = this.data.type || "book";
        this.creation_date = this.data.creation_date;
        this.released_date = this.data.released_date;
        this.state = this.data.state || "draft";
        this.metadataData = this.data.metadata && typeof this.data.metadata === "object" ? this.data.metadata : {};
        this.thumbnail = this.metadataData.thumbnail || "/assets/placeholder.webp";
        this.description = this.metadataData.description || "";
        this.links = this.normalizeLinks(this.metadataData.links);
        this.book_card = null;
        this.book_element = null;
        this.releaseTimer = null;
    }

    normalizeLinks(links) {
        if (!Array.isArray(links)) return [];
        return links.map(link => {
            const value = typeof link === "string" ? { url: link } : { ...link };
            const markdown = String(value.url || "").match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            return markdown ? { ...value, label: value.label || markdown[1], url: markdown[2] } : value;
        }).filter(link => link && typeof link.url === "string" && link.url.trim());
    }

    authorProfiles() {
        const availableAuthors = Array.isArray(window.authors) ? window.authors : [];
        return this.authors.map(id => availableAuthors.find(author => String(author.id) === String(id))).filter(Boolean);
    }

    load(alert = "", from = null) {
        this.unload();
        const section = document.createElement("section");
        section.className = "ver";
        if (from) section.appendChild(this.createNavigation());
        if (alert) { const pill = document.createElement("span"); pill.className = "pill"; pill.textContent = alert; section.appendChild(pill); }

        const book = document.createElement("div"); book.className = "book ver";
        const wrapper = document.createElement("div"); wrapper.className = "ver";
        const image = document.createElement("img"); image.src = this.thumbnail; image.alt = this.title;
        const content = document.createElement("div"); content.className = "ver";
        const release = this.createReleaseDisplay(); if (release) content.appendChild(release);
        const title = document.createElement("h2"); title.textContent = this.title;
        const description = document.createElement("span"); description.textContent = this.description;
        content.append(title, this.createAuthorDisplay(), description, this.createLinkDisplay());
        wrapper.append(image, content);
        book.appendChild(wrapper);
        section.appendChild(book);
        this.book_element = section;
        document.querySelector("header")?.after(section);
        return section;
    }

    createReleaseDisplay() {
        const releasedAt = new Date(this.released_date).getTime();
        if (!Number.isFinite(releasedAt) || releasedAt <= Date.now()) return null;
        const row = document.createElement("div"); row.className = "hor align fill";
        const progress = document.createElement("div"); progress.className = "progress";
        const remaining = document.createElement("span"); remaining.className = "except"; row.append(progress, remaining);
        const creationAt = new Date(this.creation_date).getTime();
        const update = () => {
            const time = getRemainingTime(this.released_date);
            if (!time) { row.remove(); this.releaseTimer = null; return; }
            const total = Number.isFinite(creationAt) && releasedAt > creationAt ? releasedAt - creationAt : releasedAt - Date.now();
            const elapsed = Number.isFinite(creationAt) ? Date.now() - creationAt : 0;
            progress.style.setProperty("--progress", `${Math.max(0, Math.min(100, elapsed / total * 100))}%`);
            remaining.textContent = `${time.value} ${time.unit}${time.value > 1 ? "s" : ""}`;
            this.releaseTimer = window.setTimeout(update, Math.min(time.milliseconds, 60000));
        };
        update();
        return row;
    }

    createNavigation() { const button = document.createElement("button"); button.className = "nav back"; button.type = "button"; button.textContent = "Retour"; button.addEventListener("click", () => button.dispatchEvent(new CustomEvent("project:back", { bubbles: true, detail: { renderer: this } }))); return button; }

    createAuthorDisplay() {
        const display = document.createElement("div"); display.className = "hor pfp_display";
        this.authorProfiles().forEach(author => { const span = document.createElement("span"); span.dataset.name = author.name || "Auteur"; const image = document.createElement("img"); image.src = author.thumbnail || "/assets/mld_logo_all_white.png"; image.alt = author.name || ""; span.appendChild(image); display.appendChild(span); });
        return display;
    }

    createLinkDisplay() {
        const actions = document.createElement("div"); actions.className = "ver call_action align";
        this.links.forEach(link => { const service = this.linkService(link.url); const anchor = document.createElement("a"); anchor.href = link.url; anchor.target = "_blank"; anchor.rel = "noreferrer"; const icon = document.createElement("i"); icon.className = service.icon; const label = document.createElement("p"); label.textContent = link.label || service.label || "Lien"; anchor.append(icon, label); actions.appendChild(anchor); });
        return actions;
    }

    linkService(url) {
        if (/books\.google|google\.com\/books/i.test(url)) return { icon: "fa-brands fa-google", label: "Google Books" };
        if (/amazon\./i.test(url)) return { icon: "fa-brands fa-amazon", label: "Amazon" };
        if (/apple\.com|books\.apple/i.test(url)) return { icon: "fa-brands fa-apple", label: "Apple Books" };
        return { icon: "fa-solid fa-arrow-up-right-from-square", label: "" };
    }

    create(onSelect = null, element = "div") {
        const card = document.createElement(element); card.className = "book hor";
        const image = document.createElement("img"); image.src = this.thumbnail; image.alt = this.title;
        image.loading = "lazy";
        const content = document.createElement("div"); content.className = "ver";
        const title = document.createElement("h2"); title.textContent = this.title;
        const description = document.createElement("span"); description.textContent = this.description;
        content.append(title, description, this.createAuthorDisplay());
        card.append(image, content);
        this.book_card = card;
        card.addEventListener("click", () => {
            card.dispatchEvent(new CustomEvent("project:select", { bubbles: true, detail: { project: this.data, renderer: this } }));
            if (typeof onSelect === "function") onSelect(this.data, this);
        });
        return card;
    }

    unload() {
        if (this.releaseTimer) window.clearTimeout(this.releaseTimer);
        this.releaseTimer = null;
        if (this.book_element) this.book_element.remove();
        this.book_element = null;
    }
}
