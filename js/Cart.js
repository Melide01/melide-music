const CART_STORAGE_KEY = "melide-cart-v1";
const API_URL = "https://api.melide.music";

export class Cart {
    constructor() {
        this.items = this.readItems();
    }

    readItems() {
        try {
            const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
            if (!Array.isArray(stored)) return [];
            return stored.filter(item =>
                Number.isInteger(Number(item?.variantId)) &&
                Number(item.variantId) > 0 &&
                Number.isInteger(Number(item?.quantity)) &&
                Number(item.quantity) > 0
            ).map(item => ({ variantId: Number(item.variantId), quantity: Math.min(100, Number(item.quantity)) }));
        } catch (error) {
            console.error("Could not read the saved cart.", error);
            return [];
        }
    }

    save() {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
        window.dispatchEvent(new CustomEvent("cart:change", { detail: { count: this.count() } }));
    }

    count() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    add(variantId, quantity = 1) {
        const id = Number(variantId);
        const amount = Number(quantity);
        if (!Number.isInteger(id) || id < 1 || !Number.isInteger(amount) || amount < 1 || amount > 100) {
            throw new Error("Invalid cart item.");
        }
        const existing = this.items.find(item => item.variantId === id);
        if (existing) existing.quantity = Math.min(100, existing.quantity + amount);
        else this.items.push({ variantId: id, quantity: amount });
        this.save();
    }

    update(variantId, quantity) {
        const id = Number(variantId);
        const amount = Number(quantity);
        if (!Number.isInteger(id) || !Number.isInteger(amount) || amount < 1 || amount > 100) return;
        const item = this.items.find(entry => entry.variantId === id);
        if (!item) return;
        item.quantity = amount;
        this.save();
    }

    remove(variantId) {
        this.items = this.items.filter(item => item.variantId !== Number(variantId));
        this.save();
    }

    clear() {
        this.items = [];
        this.save();
    }

    resolveItems(products) {
        return this.items.map(item => {
            for (const product of products) {
                const variant = product.variants?.find(entry => Number(entry.id) === item.variantId);
                if (variant) return { ...item, product, variant };
            }
            return null;
        }).filter(Boolean);
    }

    render(container, products, { onSubmit, onOrders, message = "" } = {}) {
        const section = document.createElement("section");
        section.className = "cart_page ver";
        const title = document.createElement("h2");
        title.textContent = "Panier et commande";
        section.appendChild(title);
        const ordersButton = document.createElement("button");
        ordersButton.type = "button";
        ordersButton.className = "cart_orders_toggle";
        ordersButton.textContent = "Mes commandes";
        ordersButton.addEventListener("click", () => onOrders());
        section.appendChild(ordersButton);
        if (message) {
            const notice = document.createElement("p");
            notice.className = "cart_notice";
            notice.textContent = message;
            section.appendChild(notice);
        }

        const resolvedItems = this.resolveItems(products);
        const list = document.createElement("div");
        list.className = "ver cart_items";
        const total = resolvedItems.reduce((sum, item) => sum + Number(item.variant.price ?? item.product.price) * item.quantity, 0);
        const currency = resolvedItems[0]?.product.currency || "EUR";
        resolvedItems.forEach(item => {
            const row = document.createElement("article");
            row.className = "hor align cart_item";
            const image = document.createElement("img");
            image.src = item.product.thumbnail || item.product.metadata?.thumbnail || "/assets/placeholder.webp";
            image.alt = item.product.name || item.product.title || "";
            const details = document.createElement("div");
            details.className = "ver fill";
            const name = document.createElement("strong");
            name.textContent = `${item.product.name || item.product.title} — ${item.variant.name}`;
            const price = document.createElement("span");
            price.textContent = this.formatPrice(Number(item.variant.price ?? item.product.price) * item.quantity, item.product.currency);
            const quantity = document.createElement("input");
            quantity.type = "number";
            quantity.min = "1";
            quantity.max = "100";
            quantity.value = String(item.quantity);
            quantity.setAttribute("aria-label", `Quantité : ${name.textContent}`);
            quantity.addEventListener("change", () => {
                const value = Number.parseInt(quantity.value, 10);
                if (value < 1 || value > 100 || !Number.isInteger(value)) {
                    quantity.value = String(item.quantity);
                    window.dispatchEvent(new CustomEvent("notification", {
                        detail: { message: "La quantité doit être comprise entre 1 et 100.", status: "validation" }
                    }));
                    return;
                }
                this.update(item.variantId, value);
                this.render(container, products, { onSubmit, onOrders, message });
            });
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Retirer";
            remove.addEventListener("click", () => {
                this.remove(item.variantId);
                this.render(container, products, { onSubmit, onOrders, message });
            });
            details.append(name, price);
            row.append(image, details, quantity, remove);
            list.appendChild(row);
        });
        const missingItems = this.items.length - resolvedItems.length;
        if (missingItems > 0) {
            const unavailable = document.createElement("p");
            unavailable.textContent = "Un ou plusieurs articles ne sont plus disponibles. Ils ont été retirés du panier.";
            section.appendChild(unavailable);
            const resolvedIds = new Set(resolvedItems.map(item => item.variantId));
            this.items = this.items.filter(item => resolvedIds.has(item.variantId));
            this.save();
        }
        if (!resolvedItems.length) {
            const empty = document.createElement("p");
            empty.textContent = "Votre panier est vide.";
            section.appendChild(empty);
            container.replaceChildren(section);
            return section;
        }

        section.appendChild(list);
        const totalLabel = document.createElement("strong");
        totalLabel.className = "cart_total";
        totalLabel.textContent = `Total articles : ${this.formatPrice(total, currency)}`;
        section.appendChild(totalLabel);

        const error = document.createElement("p");
        error.className = "cart_error";
        error.setAttribute("role", "alert");
        section.appendChild(error);

        const checkoutItems = () => this.items.map(item => ({
            merch_variant_id: item.variantId,
            quantity: item.quantity
        }));
        const startCheckout = document.createElement("button");
        startCheckout.type = "button";
        startCheckout.className = "cart_checkout_start";
        startCheckout.textContent = total === 0 ? "Obtenir gratuitement" : "Proceed to payment";

        const form = document.createElement("form");
        form.className = "ver cart_shipping";
        form.hidden = true;
        const formTitle = document.createElement("h3");
        formTitle.textContent = "Adresse de livraison";
        form.appendChild(formTitle);
        const loginHint = document.createElement("p");
        loginHint.textContent = "Connectez-vous avec Google via le bouton Connect avant de finaliser la commande.";
        form.appendChild(loginHint);
        const fields = [
            ["name", "Nom complet", "text", true],
            ["address1", "Adresse", "text", true],
            ["address2", "Complément d'adresse", "text", false],
            ["city", "Ville", "text", true],
            ["state", "Région", "text", false],
            ["postal_code", "Code postal", "text", true],
            ["country_code", "Code pays (ex. FR)", "text", true],
            ["phone", "Téléphone", "tel", false]
        ];
        fields.forEach(([name, labelText, type, required]) => {
            const label = document.createElement("label");
            label.textContent = labelText;
            const input = document.createElement("input");
            input.name = name;
            input.type = type;
            input.autocomplete = name === "address1" ? "address-line1" : name === "postal_code" ? "postal-code" : name === "name" ? "name" : name;
            input.required = required;
            if (name === "country_code") {
                input.value = "FR";
                input.maxLength = 2;
                input.pattern = "[A-Za-z]{2}";
            }
            label.appendChild(input);
            form.appendChild(label);
        });
        const checkout = document.createElement("button");
        checkout.type = "submit";
        checkout.textContent = "Continuer vers le paiement";
        form.appendChild(checkout);
        startCheckout.addEventListener("click", async () => {
            error.textContent = "";
            if (total > 0) {
                form.hidden = false;
                startCheckout.hidden = true;
                form.querySelector("input")?.focus();
                return;
            }
            startCheckout.disabled = true;
            try {
                await onSubmit(checkoutItems());
            } catch (requestError) {
                const message = requestError.message || "Impossible de confirmer la commande gratuite.";
                error.textContent = message;
                window.dispatchEvent(new CustomEvent("notification", {
                    detail: {
                        message,
                        status: /impossible de joindre|session cloudflare/i.test(message) ? "fatal" : "error"
                    }
                }));
                startCheckout.disabled = false;
            }
        });
        form.addEventListener("submit", async event => {
            event.preventDefault();
            error.textContent = "";
            checkout.disabled = true;
            try {
                const shipping = Object.fromEntries(new FormData(form).entries());
                await onSubmit(checkoutItems(), shipping);
            } catch (requestError) {
                const message = requestError.message || "Impossible de démarrer le paiement.";
                error.textContent = message;
                window.dispatchEvent(new CustomEvent("notification", {
                    detail: {
                        message,
                        status: /impossible de joindre|session cloudflare/i.test(message) ? "fatal" : "error"
                    }
                }));
                checkout.disabled = false;
            }
        });
        section.append(startCheckout);
        section.appendChild(form);
        container.replaceChildren(section);
        return section;
    }

    formatPrice(price, currency = "EUR") {
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(price);
    }
}

export async function createCheckout(items, shipping = undefined) {
    let response;
    try {
        response = await fetch(`${API_URL}/user/order`, {
            method: "POST",
            credentials: "include",
            redirect: "manual",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify({ items, ...(shipping ? { shipping } : {}) })
        });
    } catch (error) {
        console.error("Checkout request was blocked before the API returned a response.", error);
        throw new Error("Impossible de joindre l’API de commande. Vérifiez votre connexion, puis réessayez. Consultez la console du navigateur si le problème persiste.");
    }
    if (response.type === "opaqueredirect" || response.status === 0) {
        throw new Error("Votre session Cloudflare Access est absente ou expirée. Cliquez sur Connect, revenez au panier, puis réessayez.");
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) throw new Error("Connectez-vous avant de commander avec le bouton Connect.");
        throw new Error(result.error || "La création de la commande a échoué.");
    }
    if (result.free && result.order_id) {
        window.location.assign(`${window.location.origin}/?order_success=${encodeURIComponent(result.order_id)}`);
        return;
    }
    if (!result.checkout_url) throw new Error("L'adresse de paiement n'a pas été retournée par l'API.");
    window.location.assign(result.checkout_url);
}

export async function getOrderStatus(orderId) {
    const response = await fetch(`${API_URL}/user/order/${encodeURIComponent(orderId)}`, { credentials: "include" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Impossible de charger le statut de commande.");
    return result;
}

export async function getUserOrders() {
    const response = await fetch(`${API_URL}/user/orders`, {
        credentials: "include",
        cache: "no-store",
        redirect: "manual"
    });
    if (response.type === "opaqueredirect" || response.status === 0) {
        return { orders: [], ownedDigitalMerchIds: [], authenticated: false };
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Impossible de charger vos commandes.");
    if (!Array.isArray(result.orders) || !Array.isArray(result.ownedDigitalMerchIds)) {
        throw new Error("L’API a retourné une liste de commandes invalide.");
    }
    return { ...result, authenticated: true };
}
