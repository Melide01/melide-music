export class Merch {
    constructor(project = {}) {
        this.data = project && typeof project === "object" ? project : {};
        this.id = this.data.id;
        this.type = "merch";
        this.title = this.data.name || this.data.title || this.data.metadata?.title || "";
        this.state = this.data.state || (this.data.active ? "published" : "draft");
        this.metadata = this.data.metadata && typeof this.data.metadata === "object" ? this.data.metadata : {};
        this.thumbnail = this.data.thumbnail || this.metadata.thumbnail || this.metadata.visuals?.[0] || "/assets/placeholder.webp";
        this.visuals = Array.isArray(this.metadata.visuals) && this.metadata.visuals.length ? this.metadata.visuals : [this.thumbnail];
        this.price = this.data.price ?? this.metadata.price ?? "";
        this.currency = this.data.currency || "EUR";
        this.variants = Array.isArray(this.data.variants) && this.data.variants.length
            ? this.data.variants.filter(variant => variant?.active !== false && variant?.id != null)
            : this.normalizeVariants(this.metadata.available_variants);
        this.card = null;
        this.element = null;
        this.owned = false;
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
        const releaseDate = new Date(this.data.release_date || this.data.released_date || this.metadata.release_date).getTime();
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
        quickAction.appendChild(this.createAddButton("card"));
        visual.append(image, quickAction);
        const title = document.createElement("h2");
        title.textContent = this.title;
        const price = document.createElement("p");
        price.textContent = this.formatPrice();
        card.append(visual, title, price, this.createMetadataDisplay());
        if (!Array.isArray(this.data.variants) || !this.data.variants.length) card.insertBefore(this.createColorControl("card"), title);
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
        const variantControl = this.createVariantControl();
        if (variantControl) controls.appendChild(variantControl);
        else controls.append(this.createColorControl("page"), this.createSizeControl());
        buy.append(quantity, this.createAddButton("page"));
        controls.appendChild(buy);
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
        if (this.owned && this.isDigital()) {
            const tag = document.createElement("span");
            tag.className = "metadata_tag merch_owned";
            tag.textContent = "Own";
            metadata.appendChild(tag);
        }
        return metadata;
    }

    isDigital() {
        return this.metadata.digital_product === true;
    }

    createVariantControl() {
        if (!Array.isArray(this.data.variants) || !this.data.variants.length) return null;
        const label = document.createElement("label");
        label.className = "ver merch_variant_control";
        label.textContent = "Variante";
        const select = document.createElement("select");
        select.className = "merch_variant_select";
        this.data.variants.filter(variant => variant?.active !== false && variant?.id != null).forEach(variant => {
            const option = document.createElement("option");
            option.value = String(variant.id);
            option.textContent = `${variant.name} — ${this.formatPrice(variant.price ?? this.price)}`;
            select.appendChild(option);
        });
        label.appendChild(select);
        return label;
    }

    createAddButton(context = "card") {
        const button = document.createElement("button");
        button.type = "button";
        if (this.owned && this.isDigital()) {
            button.className = "pill merch_add_button merch_owned_button";
            const icon = document.createElement("i");
            icon.className = "fa-solid fa-check";
            icon.setAttribute("aria-hidden", "true");
            button.appendChild(icon);
            button.setAttribute("aria-label", "Own — Mes commandes");
            button.title = "Own — Mes commandes";
            button.addEventListener("click", event => {
                event.stopPropagation();
                window.dispatchEvent(new CustomEvent("merch:orders", {
                    detail: { merchId: this.id }
                }));
            });
            return button;
        }
        const upcoming = this.isUpcoming();
        button.className = `pill merch_add_button${upcoming ? " is_preorder" : ""}`;
        const icon = document.createElement("i");
        icon.className = `fa-solid ${upcoming ? "fa-calendar-plus" : "fa-cart-shopping"}`;
        icon.setAttribute("aria-hidden", "true");
        const label = upcoming ? "Précommander" : "Ajouter au panier";
        button.appendChild(icon);
        button.disabled = !this.variants.some(variant => variant?.active !== false && variant?.id != null);
        button.setAttribute("aria-label", label);
        button.title = label;
        button.addEventListener("click", event => {
            event.stopPropagation();
            if (button.disabled) return;
            const variantSelect = this.element?.querySelector(".merch_variant_select");
            const legacyColor = this.element?.querySelector(".merch_colors input:checked")?.value;
            const legacySize = this.element?.querySelector(".merch_sizes input:checked")?.value;
            const variant = Array.isArray(this.data.variants) && this.data.variants.length
                ? this.data.variants.find(item =>
                    item?.active !== false &&
                    item?.id != null &&
                    String(item.id) === (context === "page" ? variantSelect?.value : String(this.data.variants.find(option => option?.active !== false && option?.id != null)?.id))
                )
                : null;
            const quantityInput = context === "page" ? this.element?.querySelector(".buy input[type=number]") : null;
            const quantity = Math.max(1, Math.min(100, Number.parseInt(quantityInput?.value || "1", 10) || 1));
            const variantId = variant?.id ?? this.findLegacyVariantId(legacyColor, legacySize);
            if (variantId == null) {
                window.dispatchEvent(new CustomEvent("cart:error", { detail: { message: "Cette variante n'est pas disponible." } }));
                return;
            }
            window.dispatchEvent(new CustomEvent("cart:add", { detail: { variantId, quantity } }));
        });
        return button;
    }

    findLegacyVariantId(color, size) {
        const variant = this.variants.find(item => {
            const metadata = item?.metadata || {};
            return (!color || metadata.color === color) && (!size || metadata.size === size);
        });
        return variant?.id ?? this.variants[0]?.id ?? null;
    }

    formatPrice(price = this.price) {
        if (price === "" || price == null || !Number.isFinite(Number(price))) return "Prix indisponible";
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: this.currency }).format(Number(price));
    }

    createNavigation() {
        const button = document.createElement("button"); button.className = "nav back"; button.type = "button"; button.textContent = "Retour";
        button.addEventListener("click", () => button.dispatchEvent(new CustomEvent("project:back", { bubbles: true, detail: { renderer: this } })));
        return button;
    }

    unload() { this.element?.remove(); this.element = null; }
}