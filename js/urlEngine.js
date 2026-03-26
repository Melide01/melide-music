export { handleSearchParam }

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