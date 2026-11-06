const API_URL = "https://api.melide.music";
const root = document.getElementById("cv-root");
const params = new URLSearchParams(window.location.search);
const authorParam = params.get("author");
const isPrivatePreview = params.get("preview") === "draft";
const printButton = document.getElementById("cv-print-button");
const editorLink = document.getElementById("cv-editor-link");

printButton?.addEventListener("click", () => window.print());
if (isPrivatePreview && authorParam && editorLink) {
    editorLink.href = `/cv/edit/?author=${encodeURIComponent(authorParam)}`;
    editorLink.textContent = "Retour à l’éditeur";
}

function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function showMessage(title, message, linkText, href) {
    const panel = makeElement("section", "cv_empty");
    panel.append(makeElement("h1", "", title), makeElement("p", "", message));
    if (linkText && href) {
        const link = makeElement("a", "cv_primary_link", linkText);
        link.href = href;
        panel.append(link);
    }
    root.replaceChildren(panel);
}

function connectForPrivatePreview() {
    const returnUrl = new URL(window.location.href);
    window.location.assign(
        `${API_URL}/user/whoami?redirect_url=${encodeURIComponent(returnUrl.href)}`
    );
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

function renderCv(cv, isDraftPreview = false) {
    const paper = makeElement("article", "cv_paper");
    paper.style.setProperty("--cv-accent", cv.accentColor || "#285b40");
    paper.style.setProperty("--cv-info", cv.infoColor || "#2f5d8a");
    if (isDraftPreview) {
        paper.append(makeElement("p", "cv_draft_badge", "Brouillon · Aperçu privé"));
        paper.classList.add("is_draft_preview");
    }
    const hero = makeElement("header", "cv_hero");
    const identity = makeElement("div");
    identity.append(
        makeElement("p", "cv_kicker", "Curriculum vitae"),
        makeElement("h1", "cv_name", cv.legalName)
    );
    if (cv.role) identity.append(makeElement("p", "cv_role", cv.role));
    hero.append(identity);
    if (cv.profileImage) {
        const portraitFrame = makeElement("div", "cv_portrait");
        const portrait = makeElement("img");
        portrait.src = cv.profileImage;
        portrait.alt = `Portrait de ${cv.legalName}`;
        portrait.loading = "lazy";
        portraitFrame.append(portrait);
        hero.append(portraitFrame);
        const mobileLayout = window.matchMedia("screen and (max-width: 600px)");
        const printMedia = window.matchMedia("print");
        const syncPortraitSize = () => {
            if (!portraitFrame.isConnected) return;
            if (mobileLayout.matches) {
                portraitFrame.style.width = "";
                portraitFrame.style.height = "";
                return;
            }
            const height = Math.min(identity.offsetHeight, 320);
            portraitFrame.style.width = `${height}px`;
            portraitFrame.style.height = `${height}px`;
        };
        const portraitObserver = new ResizeObserver(syncPortraitSize);
        portraitObserver.observe(identity);
        const onMediaChange = () => requestAnimationFrame(syncPortraitSize);
        for (const media of [mobileLayout, printMedia]) {
            if (typeof media.addEventListener === "function") media.addEventListener("change", onMediaChange);
            else if (typeof media.addListener === "function") media.addListener(onMediaChange);
        }
        portrait.addEventListener("load", syncPortraitSize);
        portrait.addEventListener("error", () => {
            portraitObserver.disconnect();
            portraitFrame.remove();
        }, { once: true });
        syncPortraitSize();
    }
    paper.append(hero);

    if (cv.skills.length) {
        const section = makeElement("section", "cv_section");
        section.append(makeElement("p", "cv_section_kicker", "Savoir-faire"), makeElement("h2", "", "Compétences"));
        const list = makeElement("ul", "cv_skills");
        cv.skills.forEach(skill => list.append(makeElement("li", "", skill)));
        section.append(list);
        paper.append(section);
    }

    if (cv.experiences.length) {
        const section = makeElement("section", "cv_section");
        section.append(makeElement("p", "cv_section_kicker", "Parcours"), makeElement("h2", "", "Expériences professionnelles"));
        const table = makeElement("table", "cv_experiences");
        const head = makeElement("thead");
        const headingRow = makeElement("tr");
        ["Date", "Durée", "Poste / expérience"].forEach(label => headingRow.append(makeElement("th", "", label)));
        head.append(headingRow);
        const body = makeElement("tbody");
        cv.experiences.forEach(experience => {
            const row = makeElement("tr");
            [experience.date, experience.period, experience.title].forEach(value => row.append(makeElement("td", "", value)));
            body.append(row);
        });
        table.append(head, body);
        section.append(table);
        paper.append(section);
    }

    const footer = makeElement("footer", "cv_cv_footer");
    if (cv.traits.length) {
        const section = makeElement("section", "cv_section");
        section.append(makeElement("p", "cv_section_kicker", "Personnalité"), makeElement("h2", "", "Qui je suis"));
        const list = makeElement("ul", "cv_traits");
        cv.traits.forEach(trait => {
            const item = makeElement("li");
            item.append(
                makeElement("span", "", trait.first),
                makeElement("span", "", "↔"),
                makeElement("span", "", trait.second)
            );
            item.lastElementChild.previousElementSibling.setAttribute("aria-hidden", "true");
            list.append(item);
        });
        section.append(list);
        footer.append(section);
    }

    const updated = formatDate(cv.updatedAt);
    if (updated) footer.append(makeElement("p", "cv_last_updated", `Mis à jour le ${updated}`));
    if (footer.childElementCount) paper.append(footer);
    root.replaceChildren(paper);
    if (printButton) printButton.hidden = false;
}

async function loadCv() {
    if (!authorParam) {
        const landing = makeElement("section", "cv_landing");
        landing.append(
            makeElement("p", "cv_kicker", "Melide · Espace auteur"),
            makeElement("h1", "", "Votre parcours, à votre image."),
            makeElement("p", "", "Créez un CV professionnel en français, gardez-le privé tant qu’il est en brouillon, puis publiez-le quand vous le souhaitez.")
        );
        const link = makeElement("a", "cv_primary_link", "Créer ou modifier mon CV");
        link.href = "/cv/edit/";
        landing.append(link);
        root.replaceChildren(landing);
        return;
    }
    if (!/^[1-9]\d*$/.test(authorParam)) {
        showMessage("CV introuvable", "Le lien de ce CV n’est pas valide.", "Retour à l’accueil", "/");
        return;
    }
    try {
        const response = isPrivatePreview
            ? await fetch(`${API_URL}/user/cv/${encodeURIComponent(authorParam)}`, {
                credentials: "include",
                cache: "no-store",
                redirect: "manual"
            })
            : await fetch(`${API_URL}/public/cv/${encodeURIComponent(authorParam)}`, {
                cache: "no-store"
            });
        if (isPrivatePreview && (response.type === "opaqueredirect" || response.status === 0)) {
            connectForPrivatePreview();
            return;
        }
        if (response.status === 404) {
            showMessage("CV indisponible", isPrivatePreview
                ? "Ce CV est introuvable ou votre compte n’y a pas accès."
                : "Ce CV n’existe pas ou n’a pas été publié.", "Créer mon CV", "/cv/edit/");
            return;
        }
        const cv = await response.json();
        if (isPrivatePreview && cv.requiresConsent) {
            showMessage("Accord requis", "Acceptez les conditions du CV depuis l’éditeur pour afficher cet aperçu privé.", "Ouvrir l’éditeur", `/cv/edit/?author=${encodeURIComponent(authorParam)}`);
            return;
        }
        if (isPrivatePreview && !response.ok) {
            showMessage("Aperçu privé indisponible", response.status === 401
                ? "Connectez-vous avec le compte auteur qui gère ce CV."
                : cv.error || "Votre compte ne peut pas consulter cet aperçu.", "Ouvrir l’éditeur", `/cv/edit/?author=${encodeURIComponent(authorParam)}`);
            return;
        }
        if (!response.ok) throw new Error(cv.error || "Impossible de charger ce CV.");
        if (!cv.legalName || !Array.isArray(cv.skills) || !Array.isArray(cv.experiences) || !Array.isArray(cv.traits)) {
            throw new Error("Les informations de ce CV sont incomplètes.");
        }
        if (isPrivatePreview) {
            document.querySelector('meta[name="robots"]')?.setAttribute("content", "noindex, nofollow");
            if (cv.status === "draft") {
                document.title = `Brouillon privé - ${cv.legalName} | Melide`;
                renderCv(cv, true);
                return;
            }
        }
        document.title = `${cv.legalName} - Curriculum vitae | Melide`;
        renderCv(cv);
    } catch (error) {
        console.error("Could not load the public CV.", error);
        if (isPrivatePreview) {
            showMessage(
                "Aperçu privé indisponible",
                "Impossible de charger l’aperçu. Vérifiez votre connexion au compte auteur et réessayez.",
                "Ouvrir l’éditeur",
                `/cv/edit/?author=${encodeURIComponent(authorParam)}`
            );
            return;
        }
        showMessage("CV indisponible", "Une erreur est survenue pendant le chargement. Veuillez réessayer.", "Retour à l’accueil", "/");
    }
}

loadCv();
