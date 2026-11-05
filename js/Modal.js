export class Modal {
    constructor({ title = "", content = "", showInfoIcon = false } = {}) {
        this.dialog = document.createElement("dialog");
        this.dialog.className = "site_modal";
        const panel = document.createElement("section");
        panel.className = "site_modal_panel";
        if (title || showInfoIcon) {
            this.dialog.setAttribute("aria-label", title || "Information");
        }
        if (showInfoIcon) {
            const info = document.createElement("span");
            info.className = "site_modal_info";
            info.textContent = "i";
            info.setAttribute("aria-hidden", "true");
            panel.appendChild(info);
        }
        const body = document.createElement("div");
        body.className = "site_modal_content";
        if (content instanceof Node) body.appendChild(content);
        else body.textContent = String(content);
        const close = document.createElement("button");
        close.type = "button";
        close.className = "site_modal_close";
        close.textContent = "Fermer";
        close.addEventListener("click", () => this.close());
        panel.append(body, close);
        this.dialog.appendChild(panel);
        this.dialog.addEventListener("click", event => {
            if (event.target === this.dialog) this.close();
        });
        this.dialog.addEventListener("cancel", event => {
            event.preventDefault();
            this.close();
        });
        this.dialog.addEventListener("close", () => {
            window.clearTimeout(this.closeTimer);
            this.dialog.remove();
        }, { once: true });
        this.dialog.addEventListener("animationend", event => {
            if (event.target === this.dialog && event.animationName === "site-modal-out") {
                this.finishClose();
            }
        });
    }

    open() {
        document.body.appendChild(this.dialog);
        this.dialog.showModal();
        return this;
    }

    close() {
        if (!this.dialog.open || this.dialog.classList.contains("is-closing")) return;
        this.dialog.classList.add("is-closing");
        this.closeTimer = window.setTimeout(() => this.finishClose(), 250);
    }

    finishClose() {
        window.clearTimeout(this.closeTimer);
        if (this.dialog.open) this.dialog.close();
        else this.dialog.remove();
    }
}
