const customIconNames = fetch("/assets/icons/manifest.json")
    .then(response => {
        if (!response.ok) throw new Error(`Could not load custom icon manifest (${response.status}).`);
        return response.json();
    })
    .then(manifest => {
        if (!Array.isArray(manifest.icons) || !manifest.icons.every(name => /^(?:solid|brand)-[a-z0-9-]+$/.test(name))) {
            throw new TypeError("The custom icon manifest must contain valid icon class names.");
        }
        return new Set(manifest.icons);
    });

function loadCustomIcon(element, availableIcons) {
    if (element.dataset.customIconLoaded) return;
    const iconName = [...element.classList].find(name => availableIcons.has(name));
    if (!iconName) return;
    element.dataset.customIconLoaded = "true";
    const image = new Image();
    image.className = "custom_icon_image";
    image.alt = "";
    image.onload = () => {
        element.classList.add("has_custom_icon");
        element.appendChild(image);
    };
    image.onerror = () => image.remove();
    image.src = `/assets/icons/${iconName}.svg`;
}

export async function initializeCustomIcons(root = document) {
    const availableIcons = await customIconNames;
    if (root instanceof Element && root.matches(".custom_icon")) loadCustomIcon(root, availableIcons);
    root.querySelectorAll?.(".custom_icon").forEach(element => loadCustomIcon(element, availableIcons));
}

const iconObserver = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
        if (node instanceof Element) initializeCustomIcons(node);
    }));
});

iconObserver.observe(document.documentElement, { childList: true, subtree: true });
