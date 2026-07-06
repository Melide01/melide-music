export const UrlParams = {
    
    getAll() {
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(params.entries());
    },

    get(name, defaultValue = null) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name) ?? defaultValue;
    },

    set(name, value) {
        this.setMany({ [name]: value });
    },

    setMany(values) {
        const url = new URL(window.location);
        for (const [key, value] of Object.entries(values)) {
            if (value === null || value === undefined) { url.searchParams.delete(key);
            } else { url.searchParams.set(key, value); }
        }
        history.pushState({}, "", url);
    },

    delete(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        history.pushState({}, "", url);
    },

    reset() {
        const url = new URL(window.location);
        url.search = "";
        history.pushState({}, "", url);
    }

};