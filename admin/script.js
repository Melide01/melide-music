const API_BASE = "https://api.melide.music";
const status = document.getElementById("admin_login_status");
const login = document.getElementById("admin_login");

login.href = `${API_BASE}/user/whoami?redirect_url=${encodeURIComponent(window.location.href)}`;

async function loadAdmin() {
    try {
        const response = await fetch(`${API_BASE}/user/admin-interface`, {
            credentials: "include",
            redirect: "manual",
            cache: "no-store"
        });
        if (response.type === "opaqueredirect" || response.status === 401) {
            status.textContent = "Sign in with Cloudflare Access to continue.";
            return;
        }
        if (response.status === 403) {
            status.textContent = "Accès refusé. Vous n’êtes pas autorisé.";
            return;
        }
        if (!response.ok) throw new Error(`Request failed (${response.status}).`);

        const payload = await response.json();
        if (typeof payload.html !== "string" || typeof payload.script !== "string") {
            throw new Error("Invalid admin interface response.");
        }
        const page = new DOMParser().parseFromString(payload.html, "text/html");
        if (!page.querySelector("#admin_workbench")) throw new Error("Invalid admin interface.");
        document.body.replaceChildren(...page.body.childNodes);

        const script = document.createElement("script");
        script.type = "module";
        script.textContent = payload.script;
        script.addEventListener("error", () => {
            document.getElementById("admin_status").textContent = "Could not load the admin script.";
        });
        document.body.append(script);
    } catch (error) {
        const errorStatus = document.getElementById("admin_status") || status;
        errorStatus.textContent = `Could not load the admin interface: ${error.message}`;
    }
}

loadAdmin();
