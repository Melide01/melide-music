import { parseLyrics, serializeLyrics } from "/js/Lyrics.js";

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

function lyricsAction(label, icon, handler, className = "") {
    const button = makeButton(label, `fa-solid ${icon}`, `author_editor_icon author_lyrics_action ${className}`.trim());
    button.addEventListener("click", handler);
    return button;
}

function enableLyricsReordering(row, source, index, list, onReorder) {
    const handle = row.querySelector(".author_lyrics_drag_handle");
    handle.draggable = true;
    handle.setAttribute("aria-keyshortcuts", "ArrowUp ArrowDown");
    handle.addEventListener("keydown", event => {
        const offset = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
        const target = index + offset;
        if (!offset || target < 0 || target >= source.items.length) return;
        event.preventDefault();
        const [moved] = source.items.splice(index, 1);
        source.items.splice(target, 0, moved);
        onReorder();
        list.querySelectorAll(".author_lyrics_drag_handle")[target]?.focus();
    });
    handle.addEventListener("dragstart", event => {
        source.draggedIndex = index;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
        row.classList.add("is_dragging");
    });
    handle.addEventListener("dragend", () => {
        row.classList.remove("is_dragging");
        source.draggedIndex = null;
    });
    row.addEventListener("dragover", event => {
        if (source.draggedIndex === null || source.draggedIndex === index) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        row.classList.add("drop_target");
    });
    row.addEventListener("dragleave", event => {
        if (!row.contains(event.relatedTarget)) row.classList.remove("drop_target");
    });
    row.addEventListener("drop", event => {
        event.preventDefault();
        row.classList.remove("drop_target");
        const from = source.draggedIndex;
        if (from === null || from === index) return;
        const [moved] = source.items.splice(from, 1);
        source.items.splice(index, 0, moved);
        source.draggedIndex = null;
        onReorder();
    });
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
    let lyricsSections = null;
    if (String(project.type).toLowerCase() === "track") {
        lyricsSections = parseLyrics(metadata.lyrics || "");
        const lyricsEditor = document.createElement("section");
        lyricsEditor.className = "author_lyrics_editor";
        lyricsEditor.hidden = true;
        const lyricsToolbar = document.createElement("div");
        lyricsToolbar.className = "author_lyrics_toolbar";
        const addSection = document.createElement("button");
        addSection.type = "button";
        addSection.className = "author_editor_text_button";
        addSection.textContent = "Ajouter une section";
        const lyricsList = document.createElement("div");
        lyricsList.className = "author_lyrics_sections";
        const renderLyrics = () => {
            lyricsList.replaceChildren();
            const sectionDrag = { items: lyricsSections, draggedIndex: null };
            const sectionTypes = ["VERSE", "PRE-CHORUS", "CHORUS", "BRIDGE", "INSTRUMENTAL", "CODA"];

            lyricsSections.forEach((section, sectionIndex) => {
                const sectionElement = document.createElement("section");
                sectionElement.className = "author_lyrics_section";
                const header = document.createElement("div");
                header.className = "author_lyrics_section_header";
                const heading = document.createElement("select");
                heading.className = "author_lyrics_section_type";
                heading.setAttribute("aria-label", `Section ${sectionIndex + 1} type`);
                sectionTypes.forEach(type => heading.add(new Option(type, type)));
                const selectedType = section.title.trim().toLocaleUpperCase();
                if (selectedType && !sectionTypes.includes(selectedType)) {
                    heading.add(new Option(section.title, section.title));
                }
                heading.value = sectionTypes.includes(selectedType) ? selectedType : section.title || "VERSE";
                if (!section.title) section.title = heading.value;
                heading.addEventListener("change", () => { section.title = heading.value; });

                const sectionTimecode = document.createElement("input");
                sectionTimecode.type = "text";
                sectionTimecode.className = "author_lyrics_section_timecode";
                sectionTimecode.value = section.timecode || "";
                sectionTimecode.placeholder = "0:00";
                sectionTimecode.inputMode = "text";
                sectionTimecode.maxLength = 6;
                sectionTimecode.pattern = "[0-9]{1,3}:[0-9]{2}";
                sectionTimecode.setAttribute("aria-label", `Section ${sectionIndex + 1} timecode`);
                sectionTimecode.addEventListener("input", () => {
                    const parts = sectionTimecode.value.replace(/[^\d:]/g, "").split(":");
                    const left = parts[0].slice(0, 3);
                    const right = parts.slice(1).join("").slice(0, 2);
                    const formatted = parts.length > 1 ? `${left}:${right}` : left;
                    if (sectionTimecode.value !== formatted) {
                        const caret = formatted.length;
                        sectionTimecode.value = formatted;
                        sectionTimecode.setSelectionRange(caret, caret);
                    }
                    section.timecode = sectionTimecode.value;
                });

                const sectionActions = document.createElement("div");
                sectionActions.className = "author_lyrics_controls";
                const addLine = document.createElement("button");
                addLine.type = "button";
                addLine.className = "author_lyrics_add_line";
                addLine.textContent = "+";
                addLine.title = "Ajouter une ligne";
                addLine.setAttribute("aria-label", "Ajouter une ligne");
                addLine.addEventListener("click", () => {
                    section.lines.push({ timecode: "", text: "", explanation: "" });
                    renderLyrics();
                    lyricsList.children[sectionIndex]
                        ?.querySelector(".author_lyrics_line:last-child .author_lyrics_text")?.focus();
                });
                sectionActions.append(
                    addLine,
                    lyricsAction("Dupliquer la section", "fa-copy", () => {
                        lyricsSections.splice(sectionIndex + 1, 0, {
                            ...section,
                            lines: section.lines.map(line => ({ ...line }))
                        });
                        renderLyrics();
                    }),
                    lyricsAction("Supprimer la section", "fa-trash", () => {
                        lyricsSections.splice(sectionIndex, 1);
                        renderLyrics();
                    }),
                    lyricsAction("Déplacer la section", "fa-grip-lines-vertical", () => {}, "author_lyrics_drag_handle")
                );
                header.append(heading, sectionTimecode, sectionActions);
                sectionElement.appendChild(header);
                enableLyricsReordering(sectionElement, sectionDrag, sectionIndex, lyricsList, renderLyrics);

                const lines = document.createElement("div");
                lines.className = "author_lyrics_lines";
                const lineDrag = { items: section.lines, draggedIndex: null };
                section.lines.forEach((line, lineIndex) => {
                    const row = document.createElement("div");
                    row.className = "author_lyrics_line";
                    const timecode = document.createElement("input");
                    timecode.type = "text";
                    timecode.className = "author_lyrics_timecode";
                    timecode.value = line.timecode || "";
                    timecode.placeholder = "0:00";
                    timecode.inputMode = "text";
                    timecode.maxLength = 5;
                    timecode.pattern = "[0-9]{1,2}:[0-9]{1,2}";
                    timecode.setAttribute("aria-label", `Section ${sectionIndex + 1}, ligne ${lineIndex + 1}, minutage`);
                    timecode.addEventListener("input", () => {
                        const parts = timecode.value.replace(/[^\d:]/g, "").split(":");
                        const left = parts[0].slice(0, 2);
                        const right = parts.slice(1).join("").slice(0, 2);
                        const formatted = parts.length > 1 ? `${left}:${right}` : left;
                        if (timecode.value !== formatted) {
                            const caret = formatted.length;
                            timecode.value = formatted;
                            timecode.setSelectionRange(caret, caret);
                        }
                        line.timecode = timecode.value;
                    });
                    const text = document.createElement("input");
                    text.type = "text";
                    text.className = "author_lyrics_text";
                    text.value = line.text || "";
                    text.placeholder = "Ligne de paroles";
                    text.setAttribute("aria-label", `Section ${sectionIndex + 1}, ligne ${lineIndex + 1}`);
                    text.addEventListener("input", () => { line.text = text.value; });
                    const explanation = document.createElement("textarea");
                    explanation.className = "author_lyrics_explanation";
                    explanation.value = line.explanation || "";
                    explanation.placeholder = "Explication (facultative)";
                    explanation.setAttribute("aria-label", `Explication de la ligne ${lineIndex + 1}`);
                    explanation.addEventListener("input", () => { line.explanation = explanation.value; });
                    explanation.hidden = true;
                    const lineControls = document.createElement("div");
                    lineControls.className = "author_lyrics_controls";
                    const info = lyricsAction("Modifier l’explication", "fa-circle-info", () => {
                        explanation.hidden = !explanation.hidden;
                        info.setAttribute("aria-expanded", String(!explanation.hidden));
                        if (!explanation.hidden) explanation.focus();
                    }, "author_lyrics_info");
                    info.setAttribute("aria-expanded", "false");
                    lineControls.append(
                        info,
                        lyricsAction("Dupliquer la ligne", "fa-copy", () => {
                            section.lines.splice(lineIndex + 1, 0, { ...line });
                            renderLyrics();
                        }),
                        lyricsAction("Supprimer la ligne", "fa-trash", () => {
                            section.lines.splice(lineIndex, 1);
                            renderLyrics();
                        }),
                        lyricsAction("Déplacer la ligne", "fa-grip-lines-vertical", () => {}, "author_lyrics_drag_handle")
                    );
                    row.append(timecode, text, lineControls, explanation);
                    enableLyricsReordering(row, lineDrag, lineIndex, lines, renderLyrics);
                    lines.appendChild(row);
                });
                sectionElement.appendChild(lines);
                lyricsList.appendChild(sectionElement);
            });
        };
        addSection.addEventListener("click", () => {
            lyricsSections.push({ title: "VERSE", lines: [] });
            renderLyrics();
            lyricsList.lastElementChild?.querySelector(".author_lyrics_section_type")?.focus();
        });
        lyricsToolbar.appendChild(addSection);
        lyricsEditor.append(lyricsToolbar, lyricsList);
        renderLyrics();
        const lyricsToggle = document.createElement("button");
        lyricsToggle.type = "button";
        lyricsToggle.className = "author_editor_text_button";
        lyricsToggle.textContent = metadata.lyrics ? "Modifier les paroles" : "Ajouter des paroles";
        lyricsToggle.addEventListener("click", () => {
            lyricsEditor.hidden = !lyricsEditor.hidden;
            if (!lyricsEditor.hidden) addSection.focus();
        });
        controls.append(lyricsToggle, lyricsEditor);
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
            if (lyricsSections) {
                for (const section of lyricsSections) {
                    if (section.timecode && !/^\d{1,3}:[0-5]\d$/.test(section.timecode.trim())) {
                        throw new Error("Les minutages des sections doivent utiliser le format 0:00.");
                    }
                    for (const line of section.lines) {
                        if (line.timecode && !/^\d{1,2}:\d{1,2}$/.test(line.timecode.trim())) {
                            throw new Error("Les minutages doivent utiliser le format 0:00.");
                        }
                        if (line.text.includes("]") || line.explanation.includes("]")) {
                            throw new Error("Les paroles et explications ne peuvent pas contenir le caractère ].");
                        }
                    }
                }
                setOrDelete("lyrics", serializeLyrics(lyricsSections));
            }

            const dateValue = input => input.value ? new Date(input.value).toISOString() : null;
            await onSave({
                title: titleInput.input.value.trim(),
                creation_date: dateValue(creationDate.input),
                release_date: dateValue(releaseDate.input),
                metadata: nextMetadata
            });
            status.textContent = "Projet enregistré.";
        } catch (error) {
            const fallback = "Impossible d’enregistrer le projet. Vérifiez les informations puis réessayez.";
            const translated = translateAuthorError(error.message, "");
            status.textContent = translated || (error.message ? `${fallback} (${error.message})` : fallback);
            save.disabled = false;
        }
    });

    return editor;
}
