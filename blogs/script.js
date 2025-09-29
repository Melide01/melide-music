const mdId = "file.md";
const fetchurl = "content/";

const blog_dir = {

}

const blog_display = document.getElementById('blog_display');

function sortPannel(type = "date", index = 7, filter = "Trier...") {
    if (!!id_rules[index]) {
        document.getElementById(id_rules[index]).value = filter;
    }
    const range = blog_data.blogs_data //.slice(1);

    // RESET
    if (filter === "Trier...") {
        Object.keys(blog_element).forEach((i) => {
            blog_container.append(blog_element[i]);
        });
        return;
    }

    const indexedRange = range.map((val, i) => ({ val, originalIndex: i }));

    if (type === "text") {
        const search = filter.toLowerCase();

        const ranked = indexedRange
            .map(({ val, originalIndex }) => {
                // You can change which fields to search here
                const matchCount = val.reduce((count, field) => {
                    if (typeof field === "string" && field.toLowerCase().includes(search) || filter === "") {
                        return count + 1;
                    }
                    return count;
                }, 0);

                return { val, originalIndex, matchCount };
            })
            .filter(({ matchCount }) => matchCount > 0)
            .sort((a, b) => b.matchCount - a.matchCount);
        
        Object.keys(blog_element).forEach((i) => {
            blog_element[i].style.display = "none";
        });

        ranked.forEach(({ originalIndex }) => {
            const el = blog_element[originalIndex];
            if (el) {
                el.style.display = "grid";
                blog_container.prepend(el);
            }
        });

        if (filter === "") {
            sortPannel();
        }
        //loadTracksPanel(index, search, "text");
    }

    if (type === "date") {
        const direction = filter === "Décroissant" ? -1 : 1;
        indexedRange.sort((a, b) => {
            const dateA = new Date(a.val[index]); 
            const dateB = new Date(b.val[index]);
            return (dateA - dateB) * direction;
        });
    }

    // RENDERS SORTED ELEMENTS
    indexedRange.forEach(({ originalIndex }) => {
        const el = blog_element[originalIndex];
        if (el) blog_container.prepend(el);
    });
}

var blog_element = {};
var search_argument = {};

const id_rules = {
    8: "time_filter",
    2: "state_filter",
    5: "type_filter"
}

const blog_container = document.getElementById('blog_container');
function loadBlogsPanel(index = 0, filter = "Trier...", type = "list") {
    console.log(blog_data)  
    search_argument[index] = filter;
    
    if (!!id_rules[index]) {
        document.getElementById(id_rules[index]).value = filter;
    }
    
    const range = blog_data.blogs_data //.slice(1);

    const search_results = range.reduce((acc, val, idx) => {
        const is_match = Object.entries(search_argument).every(([key, expected]) => {
            expected = expected === "Non épingler" ? "" : expected;
            expected = expected === "Épingler" ? true : expected;
            
            return expected === "Trier..." || String(val[key]).toLowerCase() === String(expected).toLowerCase();
        })

        if (is_match) {
            acc[idx] = val;
        }

        return acc;
    }, {});
    
    blog_container.querySelector('.loading_balls').style.display = "none"

    range.forEach((e, i) => {
        if (!!blog_element[i]) {
            if (!!search_results[i]) { 
                blog_element[i].style.display = "grid"; 
            } else {
                blog_element[i].style.display = "none";
            }
            return
        };
        const blog_card_div = document.createElement('div'); blog_card_div.classList.add('track_card', 'mini', 'clickable');
        blog_card_div.style = `position: relative; opacity: 1; ${String(e[2]) === "true" ? "background: #ffffff55;" : ''}`;

        // FIRST META
        const date_blog = new Date(e[8]);
        const date_p = document.createElement('p'); date_p.textContent = date_blog.toLocaleDateString() + " " + date_blog.toLocaleTimeString(); date_p.style = "grid-column: 1/4; text-align: right; font-size: .7em; opacity: .5"; blog_card_div.appendChild(date_p);

        if (String(e[2]) === "true") {
            console.log(e[2])
            const img_pinned = document.createElement('img'); img_pinned.src = "../assets/icons/pinned.webp";
            img_pinned.style = "position: absolute; top: .25em; left: 0; opacity: 1; grid-column: 1/3;";
            blog_card_div.appendChild(img_pinned)
        }

        blog_element[i] = blog_card_div;

        var conditional_style_thumbnail = "grid-column: 2/4;";
        
        if (e[11] !== "") {
            const img_track_cover = document.createElement('img'); img_track_cover.style.opacity = "1";
            img_track_cover.src = `https://drive.google.com/thumbnail?sz=w1920&id=${e[11]}`;
            blog_card_div.appendChild(img_track_cover);
        } else {
            conditional_style_thumbnail = "grid-column: 1/4;";
        }

        const blogs_meta = document.createElement('div'); blogs_meta.classList.add('vertical');
        blogs_meta.style = "gap: 0;" + conditional_style_thumbnail;
        blogs_meta.innerHTML = `<h2>${e[3]}</h2><i>${e[4]}</i>`;
        blog_card_div.appendChild(blogs_meta);

        if (e[6] !== "") {
            const mood_div = document.createElement('div'); mood_div.classList.add('horizontal'); mood_div.style = "grid-column: 1/4; gap: .5em; justify-content: end;"
            const mood_list = e[6].split(', ').map(v => `<span class="capsule minim">${v}</span>`).join("");
            mood_div.innerHTML = mood_list;
            blog_card_div.appendChild(mood_div);
        }

        blog_container.appendChild(blog_card_div);

        // EVENT LISTENER
        blog_card_div.addEventListener("click", (event) => {
            if (event.target.tagName !== "INPUT") {
                url_params.set("blog", e[0]);
                window.history.replaceState({}, "", `${location.pathname}?${url_params}`)
                loadBlog(e[0]);
            }
        })
    })
}

const search_panel= document.getElementById('search_panel');

function loadBlog(index) {
    header_banner.classList.add('minim');

    const params = new URLSearchParams(window.location.search);
    const blog = params.get("blog");
    const data = blog_data.blogs_data.filter(v => String(v[0]) === String(index))[0];

    const blog_title = blog_display.querySelector('[name="blog_title"]');
    const blog_date = blog_display.querySelector('[name="blog_date"]');
    const blog_author = blog_display.querySelector('[name="blog_author"]');

    blog_title.textContent = data[3];
    const post_date = new Date(data[8])
    blog_date.textContent = post_date.toLocaleDateString() + " " + post_date.toLocaleTimeString();
    blog_author.textContent = data[1];

    search_panel.style.display = "none";
    blog_display.style.display = "block";
    // logo_icon.style.display = "none";
    // goBack_button.style.display = "block";

    fetch(data[10])
        .then((response) => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status : ${response.status}`)
            }
            return response.text();
        })
        .then((data) => {
            blog_display.querySelector('[name="blog_container"]').innerHTML = parseMD(data);
        })
        .catch((err) => {
            blog_display.querySelector('p').textContent = String(err);
            console.error(err);
        });
}

function goBack() {
    header_banner.classList.remove('minim');

    updateURL("blog");
    search_panel.style.display = "block";
    blog_display.style.display = "none";
    // logo_icon.style.display = "block";
    // goBack_button.style.display = "none";
    loadBlogsPanel();
}

// QUICK UPDATE URL
function updateURL(type = "", value = "") {
    if (value !== "" && value !== "Trier...") {
        url_params.set(type, String(value).toLowerCase().replace(" ", "_"));
    } else {
        url_params.delete(type);
    }
    window.history.replaceState({}, "", `${location.pathname}?${url_params}`);
}