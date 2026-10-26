import { ProjectContainer } from '/js/ProjectContainer.js';
import { Cart, createCheckout, getOrderStatus, getUserOrders } from '/js/Cart.js';
import { Pages } from '/js/Pages.js';
import { Notification } from '/js/Notification.js';

const API_URL = "https://api.melide.music";

const projectContainerElement = document.getElementById("projectContainer");
const homeElement = document.getElementById("home");
const homeContent = homeElement?.innerHTML || "";
const pages = new Pages(homeElement);
const homeButton = document.getElementById("home_button");
const projectsButton = document.getElementById("projects_button");
const merchButtons = document.querySelectorAll("#merch_button, #footer_merch_button");
const cartButton = document.getElementById("cart_button");
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
let loggedOut = false;
let authRequestId = 0;
let viewRequestId = 0;

document.addEventListener('DOMContentLoaded', async () => {
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
    cartButton?.addEventListener("click", async event => {
        event.preventDefault();
        await showCartPage();
    });
    connectButton?.addEventListener("click", event => {
        event.preventDefault();
        const returnUrl = new URL(window.location.href);
        window.location.assign(`${API_URL}/user/whoami?redirect_url=${encodeURIComponent(returnUrl.href)}`);
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
    window.addEventListener("cart:add", event => {
        try {
            cart.add(event.detail?.variantId, event.detail?.quantity);
            notification.show("Article ajouté au panier.", "success");
        } catch (error) {
            notification.show(error.message || "Impossible d'ajouter cet article.", "validation");
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
    } else if (params.has("order_success")) {
        await showOrderStatus(params.get("order_success"), { addHistory: false, fromOrders: false });
    } else if (params.has("order")) {
        await showOrderStatus(params.get("order"), { addHistory: false, fromOrders: true });
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
        merchContainer.setDatas(merchData);
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

function navigationUrl(view = "home") {
    const url = new URL(window.location);
    ["project", "book", "track", "game", "merch", "cart", "orders", "page", "order_success", "order_cancel", "from", "search", "type", "order"].forEach(name => url.searchParams.delete(name));
    if (view === "projects") url.searchParams.set("search", "");
    if (view === "merch") url.searchParams.set("merch", "");
    if (view === "cart") url.searchParams.set("cart", "");
    if (view === "orders") url.searchParams.set("orders", "");
    return url;
}

async function showProjects(addHistory = true) {
    const requestId = ++viewRequestId;
    if (addHistory) {
        window.history.pushState({ view: "container" }, "", navigationUrl("projects"));
    }
    activeRenderer?.unload?.();
    activeRenderer = null;
    merchContainer?.renderers.forEach(renderer => renderer.unload?.());
    cartPage?.remove();
    cartPage = null;
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed");
    await ensureProjectContainer();
    if (requestId !== viewRequestId) return;
    projectContainer.create();
    showUrlProject();
}

async function showPage(identifier, addHistory = true) {
    ++viewRequestId;
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

async function showMerch(addHistory = true) {
    const requestId = ++viewRequestId;
    if (addHistory) {
        window.history.pushState({ view: "merch" }, "", navigationUrl("merch"));
    }
    activeRenderer?.unload?.();
    activeRenderer = null;
    projectContainer?.renderers.forEach(renderer => renderer.unload?.());
    cartPage?.remove();
    cartPage = null;
    homeElement?.classList.add("closed");
    projectContainerElement.classList.remove("closed");
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
    const products = merchContainer.datas.filter(isPublishedMerch);
    if (!products.length) return;

    const byNewest = [...products].sort((first, second) => {
        const firstId = Number(first.id);
        const secondId = Number(second.id);
        if (Number.isFinite(firstId) && Number.isFinite(secondId) && firstId !== secondId) return secondId - firstId;
        return (merchDate(second, "creation_date") ?? 0) - (merchDate(first, "creation_date") ?? 0);
    });
    const latest = byNewest[0];
    const featured = [{ item: latest, label: "Dernier ajout" }];
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
    const slides = featured.map(({ item, label }) => {
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
    if (addHistory) {
        window.history.pushState({ view: "home" }, "", navigationUrl("home"));
    }
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
    if (addHistory) window.history.pushState({ view: "cart" }, "", navigationUrl("cart"));
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
            onSubmit: (items, shipping) => createCheckout(items, shipping),
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
    connectButton.hidden = false;
    accessButton.hidden = true;
    logoutButton.hidden = true;
    cartButton.hidden = true;
    try {
        const response = await fetch(`${API_URL}/user/whoami`, {
            credentials: "include",
            cache: "no-store",
            redirect: "manual"
        });
        if (requestId !== authRequestId) return;
        const authenticated = response.ok;
        if (authenticated) loggedOut = false;
        connectButton.hidden = authenticated;
        accessButton.hidden = !authenticated;
        logoutButton.hidden = !authenticated;
        cartButton.hidden = !authenticated;
    } catch {
        if (requestId !== authRequestId) return;
        connectButton.hidden = false;
        accessButton.hidden = true;
        logoutButton.hidden = true;
        cartButton.hidden = true;
    }
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
    ++viewRequestId;
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
    ++viewRequestId;
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
