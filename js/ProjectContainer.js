import { Track } from "/js/Track.js";
import { Book } from "/js/Book.js";
import { VideoGame } from "/js/Game.js";
import { Merch } from "/js/Merch.js";

export class ProjectContainer {
    constructor(container, datas = [], options = {}) {
        this.container = container instanceof Element ? container : null;
        this.datas = Array.isArray(datas) ? datas : [];
        this.filteredDatas = [...this.datas];
        this.renderers = [];
        this.position = 1;
        this.projectsPerPage = 7;
        this.searchValue = "";
        this.filterValue = "all";
        this.order = "desc";
        this.forcedType = typeof options.type === "string" ? options.type.toLowerCase() : null;
        this.ownedDigitalMerchIds = new Set();
        this.contextFilters = {};
        this.contextControls = null;
        this.controls = null;
        this.pagination = null;
    }

    readUrlState() {
        const params = new URLSearchParams(window.location.search);
        const type = params.get("type");
        this.searchValue = (params.get("search") || "").trim().toLocaleLowerCase();
        this.order = params.get("order") === "asc" ? "asc" : "desc";
        if (!this.forcedType && ["all", "tracks", "books", "video_games"].includes(type)) {
            this.filterValue = type;
        }
    }

    updateUrlState() {
        const url = new URL(window.location);
        if (this.searchValue) url.searchParams.set("search", this.searchValue);
        else url.searchParams.delete("search");
        if (this.forcedType) url.searchParams.delete("type");
        else if (this.filterValue !== "all") url.searchParams.set("type", this.filterValue);
        else url.searchParams.delete("type");
        if (this.order === "desc") url.searchParams.delete("order");
        else url.searchParams.set("order", this.order);
        window.history.replaceState(window.history.state, "", url);
    }

    create() {
        if (!this.container) return null;

        this.readUrlState();
        this.renderers.forEach(renderer => renderer.unload?.());
        this.renderers = [];
        this.container.classList.toggle("merch_container", this.forcedType === "merch");
        this.container.classList.add("load");
        this.container.classList.remove("closed");
        this.container.replaceChildren();
        this.createSearchControls();
        this.createPaginationControls();
        if (this.datas.length) {
            this.reload();
            this.container.classList.remove("load");
        } else {
            this.createSkeletons();
        }
        return this.container;
    }

    createSkeletons() {
        for (let index = 0; index < this.projectsPerPage; index++) {
            const card = document.createElement("div");
            card.className = "project_skeleton track hor";
            const image = document.createElement("img");
            const content = document.createElement("div");
            content.className = "ver";
            const title = document.createElement("h2");
            const description = document.createElement("span");
            content.append(title, description);
            card.append(image, content);
            this.container.insertBefore(card, this.pagination);
        }
    }

    setDatas(datas = []) {
        this.datas = Array.isArray(datas) ? datas : [];
        this.filteredDatas = [...this.datas];
        this.position = 1;
        this.reload();
        this.container?.classList.remove("load");
        return this.container;
    }

    createSearchControls() {
        const search = document.createElement("div");
        search.id = "search_controls";
        search.className = "search ver fill";

        const filters = document.createElement("div");
        filters.className = "hor fill explicative_icons";
        const typeFilters = [
            ["Toutes", "all", ""],
            ["Musiques", "tracks", "fa-solid fa-music"],
            ["Livres", "books", "fa-solid fa-book"],
            ["Jeux Vidéo", "video_games", "fa-solid fa-gamepad"]
        ];
        if (!this.forcedType) typeFilters.forEach(([label, value, iconClass]) => {
            const labelElement = document.createElement("label");
            if (value === "all") labelElement.className = "except";
            if (iconClass) {
                const icon = document.createElement("i");
                icon.className = iconClass;
                labelElement.appendChild(icon);
            }
            const text = document.createElement("p");
            text.textContent = label;
            const input = document.createElement("input");
            input.type = "radio";
            input.name = "filter";
            input.value = value;
            input.checked = value === this.filterValue;
            input.addEventListener("change", () => {
                this.filterValue = input.value;
                this.contextFilters = {};
                this.renderContextualFilters();
                this.updateUrlState();
                this.setPage(1);
            });
            labelElement.append(text, input);
            filters.appendChild(labelElement);
        });

        const searchRow = document.createElement("div");
        searchRow.className = "hor align";
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = "Rechercher...";
        const button = document.createElement("input");
        button.type = "button";
        button.className = "except";
        button.value = "Rechercher";
        const submit = () => {
            this.searchValue = input.value.trim().toLocaleLowerCase();
            this.updateUrlState();
            this.setPage(1);
        };
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") submit();
        });
        button.addEventListener("click", submit);
        searchRow.append(input, button);

        const orderRow = document.createElement("div");
        orderRow.className = "hor";
        const select = document.createElement("select");
        const ascending = document.createElement("option");
        ascending.value = "asc";
        ascending.textContent = "Anciens";
        const descending = document.createElement("option");
        descending.value = "desc";
        descending.textContent = "Récents";
        select.append(descending, ascending);
        select.value = this.order;
        select.addEventListener("change", () => {
            this.order = select.value === "desc" ? "desc" : "asc";
            this.updateUrlState();
            this.setPage(1);
        });
        orderRow.appendChild(select);

        this.contextControls = document.createElement("div");
        this.contextControls.className = "hor align contextual_filters";
        search.append(filters, searchRow, orderRow, this.contextControls);
        this.container.appendChild(search);
        this.controls = { search, input, button, select };
        input.value = this.searchValue;
        select.value = this.order;
        this.renderContextualFilters();
    }

    createPaginationControls() {
        const pagination = document.createElement("div");
        pagination.id = "pagination_controls";
        pagination.className = "search fill";
        pagination.style.maxWidth = "unset";
        this.container.appendChild(pagination);
        this.pagination = pagination;
    }

    createRenderer(project) {
        if (["merch", "merchandise"].includes(String(project?.type || "").toLowerCase())) {
            const renderer = new Merch(project);
            renderer.owned = this.ownedDigitalMerchIds.has(String(project.id));
            return renderer;
        }
        switch (String(project?.type || "").toLowerCase()) {
            case "track": return new Track(project, { albumRenderer: this.createAlbumRenderer(project) });
            case "book": return new Book(project);
            case "videogame":
            case "video_game":
            case "game": return new VideoGame(project);
            default: return null;
        }
    }

    setOwnedDigitalMerchIds(ids = []) {
        this.ownedDigitalMerchIds = new Set(ids.map(id => String(id)));
        this.reload();
    }

    createAlbumRenderer(track) {
        if (Array.isArray(track?.album_tracks)) return null;
        const album = this.albumDescriptor(track);
        if (!album) return null;
        const tracks = this.datas.filter(project =>
            String(project?.type || "").toLowerCase() === "track" &&
            this.albumDescriptor(project)?.key === album.key
        );
        if (!tracks.length) return null;
        const group = this.groupAlbums(tracks, true).find(project => project.__album_group);
        return group ? new Track(group) : null;
    }

    albumDescriptor(project) {
        const metadata = project?.metadata && typeof project.metadata === "object" ? project.metadata : {};
        const album = project?.album ?? metadata.album;
        if (album && typeof album === "object") {
            const key = album.id ?? album._id ?? album.title ?? album.name;
            if (key === undefined || key === null || !String(key).trim()) return null;
            return {
                key: String(key),
                title: String(album.title || album.name || project.album_title || metadata.album_title || key),
                thumbnail: album.thumbnail || album.cover || album.image || project.album_thumbnail || metadata.album_thumbnail || ""
            };
        }

        const key = typeof album === "string" && album.trim()
            ? album.trim()
            : project?.album_id ?? metadata.album_id ?? project?.album_title ?? metadata.album_title;
        if (key === undefined || key === null || !String(key).trim()) return null;
        return {
            key: String(key),
            title: String(project?.album_title || metadata.album_title || album || key),
            thumbnail: project?.album_thumbnail || metadata.album_thumbnail || project?.album_cover || metadata.album_cover || ""
        };
    }

    groupAlbums(projects, force = false) {
        if (this.searchValue && !force) return projects;

        const grouped = [];
        const albums = new Map();
        projects.forEach(project => {
            const album = this.albumDescriptor(project);
            if (!album) {
                grouped.push(project);
                return;
            }

            let group = albums.get(album.key);
            if (!group) {
                group = { ...project, __album_group: true, album_key: album.key, album_title: album.title, album_tracks: [] };
                albums.set(album.key, group);
                grouped.push(group);
            }
            group.album_tracks.push(project);
            if (!group.album_thumbnail && album.thumbnail) group.album_thumbnail = album.thumbnail;
        });

        grouped.forEach(group => {
            if (!group.__album_group) return;
            const getOrder = track => track.album_order !== null && track.album_order !== undefined && String(track.album_order).trim()
                ? track.album_order
                : track.metadata?.album_order;
            const hasOrder = group.album_tracks.some(track => {
                const order = getOrder(track);
                return order !== null && order !== undefined && String(order).trim() !== "";
            });
            group.album_tracks.sort((first, second) => {
                if (hasOrder) {
                    const firstOrder = Number(getOrder(first));
                    const secondOrder = Number(getOrder(second));
                    const firstHasOrder = Number.isFinite(firstOrder);
                    const secondHasOrder = Number.isFinite(secondOrder);
                    if (firstHasOrder && secondHasOrder && firstOrder !== secondOrder) return firstOrder - secondOrder;
                    if (firstHasOrder !== secondHasOrder) return firstHasOrder ? -1 : 1;
                }
                const firstTitle = String(first?.title || first?.metadata?.title || "");
                const secondTitle = String(second?.title || second?.metadata?.title || "");
                return firstTitle.localeCompare(secondTitle);
            });

            const album = this.albumDescriptor(group.album_tracks[0]);
            group.title = album.title;
            group.metadata = { ...group.metadata, thumbnail: group.album_thumbnail || group.metadata?.thumbnail };
        });
        return grouped;
    }

    prepareDatas() {
        return this.datas
            .filter(project => {
                if (this.filterValue !== "all" && !this.matchesFilter(project)) return false;
                if (this.forcedType && !this.matchesType(project, this.forcedType)) return false;
                if (!this.matchesContextFilters(project)) return false;
                if (!this.searchValue) return true;
                const title = project?.title || project?.metadata?.title || "";
                const description = project?.metadata?.description || "";
                return `${title} ${description}`.toLocaleLowerCase().includes(this.searchValue);
            })
            .sort((first, second) => {
                const firstDate = new Date(first?.release_date || first?.released_date).getTime();
                const secondDate = new Date(second?.release_date || second?.released_date).getTime();
                const firstHasDate = Number.isFinite(firstDate);
                const secondHasDate = Number.isFinite(secondDate);

                if (firstHasDate && secondHasDate && firstDate !== secondDate) {
                    return this.order === "desc" ? secondDate - firstDate : firstDate - secondDate;
                }
                if (firstHasDate !== secondHasDate) return firstHasDate ? -1 : 1;

                const firstTitle = String(first?.title || first?.metadata?.title || "").toLocaleLowerCase();
                const secondTitle = String(second?.title || second?.metadata?.title || "").toLocaleLowerCase();
                return this.order === "desc"
                    ? secondTitle.localeCompare(firstTitle)
                    : firstTitle.localeCompare(secondTitle);
            });
    }

    matchesFilter(project) {
        const type = String(project?.type || "").toLowerCase();
        if (this.filterValue === "tracks") return type === "track";
        if (this.filterValue === "books") return type === "book";
        if (this.filterValue === "video_games") return ["videogame", "video_game", "game"].includes(type);
        if (this.filterValue === "merch") return ["merch", "merchandise"].includes(type);
        return true;
    }

    matchesType(project, type) {
        const projectType = String(project?.type || "").toLowerCase();
        return type === "merch" ? ["merch", "merchandise"].includes(projectType) : projectType === type;
    }

    contextType() {
        if (this.forcedType) return this.forcedType;
        if (this.filterValue === "books") return "book";
        if (this.filterValue === "video_games") return "game";
        if (this.filterValue === "tracks") return "track";
        if (this.filterValue === "merch") return "merch";
        return null;
    }

    contextOptions(contextType, key) {
        const values = this.datas.filter(project => this.matchesType(project, contextType)).flatMap(project => {
            const variants = project?.metadata?.available_variants;
            if (contextType === "merch" && key === "color") return Array.isArray(variants) ? variants.map(variant => typeof variant === "string" ? variant : variant?.color || variant?.name) : Object.keys(variants || {});
            if (contextType === "merch" && key === "size") return Array.isArray(variants) ? variants.flatMap(variant => variant?.sizes || []) : Object.values(variants || {}).flat();
            return [project?.metadata?.[key]];
        });
        return values.filter(value => typeof value === "string" && value.trim()).filter((value, index, all) => all.indexOf(value) === index).sort();
    }

    renderContextualFilters() {
        if (!this.contextControls) return;
        this.container.classList.toggle("merch_container", this.contextType() === "merch");
        this.contextControls.replaceChildren();
        const contextType = this.contextType();
        const filterDefinitions = contextType === "book" ? [["Genre", "genre"]] : contextType === "game" ? [["Plateforme", "platform"]] : contextType === "track" ? [["Genre", "genre"]] : contextType === "merch" ? [["Couleur", "color"], ["Taille", "size"]] : [];
        filterDefinitions.forEach(([label, key]) => {
            const values = this.contextOptions(contextType, key);
            if (!values.length) return;
            const select = document.createElement("select");
            const all = document.createElement("option"); all.value = ""; all.textContent = label; select.appendChild(all);
            values.forEach(value => { const option = document.createElement("option"); option.value = value; option.textContent = value; select.appendChild(option); });
            select.value = this.contextFilters[key] || "";
            select.addEventListener("change", () => { this.contextFilters[key] = select.value; this.setPage(1); });
            this.contextControls.appendChild(select);
        });
    }

    matchesContextFilters(project) {
        return Object.entries(this.contextFilters).every(([key, value]) => {
            if (!value) return true;
            const variants = project?.metadata?.available_variants;
            if (this.matchesType(project, "merch")) {
                if (key === "color") return Array.isArray(variants) ? variants.some(variant => (typeof variant === "string" ? variant : variant?.color || variant?.name) === value) : Object.prototype.hasOwnProperty.call(variants || {}, value);
                if (key === "size") return Array.isArray(variants) ? variants.some(variant => variant?.sizes?.includes(value)) : Object.values(variants || {}).flat().includes(value);
            }
            return project?.metadata?.[key] === value;
        });
    }

    reload() {
        if (!this.container) return null;
        this.filteredDatas = this.groupAlbums(this.prepareDatas());
        const pageCount = Math.max(1, Math.ceil(this.filteredDatas.length / this.projectsPerPage));
        this.position = Math.min(Math.max(1, this.position), pageCount);

        this.renderers.forEach(renderer => renderer.unload?.());
        this.renderers = [];
        this.container.querySelectorAll(":scope > .project_skeleton, :scope > .track, :scope > .album, :scope > .book, :scope > .game, :scope > .merch").forEach(card => card.remove());

        const start = (this.position - 1) * this.projectsPerPage;
        this.filteredDatas.slice(start, start + this.projectsPerPage).forEach(project => {
            const renderer = this.createRenderer(project);
            if (!renderer) return;
            this.renderers.push(renderer);
            this.container.insertBefore(renderer.create(), this.pagination);
        });
        this.renderPagination(pageCount);
        return this.container;
    }

    renderPagination(pageCount) {
        const row = document.createElement("div");
        row.className = "hor right";
        const pages = document.createElement("div");
        pages.className = "hor";
        const addPage = (page, label = page) => {
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = String(label);
            if (page === this.position) {
                link.classList.add("selected");
                link.setAttribute("aria-current", "page");
            }
            link.addEventListener("click", event => {
                event.preventDefault();
                this.setPage(page);
            });
            pages.appendChild(link);
        };

        const start = Math.max(1, this.position === 1 ? 1 : this.position - 1);
        const end = Math.min(pageCount, this.position === 1 ? 4 : this.position + 3);
        if (start > 1) addPage(1, "...");
        for (let page = start; page <= end; page++) addPage(page);
        if (end < pageCount) addPage(pageCount, "...");

        const navigation = document.createElement("div");
        navigation.className = "hor right";
        const previous = document.createElement("button");
        previous.type = "button";
        previous.textContent = "<";
        previous.disabled = this.position <= 1;
        previous.addEventListener("click", () => this.move(-1));
        const next = document.createElement("button");
        next.type = "button";
        next.textContent = ">";
        next.disabled = this.position >= pageCount;
        next.addEventListener("click", () => this.move(1));
        navigation.append(previous, next);
        row.append(pages, navigation);
        this.pagination.replaceChildren(row);
    }

    move(dir) {
        const pageCount = Math.max(1, Math.ceil(this.filteredDatas.length / this.projectsPerPage));
        return this.setPage(this.position + Number(dir || 0), pageCount);
    }

    setPage(page, pageCount = Math.max(1, Math.ceil(this.filteredDatas.length / this.projectsPerPage))) {
        const nextPage = Number.parseInt(page, 10);
        this.position = Number.isFinite(nextPage) ? Math.min(Math.max(1, nextPage), pageCount) : 1;
        return this.reload();
    }
}