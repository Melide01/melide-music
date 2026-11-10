import { createDotsMenu } from "/js/Utils.js";

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
    const input = document.createElement(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") input.type = type;
    if (maxLength) input.maxLength = maxLength;
    input.placeholder = placeholder || labelText;
    input.setAttribute("aria-label", labelText);
    input.required = true;
    form.appendChild(input);
    return input;
}

function addSelect(form, labelText, options, value) {
    const select = document.createElement("select");
    select.setAttribute("aria-label", labelText);
    options.forEach(([optionLabel, optionValue]) => select.add(new Option(optionLabel, optionValue)));
    select.value = value;
    form.appendChild(select);
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
    let messageSignal = null;
    let messageTimer = null;
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

    async function save(path, method, payload, optimisticUpdate = null) {
        const previousData = data;
        status.textContent = "Enregistrement…";
        if (optimisticUpdate) {
            data = optimisticUpdate(structuredClone(data));
            console.log("Rafraichi");
            renderActiveTab();
        }
        try {
            data = await request(path, method, payload);
            status.textContent = "Enregistré.";
            console.log("A jour");
            renderActiveTab();
        } catch (error) {
            data = previousData;
            status.textContent = error.message;
            renderActiveTab();
        }
    }

    function removeButton(path, optimisticUpdate = null) {
        if (!canModerate) return null;
        const remove = button("Supprimer", "project_workspace_delete", "fa-solid fa-trash");
        remove.addEventListener("click", () => {
            void save(path, "POST", { authorId: activeAuthorId }, optimisticUpdate);
        });
        return remove;
    }

    function parseChange(value) {
        if (!value) return null;
        try { return JSON.parse(value); }
        catch { return null; }
    }

    function changeText(value) {
        if (value === null || value === undefined || value === "") return "—";
        if (typeof value === "string") return value;
        return JSON.stringify(value);
    }

    function appendChange(content, entry) {
        const before = parseChange(entry.changeBefore);
        const after = parseChange(entry.changeAfter);
        if (!before && !after) return;
        const change = document.createElement("span");
        change.className = "project_workspace_change";
        change.textContent = `Avant : ${changeText(before)} → Après : ${changeText(after)}`;
        content.appendChild(change);
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
        if (canModerate) {
            const removeBaseline = button("Supprimer", "project_workspace_delete", "fa-solid fa-trash");
            removeBaseline.addEventListener("click", () => {
                status.textContent = "Vous n'avez pas les authorisations pour supprimer le projet.";
            });
            baseline.appendChild(createDotsMenu("Actions du projet", [removeBaseline]));
        }
        list.appendChild(baseline);

        const entries = [...data.entries];
        if (data.projectReleasedAt) {
            entries.push({
                id: "released",
                type: "state",
                stateType: "released",
                authorName: "Projet",
                content: "Projet publié",
                createdAt: data.projectReleasedAt,
                updatedAt: data.projectReleasedAt
            });
        }
        entries.sort((first, second) => new Date(first.createdAt || first.updatedAt) - new Date(second.createdAt || second.updatedAt));
        entries.forEach(entry => {
            const item = document.createElement("article");
            const stateClass = entry.type === "file_added" || entry.type === "file_updated"
                ? "files"
                : entry.stateType || "note";
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
            appendChange(content, entry);
            item.append(meta, content);
            const actions = [];
            if (entry.id !== "released" && entry.type === "state" && Number(entry.authorId) === Number(activeAuthorId)) {
                const edit = button("Modifier", "", "fa-solid fa-pen");
                edit.addEventListener("click", () => {
                    const form = document.createElement("form");
                    form.className = "project_workspace_form ver";
                    const author = document.createElement("input");
                    author.type = "hidden";
                    author.value = String(entry.authorId);
                    const stateType = addSelect(form, "Type d’état", stateTypes, entry.stateType || "note");
                    const input = addField(form, "État", "textarea", "", 30);
                    input.value = entry.content;
                    const submit = button("Enregistrer");
                    submit.type = "submit";
                    form.append(author, submit);
                    form.addEventListener("submit", event => {
                        event.preventDefault();
                        void save(`/states/${entry.id}`, "POST", {
                            authorId: Number(author.value), stateType: stateType.value, content: input.value
                        }, current => ({
                            ...current,
                            entries: current.entries.map(item => String(item.id) === String(entry.id)
                                ? { ...item, stateType: stateType.value, content: input.value, updatedAt: new Date().toISOString() }
                                : item)
                        }));
                    });
                    item.replaceChildren(meta, form);
                    input.focus();
                });
                actions.push(edit);
            }
            const remove = entry.id !== "released" && entry.type === "state"
                ? removeButton(`/states/${entry.id}/delete`, current => ({
                    ...current,
                    entries: current.entries.filter(item => String(item.id) !== String(entry.id))
                }))
                : null;
            if (remove) actions.push(remove);
            if (actions.length) item.appendChild(createDotsMenu("Actions de l’état", actions));
            list.appendChild(item);
        });

        const form = document.createElement("form");
        form.className = "project_workspace_form ver";
        const stateType = addSelect(form, "Type d’état", stateTypes, "note");
        const input = addField(form, "Nouvel état", "textarea", "Ajouter une étape au projet", 30);
        const submit = button("Ajouter un état");
        submit.type = "submit";
        form.appendChild(submit);
        form.addEventListener("submit", event => {
            event.preventDefault();
            void save("/states", "POST", { authorId: activeAuthorId, stateType: stateType.value, content: input.value }, current => ({
                ...current,
                entries: [...current.entries, {
                    id: `pending-${Date.now()}`,
                    authorId: activeAuthorId,
                    authorName: data.authors.find(author => author.id === activeAuthorId)?.name || "",
                    type: "state",
                    stateType: stateType.value,
                    content: input.value,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }]
            }));
        });
        panel.replaceChildren(list, form);
    }

    function renderFiles() {
        const controls = document.createElement("div");
        controls.className = "project_workspace_file_controls hor";
        const search = document.createElement("input");
        search.type = "search";
        search.placeholder = "Recherche";
        search.setAttribute("aria-label", "Recherche");
        search.value = fileSearch;
        search.addEventListener("input", () => {
            fileSearch = search.value;
            renderActiveTab();
        });
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
        controls.prepend(search);

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
            const edit = button("Modifier", "", "fa-solid fa-pen");
            edit.addEventListener("click", () => {
                const form = document.createElement("form");
                form.className = "project_workspace_form ver";
                const fileType = addSelect(form, "Type de fichier", fileTypes.map(([label, value]) => [label, value]), file.fileType || "file");
                const label = addField(form, "Nom du fichier", "text", "", 20);
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
            const actions = [edit];
            if (remove) actions.push(remove);
            item.append(link, meta, createDotsMenu("Actions du fichier", actions));
            list.appendChild(item);
        });

        const form = document.createElement("form");
        form.className = "project_workspace_form ver";
        const fileType = addSelect(form, "Type de fichier", fileTypes.map(([label, value]) => [label, value]), "file");
        const label = addField(form, "Nom du fichier", "text", "Docs production", 20);
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
            const header = document.createElement("div");
            header.className = "message_header";
            const author = document.createElement("span");
            author.textContent = `${message.authorName} · ${localDate(message.createdAt)}`;
            header.appendChild(author);
            if (canModerate) {
                const remove = button("Supprimer", "project_workspace_delete", "fa-solid fa-trash");
                remove.addEventListener("click", () => {
                    void save(`/messages/${message.id}/delete`, "POST", { authorId: activeAuthorId }, current => ({
                        ...current,
                        messages: current.messages.filter(item => String(item.id) !== String(message.id))
                    }));
                });
                header.appendChild(createDotsMenu("Actions du message", [remove]));
            }
            const content = document.createElement("p");
            content.appendChild(inlineMessageText(message.content));
            item.append(header, content);
            list.appendChild(item);
        });

        const form = document.createElement("form");
        form.className = "project_workspace_form ver";
        const input = addField(form, "Message", "textarea", "Écrire un message", 130);
        const submit = button("Envoyer");
        submit.type = "submit";
        form.appendChild(submit);
        form.addEventListener("submit", event => {
            event.preventDefault();
            const content = input.value;
            input.value = "";
            void save("/messages", "POST", { authorId: activeAuthorId, content }, current => ({
                ...current,
                messages: [...current.messages, {
                    id: `pending-${Date.now()}`,
                    authorId: activeAuthorId,
                    authorName: data.authors.find(author => author.id === activeAuthorId)?.name || "",
                    content,
                    createdAt: new Date().toISOString()
                }]
            }));
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

    async function checkMessages() {
        if (activeTab !== 2 || !data) return;
        try {
            const signal = await request("/signal", "GET");
            const current = messageSignal;
            messageSignal = signal;
            if (current && (signal.latestId !== current.latestId || signal.count !== current.count)) {
                data = await request("", "GET");
                renderActiveTab();
            }
        } catch (error) {
            console.error("Could not check project messages.", error);
        }
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
            messageSignal = await request("/signal", "GET");
            if (messageTimer) clearInterval(messageTimer);
            messageTimer = setInterval(() => void checkMessages(), 5000);
        } catch (error) {
            workspace.hidden = true;
            status.textContent = "";
            console.error("Could not load the project workspace.", error);
        }
    };
    return workspace;
}