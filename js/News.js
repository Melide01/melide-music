import { parseMarkdown } from "/js/Markdown.js";

function formattedDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date)
        : "";
}

function articleTimestamp(article) {
    const date = Date.parse(article.published_at || article.updated_at || article.created_at);
    return Number.isFinite(date) ? date : 0;
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

        const featured = this.createFeaturedCarousel();
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
        section.append(heading);
        if (featured) section.appendChild(featured);
        section.append(controls, cards);
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

    createFeaturedCarousel() {
        const byNewest = [...this.articles].sort((a, b) => articleTimestamp(b) - articleTimestamp(a));
        const newsCategory = byNewest.find(article => String(article.category || "").trim().toLocaleLowerCase() === "news");
        const latest = byNewest[0];
        const historyArticles = this.articles.filter(article =>
            String(article.category || "").trim().toLocaleLowerCase() === "histoire"
        );
        const randomHistory = historyArticles.length
            ? historyArticles[Math.floor(Math.random() * historyArticles.length)]
            : null;
        const featured = [
            newsCategory && { article: newsCategory, label: "Dernier article · News" },
            latest && { article: latest, label: "Dernier article" },
            randomHistory && { article: randomHistory, label: "À découvrir · Histoire" }
        ].filter(Boolean);
        if (!featured.length) return null;

        const carousel = document.createElement("section");
        carousel.className = "merch_featured";
        carousel.setAttribute("aria-label", "À la une des articles");
        const viewport = document.createElement("div");
        viewport.className = "merch_featured_viewport";
        const track = document.createElement("div");
        track.className = "merch_featured_track";
        const slides = featured.map(({ article, label }) => {
            const slide = document.createElement("div");
            slide.className = "merch_featured_slide";
            slide.setAttribute("role", "group");
            slide.setAttribute("aria-label", label);

            const card = document.createElement("button");
            card.type = "button";
            card.className = "merch_featured_item";
            card.setAttribute("aria-label", `${label} : ${article.title}`);
            const hero = document.createElement("span");
            hero.className = "merch_featured_hero";
            const image = document.createElement("img");
            image.src = article.banner_url || "/assets/mld_logo_all_white.png";
            image.alt = "";
            image.loading = "lazy";
            hero.appendChild(image);

            const details = document.createElement("span");
            details.className = "news_featured_metadata";
            const meta = document.createElement("span");
            meta.className = "news_featured_meta";
            meta.textContent = [article.category, formattedDate(article.published_at || article.updated_at || article.created_at)]
                .filter(Boolean)
                .join(" · ");
            const title = document.createElement("strong");
            title.textContent = article.title;
            const summary = document.createElement("span");
            summary.className = "news_featured_summary";
            summary.textContent = article.summary || "";
            details.append(meta, title, summary);
            if (Array.isArray(article.tags) && article.tags.length) {
                const tags = document.createElement("span");
                tags.className = "news_featured_tags";
                article.tags.forEach(value => {
                    const tag = document.createElement("span");
                    tag.textContent = value;
                    tags.appendChild(tag);
                });
                details.appendChild(tags);
            }
            hero.appendChild(details);
            card.appendChild(hero);
            card.addEventListener("click", () => {
                card.dispatchEvent(new CustomEvent("news:select", {
                    bubbles: true,
                    detail: { article }
                }));
            });
            slide.appendChild(card);
            track.appendChild(slide);
            return { slide, label };
        });
        viewport.appendChild(track);

        let activeSlide = 0;
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
        const updateSlide = () => {
            track.style.transform = `translateX(-${activeSlide * 100}%)`;
            slides.forEach(({ slide }, index) => {
                slide.inert = index !== activeSlide;
                slide.setAttribute("aria-hidden", String(index !== activeSlide));
                indicators[index].classList.toggle("selected", index === activeSlide);
                indicators[index].setAttribute("aria-current", String(index === activeSlide));
            });
        };
        carousel.append(viewport, controls);
        updateSlide();
        return carousel;
    }

    renderCards(container) {
        const query = this.search.toLocaleLowerCase();
        const articles = this.articles.filter(article =>
            (!this.category || article.category === this.category) &&
            (!query || `${article.title} ${article.summary} ${article.category} ${(article.tags || []).join(" ")}`.toLocaleLowerCase().includes(query))
        ).sort((a, b) => {
            return (articleTimestamp(a) - articleTimestamp(b)) * (this.order === "asc" ? 1 : -1);
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

export function renderNewsArticle(container, article, { backLabel = "Retour aux articles", onBack = null } = {}) {
    container.replaceChildren();
    container.classList.add("news_container");
    const page = document.createElement("article");
    page.className = "news_article ver";
    const header = document.createElement("div");
    header.className = "news_article_header ver";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "nav back";
    back.textContent = backLabel;
    back.addEventListener("click", () => {
        if (onBack) {
            onBack();
            return;
        }
        back.dispatchEvent(new CustomEvent("news:back", { bubbles: true }));
    });
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
    profiles.className = "news_authors pfp_display hor";
    const articleAuthors = Array.isArray(article.authors) && article.authors.length
        ? article.authors
        : article.author_name ? [{ name: article.author_name, thumbnail: article.author_thumbnail }] : [];
    articleAuthors.forEach(author => {
        const profile = document.createElement("span");
        profile.dataset.name = author.name || "";
        const portrait = document.createElement("img");
        portrait.src = author.thumbnail || "/assets/mld_logo_all_white.png";
        portrait.alt = author.name || "";
        portrait.loading = "lazy";
        profile.appendChild(portrait);
        profiles.appendChild(profile);
    });
    const content = document.createElement("div");
    content.className = "news_article_content ver";
    content.innerHTML = parseMarkdown(article.content || "");
    header.append(summary, tags, profiles);
    page.append(header, content);
    container.appendChild(page);
}
