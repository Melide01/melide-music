import { ProjectContainer } from '/js/ProjectContainer.js';

const API_URL = "https://api.melide.music";
const merchDemoDatas = [
    {
        id: "hoodie-winter-pain-1",
        type: "merch",
        title: "WINTER PAIN 1",
        creation_date: "2026-08-15",
        released_date: "2026-08-20",
        state: "published",
        metadata: {
            thumbnail: "/assets/unisex-organic-oversized-raddler-2.0-sweatshirt-white-front-6abc4fc9f052a.jpg",
            visuals: ["/assets/unisex-organic-oversized-raddler-2.0-sweatshirt-white-product-details-6abc4fc9f0e85.jpg", "/assets/unisex-organic-oversized-raddler-2.0-sweatshirt-white-front-6abc4fc9f052a.jpg"],
            price: 28,
            available_variants: {
                Noir: ["S", "M", "L", "XL"],
                Blanc: ["S", "M", "L"]
            },
            is_full_cotton: true,
            is_best_seller: true,
            is_artist_pinned: true
        }
    },
    {
        id: "demo-hoodie-light",
        type: "merch",
        title: "Melide Winter Hoodie",
        creation_date: "2026-08-25",
        released_date: "2099-01-15",
        state: "published",
        metadata: {
            thumbnail: "/assets/placeholder.webp",
            visuals: ["/assets/placeholder.webp"],
            price: 64,
            available_variants: [
                { color: "Vert forêt", sizes: ["M", "L", "XL"] },
                { color: "Écru", sizes: ["S", "M", "L"] }
            ],
            is_full_cotton: true,
            is_new: true
        }
    }
];

const projectContainerElement = document.getElementById("projectContainer");
const homeElement = document.getElementById("home");
const homeButton = document.getElementById("home_button");
const projectsButton = document.getElementById("projects_button");
const merchButton = document.getElementById("merch_button");
let projectContainer;
let merchContainer;
let projectsLoading;
let merchLoading;

document.addEventListener('DOMContentLoaded', async () => {
    homeButton?.addEventListener("click", event => {
        event.preventDefault();
        showHome();
    });
    projectsButton?.addEventListener("click", async event => {
        event.preventDefault();
        await showProjects();
    });
    merchButton?.addEventListener("click", async event => {
        event.preventDefault();
        await showMerch();
    });

    const params = new URLSearchParams(window.location.search);
    if (params.has("merch")) {
        await showMerch(false);
    } else if (hasProjectRoute() || params.has("search")) {
        await showProjects(false);
    }
});

async function ensureProjectContainer() {
    if (projectContainer) return projectContainer;
    if (projectsLoading) return projectsLoading;

    projectsLoading = (async () => {
        projectContainer = new ProjectContainer(
            projectContainerElement,
            [],
            {}
        );
        projectContainer.create();

        const [projectResponse, authorResponse] = await Promise.all([
            fetch(API_URL + "/public/projects"),
            fetch(API_URL + "/public/authors")
        ]);
        const projectData = await projectResponse.json();
        window.projects = projectData;
        window.authors = await authorResponse.json();
        projectContainer.setDatas(projectData);
        return projectContainer;
    })();

    try {
        return await projectsLoading;
    } finally {
        projectsLoading = null;
    }
}

async function ensureMerchContainer() {
    if (merchContainer) return merchContainer;
    if (merchLoading) return merchLoading;

    merchLoading = Promise.resolve().then(() => {
        merchContainer = new ProjectContainer(projectContainerElement, merchDemoDatas, { type: "merch" });
        merchContainer.create();
        merchContainer.setDatas(merchDemoDatas);
        return merchContainer;
    });

    try {
        return await merchLoading;
    } finally {
        merchLoading = null;
    }
}

let activeRenderer = null;

function hasProjectRoute() {
    return ["project", "book", "track", "game"].some(name => new URLSearchParams(window.location.search).has(name));
}

function hasMerchRoute() {
    return new URLSearchParams(window.location.search).has("merch");
}

function navigationUrl(view = "home") {
    const url = new URL(window.location);
    ["project", "book", "track", "game", "merch", "from", "search", "type", "order"].forEach(name => url.searchParams.delete(name));
    if (view === "projects") url.searchParams.set("search", "");
    if (view === "merch") url.searchParams.set("merch", "");
    return url;
}

async function showProjects(addHistory = true) {
    if (addHistory) {
        window.history.pushState({ view: "container" }, "", navigationUrl("projects"));
    }
    activeRenderer?.unload?.();
    activeRenderer = null;
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed");
    await ensureProjectContainer();
    showUrlProject();
}

async function showMerch(addHistory = true) {
    if (addHistory) {
        window.history.pushState({ view: "merch" }, "", navigationUrl("merch"));
    }
    activeRenderer?.unload?.();
    activeRenderer = null;
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed");
    await ensureMerchContainer();
    showUrlMerch();
}

function showHome(addHistory = true) {
    if (addHistory) {
        window.history.pushState({ view: "home" }, "", navigationUrl("home"));
    }
    activeRenderer?.unload?.();
    activeRenderer = null;
    projectContainerElement.classList.add("closed");
    homeElement?.classList.remove("closed");
}

function projectUrl(renderer, fromSearch = false) {
    const url = new URL(window.location);
    url.search = "";
    url.searchParams.set("project", renderer.id);
    if (fromSearch) {
        const current = new URLSearchParams(window.location.search);
        ["search", "type", "order"].forEach(name => {
            const value = current.get(name);
            if (value !== null) url.searchParams.set(name, value);
        });
        url.searchParams.set("from", "search");
    }
    return url;
}

function showProject(renderer, addHistory = true, fromSearch = false) {
    if (!renderer) return;
    activeRenderer?.unload?.();
    activeRenderer = renderer;
    if (addHistory) {
        window.history.pushState({
            view: "project",
            projectId: renderer.id,
            projectIndex: projectContainer?.datas.indexOf(renderer.data),
            fromSearch
        }, "", projectUrl(renderer, fromSearch));
    }
    projectContainerElement.classList.add("closed");
    renderer.load("", fromSearch ? projectContainerElement : null);
}

function showProjectContainer(addHistory = true) {
    const url = new URL(window.location);
    ["project", "book", "track", "game", "merch", "from"].forEach(name => url.searchParams.delete(name));
    if (addHistory) {
        window.history.pushState({ view: "container" }, "", url);
    }
    activeRenderer?.unload?.();
    activeRenderer = null;
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed");
}

function findProjectFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const selectors = [["project", null], ["book", "book"], ["track", "track"], ["game", "game"]];
    for (const [name, type] of selectors) {
        const id = params.get(name);
        if (id === null) continue;
        return projectContainer.datas.find(project => {
            if (String(project?.id) !== String(id)) return false;
            if (!type) return true;
            const projectType = String(project?.type || "").toLowerCase();
            return type === "game" ? ["game", "videogame", "video_game"].includes(projectType) : projectType === type;
        }) || null;
    }
    return undefined;
}

function showUrlProject() {
    const params = new URLSearchParams(window.location.search);
    if (!["project", "book", "track", "game"].some(name => params.has(name))) return;

    const project = findProjectFromUrl();
    if (!project) {
        projectContainerElement.classList.add("closed");
        const error = document.createElement("section");
        error.className = "ver align";
        error.innerHTML = "<h2>Projet introuvable</h2>";
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Retour à l'accueil";
        button.addEventListener("click", () => {
            window.history.pushState({ view: "container" }, "", "/");
            error.remove();
            showProjectContainer(false);
        });
        error.appendChild(button);
        projectContainerElement.after(error);
        return;
    }

    const renderer = projectContainer.createRenderer(project);
    showProject(renderer, false, params.get("from") === "search");
}

function findMerchFromUrl() {
    const id = new URLSearchParams(window.location.search).get("merch");
    return merchContainer?.datas.find(item => String(item.id) === String(id)) || null;
}

function showUrlMerch() {
    if (!hasMerchRoute()) return;
    const merch = findMerchFromUrl();
    if (!merch) return;
    showProject(merchContainer.createRenderer(merch), false, true);
}

document.addEventListener("project:select", event => {
    const renderer = event.detail?.renderer;
    if (renderer?.type === "merch") {
        const url = new URL(window.location);
        url.search = "";
        url.searchParams.set("merch", String(renderer.id));
        window.history.pushState({ view: "merch", merchId: String(renderer.id) }, "", url);
        showProject(renderer, false, true);
        return;
    }
    showProject(renderer, true, true);
});

document.addEventListener("project:open-content", event => {
    showProject(event.detail?.renderer, false, true);
});

document.addEventListener("project:back", event => {
    showProjectContainer();
});

window.addEventListener("popstate", event => {
    const params = new URLSearchParams(window.location.search);
    if (hasMerchRoute()) {
        showMerch(false);
        return;
    }
    if (hasProjectRoute() || params.has("search")) {
        showProjects(false);
        return;
    }
    showHome(false);
});

var userLang = "";
var localFile;
window.userLang = userLang;
window.localFile = localFile;

const TRACKS_FETCH = "https://tracks.melide-s-account.workers.dev/tracks";
const IMG_URL_FETCH = "https://img.melide.music/";

window.TRACKS_FETCH = TRACKS_FETCH;
window.IMG_URL_FETCH = IMG_URL_FETCH;
