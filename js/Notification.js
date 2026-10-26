export class Notification {
    constructor() {
        this.element = null;
        this.timeout = null;
    }

    show(message, status = "success", duration = 3500) {
        if (!["fatal", "error", "validation", "success"].includes(status)) {
            throw new Error(`Unsupported notification status: ${status}`);
        }
        if (!this.element) {
            this.element = document.createElement("div");
            this.element.className = "global_notification";
            this.element.setAttribute("role", "status");
            this.element.setAttribute("aria-live", "polite");
            document.body.appendChild(this.element);
        }
        window.clearTimeout(this.timeout);
        this.element.className = `global_notification is_${status}`;
        this.element.dataset.status = status;
        this.element.textContent = message;
        this.element.hidden = false;
        this.timeout = window.setTimeout(() => {
            this.element?.remove();
            this.element = null;
        }, duration);
    }
}
