export function load_fetch(key, f, cb) {
    const get = sessionStorage.getItem(key);
    if (get) {
        cb(JSON.parse(get));
    }
    else {
        fetch(f)
            .then(res => res.json())
            .then(data => { cb(data); sessionStorage.setItem(key, JSON.stringify(data)) })
            .catch(err => console.error(err))
    }
}