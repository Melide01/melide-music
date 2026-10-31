import { parseMarkdown } from "/js/Markdown.js";

const PAGE_SOURCES = new Map([
    ["legal/mentions-legales.md", "/legal/mentions-legales.md"],
    ["mentions-legales.md", "/legal/mentions-legales.md"],
    ["legal_mentions", "/legal/mentions-legales.md"],
    ["legal/politique-protection-donnees.md", "/legal/politique-protection-donnees.md"],
    ["politique-protection-donnees.md", "/legal/politique-protection-donnees.md"],
    ["data_protection_policy", "/legal/politique-protection-donnees.md"],
    ["rgpd", "/legal/politique-protection-donnees.md"],
    ["legal/condition-d-utilisation.md", "/legal/condition-d-utilisation.md"],
    ["condition-d-utilisation.md", "/legal/condition-d-utilisation.md"],
    ["terms", "/legal/condition-d-utilisation.md"]
]);

function getPageSource(identifier) {
    const value = String(identifier || "").trim();
    const knownSource = PAGE_SOURCES.get(value);
    if (knownSource) return knownSource;

    const filename = value.startsWith("page/") ? value.slice("page/".length) : value;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.md$/.test(filename)) return null;
    return `/page/${encodeURIComponent(filename)}`;
}

export class Pages {
    constructor(container) {
        this.container = container;
        this.requestId = 0;
    }

    async load(identifier) {
        const requestId = ++this.requestId;
        const source = getPageSource(identifier);
        this.container.replaceChildren();
        this.container.classList.add("generated_page");
        if (!source) {
            this.showError("Page introuvable.");
            return;
        }

        try {
            const response = await fetch(source);
            if (!response.ok) throw new Error(`Page request failed (${response.status})`);
            const markdown = await response.text();
            if (requestId !== this.requestId) return;
            this.container.innerHTML = parseMarkdown(markdown);
        } catch (error) {
            if (requestId !== this.requestId) return;
            console.error("Could not load the requested page.", error);
            this.showError("Cette page est introuvable ou momentanément indisponible.");
        }
    }

    unload() {
        this.requestId++;
        this.container.classList.remove("generated_page");
        this.container.replaceChildren();
    }

    showError(message) {
        const heading = document.createElement("h1");
        heading.textContent = "Page indisponible";
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        this.container.replaceChildren(heading, paragraph);
    }
}
