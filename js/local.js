import { UrlParams } from "../js/url.js";
import { load_fetch } from "./utils.js";

const local_file = "/local/local_file.json";

export function set_current_language(code) {
    userLang = code;
    UrlParams.set("lang", userLang);
    translate_page();
}

export function get_current_language() {
    var lang_catch = UrlParams.get("lang");

    if (lang_catch) {
        userLang = lang_catch;
        UrlParams.set("lang", lang_catch);
    } else {
        userLang = navigator.language || navigator.userLanguage;
        UrlParams.set("lang", userLang);
    }
}

export async function load_local_file() {

    const create_langage_button = (l) => {
        const li_el = document.createElement('li');
        li_el.setAttribute("code", l.code);
        li_el.classList.add("local_option")
        li_el.textContent = userLang && Object.keys(l.local_title).includes(userLang) ? l.local_title[userLang] : l.title;
        li_el.addEventListener("click", () => { set_current_language(l.code); })
        return li_el;
    }

    get_current_language();

    fetch(local_file)
        .then(res => res.json())
        .then(data => {
            localFile = data;
            sections.langage_section.querySelector("ul").innerHTML = "";
            for (const l of localFile) sections.langage_section.querySelector("ul").appendChild(create_langage_button(l));
            translate_page();
        })
        .catch(err => console.error(err));
}

var local_map;
export async function translate_page() {
    var res = await fetch("/local/" + localFile.filter(v => v.code == userLang)[0].file);
    local_map = await res.json();

    for (const e of [...document.getElementsByClassName("local"), ...document.getElementsByTagName("li")]) {
        let [key, word] = e.getAttribute("local_key") ? e.getAttribute("local_key").split("/") : e.textContent.split("/");
        var t = translate(key, word);
        if (t) {
            e.setAttribute("local_key", key + "/" + word);
            e.textContent = t;
        }
        e.style.visibility = "visible";
    }

    
    for (const e of document.getElementsByClassName("local_option")) {
        var c = e.getAttribute("code");
        var lang = localFile.filter(v => v.code === c)[0];
        var title = Object.keys(lang.local_title).includes(userLang) ? lang.local_title[userLang] : "";
        
        e.textContent = title ? title : e.textContent;
    }
}

export function translate(key, word) {
    if (!key || !word) return;
    if (Object.keys(local_map).includes(key) && Object.keys(local_map[key]).includes(word)) return local_map[key][word];
}

export async function load_lang_section() {
    if (!localFile) await load_local_file;
    for (const l in localFile) console.log(l);
}