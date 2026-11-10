export function loadFetch(key, f, cb, type = "json", force = false) {
    
    const get = sessionStorage.getItem(key);
    if (get) {
        
        cb(JSON.parse(get));
    
    } else {
        
        fetch(f)
            .then(res => {
                switch (type) {
                    case "json": return res.json();
                    case "text": return res.text();
                    case "blob": return res.blob();
                    default: return res.json();
                }
            })
            .then(data => { cb(data); sessionStorage.setItem(key, JSON.stringify(data)) })
            .catch(err => console.error(err))
    }

}

export function createDotsMenu(label, items = []) {
    const wrapper = document.createElement("span");
    wrapper.className = "dots";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "dots_button";
    trigger.setAttribute("aria-label", label);
    trigger.setAttribute("aria-haspopup", "true");
    const icon = document.createElement("i");
    icon.className = "fa-solid fa-ellipsis";
    icon.setAttribute("aria-hidden", "true");
    trigger.appendChild(icon);
    const menu = document.createElement("ul");
    menu.className = "dots_menu";
    menu.hidden = true;
    items.forEach(item => {
        const entry = document.createElement("li");
        entry.appendChild(item);
        menu.appendChild(entry);
    });
    trigger.addEventListener("click", () => { menu.hidden = !menu.hidden; });
    menu.addEventListener("click", event => {
        if (event.target.closest("button")) menu.hidden = true;
    });
    wrapper.append(trigger, menu);
    return wrapper;
}

export function getRemainingTime(date, now = Date.now()) {
    const target = date instanceof Date ? date.getTime() : new Date(date).getTime();
    const difference = target - now;
    if (!Number.isFinite(target) || difference <= 0) return null;

    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;
    if (difference >= day) return { value: Math.ceil(difference / day), unit: "day", milliseconds: difference };
    if (difference >= hour) return { value: Math.ceil(difference / hour), unit: "hour", milliseconds: difference };
    if (difference >= minute) return { value: Math.ceil(difference / minute), unit: "minute", milliseconds: difference };
    return { value: Math.ceil(difference / second), unit: "second", milliseconds: difference };
}

export function isPublishedRecently(date, now = Date.now()) {
    const published = date instanceof Date ? date.getTime() : new Date(date).getTime();
    return Number.isFinite(published) && now >= published && now - published < 24 * 60 * 60 * 1000;
}
