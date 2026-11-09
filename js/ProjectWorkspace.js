function button(text, className = "", iconClass = "") {
    const element = document.createElement("button");
    element.type = "button";
    if (className) element.className = className;
    if (iconClass) {
        const icon = document.createElement("i");
        icon.className = iconClass;
        icon.setAttribute("aria-hidden", "true");
        element.appendChild(icon);
    }
    if (text) {
        const label = document.createElement("span");
        label.textContent = text;
        element.appendChild(label);
    }
    return element;
}

function icon(className) {
    const element = document.createElement("i");
    element.className = className;
    element.setAttribute("aria-hidden", "true");
    return element;
}

function localDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function inlineMessageText(value) {
    const fragment = document.createDocumentFragment();
    const pattern = /(https?:\/\/[^\s]+|(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)+(?:\:\d+)?(?:[/?#][^\s]*)?|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/gi;
    let offset = 0;
    for (const match of value.matchAll(pattern)) {
        const index = match.index;
        fragment.append(document.createTextNode(value.slice(offset, index)));
        const token = match[0];
        if (token.startsWith("*") && token.endsWith("*")) {
            const emphasized = document.createElement(token.startsWith("**") ? "em" : "strong");
            emphasized.textContent = token.startsWith("**") ? token.slice(2, -2) : token.slice(1, -1);
            fragment.appendChild(emphasized);
        } else {
            const trailing = token.match(/[.,!;:]+$/)?.[0] || "";
            const linkText = token.slice(0, token.length - trailing.length);
            const anchor = document.createElement("a");
            anchor.href = /^https?:\/\//i.test(linkText) ? linkText : `https://${linkText}`;
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
            anchor.textContent = linkText;
            fragment.appendChild(anchor);
            if (trailing) fragment.append(document.createTextNode(trailing));
        }
        offset = index + token.length;
    }
    fragment.append(document.createTextNode(value.slice(offset)));
    return fragment;
}

function addField(form, labelText, type, placeholder = "", maxLength = 0) {
    const label = document.createElement("label");
    const caption = document.createElement("span");
    caption.textContent = labelText;
    const input = document.createElement(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") input.type = type;
    if (maxLength) input.maxLength = maxLength;
    input.placeholder = placeholder;
    input.required = true;
    label.append(caption, input);
    form.appendChild(label);
    return input;
}

function addSelect(form, labelText, options, value) {
    const label = document.createElement("label");
    const caption = document.createElement("span");
    caption.textContent = labelText;
    const select = document.createElement("select");
    options.forEach(([optionLabel, optionValue]) => select.add(new Option(optionLabel, optionValue)));
    select.value = value;
    label.append(caption, select);
    form.appendChild(label);
    return select;
}

export function createProjectWorkspace(endpoint) {
    const workspace = document.createElement("section");
    workspace.className = "project_workspace ver";
    workspace.hidden = true;

    const tabs = document.createElement("div");
    tabs.className = "content_tabs hor project_workspace_tabs";
    tabs.setAttribute("role", "tablist");
    const panel = document.createElement("div");
    panel.className = "project_workspace_panel ver";
    panel.setAttribute("role", "tabpanel");
    const status = document.createElement("p");
    status.className = "project_workspace_status";
    status.setAttribute("role", "status");

    const stateTypes = [
        ["Note", "note"],
        ["A validé", "validated"],
        ["A corrigé", "corrected"],
        ["Signalement", "report"]
    ];
    const fileTypes = [
        ["Audio", "audio", "fa-solid fa-music custom_icon solid-music"],
        ["Image", "image", "fa-solid fa-image custom_icon solid-image"],
        ["Fichier", "file", "fa-solid fa-file custom_icon solid-file"]
    ];
    const fileTypeIcons = Object.fromEntries(fileTypes.map(([, value, iconClass]) => [value, iconClass]));
    let data = null;
    let activeAuthorId = null;
    let canModerate = false;
    let fileSearch = "";
    let fileTypeFilter = "all";
    let fileOrder = "desc";
    const request = async (path, method, payload) => {
        const response = await fetch(`${endpoint}${path}`, {
            method,
            credentials: "include",
            cache: "no-store",
            headers: payload ? { "Content-Type": "text/plain;charset=UTF-8" } : {},
            ...(payload ? { body: JSON.stringify(payload) } : {})
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || "Impossible d’enregistrer les modifications.");
        return result;
    };

    async function save(path, method, payload) {
        status.textContent = "Enregistrement…";
        try {
            data = await request(path, method, payload);
            status.textContent = "Enregistré.";
            renderActiveTab();
        } catch (error) {
            status.textContent = error.message;
        }
    }

    function removeButton(path) {
        if (!canModerate) return null;
        const remove = button("Supprimer", "project_workspace_delete", "fa-solid fa-trash");
        remove.addEventListener("click", () => {
            void save(path, "POST", { authorId: activeAuthorId });
        });
        return remove;
    }

    function renderEntries() {
        const list = document.createElement("div");
        list.className = "project_workspace_timeline ver";
        const baseline = document.createElement("div");
        baseline.className = "project_workspace_entry state_validated";
        const baselineMeta = document.createElement("span");
        baselineMeta.textContent = localDate(data.projectCreatedAt);
        const baselineContent = document.createElement("p");
        baselineContent.textContent = "Projet créé";
        baseline.append(baselineMeta, baselineContent);
        list.appendChild(baseline);

        data.entries.forEach(entry => {
            const item = document.createElement("article");
            const stateClass = entry.type === "state" ? entry.stateType || "note" : "validated";
            item.className = `project_workspace_entry state_${stateClass}`;
            const meta = document.createElement("span");
            meta.textContent = `${entry.authorName} · ${localDate(entry.updatedAt)}`;
            const content = document.createElement("p");
            if (entry.type === "file_added" || entry.type === "file_updated") {
                const file = data.files.find(value => Number(value.id) === Number(entry.fileId));
                content.append(document.createTextNode(`${entry.authorName} a ${entry.type === "file_added" ? "ajouté" : "modifié"} le fichier `));
                if (file) {
                    const link = document.createElement("a");
                    link.href = file.url;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.textContent = entry.content;
                    content.appendChild(link);
                } else {
                    content.append(document.createTextNode(entry.content));
                }
            } else {
                const stateType = stateTypes.find(([, value]) => value === entry.stateType)?.[0] || "Note";
                content.textContent = `${entry.authorName} · ${stateType} : ${entry.content}`;
            }
            item.append(meta, content);
            const remove = entry.type === "state" ? removeButton(`/states/${entry.id}/delete`) : null;
            if (remove) item.appendChild(remove);
            if (entry.type === "state" && Number(entry.authorId) === Number(activeAuthorId)) {
                const edit = button("Modifier");
                edit.addEventListener("click", () => {
                    const form = document.createElement("form");
                    form.className = "project_workspace_form ver";
                    const author = document.createElement("input");
                    author.type = "hidden";
                    author.value = String(entry.authorId);
                    const stateType = addSelect(form, "Type d’état", stateTypes, entry.stateType || "note");
                    const input = addField(form, "État", "textarea", "", 2000);
                    input.value = entry.content;
                    const submit = button("Enregistrer");
                    submit.type = "submit";
                    form.append(author, submit);
                    form.addEventListener("submit", event => {
                        event.preventDefault();
                        void save(`/states/${entry.id}`, "POST", {
                            authorId: Number(author.value), stateType: stateType.value, content: input.value
                        });
                    });
                    item.replaceChildren(meta, form);
                    input.focus();
                });
                item.appendChild(edit);
            }
            list.appendChild(item);
        });

        const form = document.createElement("form");
        form.className = "project_workspace_form ver";
        const stateType = addSelect(form, "Type d’état", stateTypes, "note");
        const input = addField(form, "Nouvel état", "textarea", "Ajouter une étape au projet", 2000);
        const submit = button("Ajouter un état");
        submit.type = "submit";
        form.appendChild(submit);
        form.addEventListener("submit", event => {
            event.preventDefault();
            void save("/states", "POST", { authorId: activeAuthorId, stateType: stateType.value, content: input.value });
        });
        panel.replaceChildren(list, form);
    }

    function renderFiles() {
        const controls = document.createElement("div");
        controls.className = "project_workspace_file_controls hor";
        const searchLabel = document.createElement("label");
        const searchCaption = document.createElement("span");
        searchCaption.textContent = "Recherche";
        const search = document.createElement("input");
        search.type = "search";
        search.placeholder = "Nom ou lien";
        search.value = fileSearch;
        search.addEventListener("input", () => {
            fileSearch = search.value;
            renderActiveTab();
        });
        searchLabel.append(searchCaption, search);
        const typeFilter = addSelect(controls, "Type", [["Tous", "all"], ...fileTypes.map(([label, value]) => [label, value])], fileTypeFilter);
        typeFilter.addEventListener("change", () => {
            fileTypeFilter = typeFilter.value;
            renderActiveTab();
        });
        const order = addSelect(controls, "Ordre", [["Récent", "desc"], ["Ancien", "asc"]], fileOrder);
        order.addEventListener("change", () => {
            fileOrder = order.value;
            renderActiveTab();
        });
        controls.prepend(searchLabel);

        const list = document.createElement("div");
        list.className = "project_workspace_files ver";
        const query = fileSearch.trim().toLowerCase();
        const files = data.files
            .filter(file => fileTypeFilter === "all" || file.fileType === fileTypeFilter)
            .filter(file => !query || `${file.label} ${file.url}`.toLowerCase().includes(query))
            .sort((a, b) => {
                const direction = fileOrder === "asc" ? 1 : -1;
                return direction * (new Date(a.updatedAt) - new Date(b.updatedAt));
            });
        files.forEach(file => {
            const item = document.createElement("article");
            item.className = "project_workspace_file";
            const link = document.createElement("a");
            link.href = file.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.append(icon(fileTypeIcons[file.fileType] || fileTypeIcons.file), document.createTextNode(file.label));
            const meta = document.createElement("span");
            const typeLabel = fileTypes.find(([, value]) => value === file.fileType)?.[0] || "Fichier";
            meta.textContent = `${typeLabel} · ${file.authorName} · ${localDate(file.updatedAt)}`;
            const edit = button("Modifier");
            edit.addEventListener("click", () => {
                const form = document.createElement("form");
                form.className = "project_workspace_form ver";
                const fileType = addSelect(form, "Type de fichier", fileTypes.map(([label, value]) => [label, value]), file.fileType || "file");
                const label = addField(form, "Nom du fichier", "text", "", 200);
                label.value = file.label;
                const url = addField(form, "Lien", "url", "https://…");
                url.value = file.url;
                const submit = button("Enregistrer");
                submit.type = "submit";
                form.appendChild(submit);
                form.addEventListener("submit", event => {
                    event.preventDefault();
                    void save(`/files/${file.id}`, "POST", {
                        authorId: activeAuthorId, fileType: fileType.value, label: label.value, url: url.value
                    });
                });
                item.replaceChildren(form);
            });
            const remove = removeButton(`/files/${file.id}/delete`);
            item.append(link, meta, edit);
            if (remove) item.appendChild(remove);
            list.appendChild(item);
        });

        const form = document.createElement("form");
        form.className = "project_workspace_form ver";
        const fileType = addSelect(form, "Type de fichier", fileTypes.map(([label, value]) => [label, value]), "file");
        const label = addField(form, "Nom du fichier", "text", "Documents de production", 200);
        const url = addField(form, "Lien", "url", "https://…");
        const submit = button("Ajouter un fichier");
        submit.type = "submit";
        form.appendChild(submit);
        form.addEventListener("submit", event => {
            event.preventDefault();
            void save("/files", "POST", {
                authorId: activeAuthorId, fileType: fileType.value, label: label.value, url: url.value
            });
        });
        panel.replaceChildren(controls, list, form);
    }

    function renderMessages() {
        const list = document.createElement("div");
        list.className = "project_workspace_messages ver";
        data.messages.forEach(message => {
            const item = document.createElement("div");
            item.className = `message${Number(message.authorId) === Number(activeAuthorId) ? " self" : ""}`;
            const author = document.createElement("span");
            author.textContent = `${message.authorName} · ${localDate(message.createdAt)}`;
            const content = document.createElement("p");
            content.appendChild(inlineMessageText(message.content));
            const remove = removeButton(`/messages/${message.id}/delete`);
            item.append(author, content);
            if (remove) item.appendChild(remove);
            list.appendChild(item);
        });

        const form = document.createElement("form");
        form.className = "project_workspace_form ver";
        const input = addField(form, "Message", "textarea", "Écrire un message", 4000);
        const submit = button("Envoyer");
        submit.type = "submit";
        form.appendChild(submit);
        form.addEventListener("submit", event => {
            event.preventDefault();
            void save("/messages", "POST", { authorId: activeAuthorId, content: input.value });
        });
        panel.replaceChildren(list, form);
    }

    const renderers = [renderEntries, renderFiles, renderMessages];
    let activeTab = 0;
    function renderActiveTab() {
        if (!data) {
            panel.replaceChildren(status);
            return;
        }
        renderers[activeTab]?.();
        panel.appendChild(status);
    }

    [
        ["États", "fa-solid fa-list-check custom_icon solid-states"],
        ["Fichiers", "fa-solid fa-folder-open custom_icon solid-project"],
        ["Messages", "fa-solid fa-message custom_icon solid-messages"]
    ].forEach(([label, iconClass], index) => {
        const tab = button("", "content_tab", iconClass);
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-label", label);
        tab.title = label;
        tab.setAttribute("aria-selected", String(index === 0));
        tab.addEventListener("click", () => {
            activeTab = index;
            tabs.querySelectorAll("[role='tab']").forEach(item => item.setAttribute("aria-selected", "false"));
            tab.setAttribute("aria-selected", "true");
            renderActiveTab();
        });
        tabs.appendChild(tab);
    });
    workspace.append(tabs, panel);

    workspace.load = async () => {
        try {
            data = await request("", "GET");
            const activeAuthor = data.authors[0];
            activeAuthorId = activeAuthor?.id ?? null;
            canModerate = Boolean(activeAuthor?.canModerate);
            if (activeAuthorId === null) throw new Error("Aucun auteur autorisé pour ce projet.");
            workspace.hidden = false;
            status.textContent = "";
            renderActiveTab();
        } catch (error) {
            workspace.hidden = true;
            status.textContent = "";
            console.error("Could not load the project workspace.", error);
        }
    };
    return workspace;
}