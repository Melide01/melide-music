export class Merch {
    constructor(project = {}) {
        this.data = project && typeof project === "object" ? project : {};
        this.id = this.data.id;
        this.type = "merch";
        this.title = this.data.name || this.data.title || this.data.metadata?.title || "";
        this.state = this.data.state || (this.data.active ? "published" : "draft");
        this.metadata = this.data.metadata && typeof this.data.metadata === "object" ? this.data.metadata : {};
        this.allowMultiple = this.metadata.allow_multiple === true;
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

    // Extract the size from a variant: metadata.size, else the part after the
    // last "/" in the name (e.g. "RAW PAIN 1 / M" -> "M"), else the full name.
    variantSize(variant) {
        const metadata = variant?.metadata || {};
        if (typeof metadata.size === "string" && metadata.size.trim()) return metadata.size.trim();
        const name = String(variant?.name || "");
        const parts = name.split("/");
        if (parts.length > 1) {
            const last = parts[parts.length - 1].trim();
            if (last) return last;
        }
        return name;
    }

    variantColor(variant) {
        const metadata = variant?.metadata || {};
        return typeof metadata.color === "string" && metadata.color.trim() ? metadata.color.trim() : "";
    }

    // Group real DB variants by color -> sizes using their metadata.
    // Returns an array of { color, colorHex, sizes: [{ size, variant }] }.
    // Variants without a color go into a single "" group (size-only products).
    variantGroups() {
        const groups = new Map();
        const active = (this.data.variants || []).filter(variant => variant?.active !== false && variant?.id != null);
        for (const variant of active) {
            const metadata = variant?.metadata || {};
            const color = this.variantColor(variant);
            const colorHex = typeof metadata.color_hex === "string" && metadata.color_hex.trim() ? metadata.color_hex.trim() : (metadata.hex || "");
            const size = this.variantSize(variant);
            if (!groups.has(color)) groups.set(color, { color, colorHex, sizes: [] });
            const group = groups.get(color);
            if (colorHex && !group.colorHex) group.colorHex = colorHex;
            group.sizes.push({ size, variant });
        }
        return [...groups.values()];
    }

    hasColors() {
        return this.variantGroups().some(group => group.color !== "");
    }

    // Resolve the variant for a given color + size selection.
    findVariant(color, size) {
        const active = (this.data.variants || []).filter(variant => variant?.active !== false && variant?.id != null);
        if (!active.length) return null;
        const wantedColor = color || "";
        const byColorAndSize = active.find(variant => {
            if (this.variantColor(variant) !== wantedColor) return false;
            return !size || this.variantSize(variant) === size;
        });
        const resolved = byColorAndSize
            || (size ? active.find(variant => this.variantSize(variant) === size) : null)
            || active[0];
        console.log("[merch-debug] findVariant", { color, size, resolved: resolved ? { id: resolved.id, name: resolved.name, price: resolved.price } : null, activeCount: active.length });
        return resolved;
    }

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
        const collection = this.data.collection;
        if (collection && collection.pinned) {
            const label = document.createElement("span");
            label.className = "merch_collection_label";
            label.textContent = collection.name;
            if (collection.back_color) label.style.background = collection.back_color;
            if (collection.front_color) label.style.color = collection.front_color;
            visual.appendChild(label);
        }
        const title = document.createElement("h2");
        title.textContent = this.title;
        const price = document.createElement("p");
        price.textContent = this.formatPrice();
        card.append(visual, title, price, this.createMetadataDisplay());
        if ((!Array.isArray(this.data.variants) || !this.data.variants.length) && this.colors().length) card.insertBefore(this.createColorControl("card"), title);
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

        // Collection label + description (clothes only), above the size radios.
        const collection = this.data.collection;
        let collectionBlock = null;
        if (collection) {
            collectionBlock = document.createElement("div");
            collectionBlock.className = "merch_collection_block";
            const label = document.createElement("span");
            label.className = "merch_collection_tag";
            label.textContent = collection.name;
            if (collection.back_color) label.style.background = collection.back_color;
            if (collection.front_color) label.style.color = collection.front_color;
            collectionBlock.appendChild(label);
            if (collection.description) {
                const description = document.createElement("p");
                description.className = "merch_collection_description";
                description.textContent = collection.description;
                if (collection.back_color) description.style.color = collection.back_color;
                if (collection.front_color) description.style.background = collection.front_color;
                collectionBlock.appendChild(description);
            }
        }

        const controls = document.createElement("div"); controls.className = "ver align merch_controls";
        const buy = document.createElement("div"); buy.className = "hor fill buy";
        const quantity = document.createElement("input"); quantity.className = "except"; quantity.type = "number"; quantity.min = "1"; quantity.max = "100"; quantity.value = "1"; quantity.setAttribute("aria-label", "Quantité");

        // Variant selection: group by color -> sizes. No color box when there are no colors.
        const groups = this.variantGroups();
        const hasColors = this.hasColors();
        const selection = { color: hasColors ? (groups.find(group => group.color)?.color ?? null) : null, size: null };
        const sizeContainer = document.createElement("div");
        sizeContainer.className = "merch_size_container";

        if (this.allowMultiple) buy.appendChild(quantity);
        const addButton = this.createAddButton("page");
        const priceDisplay = document.createElement("span");
        priceDisplay.className = "merch_price_live";
        priceDisplay.setAttribute("role", "status");
        priceDisplay.setAttribute("aria-live", "polite");
        buy.append(priceDisplay, addButton);

        const syncPrice = () => {
            const variant = this.findVariant(selection.color, selection.size);
            const unit = variant?.price ?? this.price;
            if (unit === "" || unit == null || !Number.isFinite(Number(unit))) {
                priceDisplay.textContent = this.formatPrice(unit);
                return;
            }
            const amount = this.allowMultiple
                ? Number(unit) * Math.max(1, Math.min(100, Number.parseInt(quantity.value || "1", 10) || 1))
                : Number(unit);
            priceDisplay.textContent = this.formatPrice(amount);
        };
        const syncQuantity = () => { quantity.hidden = this.isFreeDigital(this.findVariant(selection.color, selection.size)); };
        const syncAll = () => { syncPrice(); syncQuantity(); };

        const renderSizes = () => {
            sizeContainer.replaceChildren();
            const group = hasColors ? groups.find(entry => entry.color === selection.color) : groups[0];
            const sizes = group && group.sizes.length ? group.sizes : (groups[0]?.sizes || []);
            selection.size = sizes[0]?.size ?? null;
            if (sizes.length) sizeContainer.appendChild(this.createSizeSelectControl(sizes, selection));
            syncAll();
        };
        const colorControl = hasColors ? this.createColorSwatchControl(groups, selection, renderSizes) : null;
        if (colorControl) controls.appendChild(colorControl);
        if (collectionBlock) controls.appendChild(collectionBlock);
        controls.appendChild(sizeContainer);
        controls.appendChild(buy);
        merch.append(intro, controls);
        section.appendChild(merch);
        this.element = section;
        this.selection = selection;
        renderSizes();
        sizeContainer.addEventListener("change", syncAll);
        quantity.addEventListener("input", syncPrice);
        if (from instanceof Element) from.classList.add("closed");
        document.querySelector("header")?.after(section);
        return section;
    }

    // Color swatches; selecting one re-renders the sizes for that color.
    createColorSwatchControl(groups, selection, onChange) {
        const control = document.createElement("div");
        control.className = "grid merch_colors";
        groups.filter(group => group.color).forEach((group, index) => {
            const label = document.createElement("label");
            label.style.setProperty("--text", JSON.stringify(group.color));
            label.style.setProperty("--color", group.colorHex || this.colorVariable(group.color));
            const input = document.createElement("input");
            input.type = "radio";
            input.name = `merch-color-${this.id || this.title}`;
            input.value = group.color;
            input.checked = index === 0;
            input.setAttribute("aria-label", group.color);
            input.addEventListener("change", () => {
                if (!input.checked) return;
                selection.color = group.color;
                onChange();
            });
            label.appendChild(input);
            control.appendChild(label);
        });
        return control;
    }

    // Size radio buttons for the currently selected color group.
    createSizeSelectControl(sizes, selection) {
        this.sizeRenderCount = (this.sizeRenderCount || 0) + 1;
        const groupName = `merch-size-${this.id || this.title}-${this.sizeRenderCount}`;
        const control = document.createElement("div");
        control.className = "hor merch_sizes";
        sizes.forEach(({ size }, index) => {
            const label = document.createElement("label");
            label.textContent = size;
            const input = document.createElement("input");
            input.type = "radio";
            input.name = groupName;
            input.value = size;
            input.checked = index === 0;
            input.addEventListener("change", () => {
                if (input.checked) {
                    selection.size = size;
                    console.log("[merch-debug] size selected", size, "selection:", JSON.stringify(selection));
                }
            });
            label.appendChild(input);
            control.appendChild(label);
        });
        return control;
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

    isFreeDigital(variant = null) {
        const price = variant?.price ?? this.price;
        return this.isDigital() && price !== "" && price != null && Number(price) === 0;
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
        icon.setAttribute("aria-hidden", "true");
        button.appendChild(icon);
        const firstVariant = this.data.variants?.find(variant => variant?.active !== false && variant?.id != null);
        this.updateAddButton(button, firstVariant);
        const activeVariants = (this.data.variants || []).filter(variant => variant?.active !== false && variant?.id != null);
        button.disabled = activeVariants.length === 0;
        button.addEventListener("click", event => {
            event.stopPropagation();
            if (button.disabled) return;
            let variant = null;
            if (context === "page" && this.selection) {
                variant = this.findVariant(this.selection.color, this.selection.size);
            } else if (Array.isArray(this.data.variants) && this.data.variants.length) {
                variant = this.data.variants.find(item => item?.active !== false && item?.id != null);
            }
            const quantityInput = context === "page" ? this.element?.querySelector(".buy input[type=number]") : null;
            const quantity = this.allowMultiple && !this.isFreeDigital(variant)
                ? Math.max(1, Math.min(100, Number.parseInt(quantityInput?.value || "1", 10) || 1))
                : 1;
            const variantId = variant?.id ?? null;
            if (variantId == null) {
                window.dispatchEvent(new CustomEvent("cart:error", { detail: { message: "Cette variante n'est pas disponible." } }));
                return;
            }
            const eventName = this.isFreeDigital(variant) ? "merch:free-download" : "cart:add";
            window.dispatchEvent(new CustomEvent(eventName, {
                detail: { variantId, quantity, merchId: this.id }
            }));
        });
        return button;
    }

    updateAddButton(button, variant = null) {
        const freeDigital = this.isFreeDigital(variant);
        const label = freeDigital ? "Télécharger" : this.isUpcoming() ? "Précommander" : "Ajouter au panier";
        const icon = button.querySelector("i");
        if (icon) icon.className = `fa-solid ${freeDigital ? "fa-download" : this.isUpcoming() ? "fa-calendar-plus" : "fa-cart-shopping"}`;
        button.setAttribute("aria-label", label);
        button.title = label;
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