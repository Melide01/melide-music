export class Book {
    constructor(
        title,
        description,
        image_cover,
        colorize_cover = false,
        genres,
        authors,
        locals,
        link_code,
        book_data
    ) {
        this.title = title;
        this.description = description;
        this.image_cover = image_cover;
        this.colorize_cover = colorize_cover;
        this.genres = genres;
        this.authors = authors;
        this.locals = locals;
        this.link_code = link_code;
        this.book_data = book_data;

        this.book_element;
    }

    create() {
        const div_element = document.createElement('div');
        div_element.classList.add('book');

        const img = document.createElement('img');
        const title = document.createElement('h2');
        const description = document.createElement('span');
        const link = document.createElement('a');

        img.src = this.image_cover;
        if (this.colorize) img.classList.add("autocolor");
        title.textContent = this.title;
        description.textContent = this.description;
        link.textContent = "Lire l'histoire";
        link.href = this.link_code.startsWith("https://www.") ? this.link_code : "?book=" + this.link_code;

        div_element.appendChild(img);
        div_element.appendChild(title);
        div_element.appendChild(description);
        div_element.appendChild(link);

        this.book_element = div_element;
        return div_element;
    }
}