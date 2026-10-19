export class Merch {
    constructor(project = {}) {
        this.data = project && typeof project === "object" ? project : {};
        this.id = this.data.id;
        this.type = "merch";
        this.title = this.data.title || this.data.metadata?.title || "";
        this.state = this.data.state || "draft";
        this.metadata = this.data.metadata && typeof this.data.metadata === "object" ? this.data.metadata : {};
        this.thumbnail = this.metadata.thumbnail || this.metadata.visuals?.[0] || "/assets/placeholder.webp";
        this.visuals = Array.isArray(this.metadata.visuals) && this.metadata.visuals.length ? this.metadata.visuals : [this.thumbnail];
        this.price = this.metadata.price ?? this.data.price ?? "";
        this.variants = this.normalizeVariants(this.metadata.available_variants);
        this.card = null;
        this.element = null;
    }

    normalizeVariants(availableVariants) {
        if (Array.isArray(availableVariants)) {
            return availableVariants.map(variant => {
                if (typeof variant === "string") return { color: variant, sizes: [] };
                return { color: variant?.color || variant?.name || variant?.label || "", sizes: Array.isArray(variant?.sizes) ? variant.sizes : [] };
            }).filter(variant => variant.color);
        }
        if (availableVariants && typeof availableVariants === "object") return Object.entries(availableVariants).map(([color, sizes]) => ({ color, sizes: Array.isArray(sizes) ? sizes : [] }));
        const colors = Array.isArray(this.metadata.colors) ? this.metadata.colors : [];
        const sizes = Array.isArray(this.metadata.sizes) ? this.metadata.sizes : [];
        return colors.map(color => ({ color: typeof color === "string" ? color : color?.name || "", sizes })).filter(variant => variant.color);
    }

    colors() { return this.variants.map(variant => variant.color).filter((color, index, values) => values.indexOf(color) === index); }
    sizes() { return this.variants.flatMap(variant => variant.sizes).filter((size, index, values) => values.indexOf(size) === index); }

    colorVariable(color) {
        const slug = String(color)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        return `var(--printful-${slug || "default"})`;
    }

    isUpcoming() {
        const releaseDate = new Date(this.data.release_date || this.data.released_date).getTime();
        return Number.isFinite(releaseDate) && releaseDate > Date.now();
    }

    create(onSelect = null, element = "article") {
        const card = document.createElement(element);
        card.className = "merch ver";
        card.dataset.projectType = "merch";
        const visual = document.createElement("div");
        visual.className = "visual ver";
        const image = document.createElement("img");
        image.src = this.thumbnail;
        image.alt = this.title;
        image.loading = "lazy";
        const quickAction = document.createElement("div");
        quickAction.className = "ver right";
        quickAction.appendChild(this.createAddButton());
        visual.append(image, quickAction);
        const title = document.createElement("h2");
        title.textContent = this.title;
        const price = document.createElement("p");
        price.textContent = this.formatPrice();
        card.append(visual, this.createColorControl("card"), title, price, this.createMetadataDisplay());
        this.card = card;
        card.addEventListener("click", () => {
            card.dispatchEvent(new CustomEvent("project:select", { bubbles: true, detail: { project: this.data, renderer: this } }));
            if (typeof onSelect === "function") onSelect(this.data, this);
        });
        return card;
    }

    load(alert = "", from = null) {
        this.unload();
        const section = document.createElement("section");
        section.className = "ver";
        if (from) section.appendChild(this.createNavigation());
        if (alert) { const pill = document.createElement("span"); pill.className = "pill"; pill.textContent = alert; section.appendChild(pill); }
        const merch = document.createElement("div"); merch.className = "merch merch_page ver";
        const intro = document.createElement("div"); intro.className = "ver except merch_intro";
        const title = document.createElement("h2"); title.textContent = this.title;
        const visual = document.createElement("div"); visual.className = "merch_visual";
        const image = document.createElement("img"); image.src = this.visuals[0]; image.alt = this.title; image.tabIndex = 0;
        let visualIndex = 0;
        const visualControls = [];
        const showVisual = index => {
            visualIndex = index;
            image.src = this.visuals[visualIndex];
            visualControls.forEach((control, controlIndex) => control.classList.toggle("selected", controlIndex === visualIndex));
        };
        image.addEventListener("click", () => showVisual((visualIndex + 1) % this.visuals.length));
        visual.appendChild(image);
        this.visuals.forEach((source, index) => {
            const control = document.createElement("button"); control.type = "button"; control.textContent = String(index + 1);
            control.addEventListener("click", () => showVisual(index));
            visualControls.push(control);
            visual.appendChild(control);
        });
        showVisual(0);
        intro.append(title, visual);

        const controls = document.createElement("div"); controls.className = "ver align merch_controls";
        const buy = document.createElement("div"); buy.className = "hor fill buy";
        const quantity = document.createElement("input"); quantity.className = "except"; quantity.type = "number"; quantity.min = "1"; quantity.value = "1"; quantity.setAttribute("aria-label", "Quantité");
        buy.append(quantity, this.createAddButton());
        controls.append(this.createColorControl("page"), this.createSizeControl(), buy);
        merch.append(intro, controls);
        section.appendChild(merch);
        this.element = section;
        if (from instanceof Element) from.classList.add("closed");
        document.querySelector("header")?.after(section);
        return section;
    }

    createColorControl(context) {
        const control = document.createElement("div"); control.className = "grid merch_colors";
        this.colors().forEach((color, index) => {
            const label = document.createElement("label");
            label.style.setProperty("--text", JSON.stringify(color));
            label.style.setProperty("--color", this.colorVariable(color));
            const input = document.createElement("input"); input.type = "radio"; input.name = `${context}-merch-color-${this.id || this.title}`; input.value = color; input.checked = index === 0;
            input.setAttribute("aria-label", color);
            label.appendChild(input); control.appendChild(label);
        });
        return control;
    }

    createSizeControl() {
        const control = document.createElement("div"); control.className = "hor merch_sizes";
        this.sizes().forEach((size, index) => {
            const label = document.createElement("label"); label.textContent = size;
            const input = document.createElement("input"); input.type = "radio"; input.name = `merch-size-${this.id || this.title}`; input.value = size; input.checked = index === 0;
            label.appendChild(input); control.appendChild(label);
        });
        return control;
    }

    createMetadataDisplay() {
        const metadata = document.createElement("div"); metadata.className = "hor fill align merch_metadata";
        [["is_full_cotton", "100% coton"], ["is_full_synthetic", "Synthétique"], ["is_best_seller", "Best seller"], ["is_artist_pinned", "Choix de l'artiste"], ["is_new", "Nouveau"]]
            .filter(([key]) => this.metadata[key]).forEach(([, label]) => { const tag = document.createElement("span"); tag.className = "metadata_tag"; tag.textContent = label; metadata.appendChild(tag); });
        return metadata;
    }

    createAddButton() {
        const button = document.createElement("button"); button.type = "button"; button.textContent = this.isUpcoming() ? "Bientôt disponible" : "Ajouter au panier"; button.disabled = this.isUpcoming();
        button.addEventListener("click", event => event.stopPropagation());
        return button;
    }

    formatPrice() { return this.price === "" || this.price == null ? "Prix indisponible" : typeof this.price === "number" ? `${this.price.toFixed(2)} €` : String(this.price); }

    createNavigation() {
        const button = document.createElement("button"); button.className = "nav back"; button.type = "button"; button.textContent = "Retour";
        button.addEventListener("click", () => button.dispatchEvent(new CustomEvent("project:back", { bubbles: true, detail: { renderer: this } })));
        return button;
    }

    unload() { this.element?.remove(); this.element = null; }
}