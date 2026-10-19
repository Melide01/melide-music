// - also vibe coded
// needed to load the structure i had set from html
// and more feature such as congrats gif when projects got published

import { getRemainingTime, isPublishedRecently } from "/js/Utils.js";

export class Metadata {
    constructor(data = {}) {
        this.data = typeof data === "object" && data ? data : {};
        this.element = null;
        this.congratsElement = null;
        this.timer = null;
    }

    load() {
        this.unload();
        const data = this.data;
        const element = document.createElement("div");
        element.className = this.classNames(data.classes || data.class);
        element.dataset.metadata = "true";

        const tag = data.descriptive_tag || this.defaultTag(data.publication_date);
        if (tag) element.appendChild(this.textElement("span", tag, "metadata_tag"));
        if (data.title) element.appendChild(this.textElement("h2", data.title));
        const people = data.authors || data.artists || data.collaborators;
        if (Array.isArray(people) && people.length) element.appendChild(this.listElement("authors", people));
        if (data.description) element.appendChild(this.textElement("p", data.description));

        const dates = this.createDates(data, element);
        if (dates) element.appendChild(dates);
        const links = this.createLinks(data.links);
        if (links) element.appendChild(links);
        this.addRecentPublication(data.publication_date);

        this.element = element;
        this.startDateUpdates(data, element);
        return element;
    }

    unload() {
        if (this.timer) window.clearTimeout(this.timer);
        this.timer = null;
        this.element?.remove();
        this.congratsElement?.remove();
        this.element = null;
        this.congratsElement = null;
    }

    classNames(value) {
        const values = Array.isArray(value) ? value : [value];
        return ["metadata", ...values.filter(item => typeof item === "string" && item.trim())].join(" ");
    }

    defaultTag(publicationDate) {
        if (!publicationDate) return "";
        return getRemainingTime(publicationDate) ? "Prochaine sortie" : "Dernière sortie";
    }

    textElement(tag, value, className = "") {
        const element = document.createElement(tag);
        element.textContent = String(value);
        if (className) element.className = className;
        return element;
    }

    listElement(className, values) {
        return this.textElement("span", values.map(value => String(value)).join(", "), className);
    }

    createDates(data, parent) {
        if (!data.creation_date && !data.publication_date) return null;
        const dates = document.createElement("div");
        dates.className = "metadata_dates";
        if (data.creation_date) dates.appendChild(this.textElement("time", `Créé le ${this.formatDate(data.creation_date)}`));
        const publication = this.textElement("time", "", "metadata_publication_date");
        if (data.publication_date) {
            publication.dateTime = data.publication_date;
            publication.dataset.publicationDate = data.publication_date;
        }
        dates.appendChild(publication);
        this.updatePublication(publication, data.publication_date);
        return dates;
    }

    formatDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
    }

    updatePublication(element, date) {
        if (!date) return;
        const remaining = getRemainingTime(date);
        element.textContent = remaining
            ? `Publication dans ${remaining.value} ${remaining.unit}${remaining.value > 1 ? "s" : ""}`
            : `Publié le ${this.formatDate(date)}`;
    }

    startDateUpdates(data, element) {
        if (!data.publication_date) return;
        const publication = element.querySelector(".metadata_publication_date");
        const tick = () => {
            this.updatePublication(publication, data.publication_date);
            const remaining = getRemainingTime(data.publication_date);
            if (remaining) {
                this.timer = window.setTimeout(tick, Math.max(1000, remaining.milliseconds % (remaining.unit === "day" ? 86400000 : remaining.unit === "hour" ? 3600000 : remaining.unit === "minute" ? 60000 : 1000)));
            } else {
                this.addRecentPublication(data.publication_date);
            }
        };
        this.timer = window.setTimeout(tick, 1000);
    }

    createLinks(links) {
        if (!Array.isArray(links) || !links.length) return null;
        const wrapper = document.createElement("div");
        wrapper.className = "metadata_links";
        links.forEach(link => {
            if (!link || typeof link.url !== "string") return;
            const anchor = document.createElement("a");
            anchor.href = link.url;
            anchor.dataset.linkType = typeof link.type === "string" ? link.type : "link";
            anchor.textContent = typeof link.label === "string" ? link.label : anchor.dataset.linkType;
            wrapper.appendChild(anchor);
        });
        return wrapper.childElementCount ? wrapper : null;
    }

    addRecentPublication(date) {
        if (this.data.prevent_congrats || !isPublishedRecently(date) || this.congratsElement) return;
        const confetti = document.createElement("img");
        confetti.src = "/assets/confettis.gif";
        confetti.className = "overlay super";
        confetti.alt = "";
        document.body.appendChild(confetti);
        this.congratsElement = confetti;
    }
}