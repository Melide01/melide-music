import { ProjectContainer } from '/js/ProjectContainer.js';
import { Cart, createCheckout, getOrderStatus, getUserOrders } from '/js/Cart.js';
import { Pages } from '/js/Pages.js';
import { Notification } from '/js/Notification.js';
import { createAuthorProjectEditor, translateAuthorError } from '/js/AuthorProjectEditor.js';
import { createAuthorNewsEditor } from '/js/AuthorNewsEditor.js';
import { NewsContainer, renderNewsArticle } from '/js/News.js';
import { initializeCustomIcons } from '/js/Icons.js';
import { Modal } from '/js/Modal.js';

const API_URL = "https://api.melide.music";

const projectContainerElement = document.getElementById("projectContainer");
const homeElement = document.getElementById("home");
const homeContent = homeElement?.innerHTML || "";
const pages = new Pages(homeElement);
const homeButton = document.getElementById("home_button");
const projectsButton = document.getElementById("projects_button");
const merchButtons = document.querySelectorAll("#merch_button, #footer_merch_button");
const cartButton = document.getElementById("cart_button");
const authorButton = document.getElementById("author_button");
const connectButton = document.getElementById("connect_button");
const accessButton = document.getElementById("access_button");
const footerElement = document.querySelector("footer");
const cart = new Cart();
const notification = new Notification();
const logoutButton = document.getElementById("logout_button");
let projectContainer;
let merchContainer;
let projectsLoading;
let merchLoading;
let cartPage;
let authorPage;
let newsContainer;
let newsArticles = null;
let newsLoading = null;
let loggedOut = false;
let authRequestId = 0;
let viewRequestId = 0;
let cartAddInProgress = false;
let authorBindingInProgress = false;

function redirectToConnect() {
    const returnUrl = new URL(window.location.href);
    window.location.assign(`${API_URL}/user/whoami?redirect_url=${encodeURIComponent(returnUrl.href)}`);
}

document.addEventListener('DOMContentLoaded', async () => {
    setDocumentTitle("Accueil");
    initializeCustomIcons();
    homeButton?.addEventListener("click", event => {
        event.preventDefault();
        showHome();
    });
    projectsButton?.addEventListener("click", async event => {
        event.preventDefault();
        await showProjects();
    });
    merchButtons.forEach(button => {
        button.addEventListener("click", async event => {
            event.preventDefault();
            await showMerch();
        });
    });
    document.getElementById("footer_news_button")?.addEventListener("click", event => {
        event.preventDefault();
        showNews();
    });
    cartButton?.addEventListener("click", async event => {
        event.preventDefault();
        await showCartPage();
    });
    authorButton?.addEventListener("click", async event => {
        event.preventDefault();
        await showAuthorPanel();
    });
    document.querySelectorAll("#footer_apps a[data-app]").forEach(link => {
        link.addEventListener("click", async event => {
            event.preventDefault();
            await showAuthorPanel();
            const subsection = link.dataset.app;
            const author = (window.authors || [])[0];
            if (author && (subsection === "projects" || (subsection === "articles" && author.newsWriter))) {
                await showAuthorSubsection(author, subsection);
            }
        });
    });
    connectButton?.addEventListener("click", event => {
        event.preventDefault();
        redirectToConnect();
    });
    accessButton?.addEventListener("click", async () => {
        if (authorBindingInProgress) return;
        authorBindingInProgress = true;
        accessButton.disabled = true;
        try {
            const response = await fetch(`${API_URL}/user/authors/bind`, {
                method: "POST",
                credentials: "include",
                cache: "no-store",
                redirect: "manual"
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Impossible d’associer votre compte à un auteur.");
            if (!Array.isArray(result.authors)) throw new Error("Réponse invalide du serveur.");
            if (result.authors.length === 0) {
                notification.show("Aucun auteur ne correspond à l’adresse de votre compte connecté.", "validation");
                return;
            }
            notification.show("Accès auteur activé.", "success");
            await updateAuthButtons();
        } catch (error) {
            notification.show(error.message || "Impossible d’associer votre compte à un auteur.", "error");
        } finally {
            authorBindingInProgress = false;
            accessButton.disabled = false;
        }
    });
    logoutButton?.addEventListener("click", () => {
        loggedOut = true;
        footerElement?.classList.add("load");
        clearCachedViews();
        showHome(false);
        window.history.replaceState({ view: "home" }, "", navigationUrl("home"));

        const logoutFrame = document.createElement("iframe");
        logoutFrame.hidden = true;
        logoutFrame.title = "Cloudflare Access logout";
        let logoutFinished = false;
        const finishLogout = async () => {
            if (logoutFinished) return;
            logoutFinished = true;
            logoutFrame.remove();
            await updateAuthButtons();
            footerElement?.classList.remove("load");
        };
        logoutFrame.addEventListener("load", finishLogout, { once: true });
        logoutFrame.addEventListener("error", finishLogout, { once: true });
        logoutFrame.src = `${API_URL}/cdn-cgi/access/logout`;
        document.body.appendChild(logoutFrame);
    });
    document.addEventListener("click", event => {
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const destination = new URL(link.href, window.location.href);
        if (destination.origin !== window.location.origin || !destination.searchParams.has("page")) return;
        event.preventDefault();
        showPage(destination.searchParams.get("page"));
    });
    window.addEventListener("cart:add", async event => {
        if (cartAddInProgress) return;
        cartAddInProgress = true;
        try {
            const response = await fetch(`${API_URL}/user/whoami`, {
                credentials: "include",
                cache: "no-store",
                redirect: "manual"
            });
            if (!response.ok) {
                redirectToConnect();
                return;
            }
            const variantId = Number(event.detail?.variantId);
            const product = merchContainer?.datas.find(item =>
                item.variants?.some(variant => Number(variant.id) === variantId)
            );
            if (product?.metadata?.allow_multiple !== true) {
                const sameProduct = cart.items.find(item => merchContainer?.datas.some(candidate =>
                    candidate.id === product?.id &&
                    candidate.variants?.some(variant => Number(variant.id) === item.variantId)
                ));
                if (sameProduct) {
                    notification.show("Cet article est limité à un exemplaire par commande.", "validation");
                    return;
                }
            }
            cart.add(variantId, product?.metadata?.allow_multiple === true ? event.detail?.quantity : 1);
            connectButton.hidden = true;
            logoutButton.hidden = false;
            cartButton.hidden = false;
            notification.show("Article ajouté au panier.", "success");
        } catch (error) {
            notification.show(error.message || "Impossible de vérifier votre connexion ou d'ajouter cet article.", "fatal");
        } finally {
            cartAddInProgress = false;
        }
    });
    window.addEventListener("merch:free-download", async event => {
        if (cartAddInProgress) return;
        cartAddInProgress = true;
        try {
            const response = await fetch(`${API_URL}/user/whoami`, {
                credentials: "include",
                cache: "no-store",
                redirect: "manual"
            });
            if (!response.ok) {
                redirectToConnect();
                return;
            }
            connectButton.hidden = true;
            logoutButton.hidden = false;
            cartButton.hidden = false;
            if (cart.count() > 0) {
                const content = document.createElement("p");
                content.textContent = "Le panier va être réinitialisé, voulez-vous continuer ?";
                const modal = new Modal({ title: "Téléchargement", content });
                modal.dialog.querySelector(".site_modal_close")?.remove();
                let confirmed = false;
                const result = new Promise(resolve => {
                    modal.dialog.addEventListener("close", () => resolve(confirmed), { once: true });
                });
                const actions = document.createElement("div");
                actions.className = "hor";
                const ok = document.createElement("button");
                ok.type = "button";
                ok.textContent = "Ok";
                ok.addEventListener("click", () => {
                    confirmed = true;
                    modal.close();
                });
                const cancel = document.createElement("button");
                cancel.type = "button";
                cancel.textContent = "Annuler";
                cancel.addEventListener("click", () => modal.close());
                actions.append(ok, cancel);
                modal.dialog.querySelector(".site_modal_content")?.append(actions);
                modal.open();
                if (!await result) return;
                cart.clear();
            }
            await createCheckout([{
                merch_variant_id: Number(event.detail?.variantId),
                quantity: 1
            }]);
        } catch (error) {
            notification.show(error.message || "Impossible de démarrer le téléchargement gratuit.", "error");
        } finally {
            cartAddInProgress = false;
        }
    });
    window.addEventListener("notification", event => {
        const { message, status = "success" } = event.detail || {};
        if (message) notification.show(message, status);
    });
    window.addEventListener("cart:change", updateCartCount);
    window.addEventListener("merch:orders", event => showMyOrdersPage(true, event.detail?.merchId));
    updateCartCount();
    updateAuthButtons();

    const params = new URLSearchParams(window.location.search);
    if (params.has("page")) {
        await showPage(params.get("page"), false);
    } else if (params.has("article")) {
        const articleSlug = params.get("article");
        if (!articleSlug) await showNews(false);
        else if (/^\d+$/.test(articleSlug)) await showArticleEditor(articleSlug, false);
        else await showNewsArticle(articleSlug, false);
    } else if (params.has("news")) {
        await showNews(false);
    } else if (params.has("order_success")) {
        await showOrderStatus(params.get("order_success"), { addHistory: false, fromOrders: false });
    } else if (params.has("order")) {
        await showOrderStatus(params.get("order"), { addHistory: false, fromOrders: true });
    } else if (params.has("author")) {
        await showAuthorPanel(false);
    } else if (params.has("orders")) {
        const orderId = params.get("orders");
        if (orderId && /^\d+$/.test(orderId)) {
            await showOrderStatus(orderId, { addHistory: false, fromOrders: true });
        } else {
            await showMyOrdersPage(false);
        }
    } else if (params.has("cart") || params.has("order_cancel")) {
        await showCartPage(false, params.has("order_cancel") ? "Le paiement a été annulé. Votre panier est conservé." : "");
    } else if (params.has("merch")) {
        await showMerch(false);
    } else if (hasProjectRoute() || params.has("search")) {
        await showProjects(false);
    }
});

async function ensureProjectContainer() {
    if (projectsLoading) return projectsLoading;
    if (projectContainer) return projectContainer;

    projectsLoading = (async () => {
        merchContainer?.renderers.forEach(renderer => renderer.unload?.());
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
        projectContainer.datas = Array.isArray(projectData) ? projectData : [];
        projectContainer.filteredDatas = [...projectContainer.datas];
        return projectContainer;
    })();

    try {
        return await projectsLoading;
    } finally {
        projectsLoading = null;
    }
}

async function ensureMerchContainer(refresh = false) {
    if (merchContainer && !refresh) return merchContainer;
    if (merchLoading) return merchLoading;

    merchLoading = (async () => {
        projectContainer?.renderers.forEach(renderer => renderer.unload?.());
        if (!merchContainer) {
            merchContainer = new ProjectContainer(projectContainerElement, [], { type: "merch" });
        } else {
            merchContainer.renderers.forEach(renderer => renderer.unload?.());
            merchContainer.datas = [];
            merchContainer.filteredDatas = [];
        }
        merchContainer.create();
        addMerchFeaturedSkeleton();
        const response = await fetch(`${API_URL}/public/merch`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Merch API returned ${response.status}`);
        const merchData = await response.json();
        if (!Array.isArray(merchData)) throw new Error("Merch API returned an invalid product list.");
        merchAllDatas = merchData;
        applyMerchSection();
        return merchContainer;
    })();

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

function setDocumentTitle(title, branded = true) {
    const value = String(title || "").trim();
    document.title = value ? branded ? `Melide - ${value}` : value : "Melide";
}

function navigationUrl(view = "home") {
    const url = new URL(window.location);
    ["project", "book", "track", "game", "merch", "cart", "orders", "author", "page", "article", "news", "article_search", "article_category", "article_tag", "article_order", "news_search", "news_category", "news_tag", "news_order", "order_success", "order_cancel", "from", "search", "type", "order"].forEach(name => url.searchParams.delete(name));
    if (view === "projects") url.searchParams.set("search", "");
    if (view === "merch") url.searchParams.set("merch", "");
    if (view === "cart") url.searchParams.set("cart", "");
    if (view === "orders") url.searchParams.set("orders", "");
    if (view === "author") url.searchParams.set("author", "");
    if (view === "news") url.searchParams.set("article", "");
    return url;
}

function clearAuthorPage() {
    authorPage?.remove();
    authorPage = null;
}

async function showAuthorPanel(addHistory = true) {
    const requestId = ++viewRequestId;
    setDocumentTitle("Espace auteur");
    if (addHistory) {
        window.history.pushState({ view: "author" }, "", navigationUrl("author"));
    }
    activeRenderer?.unload?.();
    activeRenderer = null;
    projectContainerElement.classList.add("closed");
    homeElement?.classList.add("closed");
    cartPage?.remove();
    cartPage = null;
    clearAuthorPage();
    pages.unload();
    authorPage = document.createElement("main");
    authorPage.className = "author_space ver";
    authorPage.setAttribute("aria-labelledby", "author_panel_title");
    const heading = document.createElement("h2");
    heading.id = "author_panel_title";
    heading.textContent = "Espace auteur";
    authorPage.appendChild(heading);
    const loading = document.createElement("p");
    loading.textContent = "Chargement…";
    authorPage.appendChild(loading);
    document.querySelector("header")?.after(authorPage);

    try {
        const response = await fetch(`${API_URL}/user/authors`, {
            credentials: "include",
            cache: "no-store",
            redirect: "manual"
        });
        if (!response.ok) throw new Error("Impossible de charger les auteurs associés à votre compte.");
        const authors = await response.json();
        if (!Array.isArray(authors)) throw new Error("Réponse invalide du serveur.");
        if (requestId !== viewRequestId) return;
        if (authors.length === 0) {
            if (authorButton) authorButton.hidden = true;
            throw new Error("Aucun accès auteur n’est associé à ce compte.");
        }

        window.authors = authors;
        authorPage.replaceChildren(heading);
        for (const author of authors) {
            const panel = await createAuthorPanel(author, requestId);
            if (requestId !== viewRequestId) return;
            authorPage.appendChild(panel);
        }
    } catch (error) {
        if (requestId !== viewRequestId) return;
        authorPage.replaceChildren(heading);
        const message = document.createElement("p");
        message.textContent = translateAuthorError(error.message, "Impossible de charger l’espace auteur.");
        authorPage.appendChild(message);
    }
}

async function createAuthorPanel(author, requestId) {
    const panel = document.createElement("section");
    panel.className = "author_profile ver";
    const profile = document.createElement("div");
    profile.className = "author_profile_header";
    const portrait = document.createElement("div");
    portrait.className = "author_profile_portrait";
    const image = document.createElement("img");
    image.className = "author_profile_thumbnail";
    image.src = author.thumbnail || "/assets/mld_logo_all_white.png";
    image.alt = "";
    image.loading = "lazy";
    const editThumbnail = document.createElement("button");
    editThumbnail.type = "button";
    editThumbnail.className = "author_profile_photo_edit";
    editThumbnail.setAttribute("aria-label", "Modifier la photo de profil");
    editThumbnail.title = "Modifier la photo";
    editThumbnail.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
    portrait.append(image, editThumbnail);
    const identity = document.createElement("div");
    identity.className = "author_profile_identity ver";
    const name = document.createElement("h2");
    name.className = "author_profile_name";
    name.textContent = author.name || "Auteur";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "author_profile_edit";
    edit.setAttribute("aria-label", "Modifier le nom");
    edit.title = "Modifier le nom";
    edit.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
    identity.append(name, edit);
    profile.append(portrait, identity);
    panel.appendChild(profile);

    const profileForm = document.createElement("form");
    profileForm.className = "author_profile_form";
    profileForm.hidden = true;
    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Nom";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.required = true;
    nameInput.maxLength = 100;
    nameInput.value = author.name || "";
    nameLabel.appendChild(nameInput);
    const profileActions = document.createElement("div");
    profileActions.className = "author_profile_actions";
    const saveProfile = document.createElement("button");
    saveProfile.type = "submit";
    saveProfile.textContent = "Enregistrer";
    const cancelProfile = document.createElement("button");
    cancelProfile.type = "button";
    cancelProfile.className = "author_profile_cancel";
    cancelProfile.textContent = "Annuler";
    profileActions.append(saveProfile, cancelProfile);
    const profileStatus = document.createElement("p");
    profileStatus.setAttribute("role", "status");
    profileStatus.setAttribute("aria-live", "polite");
    profileForm.append(nameLabel, profileActions, profileStatus);
    const openProfileForm = () => {
        profileForm.hidden = false;
        nameInput.focus();
    };
    edit.addEventListener("click", openProfileForm);
    editThumbnail.addEventListener("click", () => {
        updatePhotoAvailability();
        photoForm.hidden = false;
        if (!photoInput.disabled) photoInput.focus();
    });
    cancelProfile.addEventListener("click", () => {
        profileForm.hidden = true;
        profileStatus.textContent = "";
    });
    profileForm.addEventListener("submit", async event => {
        event.preventDefault();
        saveProfile.disabled = true;
        profileStatus.textContent = "Enregistrement…";
        try {
            const response = await fetch(`${API_URL}/user/authors/${encodeURIComponent(author.id)}`, {
                method: "PUT",
                credentials: "include",
                cache: "no-store",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: nameInput.value.trim() })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Impossible d’enregistrer le profil.");
            author.name = result.name;
            name.textContent = author.name;
            profileForm.hidden = true;
            profileStatus.textContent = "Profil enregistré.";
        } catch (error) {
            profileStatus.textContent = translateAuthorError(error.message, "Impossible d’enregistrer le profil. Vérifiez les informations puis réessayez.");
        } finally {
            saveProfile.disabled = false;
        }
    });
    panel.appendChild(profileForm);

    const photoForm = document.createElement("form");
    photoForm.className = "author_profile_form author_profile_photo_form";
    photoForm.hidden = true;
    const photoLabel = document.createElement("label");
    photoLabel.textContent = "Photo de profil (PNG, JPEG, WebP ou GIF · 5 Mo max.)";
    const photoInput = document.createElement("input");
    photoInput.type = "file";
    photoInput.accept = "image/png,image/jpeg,image/webp,image/gif";
    photoInput.required = true;
    photoLabel.appendChild(photoInput);
    const photoLimit = document.createElement("p");
    photoLimit.className = "author_profile_photo_limit";
    const updatePhotoAvailability = () => {
        const availableAt = author.profilePictureNextUploadAt ? new Date(author.profilePictureNextUploadAt) : null;
        if (availableAt && availableAt > new Date()) {
            photoLimit.textContent = `Prochain envoi possible le ${availableAt.toLocaleDateString("fr-FR")}.`;
            photoInput.disabled = true;
        } else {
            photoLimit.textContent = "Une photo par mois calendaire (UTC).";
            photoInput.disabled = false;
        }
        uploadPhoto.disabled = photoInput.disabled;
    };
    const photoActions = document.createElement("div");
    photoActions.className = "author_profile_actions";
    const uploadPhoto = document.createElement("button");
    uploadPhoto.type = "submit";
    uploadPhoto.textContent = "Envoyer la photo";
    const cancelPhoto = document.createElement("button");
    cancelPhoto.type = "button";
    cancelPhoto.textContent = "Annuler";
    cancelPhoto.addEventListener("click", () => {
        photoForm.hidden = true;
        photoInput.value = "";
        photoStatus.textContent = "";
    });
    photoActions.append(uploadPhoto, cancelPhoto);
    const photoStatus = document.createElement("p");
    photoStatus.setAttribute("role", "status");
    photoStatus.setAttribute("aria-live", "polite");
    photoForm.append(photoLabel, photoLimit, photoActions, photoStatus);
    photoForm.addEventListener("submit", async event => {
        event.preventDefault();
        const file = photoInput.files?.[0];
        if (!file) return;
        uploadPhoto.disabled = true;
        photoStatus.textContent = "Envoi et traitement de la photo…";
        try {
            const response = await fetch(`${API_URL}/user/authors/${encodeURIComponent(author.id)}/thumbnail`, {
                method: "POST",
                credentials: "include",
                cache: "no-store",
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: file
            });
            const result = await response.json();
            if (!response.ok) {
                const error = new Error(result.error || "Impossible d’envoyer la photo.");
                error.nextUploadAvailableAt = result.nextUploadAvailableAt;
                throw error;
            }
            author.thumbnail = result.thumbnail;
            author.profilePictureNextUploadAt = result.nextUploadAvailableAt;
            image.src = author.thumbnail;
            updatePhotoAvailability();
            photoForm.hidden = true;
            photoInput.value = "";
            photoStatus.textContent = result.previousThumbnailCleanupFailed
                ? "Photo enregistrée, mais l’ancienne image n’a pas pu être supprimée. Contactez l’administrateur."
                : "Photo de profil enregistrée.";
        } catch (error) {
            photoStatus.textContent = translateAuthorError(error.message, "Impossible d’envoyer la photo. Vérifiez le fichier puis réessayez.");
            if (error.nextUploadAvailableAt) {
                author.profilePictureNextUploadAt = error.nextUploadAvailableAt;
                const availableAt = new Date(error.nextUploadAvailableAt);
                photoStatus.textContent += ` Vous pourrez en envoyer une autre à partir du ${availableAt.toLocaleDateString("fr-FR")}.`;
            }
        } finally {
            updatePhotoAvailability();
        }
    });
    panel.appendChild(photoForm);

    const navigation = document.createElement("nav");
    navigation.className = "author_space_nav author_apps";
    navigation.setAttribute("aria-label", `Applications de ${author.name || "l’auteur"}`);
    const appsGrid = document.createElement("div");
    appsGrid.className = "author_apps_grid";
    const makeApp = (icon, label, onClick) => {
        const app = document.createElement("button");
        app.type = "button";
        app.className = "author_app_card";
        const iconEl = document.createElement("i");
        iconEl.className = icon;
        iconEl.setAttribute("aria-hidden", "true");
        const text = document.createElement("span");
        text.textContent = label;
        app.append(iconEl, text);
        app.addEventListener("click", onClick);
        return app;
    };
    appsGrid.appendChild(makeApp("fa-solid fa-folder-open", "Projets", () => showAuthorSubsection(author, "projects")));
    if (author.newsWriter) {
        appsGrid.appendChild(makeApp("fa-solid fa-newspaper", "Articles", () => showAuthorSubsection(author, "articles")));
    }
    appsGrid.appendChild(makeApp("fa-solid fa-id-card", "Curriculum vitae", () => { window.location.href = "/cv/"; }));
    navigation.append(appsGrid);
    panel.append(navigation);
    return panel;
}

async function showAuthorSubsection(author, subsection) {
    const requestId = ++viewRequestId;
    const url = navigationUrl("author");
    window.history.pushState({ view: "author-section", subsection, authorId: author.id }, "", url);
    authorPage.replaceChildren();
    const back = document.createElement("button");
    back.type = "button";
    back.className = "nav back";
    back.textContent = "Retour";
    back.addEventListener("click", () => showAuthorPanel());
    const heading = document.createElement("h2");
    heading.className = "author_section_title";
    heading.textContent = subsection === "projects" ? "MES PROJETS" : "MES ARTICLES";
    authorPage.append(back, heading);
    if (subsection === "projects") {
        await loadAuthorProjects(author, requestId);
        return;
    }
    const editor = await createAuthorNewsEditor(author, { showHeading: false });
    if (requestId === viewRequestId) authorPage.appendChild(editor);
}

async function loadAuthorProjects(author, requestId) {
    const projectTools = document.createElement("div");
    projectTools.className = "author_projects_tools";
    const searchLabel = document.createElement("label");
    searchLabel.className = "author_projects_search";
    searchLabel.textContent = "Rechercher";
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Nom, album, description…";
    searchLabel.appendChild(search);
    const filterLabel = document.createElement("label");
    filterLabel.textContent = "Afficher";
    const filter = document.createElement("select");
    [["all", "Tous les projets"], ["track", "Morceaux"], ["book", "Livres"], ["videogame", "Jeux vidéo"], ["draft", "Brouillons"], ["published", "Publiés"]]
        .forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            filter.appendChild(option);
        });
    filterLabel.appendChild(filter);
    const sortLabel = document.createElement("label");
    sortLabel.textContent = "Trier par";
    const sort = document.createElement("select");
    [["date", "Date"], ["album", "Album"], ["album_order", "Ordre dans l’album"], ["name", "Nom"]]
        .forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            sort.appendChild(option);
        });
    sortLabel.appendChild(sort);
    projectTools.append(searchLabel, filterLabel, sortLabel);
    const projectsContainer = document.createElement("div");
    projectsContainer.className = "author_projects_grid";
    const loading = document.createElement("p");
    loading.textContent = "Chargement des projets…";
    projectsContainer.appendChild(loading);
    authorPage.append(projectTools, projectsContainer);

    let projects;
    try {
        const response = await fetch(`${API_URL}/user/authors/${encodeURIComponent(author.id)}/projects`, {
            credentials: "include",
            cache: "no-store",
            redirect: "manual"
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Impossible de charger les projets de cet auteur.");
        if (!Array.isArray(result)) throw new Error("Réponse invalide du serveur.");
        projects = result;
    } catch (error) {
        if (requestId === viewRequestId) loading.textContent = translateAuthorError(error.message, "Impossible de charger les projets de cet auteur.");
        return;
    }
    if (requestId !== viewRequestId) return;
    const renderProjects = () => {
        const query = search.value.trim().toLocaleLowerCase("fr");
        const filteredProjects = projects.filter(project => {
            const matchesFilter = filter.value === "all" ||
                filter.value === project.type ||
                filter.value === project.state;
            const searchable = [project.title, project.metadata?.album, project.metadata?.description]
                .filter(Boolean).join(" ").toLocaleLowerCase("fr");
            return matchesFilter && (!query || searchable.includes(query));
        });
        const dateValue = project => Date.parse(project.release_date || project.creation_date || "") || 0;
        const albumOrder = project => {
            const value = Number(project.metadata?.album_order);
            return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
        };
        filteredProjects.sort((a, b) => {
            if (sort.value === "name") return String(a.title || "").localeCompare(String(b.title || ""), "fr");
            if (sort.value === "album") {
                return String(a.metadata?.album || "").localeCompare(String(b.metadata?.album || ""), "fr") ||
                    albumOrder(a) - albumOrder(b) ||
                    String(a.title || "").localeCompare(String(b.title || ""), "fr");
            }
            if (sort.value === "album_order") {
                return albumOrder(a) - albumOrder(b) ||
                    String(a.metadata?.album || "").localeCompare(String(b.metadata?.album || ""), "fr") ||
                    String(a.title || "").localeCompare(String(b.title || ""), "fr");
            }
            return dateValue(b) - dateValue(a) ||
                String(a.metadata?.album || "").localeCompare(String(b.metadata?.album || ""), "fr") ||
                albumOrder(a) - albumOrder(b) ||
                String(a.title || "").localeCompare(String(b.title || ""), "fr");
        });
        projectsContainer.replaceChildren();
        if (!filteredProjects.length) {
            const empty = document.createElement("p");
            empty.className = "author_projects_empty";
            empty.textContent = projects.length ? "Aucun projet ne correspond à votre recherche." : "Aucun projet n’est encore associé à cet auteur.";
            projectsContainer.appendChild(empty);
            return;
        }

        const typeLabels = { track: "Morceau", book: "Livre", videogame: "Jeu vidéo" };
        for (const project of filteredProjects) {
            const link = document.createElement("a");
            link.className = "author_project_card";
            link.href = `?project=${encodeURIComponent(project.id)}&from=author`;
            const thumbnail = document.createElement("img");
            thumbnail.src = project.metadata?.thumbnail || "/assets/placeholder.webp";
            thumbnail.alt = "";
            thumbnail.loading = "lazy";
            const content = document.createElement("div");
            content.className = "author_project_card_content";
            const title = document.createElement("h4");
            title.textContent = project.title || "Projet sans titre";
            const description = document.createElement("p");
            const album = project.metadata?.album;
            const date = project.release_date || project.creation_date;
            const formattedDate = date && Number.isFinite(Date.parse(date))
                ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(date))
                : "";
            description.textContent = [typeLabels[project.type] || project.type, album, formattedDate].filter(Boolean).join(" · ");
            const state = document.createElement("span");
            state.className = `author_project_state${project.state === "draft" ? " is_draft" : ""}`;
            state.textContent = project.canEdit === false
                ? `${project.state === "draft" ? "Brouillon" : "Publié"} · Consultant (lecture seule)`
                : project.state === "draft" ? "Brouillon" : "Publié";
            content.append(title, description, state);
            link.append(thumbnail, content);
            link.addEventListener("click", event => {
                event.preventDefault();
                const container = ensureRendererContainer();
                container.datas = projects;
                container.filteredDatas = [...projects];
                window.history.pushState({ view: "project", projectId: project.id, fromAuthor: true }, "", link.href);
                const renderer = container.createRenderer(project);
                showProject(renderer, false, true);
            });
            projectsContainer.appendChild(link);
        }
    };
    search.addEventListener("input", renderProjects);
    filter.addEventListener("change", renderProjects);
    sort.addEventListener("change", renderProjects);
    renderProjects();
    return;
}

function ensureRendererContainer() {
    if (!projectContainer) projectContainer = new ProjectContainer(projectContainerElement, [], {});
    return projectContainer;
}

async function showProjects(addHistory = true) {
    const requestId = ++viewRequestId;
    clearAuthorPage();
    if (addHistory) {
        window.history.pushState({ view: "container" }, "", navigationUrl("projects"));
    }
    setDocumentTitle("Projets");
    activeRenderer?.unload?.();
    activeRenderer = null;
    merchContainer?.renderers.forEach(renderer => renderer.unload?.());
    cartPage?.remove();
    cartPage = null;
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed");
    projectContainerElement.classList.remove("news_container");
    await ensureProjectContainer();
    if (requestId !== viewRequestId) return;
    projectContainer.create();
    await showUrlProject();
}

async function showPage(identifier, addHistory = true) {
    ++viewRequestId;
    clearAuthorPage();
    const pageName = String(identifier || "").trim();
    if (addHistory) {
        const url = navigationUrl();
        url.searchParams.set("page", pageName);
        window.history.pushState({ view: "page", page: pageName }, "", url);
    }
    activeRenderer?.unload?.();
    activeRenderer = null;
    cartPage?.remove();
    cartPage = null;
    projectContainerElement.classList.add("closed");
    homeElement?.classList.remove("closed");
    await pages.load(pageName);
}

async function loadNewsArticles() {
    if (newsArticles) return newsArticles;
    if (!newsLoading) {
        newsLoading = (async () => {
            const response = await fetch(`${API_URL}/public/news`, { cache: "no-store" });
            if (!response.ok) throw new Error("Impossible de charger les articles.");
            const result = await response.json();
            if (!Array.isArray(result)) throw new Error("Réponse invalide du serveur.");
            newsArticles = result;
            return result;
        })();
    }
    try {
        return await newsLoading;
    } finally {
        newsLoading = null;
    }
}

function prepareNewsView(addHistory, slug = null) {
    ++viewRequestId;
    clearAuthorPage();
    activeRenderer?.unload?.();
    activeRenderer = null;
    cartPage?.remove();
    cartPage = null;
    pages.unload();
    if (addHistory) {
        const url = navigationUrl("news");
        url.searchParams.set("article", slug || "");
        window.history.pushState({ view: slug ? "article" : "news", slug }, "", url);
    }
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed", "merch_container");
    projectContainerElement.classList.add("news_container");
    projectContainerElement.replaceChildren();
    return viewRequestId;
}

async function showNews(addHistory = true) {
    const requestId = prepareNewsView(addHistory);
    setDocumentTitle("Articles");
    const loading = document.createElement("p");
    loading.textContent = "Chargement des articles…";
    projectContainerElement.appendChild(loading);
    try {
        const articles = await loadNewsArticles();
        if (requestId !== viewRequestId) return;
        newsContainer = new NewsContainer(articles);
        newsContainer.render(projectContainerElement);
    } catch (error) {
        if (requestId !== viewRequestId) return;
        const message = document.createElement("p");
        message.textContent = error.message || "Les articles sont momentanément indisponibles.";
        projectContainerElement.replaceChildren(message);
    }
}

async function showNewsArticle(slug, addHistory = true) {
    const requestId = prepareNewsView(addHistory, slug);
    try {
        const articles = await loadNewsArticles();
        if (requestId !== viewRequestId) return;
        let article = articles.find(item => item.slug === slug);
        if (!article) {
            const response = await fetch(`${API_URL}/public/news/${encodeURIComponent(slug)}`, { cache: "no-store" });
            if (!response.ok) throw new Error("Article introuvable.");
            article = await response.json();
        }
        if (requestId !== viewRequestId) return;
        renderNewsArticle(projectContainerElement, article);
        setDocumentTitle(article.title);
    } catch (error) {
        if (requestId !== viewRequestId) return;
        setDocumentTitle("Articles");
        const message = document.createElement("p");
        message.textContent = error.message || "Article introuvable.";
        projectContainerElement.replaceChildren(message);
    }
}

async function showArticleEditor(articleId, addHistory = true) {
    const requestId = ++viewRequestId;
    clearAuthorPage();
    activeRenderer?.unload?.();
    activeRenderer = null;
    cartPage?.remove();
    cartPage = null;
    pages.unload();
    if (addHistory) {
        const url = navigationUrl("news");
        url.searchParams.set("article", String(articleId));
        window.history.pushState({ view: "article-editor", articleId }, "", url);
    }
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed", "merch_container");
    projectContainerElement.classList.add("news_container");
    projectContainerElement.replaceChildren();
    const loading = document.createElement("p");
    loading.textContent = "Chargement de l’article…";
    projectContainerElement.appendChild(loading);
    try {
        const response = await fetch(`${API_URL}/user/news/${encodeURIComponent(articleId)}`, {
            credentials: "include",
            cache: "no-store",
            redirect: "manual"
        });
        const article = await response.json();
        if (!response.ok) throw new Error(article.error || "Article introuvable ou accès refusé.");
        if (requestId !== viewRequestId) return;
        const author = {
            id: article.author_id,
            name: article.author_name,
            thumbnail: article.author_thumbnail,
            newsWriter: true
        };
        const editorPage = document.createElement("section");
        editorPage.className = "article_editor_page";
        const back = document.createElement("button");
        back.type = "button";
        back.className = "nav back";
        back.textContent = "Retour";
        back.addEventListener("click", () => showAuthorPanel());
        const heading = document.createElement("h1");
        heading.textContent = "ÉDITION DE L’ARTICLE";
        const editor = await createAuthorNewsEditor(author, { articleId, editorOnly: true, showHeading: false });
        if (requestId !== viewRequestId) return;
        editorPage.append(back, heading, editor);
        projectContainerElement.replaceChildren(editorPage);
        setDocumentTitle(article.title);
    } catch (error) {
        if (requestId !== viewRequestId) return;
        setDocumentTitle("Articles");
        const message = document.createElement("p");
        message.textContent = error.message || "Impossible de charger l’éditeur de l’article.";
        projectContainerElement.replaceChildren(message);
    }
}

async function showMerch(addHistory = true) {
    const requestId = ++viewRequestId;
    clearAuthorPage();
    if (addHistory) {
        window.history.pushState({ view: "merch" }, "", navigationUrl("merch"));
    }
    setDocumentTitle("Merch");
    activeRenderer?.unload?.();
    activeRenderer = null;
    projectContainer?.renderers.forEach(renderer => renderer.unload?.());
    cartPage?.remove();
    cartPage = null;
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed");
    projectContainerElement.classList.remove("news_container");
    try {
        await ensureMerchContainer(true);
        if (requestId !== viewRequestId) return;
        let orderData;
        try {
            orderData = await getUserOrders();
        } catch (error) {
            console.warn("Could not load digital merch ownership.", error);
            orderData = { ownedDigitalMerchIds: [] };
        }
        if (requestId !== viewRequestId) return;
        merchContainer.setOwnedDigitalMerchIds(orderData.ownedDigitalMerchIds);
        const merchId = new URLSearchParams(window.location.search).get("merch");
        if (merchId === null || merchId === "") {
            document.getElementById("merchFeaturedSkeleton")?.remove();
            addMerchSectionControls();
            addMerchFeaturedCarousel();
        } else {
            document.getElementById("merchFeaturedSkeleton")?.remove();
        }
        showUrlMerch();
    } catch (error) {
        if (requestId !== viewRequestId) return;
        showMerchError(error);
    }
}

function merchDate(item, key) {
    const value = item?.[key] ?? item?.metadata?.[key];
    const timestamp = value ? new Date(value).getTime() : NaN;
    return Number.isFinite(timestamp) ? timestamp : null;
}

function isPublishedMerch(item) {
    return String(item?.state || "").toLowerCase() === "published" || (item?.state == null && item?.active === true);
}

function getMerchType(item) {
    const explicit = item?.metadata?.product_type;
    if (explicit === "clothe" || explicit === "digital") return explicit;
    return item?.metadata?.digital_product === true ? "digital" : "clothe";
}

function isDigitalMerch(item) {
    return getMerchType(item) === "digital";
}

// Current merch section: "clothes" | "digital" (clothes selected by default)
let merchSection = "clothes";
let merchAllDatas = [];

function applyMerchSection() {
    if (!merchContainer) return;
    const all = merchAllDatas.length ? merchAllDatas : merchContainer.datas;
    let filtered = all;
    if (merchSection === "clothes") filtered = all.filter(item => !isDigitalMerch(item));
    else if (merchSection === "digital") filtered = all.filter(item => isDigitalMerch(item));
    merchContainer.setDatas(filtered);
}

function addMerchSectionControls() {
    document.getElementById("merchSectionControls")?.remove();
    const controls = document.createElement("div");
    controls.id = "merchSectionControls";
    controls.className = "hor align merch_section_controls";
    const makeButton = (section, icon, label) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "merch_section_button";
        button.classList.toggle("selected", merchSection === section);
        button.setAttribute("aria-pressed", String(merchSection === section));
        button.setAttribute("aria-label", label);
        button.title = label;
        const iconEl = document.createElement("i");
        iconEl.className = icon;
        iconEl.setAttribute("aria-hidden", "true");
        button.appendChild(iconEl);
        button.addEventListener("click", () => {
            merchSection = section;
            controls.querySelectorAll(".merch_section_button").forEach(item => {
                const active = item === button;
                item.classList.toggle("selected", active);
                item.setAttribute("aria-pressed", String(active));
            });
            applyMerchSection();
            document.getElementById("merchFeaturedSkeleton")?.remove();
            projectContainerElement.querySelector(".merch_featured")?.remove();
            addMerchFeaturedCarousel();
        });
        return button;
    };
    controls.append(
        makeButton("clothes", "fa-solid fa-shirt", "Vêtements"),
        makeButton("digital", "fa-solid fa-file-arrow-down", "Produits numériques")
    );
    projectContainerElement.insertBefore(controls, projectContainerElement.querySelector("#search_controls"));
}

function addMerchFeaturedSkeleton() {
    document.getElementById("merchFeaturedSkeleton")?.remove();
    const skeleton = document.createElement("section");
    skeleton.id = "merchFeaturedSkeleton";
    skeleton.className = "merch_featured merch_featured_skeleton load";
    skeleton.setAttribute("aria-hidden", "true");
    const viewport = document.createElement("div");
    viewport.className = "merch_featured_viewport";
    const hero = document.createElement("div");
    hero.className = "merch_skeleton_hero";
    const details = document.createElement("div");
    details.className = "merch_skeleton_details";
    details.append(document.createElement("span"), document.createElement("span"));
    const controls = document.createElement("div");
    controls.className = "merch_skeleton_controls";
    controls.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
    viewport.appendChild(hero);
    skeleton.append(viewport, details, controls);
    projectContainerElement.insertBefore(skeleton, projectContainerElement.querySelector("#search_controls"));
}

function addMerchFeaturedCarousel() {
    let products = merchContainer.datas.filter(isPublishedMerch);
    if (merchSection === "clothes") products = products.filter(item => !isDigitalMerch(item));
    else if (merchSection === "digital") products = products.filter(item => isDigitalMerch(item));
    if (!products.length) return;

    const byNewest = [...products].sort((first, second) => {
        const firstId = Number(first.id);
        const secondId = Number(second.id);
        if (Number.isFinite(firstId) && Number.isFinite(secondId) && firstId !== secondId) return secondId - firstId;
        return (merchDate(second, "creation_date") ?? 0) - (merchDate(first, "creation_date") ?? 0);
    });
    const latest = byNewest[0];
    const featured = [{ item: latest, label: "Dernier ajout" }];

    // Latest merch item belonging to a pinned collection.
    const latestInPins = byNewest.find(item => item.collection && item.collection.pinned);
    if (latestInPins && String(latestInPins.id) !== String(latest.id)) {
        featured.push({ item: latestInPins, label: latestInPins.collection.name, collection: latestInPins.collection });
    }
    const latestId = String(latest.id);
    const upcoming = products
        .filter(item => {
            const creationDate = merchDate(item, "creation_date");
            const releaseDate = merchDate(item, "release_date");
            return creationDate !== null && releaseDate !== null && releaseDate > creationDate;
        })
        .sort((first, second) =>
            Number(String(first.id) === latestId) - Number(String(second.id) === latestId)
            || merchDate(first, "release_date") - merchDate(second, "release_date")
        )[0];

    if (upcoming) featured.push({ item: upcoming, label: "Prochainement" });
    const featuredIds = new Set(featured.map(entry => String(entry.item.id)));
    const randomPool = products.filter(item => !featuredIds.has(String(item.id)));
    if (randomPool.length) {
        const randomItem = randomPool[Math.floor(Math.random() * randomPool.length)];
        featured.push({ item: randomItem, label: "À découvrir" });
    }

    const carousel = document.createElement("section");
    carousel.className = "merch_featured";
    carousel.setAttribute("aria-label", "Sélection merch");
    const viewport = document.createElement("div");
    viewport.className = "merch_featured_viewport";
    const track = document.createElement("div");
    track.className = "merch_featured_track";
    const slides = featured.map(({ item, label, collection }) => {
        const slide = document.createElement("div");
        slide.className = "merch_featured_slide";
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-label", label);
        const renderer = merchContainer.createRenderer(item);
        if (!renderer) return null;
        const card = document.createElement("button");
        card.type = "button";
        card.className = "merch_featured_item";
        card.setAttribute("aria-label", `${label} : ${renderer.title}`);
        const hero = document.createElement("span");
        hero.className = "merch_featured_hero";
        const image = document.createElement("img");
        image.src = renderer.thumbnail;
        image.alt = "";
        image.loading = "lazy";
        hero.appendChild(image);
        const itemCollection = collection || (item.collection || null);
        if (itemCollection) {
            const badge = document.createElement("span");
            badge.className = "merch_featured_collection_badge";
            badge.textContent = itemCollection.name;
            if (itemCollection.back_color) badge.style.background = itemCollection.back_color;
            if (itemCollection.front_color) badge.style.color = itemCollection.front_color;
            hero.appendChild(badge);
        }
        const details = document.createElement("span");
        details.className = "merch_featured_details";
        const title = document.createElement("strong");
        title.textContent = renderer.title;
        const price = document.createElement("span");
        price.textContent = renderer.formatPrice();
        details.append(title, price);
        card.append(hero, details);
        card.addEventListener("click", () => {
            card.dispatchEvent(new CustomEvent("project:select", {
                bubbles: true,
                detail: { project: item, renderer }
            }));
        });
        slide.appendChild(card);
        track.appendChild(slide);
        return { slide, label };
    }).filter(Boolean);
    if (!slides.length) return;

    let activeSlide = 0;
    const updateSlide = () => {
        track.style.transform = `translateX(-${activeSlide * 100}%)`;
        slides.forEach(({ slide }, index) => {
            slide.inert = index !== activeSlide;
            slide.setAttribute("aria-hidden", String(index !== activeSlide));
            indicators[index].classList.toggle("selected", index === activeSlide);
            indicators[index].setAttribute("aria-current", String(index === activeSlide));
        });
    };
    viewport.appendChild(track);

    const controls = document.createElement("div");
    controls.className = "merch_featured_controls";
    const indicators = slides.map(({ label }, index) => {
        const indicator = document.createElement("button");
        indicator.type = "button";
        indicator.className = "merch_featured_indicator";
        indicator.setAttribute("aria-label", `Afficher ${label.toLocaleLowerCase()}`);
        indicator.addEventListener("click", () => {
            activeSlide = index;
            updateSlide();
        });
        controls.appendChild(indicator);
        return indicator;
    });
    carousel.append(viewport, controls);
    projectContainerElement.insertBefore(carousel, projectContainerElement.querySelector("#search_controls"));
    updateSlide();
}

function showHome(addHistory = true) {
    ++viewRequestId;
    clearAuthorPage();
    if (addHistory) {
        window.history.pushState({ view: "home" }, "", navigationUrl("home"));
    }
    setDocumentTitle("Accueil");
    activeRenderer?.unload?.();
    activeRenderer = null;
    cartPage?.remove();
    cartPage = null;
    pages.unload();
    if (homeElement) homeElement.innerHTML = homeContent;
    projectContainerElement.classList.add("closed");
    homeElement?.classList.remove("closed");
}

async function showCartPage(addHistory = true, message = "") {
    const requestId = ++viewRequestId;
    clearAuthorPage();
    if (addHistory) window.history.pushState({ view: "cart" }, "", navigationUrl("cart"));
    setDocumentTitle("Panier");
    activeRenderer?.unload?.();
    activeRenderer = null;
    projectContainerElement.classList.add("closed");
    homeElement?.classList.add("closed");
    cartPage?.remove();
    cartPage = document.createElement("main");
    cartPage.id = "cartPage";
    cartPage.className = "ver align";
    cartPage.appendChild(createCartSkeleton());
    document.querySelector("header")?.after(cartPage);
    if (message) notification.show(message, "validation");
    try {
        const loadingMerch = ensureMerchContainer(true);
        projectContainerElement.classList.add("closed");
        await loadingMerch;
        if (requestId !== viewRequestId) return;
        cart.render(cartPage, merchContainer.datas, {
            message,
            onSubmit: (items, shipping, code) => createCheckout(items, shipping, code),
            onOrders: showMyOrdersPage
        });
    } catch (error) {
        if (requestId !== viewRequestId) return;
        showMerchError(error, cartPage);
    }
}

function createCartSkeleton() {
    const section = document.createElement("section");
    section.className = "cart_page ver cart_loading";
    const title = document.createElement("h2");
    title.textContent = "Panier et commande";
    const line = document.createElement("span");
    const lineTwo = document.createElement("span");
    line.className = lineTwo.className = "cart_skeleton_line";
    section.append(title, line, lineTwo);
    return section;
}

async function showMyOrdersPage(addHistory = true, merchId = null) {
    const requestId = ++viewRequestId;
    setDocumentTitle("Mes commandes");
    clearAuthorPage();
    activeRenderer?.unload?.();
    activeRenderer = null;
    projectContainerElement.classList.add("closed");
    homeElement?.classList.add("closed");
    cartPage?.remove();
    cartPage = document.createElement("main");
    cartPage.id = "cartPage";
    cartPage.className = "ver align";
    const section = document.createElement("section");
    section.className = "cart_page ver";
    const heading = document.createElement("h2");
    heading.textContent = "Mes commandes";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "nav back";
    back.textContent = "Retour";
    back.addEventListener("click", () => showCartPage());
    const content = document.createElement("p");
    content.textContent = "Chargement de vos commandes…";
    section.append(heading, back, content);
    cartPage.appendChild(section);
    document.querySelector("header")?.after(cartPage);

    try {
        const { orders, authenticated } = await getUserOrders();
        if (requestId !== viewRequestId) return;
        if (!authenticated) {
            content.textContent = "Connectez-vous pour consulter vos commandes.";
            const connect = document.createElement("button");
            connect.type = "button";
            connect.textContent = "Connect";
            connect.addEventListener("click", () => {
                const returnUrl = new URL(window.location.href);
                window.location.assign(`${API_URL}/user/whoami?redirect_url=${encodeURIComponent(returnUrl.href)}`);
            });
            section.appendChild(connect);
            return;
        }
        if (merchId !== null && merchId !== undefined) {
            const matchingOrder = orders.find(order =>
                order.items.some(item => String(item.merch_id) === String(merchId))
            );
            if (matchingOrder) {
                if (addHistory) {
                    const url = navigationUrl("orders");
                    url.searchParams.set("orders", String(matchingOrder.id));
                    window.history.pushState({ view: "order", orderId: String(matchingOrder.id), fromOrders: true }, "", url);
                }
                await showOrderStatus(matchingOrder.id, { addHistory: false, fromOrders: true });
                return;
            }
        }
        if (addHistory) {
            const url = navigationUrl("orders");
            window.history.pushState({ view: "orders" }, "", url);
        }
        if (!orders.length) {
            content.textContent = "Vous n’avez pas encore de commande.";
            return;
        }
        const orderList = document.createElement("div");
        orderList.className = "ver cart_orders_list";
        orders.forEach(order => {
            const row = document.createElement("article");
            row.className = "hor align cart_order";
            const thumbnails = document.createElement("div");
            thumbnails.className = "hor cart_order_thumbnails";
            order.items.forEach(item => {
                if (!item.thumbnail) return;
                const image = document.createElement("img");
                image.src = item.thumbnail;
                image.alt = item.name;
                image.loading = "lazy";
                thumbnails.appendChild(image);
            });
            const summary = document.createElement("div");
            summary.className = "ver fill";
            const itemNames = order.items.map(item => item.name);
            const label = document.createElement("strong");
            label.textContent = itemNames.length > 1
                ? `${itemNames[0]} + ${itemNames.length - 1} autre${itemNames.length > 2 ? "s" : ""}`
                : itemNames[0] || "Commande";
            const details = document.createElement("span");
            const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(order.created_at));
            const total = new Intl.NumberFormat("fr-FR", { style: "currency", currency: order.currency }).format(Number(order.total));
            details.textContent = `${date} · ${total} · ${order.payment_status} (${order.status})`;
            summary.append(label, details);
            const view = document.createElement("button");
            view.type = "button";
            view.className = "cart_action_button";
            view.textContent = "Voir le suivi";
            view.addEventListener("click", () => showOrderStatus(order.id, { fromOrders: true }));
            row.append(thumbnails, summary, view);
            orderList.appendChild(row);
        });
        content.remove();
        section.appendChild(orderList);
    } catch (error) {
        content.textContent = error.message || "Impossible de charger vos commandes.";
    }
}

async function showOrderStatus(orderId, { addHistory = true, fromOrders = false } = {}) {
    const requestId = ++viewRequestId;
    setDocumentTitle("Statut de la commande");
    clearAuthorPage();
    if (addHistory) {
        const url = navigationUrl(fromOrders ? "orders" : "home");
        if (fromOrders) url.searchParams.set("orders", String(orderId));
        else url.searchParams.set("order_success", String(orderId));
        window.history.pushState({ view: "order", orderId: String(orderId), fromOrders }, "", url);
    }
    activeRenderer?.unload?.();
    activeRenderer = null;
    projectContainerElement.classList.add("closed");
    homeElement?.classList.add("closed");
    cartPage?.remove();
    cartPage = document.createElement("main");
    cartPage.id = "cartPage";
    cartPage.className = "ver align";
    const statusPage = document.createElement("section");
    statusPage.className = "cart_page ver";
    const heading = document.createElement("h2");
    heading.textContent = "Statut de la commande";
    statusPage.appendChild(heading);
    const statusMessage = document.createElement("p");
    statusMessage.textContent = "Vérification du paiement…";
    statusPage.appendChild(statusMessage);
    let orderSuccessNotified = false;
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.textContent = "Actualiser le statut";
    const refreshStatus = async () => {
        refresh.disabled = true;
        statusMessage.textContent = "Vérification du paiement…";
        try {
            const order = await getOrderStatus(orderId);
            if (requestId !== viewRequestId) return;
            statusMessage.textContent = order.payment_status === "free"
                ? `Commande ${order.id} : confirmation gratuite envoyée.`
                : `Commande ${order.id} : ${order.payment_status} (${order.status}).`;
            if (order.payment_status === "paid" || order.payment_status === "free") {
                cart.clear();
                if (!orderSuccessNotified) {
                    notification.show(
                        order.payment_status === "free" ? "Commande gratuite confirmée." : "Paiement de la commande confirmé.",
                        "success"
                    );
                    orderSuccessNotified = true;
                }
            }
        } catch (error) {
            if (requestId !== viewRequestId) return;
            statusMessage.textContent = error.message;
            notification.show(error.message, "error");
        } finally {
            refresh.disabled = false;
        }
    };
    refresh.addEventListener("click", refreshStatus);
    const back = document.createElement("button");
    back.type = "button";
    back.className = "nav back";
    back.textContent = "Retour";
    back.addEventListener("click", () => fromOrders ? showMyOrdersPage() : showCartPage());
    statusPage.append(refresh, back);
    cartPage.appendChild(statusPage);
    document.querySelector("header")?.after(cartPage);
    await refreshStatus();
}

function showMerchError(error, container = projectContainerElement) {
    console.error("Could not load the merch store.", error);
    notification.show("La boutique est momentanément indisponible. Veuillez réessayer.", "fatal");
    container.classList.remove("load");
    document.getElementById("merchFeaturedSkeleton")?.remove();
    container.classList.remove("closed");
    const section = document.createElement("section");
    section.className = "ver align";
    const message = document.createElement("p");
    message.textContent = "La boutique est momentanément indisponible. Veuillez réessayer plus tard.";
    section.appendChild(message);
    container.replaceChildren(section);
}

function updateCartCount() {
    cartButton?.style.setProperty("--count", `"${cart.count()}"`);
}

async function updateAuthButtons() {
    if (!connectButton || !accessButton || !logoutButton || !cartButton) return;
    const requestId = ++authRequestId;
    let authenticated = false;
    connectButton.hidden = false;
    accessButton.hidden = true;
    if (authorButton) authorButton.hidden = true;
    logoutButton.hidden = true;
    cartButton.hidden = true;
    updateFooterAide(false);
    try {
        const response = await fetch(`${API_URL}/user/whoami`, {
            credentials: "include",
            cache: "no-store",
            redirect: "manual"
        });
        if (requestId !== authRequestId) return;
        authenticated = response.ok;
        window.dispatchEvent(new CustomEvent("auth:change", { detail: { authenticated } }));
        if (!authenticated) return;
        loggedOut = false;
        connectButton.hidden = true;
        accessButton.hidden = false;
        logoutButton.hidden = false;
        cartButton.hidden = false;
        updateFooterAide(true);

        const authorsResponse = await fetch(`${API_URL}/user/authors`, {
            credentials: "include",
            cache: "no-store",
            redirect: "manual"
        });
        if (!authorsResponse.ok) throw new Error("Impossible de vérifier les auteurs associés à votre compte.");
        const authors = await authorsResponse.json();
        if (!Array.isArray(authors)) throw new Error("Réponse invalide du serveur.");
        if (requestId !== authRequestId) return;
        accessButton.hidden = authors.length > 0;
        if (authorButton) authorButton.hidden = authors.length === 0;
        updateFooterApps(authors);
    } catch {
        if (requestId !== authRequestId) return;
        if (authenticated) {
            connectButton.hidden = true;
            accessButton.hidden = false;
            if (authorButton) authorButton.hidden = true;
            logoutButton.hidden = false;
            cartButton.hidden = false;
            updateFooterApps(null);
            updateFooterAide(true);
            notification.show("Impossible de vérifier les auteurs associés à votre compte.", "error");
        } else {
            window.dispatchEvent(new CustomEvent("auth:change", { detail: { authenticated: false } }));
            connectButton.hidden = false;
            accessButton.hidden = true;
            if (authorButton) authorButton.hidden = true;
            logoutButton.hidden = true;
            cartButton.hidden = true;
            updateFooterApps(null);
            updateFooterAide(false);
        }
    }
}

function updateFooterApps(authors) {
    const footerApps = document.getElementById("footer_apps");
    if (!footerApps) return;
    const list = Array.isArray(authors) ? authors : [];
    footerApps.hidden = list.length === 0;
    const articlesItem = document.getElementById("footer_app_articles")?.closest("li");
    if (articlesItem) articlesItem.hidden = !list.some(author => author.newsWriter);
}

function updateFooterAide(authenticated) {
    const footerAide = document.getElementById("footer_aide");
    if (footerAide) footerAide.hidden = !authenticated;
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

function showProject(renderer, addHistory = true, fromSearch = false, authorizedProject = null, editorStatus = "") {
    if (!renderer) return;
    const requestId = ++viewRequestId;
    clearAuthorPage();
    activeRenderer?.unload?.();
    activeRenderer = renderer;
    if (renderer.type === "merch" || renderer.type === "merchandise") {
        setDocumentTitle(renderer.title);
    } else {
        const authors = (Array.isArray(renderer.authors) ? renderer.authors : [])
            .filter(authorId => !renderer.data.authorRoles?.[authorId] || renderer.data.authorRoles[authorId] === "main")
            .map(authorId => window.authors?.find(author => String(author.id) === String(authorId))?.name)
            .filter(Boolean);
        setDocumentTitle(`${authors.length ? `${authors.join(", ")} - ` : ""}${renderer.title || "Projet"}`, false);
    }
    if (addHistory) {
        window.history.pushState({
            view: "project",
            projectId: renderer.id,
            projectIndex: projectContainer?.datas.indexOf(renderer.data),
            fromSearch
        }, "", projectUrl(renderer, fromSearch));
    }
    projectContainerElement.classList.add("closed");
    const root = renderer.load("", fromSearch ? projectContainerElement : null);
    const isMerch = renderer.type === "merch" || renderer.type === "merchandise";
    if (root && !isMerch) void loadAuthorProjectEditor(renderer, root, requestId, authorizedProject, editorStatus);
}

async function loadAuthorProjectEditor(renderer, root, requestId, authorizedProject = null, editorStatus = "") {
    try {
        let project = authorizedProject;
        if (!project) {
            const response = await fetch(`${API_URL}/user/project/${encodeURIComponent(renderer.id)}`, {
                credentials: "include",
                cache: "no-store",
                redirect: "manual"
            });
            if (!response.ok) return;
            project = await response.json();
        }
        if (requestId !== viewRequestId || activeRenderer !== renderer) return;
        if (project.canEdit === false) return;
        renderer.data = project;
        const container = ensureRendererContainer();
        const index = container.datas.findIndex(item => String(item.id) === String(project.id));
        if (index === -1) container.datas.push(project);
        else container.datas[index] = project;

        const editor = createAuthorProjectEditor(project, root, async changes => {
            const saveResponse = await fetch(`${API_URL}/user/project/${encodeURIComponent(project.id)}`, {
                method: "POST",
                credentials: "include",
                cache: "no-store",
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: JSON.stringify(changes)
            });
            const responseText = await saveResponse.text();
            let result;
            try {
                result = responseText ? JSON.parse(responseText) : null;
            } catch {
                const detail = saveResponse.ok
                    ? "Le serveur a renvoyé une réponse invalide."
                    : `Le serveur a répondu avec le statut ${saveResponse.status} sans message exploitable.`;
                throw new Error(detail);
            }
            if (!saveResponse.ok) throw new Error(result?.error || "Impossible d’enregistrer le projet.");
            if (!result || typeof result !== "object" || Array.isArray(result)) {
                throw new Error("Le serveur a renvoyé une réponse invalide.");
            }
            const projectIndex = container.datas.findIndex(item => String(item.id) === String(result.id));
            if (projectIndex === -1) container.datas.push(result);
            else container.datas[projectIndex] = result;
            const updatedRenderer = container.createRenderer(result);
            showProject(updatedRenderer, false, new URLSearchParams(window.location.search).get("from") !== "author", result, "Projet enregistré.");
        }, editorStatus);
        const navigation = root.querySelector(".nav.back");
        root.insertBefore(editor, navigation?.nextSibling || root.firstChild);
    } catch (error) {
        console.error("Could not load the author project editor.", error);
    }
}

function showProjectContainer(addHistory = true) {
    ++viewRequestId;
    const url = new URL(window.location);
    ["project", "book", "track", "game", "merch", "from"].forEach(name => url.searchParams.delete(name));
    if (addHistory) {
        window.history.pushState({ view: "container" }, "", url);
    }
    setDocumentTitle("Projets");
    activeRenderer?.unload?.();
    activeRenderer = null;
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed");
    projectContainerElement.classList.remove("news_container");
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

async function showUrlProject() {
    const params = new URLSearchParams(window.location.search);
    if (!["project", "book", "track", "game"].some(name => params.has(name))) return;

    let project = findProjectFromUrl();
    if (!project) {
        const projectId = params.get("project") || params.get("book") || params.get("track") || params.get("game");
        try {
            const response = await fetch(`${API_URL}/user/project/${encodeURIComponent(projectId)}`, {
                credentials: "include",
                cache: "no-store",
                redirect: "manual"
            });
            if (response.ok) {
                project = await response.json();
                projectContainer.datas.push(project);
            }
        } catch (error) {
            console.warn("Could not check author access for this project.", error);
        }
    }
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

    const renderer = ensureRendererContainer().createRenderer(project);
    showProject(renderer, false, ["search", "author"].includes(params.get("from")));
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

document.addEventListener("news:select", event => {
    const article = event.detail?.article;
    if (article?.slug) showNewsArticle(article.slug);
});
window.addEventListener("news:edit", event => {
    const articleId = event.detail?.articleId;
    if (Number.isSafeInteger(Number(articleId)) && Number(articleId) > 0) showArticleEditor(articleId);
});
window.addEventListener("news:editor-close", () => showAuthorPanel());
document.addEventListener("news:back", () => showNews());
window.addEventListener("news:updated", () => {
    newsArticles = null;
    newsContainer = null;
});

document.addEventListener("project:open-content", event => {
    showProject(event.detail?.renderer, false, true);
});

document.addEventListener("project:back", event => {
    if (new URLSearchParams(window.location.search).get("from") === "author") {
        showAuthorPanel();
        return;
    }
    showProjectContainer();
});

window.addEventListener("popstate", event => {
    if (loggedOut) {
        clearCachedViews();
        showHome(false);
        window.history.replaceState({ view: "home" }, "", navigationUrl("home"));
        updateAuthButtons();
        return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.has("page")) {
        showPage(params.get("page"), false);
        return;
    }
    if (params.has("article")) {
        const articleSlug = params.get("article");
        if (!articleSlug) showNews(false);
        else if (/^\d+$/.test(articleSlug)) showArticleEditor(articleSlug, false);
        else showNewsArticle(articleSlug, false);
        return;
    }
    if (params.has("news")) {
        showNews(false);
        return;
    }
    if (params.has("author")) {
        showAuthorPanel(false);
        return;
    }
    pages.unload();
    if (params.has("order")) {
        showOrderStatus(params.get("order"), { addHistory: false, fromOrders: true });
        return;
    }
    if (params.has("order_success")) {
        showOrderStatus(params.get("order_success"), { addHistory: false, fromOrders: false });
        return;
    }
    if (params.has("orders")) {
        const orderId = params.get("orders");
        if (orderId && /^\d+$/.test(orderId)) {
            showOrderStatus(orderId, { addHistory: false, fromOrders: true });
        } else {
            showMyOrdersPage(false);
        }
        return;
    }
    if (params.has("cart") || params.has("order_cancel")) {
        showCartPage(false, params.has("order_cancel") ? "Le paiement a été annulé. Votre panier est conservé." : "");
        return;
    }
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

window.addEventListener("pageshow", event => {
    if (!event.persisted || !loggedOut) return;
    clearCachedViews();
    showHome(false);
    window.history.replaceState({ view: "home" }, "", navigationUrl("home"));
    updateAuthButtons();
});

function clearCachedViews() {
    clearAuthorPage();
    activeRenderer?.unload?.();
    activeRenderer = null;
    projectContainer?.renderers.forEach(renderer => renderer.unload?.());
    merchContainer?.renderers.forEach(renderer => renderer.unload?.());
    window.projects = [];
    window.authors = [];
    projectContainer = null;
    merchContainer = null;
    projectsLoading = null;
    merchLoading = null;
    newsContainer = null;
    newsArticles = null;
    newsLoading = null;
    projectContainerElement.replaceChildren();
    cartPage?.remove();
    cartPage = null;
}

var userLang = "";
var localFile;
window.userLang = userLang;
window.localFile = localFile;

const TRACKS_FETCH = "https://tracks.melide-s-account.workers.dev/tracks";
const IMG_URL_FETCH = "https://img.melide.music/";

window.TRACKS_FETCH = TRACKS_FETCH;
window.IMG_URL_FETCH = IMG_URL_FETCH;
