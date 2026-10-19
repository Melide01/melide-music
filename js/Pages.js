import { parseMarkdown }    from '/js/Markdown.js';
import { UrlParams }        from '/js/Url.js';

export class Pages {
    constructor(
        fetch = "",
        title = "",
        description = "",
        keywords = "",
        author = "",
        banner = "",
    ) {
        this.fetch = fetch;
        this.title = title;
        this.description = description;
        this.keywords = keywords;
        this.author = author;
        this.banner = banner;

        this.page;
    }

    async load() {

        if (this.page) this.page.innerHTML = "";
        var res = await fetch(fetch);
        res = await res.text();
        if (!this.page) {
            const page = document.createElement('div');
            this.page = page;
        };
        this.page.classList.add("page");
        this.page.innerHTML = parseMarkdown(res);
        
    }

    unload() {
        if (!this.page) return
        this.page.innerHTML = "";
        this.page?.remove();
    }
}