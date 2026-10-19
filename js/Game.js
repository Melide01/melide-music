import { Hero } from "/js/Hero.js";
import { SuperPage } from "/js/SuperPage.js";
import { getRemainingTime } from "/js/Utils.js";

export class VideoGame {
    constructor(project = {}) {
        this.data = project && typeof project === "object" ? project : {};
        this.id = this.data.id;
        this.title = this.data.title || (this.data.metadata && this.data.metadata.title) || "";
        this.authors = Array.isArray(this.data.authors) ? this.data.authors : [];
        this.metadata = this.data.metadata && typeof this.data.metadata === "object" ? this.data.metadata : {};
        this.thumbnail = this.metadata.thumbnail || "/assets/placeholder.webp";
        this.description = this.metadata.description || "";
        this.links = this.normalizeLinks(this.metadata.links);
        this.released_date = this.data.released_date;
        this.creation_date = this.data.creation_date;
        this.game_card = null;
        this.element = null;
        this.hero = null;
        this.page = null;
        this.releaseTimer = null;
    }

    normalizeLinks(links) {
        if (!Array.isArray(links)) return [];
        return links.map(link => typeof link === "string" ? { url: link } : { ...link }).filter(link => link && typeof link.url === "string" && link.url.trim());
    }

    authorProfiles() {
        const availableAuthors = Array.isArray(window.authors) ? window.authors : [];
        return this.authors.map(id => availableAuthors.find(author => String(author.id) === String(id))).filter(Boolean);
    }

    create(onSelect = null, element = "div") {
        const card = document.createElement(element); card.className = "game hor";
        const image = document.createElement("img"); image.className = "game_icon"; image.src = this.thumbnail; image.alt = this.title;
        image.loading = "lazy";
        const content = document.createElement("div"); content.className = "ver";
        const title = document.createElement("h2"); title.textContent = this.title;
        const description = document.createElement("span"); description.textContent = this.description;
        content.append(title, description, this.createAuthorDisplay()); card.append(image, content);
        this.game_card = card;
        card.addEventListener("click", () => {
            card.dispatchEvent(new CustomEvent("project:select", { bubbles: true, detail: { project: this.data, renderer: this } }));
            if (typeof onSelect === "function") onSelect(this.data, this);
        });
        return card;
    }

    load(alert = "", from = null) {
        this.unload();
        const section = document.createElement("section"); section.className = "ver";
        if (from) section.appendChild(this.createNavigation());
        if (alert) { const pill = document.createElement("span"); pill.className = "pill"; pill.textContent = alert; section.appendChild(pill); }

        const game = document.createElement("div"); game.className = "game";
        const content = document.createElement("div"); content.className = "ver";
        const details = document.createElement("div"); details.className = "ver";

        const heroContainer = document.createElement("div"); heroContainer.className = "game_hero_container"; game.appendChild(heroContainer);
        
        const release = this.createReleaseDisplay(); if (release) details.appendChild(release);
        const title = document.createElement("h2"); title.textContent = this.title;
        const description = document.createElement("span"); description.textContent = this.description;
        details.append(title, description, this.createAuthorDisplay(), this.createLinkDisplay());
        content.appendChild(details); game.appendChild(content);
        section.appendChild(game);

        if (this.metadata.hero && typeof this.metadata.hero === "object") {
            const heroData = this.metadata.hero;
            this.hero = new Hero(heroContainer, heroData.class || "hero", heroData.objects || [], heroData.styles || []);
            this.hero.load();
        }
        if (this.metadata.page && typeof this.metadata.page === "object") {
            const pageContainer = document.createElement("div"); pageContainer.className = "game_page_container"; game.appendChild(pageContainer);
            const pageData = this.metadata.page;
            this.page = new SuperPage(pageContainer, pageData.class || "page", pageData.objects || pageData.children || [], pageData.styles || []);
            this.page.load();
        }
        
        this.element = section;
        document.querySelector("header")?.after(section);
        return section;
    }

    createReleaseDisplay() {
        const releasedAt = new Date(this.released_date).getTime(); if (!Number.isFinite(releasedAt) || releasedAt <= Date.now()) return null;
        const row = document.createElement("div"); row.className = "hor align fill";
        const progress = document.createElement("div"); progress.className = "progress"; const remaining = document.createElement("span"); remaining.className = "except"; row.append(progress, remaining);
        const creationAt = new Date(this.creation_date).getTime();
        const update = () => { const time = getRemainingTime(this.released_date); if (!time) { row.remove(); this.releaseTimer = null; return; } const total = Number.isFinite(creationAt) && releasedAt > creationAt ? releasedAt - creationAt : releasedAt - Date.now(); const elapsed = Number.isFinite(creationAt) ? Date.now() - creationAt : 0; progress.style.setProperty("--progress", `${Math.max(0, Math.min(100, elapsed / total * 100))}%`); remaining.textContent = `${time.value} ${time.unit}${time.value > 1 ? "s" : ""}`; this.releaseTimer = window.setTimeout(update, Math.min(time.milliseconds, 60000)); };
        update(); return row;
    }

    createNavigation() { const button = document.createElement("button"); button.className = "nav back"; button.type = "button"; button.textContent = "Retour"; button.addEventListener("click", () => button.dispatchEvent(new CustomEvent("project:back", { bubbles: true, detail: { renderer: this } }))); return button; }

    createAuthorDisplay() { const display = document.createElement("div"); display.className = "hor pfp_display"; this.authorProfiles().forEach(author => { const span = document.createElement("span"); span.dataset.name = author.name || "Auteur"; const image = document.createElement("img"); image.src = author.thumbnail || "/assets/mld_logo_all_white.png"; image.alt = author.name || ""; span.appendChild(image); display.appendChild(span); }); return display; }

    createLinkDisplay() { const actions = document.createElement("div"); actions.className = "ver call_action align"; this.links.forEach(link => { const service = this.linkService(link.url); const anchor = document.createElement("a"); anchor.href = link.url; anchor.target = "_blank"; anchor.rel = "noreferrer"; const icon = document.createElement("i"); icon.className = service.icon; const label = document.createElement("p"); label.textContent = link.label || service.label || "Lien"; anchor.append(icon, label); actions.appendChild(anchor); }); return actions; }

    linkService(url) {
        if (/store\.steampowered|steamcommunity/i.test(url)) return { icon: "fa-brands fa-steam", label: "Steam" };
        if (/itch\.io/i.test(url)) return { icon: "fa-solid fa-gamepad", label: "Itch.io" };
        if (/xbox\.com/i.test(url)) return { icon: "fa-brands fa-xbox", label: "Xbox" };
        if (/epicgames\.com/i.test(url)) return { icon: "fa-solid fa-gamepad", label: "Epic Games" };
        if (/microsoft\.com/i.test(url)) return { icon: "fa-brands fa-microsoft", label: "Microsoft" };
        if (/play\.google\.com/i.test(url)) return { icon: "fa-brands fa-google-play", label: "Google Play" };
        if (/apps\.apple\.com/i.test(url)) return { icon: "fa-brands fa-apple", label: "Apple Store" };
        return { icon: "fa-solid fa-arrow-up-right-from-square", label: "" };
    }

    unload() { if (this.releaseTimer) window.clearTimeout(this.releaseTimer); this.releaseTimer = null; if (this.hero) this.hero.unload(); if (this.page) this.page.unload(); if (this.element) this.element.remove(); this.hero = null; this.page = null; this.element = null; }
}

export { VideoGame as Game };
