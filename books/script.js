const sections = {
    langage_section: document.getElementById('langage_section'),
    book_page : document.getElementById('book_page'),
    book_section : document.getElementById('book_section'),
    info_modal: document.getElementById('info_modal'),
    search_section: document.getElementById('search_section')
}

window.sections = sections;
var userLang = "";
var localFile;
window.userLang = userLang;
window.localFile = localFile;

import { Book } from "./books.js";
import { UrlParams } from "../js/url.js";
import { get_current_language, load_local_file, translate, load_lang_section } from "../js/local.js";

const info_button = document.getElementById('info_button');
const close_modal_button = document.getElementById('close_modal_button')

var loaded_books = [];

const return_button = document.getElementById('return_button');
const book_page = document.getElementById('book_page');
const book_section = document.getElementById('book_section');

const BOOK_GENRES = {
    "GENRES/AVENTURE": "Adventure",
    "GENRES/TRAGEDIE": "Tragedy",
    "GENRES/THRILLER": "Thriller",
    "GENRES/HORREUR": "Horror",
    "GENRES/MYSTERE": "Mystery",
    "GENRES/THEATRE": "Theatre",
    "GENRES/EPOPEE": "Epic"
}

const TEST_FETCH_BOOKS_DATA = [
    { "locals": [], "authors": [], "genres": ["GENRES/THRILLER"], "colorize": false, "title": "Proche de la couronne", "description": "Elle n'a pas eu le choix, elle devait survivre dans un monde où le danger est omniprésent. Elle comptera sur son père qui la poussera à rejoindre le Club de chasse de sa région. Qui aurait pu prédire le nombre de décès, lorsqu'ils ont atteint la couronne.", "image_cover": "/assets/Proche de la couronne.png", "link_code": "couronne", "book_data": "book_data.json" },
    { "locals": [], "authors": [], "genres": ["GENRES/THEATRE"], "colorize": false, "title": "L'homme dans l'écran", "description": "Lors d'un rendez-vous quotidien nocturne, cette famille va vivre le début d'une histoire horrifiante, troublante et presque comique. Mais tout ça n'a rien de drôle pour la petite fille qui a vu l'Homme dans l'écran.", "image_cover": "/assets/placeholder.webp", "link_code": "homme_ecran", "book_data": "" }
]

function load_books(books) {
    book_section.innerHTML = "";

    for (const b of books) {
        const book_element = new Book(b.title, b.description, b.image_cover, b.colorize, b.genres, b.authors, b.locals, b.link_code, b.book_data);
        const book_button = book_element.create();
        book_section.appendChild(book_button);
        loaded_books.push(book_element);
    }
}

async function load_book(link_code) {
    sections.search_section.classList.remove("open");

    const book = TEST_FETCH_BOOKS_DATA.filter(v => v.link_code === link_code)[0];

    if (book.link_code.startsWith("https://www.")) {
        
        location.href = book.link_code;
    
    } else {
        book_section.style.display = "none";
        book_page.classList.add("open");

        if (!book.book_data) {
            sections.book_page.innerHTML = "<a>Le contenu de cette page est pour le moment indisponible.</a>";
            return;
        };
        const res = await fetch(book.book_data);
        const data = await res.json();

        userLang = UrlParams.get("lang", "fr-FR");
        sections.book_page.innerHTML = "";

        for (const c of data.chapters) {
            const title_el = document.createElement("h1");
            title_el.textContent = c.chapter_local_title[userLang];
            sections.book_page.appendChild(title_el)
            parse_text_content(c.local_content[userLang]);

        }
    }
}

function parse_text_content(array_content) {
    
    for (const e of array_content) {
        var element;
        switch (e.type) {
            case "title":
                element = document.createElement('h2');
                element.textContent = e.text;
                break;
            case "image":
                element = document.createElement('img');
                element.src = e.src;
                break;
            case "text":
                element = document.createElement('p');
                element.textContent = e.text;
                break;
        }
        sections.book_page.appendChild(element);
    }

}

const create_title_element = (text) => {};
const create_text_element = (text) => {};

function style_inline(text) {};

function return_back() {
    const current_book = UrlParams.get("book");

    if (current_book) {

        book_section.style.display = "flex";
        book_page.classList.remove("open");
        sections.search_section.classList.add("open");
        load_books(TEST_FETCH_BOOKS_DATA);
        UrlParams.delete("book");
    
    } else {

        location.href = "/";

    }
}

function load_info_modal() {
    var [close_btn, img_cover, title_element, description_element] = sections.info_modal.children;
    const current_book = UrlParams.get("book");
    const book = TEST_FETCH_BOOKS_DATA.filter(v => v.link_code === current_book)[0];
    
    img_cover.src = book.image_cover;
    title_element.textContent = book.title;
    description_element.textContent = book.description;

    console.log(book);
}

const search_text_input = document.getElementById('search_text_input');
const search_button = document.getElementById('search_button');
function filter_from_search(search = "") {
    if (search === "") {
        for (let b of loaded_books) b.book_element.style.display = "flex";
        return;
    }
    for (let b of loaded_books) b.book_element.style.display = "none";

    for (let b of loaded_books.filter(v => String(v.title).toLocaleLowerCase().includes(search) || String(v.description).toLocaleLowerCase().includes(search))) {
        b.book_element.style.display = "flex";
    }
}

function filter_from_genre(genre) {
    for (let b of loaded_books) {
        if (b.genres.includes(search_genre.value) || search_genre.value === "") { b.book_element.style.display = "flex";
        } else { b.book_element.style.display = "none"; }
    }
}

document.addEventListener("scroll", (e) => {
    let time = 2000
    let current_pos = Math.floor(window.scrollY / document.body.offsetHeight * 100.);
    
    var pos = UrlParams.get("pos", -1);
    
    if (current_pos === pos) return
    clearTimeout(document.delay);
    document.delay = setTimeout(() => {
        UrlParams.set("pos", current_pos);
    }, time);
})

const search_genre = document.getElementById('search_genre');
document.addEventListener('DOMContentLoaded', async () => {
    const current_lang = UrlParams.get("lang");
    const current_book = UrlParams.get("book");

    search_button.addEventListener('click', () => { filter_from_search(search_text_input.value); })
    return_button.addEventListener('click', return_back);
    info_button.addEventListener('click', () => { load_info_modal(); sections.info_modal.open = true; })
    close_modal_button.addEventListener('click', () => { sections.info_modal.open = false; })

    load_local_file();
    
    if (current_book) {
        await load_book(current_book);
    } else {
        load_books(TEST_FETCH_BOOKS_DATA);
    };

    restore_scroll_position();

    search_text_input.addEventListener('keydown', (e) => {
        let time = 800
        if (e.key === "Enter") time = 0
        if (search_text_input.value.length < 3) return;
        clearTimeout(search_text_input.delay);
        search_text_input.delay = setTimeout(() => {
            filter_from_search(search_text_input.value);
        }, time);
    });
    
    search_genre.innerHTML = "";
    search_genre.appendChild(new Option("Select option", "", true, true))
    for (let g of Object.keys(BOOK_GENRES)) {
        var has_genre = loaded_books.filter(v => v.genres.includes(g)).length > 0;
        var o = new Option(BOOK_GENRES[g], g);
        search_genre.appendChild(o);
        if (!has_genre) o.disabled = true;
    };

    search_genre.addEventListener('change', (e) => {
        filter_from_genre(search_genre.value)
    });

    
})

function restore_scroll_position() {
    let pos = UrlParams.get("pos", null);
    if (pos === null) return;
        
    requestAnimationFrame(() => {
        const max_scroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, max_scroll * (pos / 100.));
    });
}
