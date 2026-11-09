const API_URL = "https://api.melide.music";
const root = document.getElementById("cv-editor-root");
const params = new URLSearchParams(window.location.search);
const requestedAuthorId = params.get("author");
let availableAuthors = [];

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function field(labelText, value, options = {}) {
    const label = element("label", "cv_editor_field");
    label.append(element("span", "", labelText));
    const input = element(options.multiline ? "textarea" : "input");
    if (!options.multiline) input.type = options.type || "text";
    if (options.maxLength) input.maxLength = options.maxLength;
    input.value = value || "";
    label.append(input);
    return { label, input };
}

function setStatus(status, message, isError = false) {
    status.textContent = message;
    status.toggleAttribute("data-error", isError);
}

async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        credentials: "include",
        cache: "no-store",
        redirect: "manual",
        ...options
    });
    if (response.type === "opaqueredirect" || response.status === 0) {
        returnToLogin();
        throw new Error("Redirection vers la connexion…");
    }
    let result = {};
    try { result = await response.json(); } catch { }
    if (!response.ok) throw new Error(result.error || "La requête a échoué. Veuillez réessayer.");
    return result;
}

function returnToLogin() {
    const returnUrl = new URL(window.location.href);
    window.location.assign(`${API_URL}/user/whoami?redirect_url=${encodeURIComponent(returnUrl.href)}`);
}

function showPanel(title, message, linkLabel = "Retour à l’accueil", linkUrl = "/") {
    const panel = element("section", "cv_consent");
    panel.append(element("h1", "", title), element("p", "", message));
    const link = element("a", "", linkLabel);
    link.href = linkUrl;
    panel.append(link);
    root.replaceChildren(panel);
}

async function showConsent(author, termsVersion) {
    const panel = element("section", "cv_consent");
    panel.append(
        element("p", "cv_kicker", "Avant de commencer"),
        element("h1", "", "Conditions d’utilisation du CV"),
        element("p", "", "Le CV est facultatif. Il reste privé tant que vous ne le publiez pas. En le publiant, les informations et la photo choisies deviennent accessibles publiquement et peuvent être partagées ou référencées.")
    );
    const points = element("ul");
    [
        "Vous êtes responsable des informations et des droits sur la photo que vous ajoutez ; vérifiez-les et maintenez-les à jour.",
        "Melide ne garantit ni l’exactitude ni l’actualité des informations inscrites et ne peut garantir que le service soit disponible en permanence.",
        "N’inscrivez pas de données sensibles dont la publication pourrait vous porter préjudice. Vous pouvez repasser votre CV en brouillon à tout moment.",
        "Les données sont associées à votre profil d’auteur dans la base du site. Vous pouvez demander leur rectification ou suppression à john.teuira@melide.music."
    ].forEach(text => points.append(element("li", "", text)));
    panel.append(points);
    const terms = element("a", "", "Lire les conditions spécifiques du CV");
    terms.href = "/?page=legal/cv-conditions-d-utilisation.md";
    panel.append(terms);
    const privacy = element("a", "", "Consulter la politique de protection des données");
    privacy.href = "/?page=legal/politique-protection-donnees.md";
    panel.append(privacy);

    const label = element("label");
    const checkbox = element("input");
    checkbox.type = "checkbox";
    label.append(checkbox, document.createTextNode(" J’ai lu et j’accepte les conditions spécifiques d’utilisation du CV."));
    panel.append(label);
    const status = element("p", "cv_editor_status");
    status.setAttribute("role", "status");
    const actions = element("div", "cv_consent_actions");
    const accept = element("button", "", "Accepter et continuer");
    accept.type = "button";
    accept.disabled = true;
    checkbox.addEventListener("change", () => { accept.disabled = !checkbox.checked; });
    accept.addEventListener("click", async () => {
        accept.disabled = true;
        setStatus(status, "Enregistrement de votre accord…");
        try {
            await request(`/user/cv/${author.id}/consent`, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: JSON.stringify({ accepted: true, version: termsVersion })
            });
            await loadAuthorCv(author);
        } catch (error) {
            setStatus(status, error.message, true);
            accept.disabled = !checkbox.checked;
        }
    });
    const decline = element("button", "", "Refuser et retourner à l’accueil");
    decline.type = "button";
    decline.addEventListener("click", () => window.location.assign("/"));
    actions.append(accept, decline);
    panel.append(actions, status);
    root.replaceChildren(panel);
}

function createRepeatRow(container, titleValue = "", dateValue = "", periodValue = "") {
    const row = element("div", "cv_repeat_item");
    const date = field("Date", dateValue, { maxLength: 40 });
    const period = field("Durée", periodValue, { maxLength: 60 });
    const title = field("Poste / expérience", titleValue, { maxLength: 160 });
    const remove = element("button", "", "Supprimer");
    remove.type = "button";
    remove.addEventListener("click", () => row.remove());
    row.append(date.label, period.label, title.label, remove);
    container.append(row);
}

function createTraitRow(container, firstValue = "", secondValue = "") {
    const row = element("div", "cv_repeat_item cv_trait_item");
    const first = field("Qualité", firstValue, { maxLength: 60 });
    const second = field("Son contraste", secondValue, { maxLength: 60 });
    const remove = element("button", "", "Supprimer");
    remove.type = "button";
    remove.addEventListener("click", () => row.remove());
    row.append(first.label, second.label, remove);
    container.append(row);
}

function rowValues(container, fields) {
    return [...container.querySelectorAll(".cv_repeat_item")].map(row =>
        Object.fromEntries(fields.map((name, index) => [name, row.querySelectorAll("input")[index].value.trim()]))
    ).filter(item => Object.values(item).some(Boolean));
}

function renderEditor(author, cv) {
    const wrapper = element("div");
    const intro = element("header", "cv_editor_intro");
    const introCopy = element("div");
    introCopy.append(
        element("p", "cv_kicker", "Espace auteur"),
        element("h1", "", "Mon curriculum vitae"),
        element("p", "", `Profil auteur : ${author.name}`)
    );
    intro.append(introCopy);
    if (availableAuthors.length > 1) {
        const picker = element("label", "cv_author_picker");
        picker.append(element("span", "", "Profil auteur"));
        const select = element("select");
        availableAuthors.forEach(item => {
            const option = element("option", "", item.name);
            option.value = item.id;
            option.selected = item.id === author.id;
            select.append(option);
        });
        select.addEventListener("change", () => {
            window.location.assign(`/cv/edit/?author=${encodeURIComponent(select.value)}`);
        });
        picker.append(select);
        intro.append(picker);
    }

    const statusBanner = element("p", `cv_status_banner${cv.status === "published" ? " is_published" : ""}`);
    const updateStatusBanner = () => {
        statusBanner.classList.toggle("is_published", cv.status === "published");
        if (cv.status === "published") {
            const link = element("a", "", "Voir mon CV public");
            link.href = `/cv/?author=${encodeURIComponent(author.id)}`;
            statusBanner.replaceChildren(document.createTextNode("Publié · "), link);
        } else {
            statusBanner.textContent = "Brouillon privé · Seul vous pouvez consulter et modifier ce CV.";
        }
    };
    updateStatusBanner();
    const card = element("section", "cv_editor_card");
    const form = element("form", "cv_editor_form");
    const topGrid = element("div", "cv_editor_grid");
    const legalName = field("Nom légal", cv.legalName, { maxLength: 120 });
    legalName.input.autocomplete = "name";
    const role = field("Métier(s) / poste recherché", cv.role, { maxLength: 160 });
    topGrid.append(legalName.label, role.label);

    const colorsSection = element("section", "cv_editor_section");
    colorsSection.append(
        element("h2", "", "Couleurs du CV"),
        element("p", "", "La couleur d’accent habille le poste et les compétences ; la couleur d’information sert aux repères et en-têtes.")
    );
    const colorGrid = element("div", "cv_editor_grid");
    const accentColor = field("Couleur d’accent", cv.accentColor || "#285b40", { type: "color" });
    const infoColor = field("Couleur d’information", cv.infoColor || "#2f5d8a", { type: "color" });
    colorGrid.append(accentColor.label, infoColor.label);
    colorsSection.append(colorGrid);

    const photoSection = element("section", "cv_editor_section");
    photoSection.append(element("h2", "", "Photo du CV"), element("p", "", "La photo du CV est indépendante de la photo publique de votre profil auteur. JPEG, PNG ou WebP · 5 Mo maximum · recadrage carré et conversion WebP."));
    const photoRow = element("div", "cv_photo_row");
    const photoPreview = element("img", "cv_photo_preview");
    photoPreview.alt = "Aperçu de la photo du CV";
    photoPreview.src = cv.profileImage || "/assets/placeholder.webp";
    const photoControls = element("div", "cv_photo_controls");
    const photoInput = element("input");
    photoInput.type = "file";
    photoInput.accept = "image/jpeg,image/png,image/webp";
    const photoStatus = element("p", "cv_editor_notice");
    photoStatus.setAttribute("role", "status");
    photoInput.addEventListener("change", async () => {
        const file = photoInput.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            photoStatus.textContent = "La photo doit peser 5 Mo ou moins.";
            photoInput.value = "";
            return;
        }
        photoInput.disabled = true;
        photoStatus.textContent = "Recadrage et envoi de la photo…";
        try {
            const result = await request(`/user/cv/${author.id}/image`, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: file
            });
            cv.profileImage = result.profileImage;
            cv.hasCustomImage = true;
            cv.updatedAt = result.updatedAt;
            photoPreview.src = `${result.profileImage}?updated=${Date.now()}`;
            photoStatus.textContent = "Photo enregistrée.";
            footer.textContent = `Dernière mise à jour : ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(result.updatedAt))}`;
        } catch (error) {
            photoStatus.textContent = error.message;
        } finally {
            photoInput.disabled = false;
            photoInput.value = "";
        }
    });
    photoControls.append(photoInput, photoStatus);
    photoRow.append(photoPreview, photoControls);
    photoSection.append(photoRow);

    const experiencesSection = element("section", "cv_editor_section");
    experiencesSection.append(
        element("h2", "", "Expériences professionnelles"),
        element("p", "", "Ajoutez une date, une durée et un intitulé. Vous pouvez rester général si vous le souhaitez.")
    );
    const experiencesList = element("div", "cv_repeat_list");
    cv.experiences.forEach(item => createRepeatRow(experiencesList, item.title, item.date, item.period));
    const addExperience = element("button", "", "Ajouter une expérience");
    addExperience.type = "button";
    addExperience.className = "cv_add_button";
    addExperience.addEventListener("click", () => {
        if (experiencesList.children.length >= 30) return;
        createRepeatRow(experiencesList);
    });
    experiencesSection.append(experiencesList, addExperience);

    const skillsSection = element("section", "cv_editor_section");
    skillsSection.append(element("h2", "", "Mes compétences"), element("p", "", "Une compétence par ligne, jusqu’à 12."));
    const skills = field("Savoir-faire", cv.skills.join("\n"), { multiline: true });
    skills.input.maxLength = 1000;
    skillsSection.append(skills.label);

    const traitsSection = element("section", "cv_editor_section");
    traitsSection.append(
        element("h2", "", "Qui je suis"),
        element("p", "", "Présentez-vous par contrastes : « Artistique » mais « Efficace », « Rêveur » mais « Ambitieux ». Jusqu’à 8 paires.")
    );
    const traitsList = element("div", "cv_repeat_list");
    cv.traits.forEach(item => createTraitRow(traitsList, item.first, item.second));
    const addTrait = element("button", "", "Ajouter une paire");
    addTrait.type = "button";
    addTrait.className = "cv_add_button";
    addTrait.addEventListener("click", () => {
        if (traitsList.children.length >= 8) return;
        createTraitRow(traitsList);
    });
    traitsSection.append(traitsList, addTrait);

    const actions = element("div", "cv_editor_actions");
    const saveDraft = element("button", "", cv.status === "published" ? "Repasser en brouillon" : "Enregistrer le brouillon");
    saveDraft.type = "submit";
    saveDraft.value = "draft";
    saveDraft.className = "cv_action_primary";
    const publish = element("button", "", cv.status === "published" ? "Enregistrer et publier" : "Publier mon CV");
    publish.type = "submit";
    publish.value = "published";
    publish.className = "cv_action_publish";
    const preview = element("a", "cv_editor_preview", "Aperçu privé");
    preview.href = `/cv/?author=${encodeURIComponent(author.id)}&preview=draft`;
    preview.target = "_blank";
    preview.rel = "noopener";
    actions.append(saveDraft, publish, preview);
    const status = element("p", "cv_editor_status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const footer = element("p", "cv_editor_notice", cv.updatedAt
        ? `Dernière mise à jour : ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(cv.updatedAt))}`
        : "Votre CV n’a pas encore été enregistré.");

    const previewHelp = element("p", "cv_editor_notice", "L’aperçu affiche la dernière version enregistrée. Enregistrez d’abord vos modifications pour les y voir.");
    form.append(topGrid, colorsSection, photoSection, experiencesSection, skillsSection, traitsSection, actions, previewHelp, status, footer);
    form.addEventListener("submit", async event => {
        event.preventDefault();
        const submitter = event.submitter;
        const nextStatus = submitter?.value === "published" ? "published" : "draft";
        const data = {
            legalName: legalName.input.value.trim(),
            role: role.input.value.trim(),
            experiences: rowValues(experiencesList, ["date", "period", "title"]).map(item => ({
                date: item.date,
                period: item.period,
                title: item.title
            })),
            skills: skills.input.value.split(/\r?\n/).map(item => item.trim()).filter(Boolean),
            traits: rowValues(traitsList, ["first", "second"]),
            accentColor: accentColor.input.value,
            infoColor: infoColor.input.value,
            status: nextStatus
        };
        const submitButtons = [...actions.querySelectorAll("button[type=submit]")];
        submitButtons.forEach(button => { button.disabled = true; });
        setStatus(status, nextStatus === "published" ? "Publication du CV…" : "Enregistrement…");
        try {
            const updated = await request(`/user/cv/${author.id}`, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: JSON.stringify(data)
            });
            Object.assign(cv, updated);
            updateStatusBanner();
            footer.textContent = `Dernière mise à jour : ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(updated.updatedAt))}`;
            setStatus(status, updated.status === "published" ? "Votre CV est publié." : "Brouillon enregistré.");
            const newPublishLabel = actions.querySelector(".cv_action_publish");
            if (newPublishLabel) newPublishLabel.textContent = updated.status === "published" ? "Enregistrer et publier" : "Publier mon CV";
        } catch (error) {
            setStatus(status, error.message, true);
        } finally {
            submitButtons.forEach(button => { button.disabled = false; });
        }
    });
    card.append(form);
    wrapper.append(intro, statusBanner, card);
    root.replaceChildren(wrapper);
}

async function loadAuthorCv(author) {
    let cv = await request(`/user/cv/${author.id}`);
    if (cv.requiresConsent) {
        if (typeof cv.termsVersion !== "string") throw new Error("La version des conditions n’est pas valide.");
        await showConsent(author, cv.termsVersion);
        return;
    }
    if (!Array.isArray(cv.experiences) || !Array.isArray(cv.skills) || !Array.isArray(cv.traits)) {
        throw new Error("Les données du CV sont invalides.");
    }
    renderEditor(author, cv);
}

async function initialize() {
    try {
        const identityResponse = await fetch(`${API_URL}/user/whoami`, {
            credentials: "include",
            cache: "no-store",
            redirect: "manual"
        });
        if (identityResponse.type === "opaqueredirect" || identityResponse.status === 0 || !identityResponse.ok) {
            returnToLogin();
            return;
        }
        const authors = await request("/user/authors");
        if (!Array.isArray(authors) || authors.length === 0) {
            showPanel("Accès auteur requis", "Connectez-vous avec un compte associé à un profil auteur pour créer un CV.");
            return;
        }
        availableAuthors = authors;
        const selected = authors.find(author => String(author.id) === requestedAuthorId) || authors[0];
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("author", selected.id);
        window.history.replaceState({}, "", nextUrl);
        await loadAuthorCv(selected);
    } catch (error) {
        console.error("Could not load the CV editor.", error);
        showPanel("Impossible de charger l’éditeur", error.message || "Veuillez réessayer.");
    }
}

initialize();
