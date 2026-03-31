export { handleSearchParam, animateTransition }

const url = new URLSearchParams(window.location.search);
window.url = url;

function handleSearchParam(
    {
        to_set = [],
        to_add = [],
        to_delete = [],
        delete_all = false
    }
) {
    if (delete_all) for (const obj of Array.from(url.entries())) url.delete(obj[0]);
    for (const obj of to_add) url.append(obj[0], obj[1]);
    for (const obj of to_set) url.set(obj[0], obj[1]);
    for (const name of to_delete) url.delete(name);
    window.history.replaceState( {}, "", '?' + url);
}

const site_style_data = {
    "/": {
        "background-color": "#000",
        "color": "#fff"
    },
    "/merch/": {
        "background-color": "#a02",
        "color": "#fff"
    },
    "/e/": {
        "background-color": "#077",
        "color": "#fff"
    }
}
function animateTransition(direction = "") {
    if (!direction) return;
    console.log(Object.entries(site_style_data[direction]).map(v => v[0]+v[1]).join("; "))
    document.body.querySelector('header').parentElement.style = "transition: all 500ms;" + Object.entries(site_style_data[direction]).map(v => v[0]+": "+v[1]).join("; ");
    document.body.classList.add('changing');
    setTimeout(() => {
        location.href = direction;
    }, 1000);
}