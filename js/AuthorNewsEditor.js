import { parseArticleBlocks, serializeArticleBlocks } from "/js/ArticleBlocks.js";

const API_URL = "https://api.melide.music";

async function request(path, method = "GET", data = undefined) {
    const options = { method, credentials: "include", cache: "no-store", redirect: "manual" };
    if (data !== undefined) {
        options.headers = { "Content-Type": "text/plain;charset=UTF-8" };
        options.body = JSON.stringify(data);
    }
    const response = await fetch(`${API_URL}${path}`, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Impossible d’enregistrer l’article.");
    return result;
}

async function uploadImage(articleId, file, kind) {
    const response = await fetch(`${API_URL}/user/news/${encodeURIComponent(articleId)}/image?kind=${encodeURIComponent(kind)}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        redirect: "manual",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: file
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Impossible d’envoyer l’image.");
    return result.url;
}

function field(labelText, type, value = "") {
    const label = document.createElement("label");
    label.className = "author_news_field";
    const caption = document.createElement("span");
    caption.textContent = labelText;
    const input = document.createElement(type === "textarea" ? "textarea" : type === "select" ? "select" : "input");
    if (type !== "textarea" && type !== "select") input.type = type;
    input.value = value ?? "";
    label.append(caption, input);
    return { label, input };
}

function autoResizeTextarea(input) {
    const resize = () => {
        input.style.height = "auto";
        input.style.height = `${input.scrollHeight}px`;
    };
    input.addEventListener("input", resize);
    requestAnimationFrame(resize);
}

function makeButton(text, handler, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    if (className) button.className = className;
    button.addEventListener("click", handler);
    return button;
}

function imageInput(labelText, disabled, onUpload) {
    const isDisabled = () => typeof disabled === "function" ? disabled() : disabled;
    const label = document.createElement("label");
    label.className = "author_news_field";
    const caption = document.createElement("span");
    caption.textContent = labelText;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.disabled = isDisabled();
    input.addEventListener("change", async () => {
        const [file] = input.files || [];
        if (!file) return;
        input.disabled = true;
        try {
            await onUpload(file);
        } finally {
            input.disabled = isDisabled();
            input.value = "";
        }
    });
    label.append(caption, input);
    return label;
}

export async function createAuthorNewsEditor(author, { articleId = null, editorOnly = false, showHeading = true } = {}) {
    const section = document.createElement("section");
    section.className = "author_news_editor ver";
    const heading = document.createElement("h3");
    heading.textContent = editorOnly ? "Éditeur d’article" : "Articles";
    heading.hidden = !showHeading;
    const create = document.createElement("button");
    create.type = "button";
    create.className = "author_editor_text_button";
    create.textContent = "Nouvel article";
    create.hidden = author.canCreateNews === false;
    const list = document.createElement("div");
    list.className = "author_news_list ver";
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    section.append(heading, create, list, status);
    if (editorOnly) {
        create.hidden = true;
        list.hidden = true;
    }
    let articles = [];

    const renderList = () => {
        list.replaceChildren();
        if (!articles.length) {
            const empty = document.createElement("p");
            empty.textContent = "Vous n’avez pas encore écrit d’article.";
            list.appendChild(empty);
            return;
        }
        articles.forEach(article => {
            const row = document.createElement("div");
            row.className = "author_news_row hor";
            const title = document.createElement("strong");
            title.textContent = article.title;
            const articleState = document.createElement("span");
            articleState.textContent = article.state === "published" ? "Publié" : "Brouillon";
            const edit = makeButton(article.can_edit === false ? "Voir" : "Modifier", () => {
                window.dispatchEvent(new CustomEvent("news:edit", { detail: { articleId: article.id } }));
            });
            const remove = makeButton("Supprimer", async () => {
                if (!window.confirm(`Supprimer « ${article.title} » ?`)) return;
                remove.disabled = true;
                try {
                    await request(`/user/news/${encodeURIComponent(article.id)}/delete`, "POST", {});
                    articles = articles.filter(item => item.id !== article.id);
                    renderList();
                    window.dispatchEvent(new CustomEvent("news:updated"));
                    status.textContent = "Article supprimé.";
                } catch (error) {
                    status.textContent = error.message;
                    remove.disabled = false;
                }
            });
            remove.hidden = article.can_delete === false;
            row.append(title, articleState, edit, remove);
            list.appendChild(row);
        });
    };

    const renderForm = (initialArticle = {}) => {
        (editorOnly ? section : list).querySelector("form")?.remove();
        let article = { ...initialArticle };
        const form = document.createElement("form");
        form.className = "author_news_form";

        const save = document.createElement("button");
        save.type = "submit";
        save.textContent = "Enregistrer";
        const readOnly = article.can_edit === false;
        save.hidden = readOnly;
        const finish = makeButton("Terminer", () => {
            if (editorOnly) window.dispatchEvent(new CustomEvent("news:editor-close"));
            else {
                form.remove();
                renderList();
            }
        });
        const stateField = field("Publication", "select", article.state || "draft");
        stateField.input.replaceChildren(new Option("Brouillon", "draft"), new Option("Publié", "published"));
        stateField.input.value = article.state || "draft";
        const toolbar = document.createElement("div");
        toolbar.className = "article_editor_toolbar";
        const toolbarActions = document.createElement("div");
        toolbarActions.className = "article_editor_actions";
        toolbarActions.append(save, finish);
        toolbar.append(stateField.label, toolbarActions, status);

        const banner = document.createElement("label");
        banner.className = "article_editor_banner";
        banner.setAttribute("aria-label", "Envoyer une bannière");
        const bannerPreview = document.createElement("img");
        bannerPreview.className = "news_article_banner";
        bannerPreview.alt = "";
        bannerPreview.hidden = !article.banner_url;
        if (article.banner_url) bannerPreview.src = article.banner_url;
        const bannerPrompt = document.createElement("span");
        bannerPrompt.className = "article_editor_banner_prompt";
        bannerPrompt.innerHTML = '<i class="fa-solid fa-camera" aria-hidden="true"></i> <span>Envoyer une bannière</span>';
        bannerPrompt.hidden = Boolean(article.banner_url);
        const bannerInput = document.createElement("input");
        bannerInput.type = "file";
        bannerInput.accept = "image/png,image/jpeg,image/webp,image/gif";
        bannerInput.disabled = !article.id;
        banner.append(bannerPreview, bannerPrompt, bannerInput);
        bannerInput.addEventListener("change", async () => {
            const [file] = bannerInput.files || [];
            if (!file) return;
            bannerInput.disabled = true;
            status.textContent = "Envoi de la bannière…";
            try {
                article.banner_url = await uploadImage(article.id, file, "banner");
                bannerPreview.src = article.banner_url;
                bannerPreview.hidden = false;
                bannerPrompt.hidden = true;
                status.textContent = "Bannière envoyée. Enregistrez l’article pour conserver le changement.";
            } catch (error) {
                status.textContent = error.message;
            } finally {
                bannerInput.disabled = !article.id;
                bannerInput.value = "";
            }
        });

        const title = field("Titre", "text", article.title);
        title.input.required = true;
        title.input.maxLength = 200;
        title.input.classList.add("article_editor_title");
        const category = field("Catégorie", "text", article.category);
        category.input.maxLength = 80;
        const slug = field("Adresse", "text", article.slug);
        slug.input.placeholder = "générée depuis le titre";
        const tags = field("Tags (séparés par des virgules)", "text", (article.tags || []).join(", "));
        const summary = field("Résumé", "textarea", article.summary);
        summary.input.maxLength = 1000;
        summary.input.rows = 1;
        autoResizeTextarea(summary.input);
        const metadata = document.createElement("div");
        metadata.className = "article_editor_metadata";
        metadata.append(title.label, category.label, slug.label, tags.label, summary.label);
        const articleHeader = document.createElement("header");
        articleHeader.className = "news_article_header article_editor_header";
        articleHeader.append(banner, metadata);

        const contentSection = document.createElement("section");
        contentSection.className = "article_editor_content";
        const contentHeading = document.createElement("h2");
        contentHeading.textContent = "Contenu de la page";
        const blockHelp = document.createElement("p");
        blockHelp.className = "author_news_editor_help";
        blockHelp.textContent = "Composez la page avec des blocs. Leur contenu sera enregistré en Markdown.";
        const blocksRoot = document.createElement("div");
        blocksRoot.className = "author_news_blocks";
        let blocks = parseArticleBlocks(article.content || "");
        if (!blocks.length) blocks = [{ type: "paragraph", text: "" }];

        const addBlock = document.createElement("div");
        addBlock.className = "author_news_add_blocks";
        [
            ["Texte", { type: "paragraph", text: "" }],
            ["Titre", { type: "heading", level: 2, text: "" }],
            ["Liste", { type: "list", ordered: false, items: [""] }],
            ["Lien", { type: "link", text: "", url: "" }],
            ["Image", { type: "image", alt: "", url: "" }],
            ["Tableau", { type: "table", rows: [["Colonne 1", "Colonne 2"], ["", ""]] }],
            ["Citation", { type: "quote", text: "" }],
            ["Séparateur", { type: "rule" }]
        ].forEach(([label, block]) => {
            addBlock.appendChild(makeButton(label, () => {
                blocks.push({ ...block });
                renderBlocks();
            }));
        });

        const typeLabels = {
            paragraph: "Texte",
            heading: "Titre",
            list: "Liste",
            link: "Lien",
            image: "Image",
            table: "Tableau",
            quote: "Citation",
            code: "Code",
            rule: "Séparateur"
        };
        const textArea = (caption, value, onInput) => {
            const control = field(caption, "textarea", value);
            control.input.rows = 1;
            control.input.addEventListener("input", () => {
                onInput(control.input.value);
            });
            autoResizeTextarea(control.input);
            return control.label;
        };
        const iconButton = (label, icon, handler, className = "") => {
            const button = makeButton("", handler, `article_editor_icon ${className}`.trim());
            button.setAttribute("aria-label", label);
            button.title = label;
            button.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i>`;
            return button;
        };
        const convertBlock = (block, type) => {
            const text = block.text || (block.items || []).join("\n") || block.alt || "";
            switch (type) {
                case "paragraph":
                case "quote":
                case "code":
                    return { type, text };
                case "heading":
                    return { type, level: block.level || 2, text };
                case "list":
                    return { type, ordered: Boolean(block.ordered), items: (block.items || text.split("\n")).filter(Boolean) };
                case "link":
                    return { type, text, url: block.url || "" };
                case "image":
                    return { type, alt: block.alt || text, url: block.url || "" };
                case "table":
                    return { type, rows: block.rows || [["", ""]] };
                default:
                    return { type: "rule" };
            }
        };

        function renderBlocks() {
            blocksRoot.replaceChildren();
            blocks.forEach((block, index) => {
                const card = document.createElement("article");
                card.className = "author_news_block";
                const moveControls = document.createElement("div");
                moveControls.className = "author_news_move_controls";
                moveControls.append(
                    iconButton("Déplacer vers le haut", "fa-arrow-up", () => moveBlock(index, -1), "author_news_move"),
                    iconButton("Déplacer vers le bas", "fa-arrow-down", () => moveBlock(index, 1), "author_news_move")
                );
                moveControls.children[0].disabled = index === 0;
                moveControls.children[1].disabled = index === blocks.length - 1;

                const body = document.createElement("div");
                body.className = "author_news_block_body";
                const blockTitle = document.createElement("h3");
                blockTitle.textContent = typeLabels[block.type] || "Bloc";
                body.appendChild(blockTitle);
                const actions = document.createElement("div");
                actions.className = "author_news_block_actions";
                const typeButton = iconButton("Modifier le type du bloc", "fa-pen-to-square", () => {
                    typeSelect.hidden = !typeSelect.hidden;
                    if (!typeSelect.hidden) typeSelect.focus();
                });
                const typeSelect = document.createElement("select");
                typeSelect.className = "author_news_type_select";
                typeSelect.setAttribute("aria-label", "Type de bloc");
                typeSelect.hidden = true;
                Object.entries(typeLabels).filter(([type]) => type !== "code").forEach(([type, label]) => {
                    typeSelect.add(new Option(label, type));
                });
                typeSelect.value = block.type === "code" ? "paragraph" : block.type;
                typeSelect.addEventListener("change", () => {
                    blocks[index] = convertBlock(block, typeSelect.value);
                    renderBlocks();
                });
                const deleteButton = iconButton("Supprimer le bloc", "fa-trash", () => {
                    blocks.splice(index, 1);
                    renderBlocks();
                });
                actions.append(deleteButton, typeButton, typeSelect);

                if (block.type === "paragraph" || block.type === "quote" || block.type === "code") {
                    body.appendChild(textArea(
                        block.type === "paragraph" ? "Texte" : block.type === "quote" ? "Citation" : "Code",
                        block.text,
                        value => { block.text = value; }
                    ));
                } else if (block.type === "heading") {
                    const level = field("Niveau", "select", String(block.level || 2));
                    level.input.replaceChildren(...[2, 3, 4].map(value => new Option(`Titre ${value}`, String(value))));
                    level.input.value = String(block.level || 2);
                    level.input.addEventListener("change", () => { block.level = Number(level.input.value); });
                    const text = field("Texte du titre", "text", block.text);
                    text.input.addEventListener("input", () => { block.text = text.input.value; });
                    body.append(level.label, text.label);
                } else if (block.type === "list") {
                    const ordered = field("Type", "select", block.ordered ? "ordered" : "unordered");
                    ordered.input.replaceChildren(new Option("À puces", "unordered"), new Option("Numérotée", "ordered"));
                    ordered.input.addEventListener("change", () => { block.ordered = ordered.input.value === "ordered"; });
                    body.append(ordered.label, textArea("Un élément par ligne", (block.items || []).join("\n"), value => { block.items = value.split("\n"); }));
                } else if (block.type === "link") {
                    const text = field("Texte du lien", "text", block.text);
                    text.input.addEventListener("input", () => { block.text = text.input.value; });
                    const url = field("Adresse du lien", "url", block.url);
                    url.input.addEventListener("input", () => { block.url = url.input.value; });
                    body.append(text.label, url.label);
                } else if (block.type === "image") {
                    const alt = field("Description de l’image", "text", block.alt);
                    alt.input.addEventListener("input", () => { block.alt = alt.input.value; });
                    const url = field("Adresse de l’image", "url", block.url);
                    url.input.addEventListener("input", () => { block.url = url.input.value; });
                    const upload = imageInput("Envoyer une image", () => !article.id, async file => {
                        status.textContent = "Envoi de l’image…";
                        try {
                            block.url = await uploadImage(article.id, file, "content");
                            renderBlocks();
                            status.textContent = "Image envoyée. Enregistrez l’article pour conserver le changement.";
                        } catch (error) {
                            status.textContent = error.message;
                        }
                    });
                    body.append(alt.label, url.label, upload);
                } else if (block.type === "table") {
                    body.appendChild(textArea(
                        "Une ligne par rangée, cellules séparées par |",
                        (block.rows || []).map(row => row.join(" | ")).join("\n"),
                        value => { block.rows = value.split("\n").map(row => row.split("|").map(cell => cell.trim())); }
                    ));
                } else if (block.type === "rule") {
                    const note = document.createElement("p");
                    note.textContent = "Un séparateur horizontal sera inséré.";
                    body.appendChild(note);
                }
                card.append(moveControls, body, actions);
                blocksRoot.appendChild(card);
            });
        }

        function moveBlock(index, direction) {
            const target = index + direction;
            if (target < 0 || target >= blocks.length) return;
            [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
            renderBlocks();
        }

        renderBlocks();
        contentSection.append(contentHeading, blockHelp, addBlock, blocksRoot);
        form.append(toolbar, articleHeader, contentSection);
        if (readOnly) {
            form.querySelectorAll("input, textarea, select, button").forEach(control => {
                control.disabled = true;
            });
            finish.disabled = false;
            form.querySelectorAll('input[type="file"]').forEach(input => {
                input.closest("label")?.remove();
            });
            status.textContent = "Mode consultant — consultation uniquement.";
        }
        form.addEventListener("submit", async event => {
            event.preventDefault();
            const content = serializeArticleBlocks(blocks);
            if (!content.trim() && stateField.input.value === "published") {
                status.textContent = "Ajoutez du contenu avant d’enregistrer l’article.";
                return;
            }
            save.disabled = true;
            status.textContent = "Enregistrement…";
            const body = {
                title: title.input.value.trim(),
                slug: slug.input.value.trim(),
                category: category.input.value.trim(),
                tags: tags.input.value.split(",").map(tag => tag.trim()).filter(Boolean),
                summary: summary.input.value.trim(),
                banner_url: article.banner_url || null,
                content,
                state: stateField.input.value,
                published_at: article.published_at || null
            };
            try {
                const saved = await request(
                    article.id ? `/user/news/${encodeURIComponent(article.id)}` : `/user/authors/${encodeURIComponent(author.id)}/news`,
                    "POST",
                    body
                );
                article = saved;
                bannerInput.disabled = !article.id;
                const index = articles.findIndex(item => item.id === saved.id);
                if (index < 0) articles.unshift(saved);
                else articles[index] = saved;
                if (!editorOnly) {
                    renderList();
                    list.prepend(form);
                }
                window.dispatchEvent(new CustomEvent("news:updated"));
                status.textContent = "Article enregistré.";
                renderBlocks();
            } catch (error) {
                status.textContent = error.message;
            } finally {
                save.disabled = false;
            }
        });
        (editorOnly ? section : list).prepend(form);
        title.input.focus();
    };

    create.addEventListener("click", async () => {
        create.disabled = true;
        try {
            const article = await request(`/user/authors/${encodeURIComponent(author.id)}/news`, "POST", {
                title: `Brouillon ${Date.now()}`,
                content: "",
                state: "draft"
            });
            articles.unshift(article);
            renderList();
            window.dispatchEvent(new CustomEvent("news:edit", { detail: { articleId: article.id } }));
        } catch (error) {
            status.textContent = error.message;
        } finally {
            create.disabled = false;
        }
    });
    try {
        articles = await request(`/user/authors/${encodeURIComponent(author.id)}/news`);
        if (editorOnly) {
            const article = articles.find(item => String(item.id) === String(articleId));
            if (!article) throw new Error("Article introuvable ou accès refusé.");
            renderForm(article);
        } else {
            renderList();
        }
    } catch (error) {
        status.textContent = error.message;
        create.disabled = true;
    }
    return section;
}
