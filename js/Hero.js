// - this whole ass class is vibe coded
// it basically creates a header element that can play audios from the page scroll
// and it displays custom elements inside the header to create a fun responsive banner
export class Hero {
    constructor(pageContainer, heroClass = "hero", objects = [], styles = []) {
        this.pageContainer = this.resolveElement(pageContainer);
        this.heroClass = typeof heroClass === "string" ? heroClass : "hero";
        this.objects = this.parseArray(objects, "objects");
        this.styles = this.parseArray(styles, "styles");
        this.audio = null;
        this.audioMap = [];
        this.activeMapping = null;
        this.scrollHandler = null;
        this.scrollFrame = null;
        this.audioRequest = 0;
        this.audioUnlockHandler = null;
        this.audioTimer = null;
        this.heroPointerHandler = null;
    }

    load() {
        if (!this.pageContainer) return null;
        this.unloadAudio();
        this.pageContainer.querySelectorAll("[data-hero-instance]").forEach(element => element.remove());
        const hero = document.createElement("header");
        hero.className = this.heroClass;
        hero.dataset.heroInstance = "true";
        this.styles.forEach(style => this.applyStyle(hero, style));
        this.audioMap = [];
        this.audio = this.createAudio();
        this.objects.forEach(object => this.renderObject(hero, object));
        // this.pageContainer.appendChild(hero);
        this.pageContainer.prepend(hero);
        this.hero = hero;
        hero.appendChild(this.audio);
        hero.appendChild(this.createControls(hero));
        this.indexAudioMap();
        this.startAudioMap();
        return hero;
    }

    resolveElement(element) {
        if (element instanceof Element) return element;
        if (typeof element !== "string") return null;
        try { return document.querySelector(element); } catch { return null; }
    }

    parseArray(data, name) {
        if (Array.isArray(data)) return data;
        if (typeof data !== "string") return [];
        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) throw new TypeError(`${name} must be an array`);
            return parsed;
        } catch (error) {
            console.error(`Unable to parse Hero ${name}:`, error);
            return [];
        }
    }

    applyStyle(element, style) {
        if (!style || typeof style.key !== "string" || typeof style.value !== "string") return;
        element.style.setProperty(style.key, style.value);
    }

    addObjectAttributes(element, object) {
        const classes = object.classes || object.class;
        if (Array.isArray(classes)) {
            classes.filter(item => typeof item === "string" && item.trim()).forEach(item => element.classList.add(item));
        }
        this.parseArray(object.styles || [], "object styles").forEach(style => this.applyStyle(element, style));
    }

    renderObject(hero, object) {
        if (!object || typeof object.type !== "string") return;
        switch (object.type.toLowerCase()) {
            case "img": this.renderImage(hero, object); break;
            case "video": this.renderVideo(hero, object); break;
            case "audio": this.renderAudio(hero, object); break;
            case "audio_mapping": this.audioMap.push(object); break;
            case "text": this.renderText(hero, object); break;
        }
    }

    renderImage(hero, object) {
        const image = document.createElement("img");
        if (typeof object.src === "string") image.src = object.src;
        if (typeof object.alt === "string") image.alt = object.alt;
        this.addObjectAttributes(image, object);
        hero.appendChild(image);
    }

    renderVideo(hero, object) {
        const video = document.createElement("video");
        if (typeof object.src === "string") video.src = object.src;
        video.autoplay = object.autoplay !== false;
        video.loop = object.loop !== false;
        video.muted = object.muted !== false;
        video.playsInline = true;
        this.addObjectAttributes(video, object);
        if (!video.loop) video.addEventListener("ended", () => video.remove(), { once: true });
        hero.appendChild(video);
        this.playMedia(video);
    }

    renderAudio(hero, object) {
        if (typeof object.src === "string") this.audio.src = object.src;
        this.audio.autoplay = object.autoplay !== false;
        this.audio.loop = object.loop !== false;
        this.audio.controls = object.controls === true;
        this.playMedia(this.audio);
    }

    renderText(hero, object) {
        const tags = ["p", "span", "div", "h1", "h2", "h3", "h4", "h5", "h6"];
        const text = document.createElement(tags.includes(object.tag) ? object.tag : "span");
        text.textContent = typeof object.text === "string" ? object.text : "";
        this.addObjectAttributes(text, object);
        hero.appendChild(text);
    }

    createAudio(object = {}) {
        const audio = document.createElement("audio");
        audio.autoplay = object.autoplay !== false;
        audio.loop = object.loop !== false;
        audio.controls = object.controls === true;
        audio.preload = "auto";
        if (typeof object.src === "string") audio.src = object.src;
        return audio;
    }

    createControls(hero) {
        const controls = document.createElement("div");
        const label = document.createElement("label");
        const input = document.createElement("input");
        const volumeIcon = document.createElement("i");
        const muteIcon = document.createElement("i");

        controls.className = "hero_controls";
        label.className = "hero_volume_control";
        label.title = "Activer ou couper le son";
        input.type = "checkbox";
        input.className = "hero_volume_toggle";
        input.setAttribute("aria-label", "Activer ou couper le son");
        volumeIcon.className = "fa-solid fa-volume-high";
        muteIcon.className = "fa-solid fa-volume-xmark";

        input.addEventListener("change", () => {
            hero.querySelectorAll("audio, video").forEach(media => {
                media.muted = input.checked;
                this.playMedia(media);
            });
        });

        this.heroPointerHandler = () => this.playMedia(this.audio);
        hero.addEventListener("pointerdown", this.heroPointerHandler, { passive: true });

        label.append(input, volumeIcon, muteIcon);
        controls.appendChild(label);
        return controls;
    }

    unload(callback) {
        const finish = typeof callback === "function" ? callback : () => {};
        const audio = this.audio;
        const hero = this.hero;

        this.stopAudioMap();
        this.audioRequest++;

        if (!audio) {
            hero?.remove();
            this.hero = null;
            finish();
            return;
        }

        audio.style.transition = "opacity 100ms ease";
        audio.style.opacity = "0";
        window.setTimeout(() => {
            if (this.audio !== audio) return;
            this.detachMedia(hero);
            hero?.remove();
            this.audio = null;
            this.hero = null;
            finish();
        }, 100);
    }

    indexAudioMap() {
        this.audioMap = this.audioMap.map(mapping => ({
            ...mapping,
            target: this.findTarget(mapping.element_target),
            position: this.mappingPosition(mapping)
        })).filter(mapping => mapping.position !== null && typeof mapping.src === "string")
            .sort((first, second) => first.position - second.position);
    }

    findTarget(target) {
        if (typeof target !== "string" || !target.trim()) return null;
        try {
            if (target.startsWith("[") || target.startsWith(".") || target.startsWith("#")) {
                return this.pageContainer.querySelector(target);
            }
            const escaped = CSS.escape(target);
            return this.pageContainer.querySelector(`[data-hero-target="${escaped}"]`)
                || this.pageContainer.querySelector(`[data-name="${escaped}"]`);
        } catch { return null; }
    }

    mappingPosition(mapping) {
        const page = this.pageContainer.getBoundingClientRect();
        const offset = this.lengthToPixels(mapping.look_out_y_space);
        if (!mapping.target) {
            if (offset < 0) return page.bottom + window.scrollY + offset;
            return page.top + window.scrollY + offset;
        }
        return mapping.target.getBoundingClientRect().top + window.scrollY
            - window.innerHeight + offset;
    }

    lengthToPixels(value) {
        if (value == null || value === "") return 0;
        const text = String(value).trim();
        const number = Number.parseFloat(text);
        if (!Number.isFinite(number)) return 0;
        if (text.endsWith("vh")) return window.innerHeight * number / 100;
        if (text.endsWith("vw")) return window.innerWidth * number / 100;
        return number;
    }

    startAudioMap() {
        if (!this.audioMap.length) return;
        this.scrollHandler = () => {
            if (this.scrollFrame) return;
            this.scrollFrame = requestAnimationFrame(() => {
                this.scrollFrame = null;
                this.selectAudioForScroll();
            });
        };
        window.addEventListener("scroll", this.scrollHandler, { passive: true });
        window.addEventListener("resize", this.scrollHandler, { passive: true });
        this.selectAudioForScroll();
    }

    selectAudioForScroll() {
        const scrollPosition = window.scrollY;
        const candidates = this.audioMap.filter(mapping => mapping.position <= scrollPosition);
        const mapping = candidates[candidates.length - 1] || this.audioMap[0];
        if (mapping && mapping !== this.activeMapping) {
            this.activeMapping = mapping;
            this.changeAudio(mapping);
        }
    }

    changeAudio(mapping) {
        let source;
        try { source = new URL(mapping.src, document.baseURI).href; } catch { return; }
        if (this.audio.src === source) return;
        const fadeTime = Number.isFinite(Number(mapping.fade_time)) ? Math.max(0, Number(mapping.fade_time)) : 777;
        const request = ++this.audioRequest;
        this.audio.style.transition = `opacity ${fadeTime}ms ease`;
        this.audio.style.opacity = "0";
        this.audioTimer = window.setTimeout(() => {
            this.audioTimer = null;
            if (request !== this.audioRequest) return;
            this.audio.src = mapping.src;
            this.audio.load();
            const reveal = () => {
                if (request !== this.audioRequest) return;
                this.audio.style.opacity = "1";
                this.playMedia(this.audio);
            };
            this.audio.addEventListener("canplay", reveal, { once: true });
            if (fadeTime === 0) reveal();
        }, fadeTime);
    }

    playMedia(media) {
        if (!media.autoplay) return;
        const playAttempt = media.play();
        if (!playAttempt?.catch) return;
        playAttempt.catch(() => {
            if (this.audioUnlockHandler) return;
            this.audioUnlockHandler = () => {
                this.playMedia(media);
                this.removeAudioUnlock();
            };
            document.addEventListener("pointerdown", this.audioUnlockHandler, { once: true, passive: true });
            document.addEventListener("keydown", this.audioUnlockHandler, { once: true });
        });
    }

    stopAudioMap() {
        if (this.scrollHandler) {
            window.removeEventListener("scroll", this.scrollHandler);
            window.removeEventListener("resize", this.scrollHandler);
        }
        if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
        if (this.audioTimer) window.clearTimeout(this.audioTimer);
        this.scrollHandler = null;
        this.scrollFrame = null;
        this.audioTimer = null;
        this.activeMapping = null;
        this.removeAudioUnlock();
    }

    detachMedia(hero) {
        if (this.heroPointerHandler && hero) {
            hero.removeEventListener("pointerdown", this.heroPointerHandler);
        }
        this.heroPointerHandler = null;
        hero?.querySelectorAll("audio, video").forEach(media => {
            media.pause();
            media.removeAttribute("src");
            media.load();
        });
    }

    removeAudioUnlock() {
        if (!this.audioUnlockHandler) return;
        document.removeEventListener("pointerdown", this.audioUnlockHandler);
        document.removeEventListener("keydown", this.audioUnlockHandler);
        this.audioUnlockHandler = null;
    }

    unloadAudio() {
        this.stopAudioMap();
        this.audioRequest++;
        if (this.audio) {
            this.audio.pause();
            this.audio.removeAttribute("src");
            this.audio.load();
        }
        this.audio = null;
    }
}
