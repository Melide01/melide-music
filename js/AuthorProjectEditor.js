function makeInput(labelText, type, value, className = "") {
    const label = document.createElement("label");
    label.className = "author_editor_field";
    const caption = document.createElement("span");
    caption.textContent = labelText;
    const input = document.createElement(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") input.type = type;
    input.value = value ?? "";
    if (className) input.className = className;
    label.append(caption, input);
    return { label, input };
}

function localDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function makeButton(label, icon, className = "author_editor_icon") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.title = label;
    const glyph = document.createElement("i");
    glyph.className = icon;
    glyph.setAttribute("aria-hidden", "true");
    button.appendChild(glyph);
    return button;
}

function addLinkRow(rows, link = {}) {
    const row = document.createElement("div");
    row.className = "author_editor_link_row";
    const label = makeInput("Nom du lien", "text", link.label || "");
    const address = makeInput("Adresse", "url", link.url || "");
    address.input.placeholder = "https://…";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "author_editor_remove";
    remove.textContent = "Supprimer";
    remove.addEventListener("click", () => row.remove());
    row.append(label.label, address.label, remove);
    rows.appendChild(row);
}

function normalizedLinks(links) {
    if (!Array.isArray(links)) return [];
    return links.map(link => {
        const value = typeof link === "string" ? { url: link } : { ...link };
        const markdown = String(value.url || "").match(/^\[([^\]]+)\]\((.+)\)$/);
        return markdown ? { ...value, label: value.label || markdown[1], url: markdown[2] } : value;
    }).filter(link => typeof link.url === "string" && link.url.trim());
}

export function translateAuthorError(message, fallback) {
    const translations = {
        "Author not found": "Auteur introuvable.",
        "Project not found": "Projet introuvable.",
        "Only the author name can be changed": "Seul le nom de l’auteur peut être modifié ici.",
        "Author name must contain between 1 and 100 characters": "Le nom doit contenir entre 1 et 100 caractères.",
        "Choose an image to upload.": "Choisissez une image à envoyer.",
        "The image must be 5 MB or smaller.": "L’image doit faire 5 Mo ou moins.",
        "Choose a PNG, JPEG, WebP, or GIF image.": "Choisissez une image PNG, JPEG, WebP ou GIF.",
        "The file could not be processed as an image.": "Le fichier ne peut pas être traité comme une image valide.",
        "You can upload only one profile picture per calendar month.": "Vous ne pouvez envoyer qu’une photo de profil par mois.",
        "Profile image uploads are not configured.": "L’envoi de photos de profil n’est pas encore configuré.",
        "Could not save the profile picture. Please try again later.": "Impossible d’enregistrer la photo de profil. Réessayez plus tard.",
        "Project title must contain between 1 and 250 characters": "Le titre doit contenir entre 1 et 250 caractères.",
        "Creation date must be a valid date": "La date de création n’est pas valide.",
        "Release date must be a valid date": "La date de sortie n’est pas valide.",
        "Project metadata must be an object": "Les informations du projet ne sont pas valides.",
        "Project metadata is too large": "Les informations du projet sont trop volumineuses.",
        "Project thumbnail URL is too long": "L’adresse de l’image du projet est trop longue.",
        "Project links must be an array": "La liste des liens du projet n’est pas valide.",
        "Project link must be a valid HTTP or HTTPS URL or site-relative path": "Chaque lien doit être une adresse HTTP(S) valide ou un chemin du site."
    };
    if (translations[message]) return translations[message];
    return /[àâçéèêëîïôûùüÿœ’]/i.test(message || "") ? message : fallback;
}

export function createAuthorProjectEditor(project, root, onSave, initialStatus = "") {
    const editor = document.createElement("form");
    editor.className = "author_project_editor";
    const toolbar = document.createElement("div");
    toolbar.className = "author_project_toolbar";
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "author_editor_save";
    save.textContent = "Sauvegarder";
    const status = document.createElement("p");
    status.className = "author_editor_status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = initialStatus;
    toolbar.append(save, status);
    editor.appendChild(toolbar);

    const metadata = project.metadata && typeof project.metadata === "object" ? { ...project.metadata } : {};
    const title = root.querySelector(".track h2, .book h2, .game h2");
    const titleInput = makeInput("Titre du projet", "text", project.title);
    titleInput.input.required = true;
    titleInput.input.maxLength = 250;
    titleInput.label.hidden = true;
    if (title) {
        const titleButton = makeButton("Modifier le titre", "fa-solid fa-pen");
        titleButton.classList.add("author_editor_title_button");
        title?.after(titleButton, titleInput.label);
        titleButton.addEventListener("click", () => {
            titleInput.label.hidden = !titleInput.label.hidden;
            if (!titleInput.label.hidden) titleInput.input.focus();
        });
    } else {
        editor.appendChild(titleInput.label);
    }

    const image = root.querySelector(".track img, .book img, .game img");
    const imageSurface = root.querySelector(".game .game_hero_container") ||
        image?.closest(".track_thumbnail, .game_icon") ||
        image?.parentElement;
    const thumbnailInput = makeInput("Adresse de l’image", "text", metadata.thumbnail || "");
    thumbnailInput.input.placeholder = "https://… ou /assets/…";
    thumbnailInput.label.hidden = true;
    if (imageSurface) {
        imageSurface.classList.add("author_editor_image_surface");
        const imageButton = makeButton("Modifier l’image", "fa-solid fa-pen");
        imageButton.classList.add("author_editor_image_button");
        imageSurface.append(imageButton, thumbnailInput.label);
        imageButton.addEventListener("click", () => {
            thumbnailInput.label.hidden = !thumbnailInput.label.hidden;
            if (!thumbnailInput.label.hidden) thumbnailInput.input.focus();
        });
    } else {
        editor.appendChild(thumbnailInput.label);
    }

    const infoToggle = document.createElement("button");
    infoToggle.type = "button";
    infoToggle.className = "author_editor_text_button";
    infoToggle.textContent = "Modifier les informations";
    const infoFields = document.createElement("div");
    infoFields.className = "author_editor_info_fields";
    infoFields.hidden = true;
    const description = makeInput("Description", "textarea", metadata.description || "");
    description.input.rows = 3;
    const album = makeInput("Album", "text", metadata.album || "");
    const albumOrder = makeInput("Ordre dans l’album", "number", metadata.album_order ?? "");
    albumOrder.input.min = "1";
    albumOrder.input.step = "1";
    const creationDate = makeInput("Date de création", "datetime-local", localDateTime(project.creation_date));
    const releaseDate = makeInput("Date de sortie", "datetime-local", localDateTime(project.release_date));
    infoFields.append(description.label, album.label, albumOrder.label, creationDate.label, releaseDate.label);
    infoToggle.addEventListener("click", () => {
        infoFields.hidden = !infoFields.hidden;
        if (!infoFields.hidden) description.input.focus();
    });

    const controls = document.createElement("div");
    controls.className = "author_editor_controls";
    controls.append(infoToggle);
    let lyricsInput = null;
    if (String(project.type).toLowerCase() === "track") {
        const lyrics = makeInput("Paroles", "textarea", metadata.lyrics || "");
        lyrics.input.rows = 10;
        lyrics.input.classList.add("author_editor_lyrics");
        lyrics.label.hidden = true;
        const lyricsToggle = document.createElement("button");
        lyricsToggle.type = "button";
        lyricsToggle.className = "author_editor_text_button";
        lyricsToggle.textContent = metadata.lyrics ? "Modifier les paroles" : "Ajouter des paroles";
        lyricsToggle.addEventListener("click", () => {
            lyrics.label.hidden = !lyrics.label.hidden;
            if (!lyrics.label.hidden) lyrics.input.focus();
        });
        controls.append(lyricsToggle);
        editor.appendChild(lyrics.label);
        lyricsInput = lyrics.input;
    }

    const linksContainer = root.querySelector(".call_action");
    const linksEditor = document.createElement("div");
    linksEditor.className = "author_editor_links";
    linksEditor.hidden = true;
    normalizedLinks(metadata.links).forEach(link => addLinkRow(linksEditor, link));
    const addLink = document.createElement("button");
    addLink.type = "button";
    addLink.className = "author_editor_text_button";
    addLink.textContent = "Ajouter un lien";
    addLink.addEventListener("click", () => addLinkRow(linksEditor));
    linksEditor.appendChild(addLink);
    const toggleLinks = document.createElement("button");
    toggleLinks.type = "button";
    toggleLinks.className = "author_editor_text_button";
    toggleLinks.textContent = metadata.links?.length ? "Modifier les liens" : "Ajouter un lien";
    toggleLinks.addEventListener("click", () => {
        linksEditor.hidden = !linksEditor.hidden;
        if (!linksEditor.hidden) linksEditor.querySelector("input")?.focus();
    });
    if (linksContainer) {
        linksContainer.append(toggleLinks, linksEditor);
    } else {
        controls.append(toggleLinks);
        editor.appendChild(linksEditor);
    }

    editor.append(controls, infoFields);
    editor.addEventListener("submit", async event => {
        event.preventDefault();
        save.disabled = true;
        status.textContent = "Enregistrement…";
        try {
            const nextMetadata = { ...metadata };
            const setOrDelete = (key, value) => {
                if (value) nextMetadata[key] = value;
                else delete nextMetadata[key];
            };
            setOrDelete("description", description.input.value.trim());
            setOrDelete("thumbnail", thumbnailInput.input.value.trim());
            setOrDelete("album", album.input.value.trim());
            if (albumOrder.input.value) {
                const order = Number(albumOrder.input.value);
                if (!Number.isInteger(order) || order < 1) throw new Error("L’ordre dans l’album doit être un nombre entier positif.");
                nextMetadata.album_order = order;
            } else {
                delete nextMetadata.album_order;
            }
            const linkValues = [...linksEditor.querySelectorAll(".author_editor_link_row")].map(row => {
                const inputs = row.querySelectorAll("input");
                return { label: inputs[0].value.trim(), url: inputs[1].value.trim() };
            }).filter(link => link.url);
            if (linkValues.length) nextMetadata.links = linkValues;
            else delete nextMetadata.links;
            if (lyricsInput) setOrDelete("lyrics", lyricsInput.value.trim());

            const dateValue = input => input.value ? new Date(input.value).toISOString() : null;
            await onSave({
                title: titleInput.input.value.trim(),
                creation_date: dateValue(creationDate.input),
                release_date: dateValue(releaseDate.input),
                metadata: nextMetadata
            });
            status.textContent = "Projet enregistré.";
        } catch (error) {
            status.textContent = translateAuthorError(error.message, "Impossible d’enregistrer le projet. Vérifiez les informations puis réessayez.");
            save.disabled = false;
        }
    });

    return editor;
}
