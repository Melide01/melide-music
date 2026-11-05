import { parseMarkdown } from "/js/Markdown.js";

function formattedDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date)
        : "";
}

export class NewsContainer {
    constructor(articles = []) {
        this.articles = Array.isArray(articles) ? articles : [];
        const params = new URLSearchParams(window.location.search);
        this.search = params.get("article_search") || params.get("news_search") || "";
        this.category = params.get("article_category") || params.get("news_category") || "";
        this.order = (params.get("article_order") || params.get("news_order")) === "asc" ? "asc" : "desc";
    }

    updateUrl() {
        const url = new URL(window.location);
        const setOrDelete = (key, value) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
        setOrDelete("article_search", this.search);
        setOrDelete("article_category", this.category);
        setOrDelete("article_order", this.order === "asc" ? "asc" : "");
        ["article_tag", "news_search", "news_category", "news_tag", "news_order"].forEach(key => url.searchParams.delete(key));
        window.history.replaceState(window.history.state, "", url);
    }

    render(container) {
        container.replaceChildren();
        container.classList.add("news_container");
        container.classList.remove("load");
        const section = document.createElement("section");
        section.className = "news_listing ver";
        const heading = document.createElement("h1");
        heading.textContent = "ARTICLES";

        const controls = document.createElement("div");
        controls.className = "news_filters ver";
        const filterFields = document.createElement("div");
        filterFields.className = "news_filter_fields";
        const search = document.createElement("input");
        search.type = "search";
        search.placeholder = "Rechercher un article";
        search.value = this.search;
        search.setAttribute("aria-label", "Rechercher un article");
        const category = document.createElement("select");
        category.setAttribute("aria-label", "Filtrer par catégorie");
        const allCategories = new Option("Toutes les catégories", "");
        category.add(allCategories);
        [...new Set(this.articles.map(article => article.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"))
            .forEach(value => category.add(new Option(value, value)));
        category.value = this.category;
        const searchLabel = document.createElement("label");
        searchLabel.className = "news_filter";
        searchLabel.append(document.createTextNode("Recherche"), search);
        const categoryLabel = document.createElement("label");
        categoryLabel.className = "news_filter";
        categoryLabel.append(document.createTextNode("Catégorie"), category);
        const order = document.createElement("div");
        order.className = "news_order_controls";
        order.setAttribute("role", "group");
        order.setAttribute("aria-label", "Trier les articles");
        const descending = document.createElement("button");
        descending.type = "button";
        descending.className = "news_order_button fa-solid fa-arrow-down-wide-short";
        descending.setAttribute("aria-label", "Les plus récents");
        descending.title = "Les plus récents";
        descending.setAttribute("aria-pressed", String(this.order === "desc"));
        const ascending = document.createElement("button");
        ascending.type = "button";
        ascending.className = "news_order_button fa-solid fa-arrow-up-wide-short";
        ascending.setAttribute("aria-label", "Les plus anciens");
        ascending.title = "Les plus anciens";
        ascending.setAttribute("aria-pressed", String(this.order === "asc"));
        order.append(descending, ascending);
        filterFields.append(searchLabel, categoryLabel, order);
        controls.appendChild(filterFields);
        const cards = document.createElement("div");
        cards.className = "news_cards ver";
        section.append(heading, controls, cards);
        container.appendChild(section);

        const update = () => {
            this.search = search.value.trim();
            this.category = category.value;
            this.updateUrl();
            this.renderCards(cards);
        };
        const setOrder = value => {
            this.order = value;
            descending.setAttribute("aria-pressed", String(value === "desc"));
            ascending.setAttribute("aria-pressed", String(value === "asc"));
            this.updateUrl();
            this.renderCards(cards);
        };
        search.addEventListener("input", update);
        category.addEventListener("change", update);
        descending.addEventListener("click", () => setOrder("desc"));
        ascending.addEventListener("click", () => setOrder("asc"));
        this.renderCards(cards);
    }

    renderCards(container) {
        const query = this.search.toLocaleLowerCase();
        const articles = this.articles.filter(article =>
            (!this.category || article.category === this.category) &&
            (!query || `${article.title} ${article.summary} ${article.category} ${(article.tags || []).join(" ")}`.toLocaleLowerCase().includes(query))
        ).sort((a, b) => {
            const dateA = Date.parse(a.published_at || a.updated_at || a.created_at) || 0;
            const dateB = Date.parse(b.published_at || b.updated_at || b.created_at) || 0;
            return (dateA - dateB) * (this.order === "asc" ? 1 : -1);
        });
        container.replaceChildren();
        if (!articles.length) {
            const empty = document.createElement("p");
            empty.textContent = "Aucun article ne correspond à ces filtres.";
            container.appendChild(empty);
            return;
        }
        articles.forEach(article => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "news_card";
            if (article.banner_url) {
                const thumbnail = document.createElement("img");
                thumbnail.className = "news_card_thumbnail";
                thumbnail.src = article.banner_url;
                thumbnail.alt = "";
                thumbnail.loading = "lazy";
                card.appendChild(thumbnail);
            }
            const details = document.createElement("div");
            details.className = "news_card_details ver";
            const meta = document.createElement("p");
            meta.className = "news_card_meta";
            meta.textContent = [article.category, formattedDate(article.published_at)].filter(Boolean).join(" · ");
            const title = document.createElement("h2");
            title.textContent = article.title;
            const summary = document.createElement("p");
            summary.textContent = article.summary;
            const tagList = document.createElement("div");
            tagList.className = "news_tags hor";
            (article.tags || []).forEach(value => {
                const tag = document.createElement("span");
                tag.textContent = value;
                tagList.appendChild(tag);
            });
            details.append(meta, title, summary, tagList);
            card.appendChild(details);
            card.addEventListener("click", () => card.dispatchEvent(new CustomEvent("news:select", { bubbles: true, detail: { article } })));
            container.appendChild(card);
        });
    }
}

export function renderNewsArticle(container, article) {
    container.replaceChildren();
    container.classList.add("news_container");
    const page = document.createElement("article");
    page.className = "news_article ver";
    const header = document.createElement("div");
    header.className = "news_article_header ver";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "nav back";
    back.textContent = "Retour aux articles";
    back.addEventListener("click", () => back.dispatchEvent(new CustomEvent("news:back", { bubbles: true })));
    const meta = document.createElement("p");
    meta.className = "news_card_meta";
    meta.textContent = [article.category, formattedDate(article.published_at), article.author_name].filter(Boolean).join(" · ");
    const title = document.createElement("h1");
    title.textContent = article.title;
    header.append(back, meta, title);
    if (article.banner_url) {
        const banner = document.createElement("img");
        banner.className = "news_article_banner";
        banner.src = article.banner_url;
        banner.alt = "";
        banner.fetchPriority = "high";
        header.appendChild(banner);
    }
    const summary = document.createElement("p");
    summary.className = "news_article_summary";
    summary.textContent = article.summary;
    const tags = document.createElement("div");
    tags.className = "news_tags hor";
    (article.tags || []).forEach(value => {
        const tag = document.createElement("span");
        tag.textContent = value;
        tags.appendChild(tag);
    });
    const profiles = document.createElement("div");
    profiles.className = "news_authors profile_container";
    if (article.author_name) {
        const profile = document.createElement("div");
        profile.className = "news_author_profile";
        if (article.author_thumbnail) {
            const portrait = document.createElement("img");
            portrait.src = article.author_thumbnail;
            portrait.alt = "";
            portrait.loading = "lazy";
            profile.appendChild(portrait);
        }
        const name = document.createElement("span");
        name.textContent = article.author_name;
        profile.appendChild(name);
        profiles.appendChild(profile);
    }
    const content = document.createElement("div");
    content.className = "news_article_content ver";
    content.innerHTML = parseMarkdown(article.content || "");
    header.append(summary, tags, profiles);
    page.append(header, content);
    container.appendChild(page);
}
