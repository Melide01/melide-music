export class SuperPage {
    constructor(pageContainer, pageClass = "super_page", objects = [], styles = []) {
        this.pageContainer = this.resolveElement(pageContainer);
        this.pageClass = typeof pageClass === "string" ? pageClass : "super_page";
        this.objects = this.parseArray(objects, "objects");
        this.styles = this.parseArray(styles, "styles");
        this.element = null;
        this.carousels = [];
    }

    load() {
        if (!this.pageContainer) return null;
        this.unload();

        const page = document.createElement("main");
        page.className = this.pageClass;
        page.dataset.superPage = "true";
        this.styles.forEach(style => this.applyStyle(page, style));
        this.objects.forEach(object => this.renderObject(page, object));
        this.pageContainer.appendChild(page);
        this.element = page;
        this.carousels.forEach(carousel => this.activateCarousel(carousel));
        return page;
    }

    unload() {
        this.carousels.forEach(carousel => {
            carousel.previous?.removeEventListener("click", carousel.showPrevious);
            carousel.next?.removeEventListener("click", carousel.showNext);
        });
        this.carousels = [];
        this.element?.remove();
        this.element = null;
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
            console.error(`Unable to parse SuperPage ${name}:`, error);
            return [];
        }
    }

    applyStyle(element, style) {
        if (!style || typeof style.key !== "string" || typeof style.value !== "string") return;
        element.style.setProperty(style.key, style.value);
    }

    applyObjectOptions(element, object) {
        const classes = object.classes || object.class;
        if (Array.isArray(classes)) {
            classes.filter(item => typeof item === "string" && item.trim())
                .forEach(item => element.classList.add(item));
        }
        this.parseArray(object.styles || [], "object styles").forEach(style => this.applyStyle(element, style));
        this.applyAnimation(element, object.animation);
    }

    applyAnimation(element, animation) {
        if (!animation || typeof animation !== "object") return;
        const properties = {
            animationName: animation.animation_name,
            animationDuration: animation.duration,
            animationTimingFunction: animation.timing_function,
            animationDelay: animation.delay,
            animationIterationCount: animation.iteration_count,
            animationFillMode: animation.fill_mode,
            animationTimeline: animation.timeline,
            animationRange: animation.range
        };
        Object.entries(properties).forEach(([property, value]) => {
            if (typeof value === "string" && value.trim()) element.style[property] = value;
        });
    }

    renderObject(parent, object) {
        if (!object || typeof object.type !== "string") return;
        switch (object.type.toLowerCase()) {
            case "content":
            case "text": this.renderText(parent, object); break;
            case "img": this.renderImage(parent, object); break;
            case "video": this.renderVideo(parent, object); break;
            case "audio": this.renderAudio(parent, object); break;
            case "carousel": this.renderCarousel(parent, object); break;
            case "scroll_carousel": this.renderScrollCarousel(parent, object); break;
            case "overlay": this.renderOverlay(parent, object); break;
            case "section": this.renderSection(parent, object); break;
        }
    }

    elementTag(object) {
        const allowedTags = ["p", "span", "div", "article", "section", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"];
        return allowedTags.includes(object.tag) ? object.tag : "div";
    }

    renderText(parent, object) {
        const element = document.createElement(this.elementTag(object));
        element.textContent = typeof object.content === "string" ? object.content : (object.text || "");
        this.applyObjectOptions(element, object);
        parent.appendChild(element);
    }

    renderImage(parent, object) {
        const image = document.createElement("img");
        if (typeof object.src === "string") image.src = object.src;
        if (typeof object.alt === "string") image.alt = object.alt;
        this.applyObjectOptions(image, object);
        parent.appendChild(image);
    }

    renderVideo(parent, object) {
        const video = document.createElement("video");
        if (typeof object.src === "string") video.src = object.src;
        video.autoplay = object.autoplay !== false;
        video.loop = object.loop !== false;
        video.muted = object.muted !== false;
        video.playsInline = true;
        this.applyObjectOptions(video, object);
        if (!video.loop) video.addEventListener("ended", () => video.remove(), { once: true });
        parent.appendChild(video);
        if (video.autoplay) video.play()?.catch(() => {});
    }

    renderAudio(parent, object) {
        const audio = document.createElement("audio");
        if (typeof object.src === "string") audio.src = object.src;
        audio.autoplay = object.autoplay !== false;
        audio.loop = object.loop !== false;
        audio.controls = object.controls === true;
        audio.preload = "auto";
        this.applyObjectOptions(audio, object);
        parent.appendChild(audio);
        if (audio.autoplay) audio.play()?.catch(() => {});
    }

    renderSection(parent, object) {
        const section = document.createElement(object.tag === "article" ? "article" : "section");
        this.applyObjectOptions(section, object);
        this.parseArray(object.objects || object.children || [], "section objects")
            .forEach(child => this.renderObject(section, child));
        parent.appendChild(section);
    }

    renderCarousel(parent, object) {
        const variant = typeof object.variant === "string" ? object.variant.toLowerCase() : "scroll";
        if (!["buttons", "simple", "nav"].includes(variant)) {
            this.renderScrollCarousel(parent, object);
            return;
        }

        const carousel = document.createElement("section");
        const slides = document.createElement("div");
        const previous = document.createElement("button");
        const next = document.createElement("button");
        const slideObjects = this.parseArray(object.slides, "carousel slides");

        carousel.className = "super_page_carousel";
        slides.className = "super_page_carousel_slides";
        previous.className = "super_page_carousel_previous";
        next.className = "super_page_carousel_next";
        previous.type = "button";
        next.type = "button";
        previous.textContent = object.previous_label || "Previous";
        next.textContent = object.next_label || "Next";
        carousel.setAttribute("aria-label", object.label || "Carousel");
        this.applyObjectOptions(carousel, object);

        slideObjects.forEach((slideObject, index) => {
            const slide = document.createElement("article");
            const normalizedSlide = typeof slideObject === "string" ? { type: "img", src: slideObject } : slideObject;
            slide.className = "super_page_carousel_slide";
            slide.hidden = index !== 0;
            slide.dataset.slideIndex = String(index);
            this.applyObjectOptions(slide, normalizedSlide);
            if (Array.isArray(normalizedSlide?.objects)) {
                normalizedSlide.objects.forEach(child => this.renderObject(slide, child));
            } else if (normalizedSlide?.type) {
                this.renderObject(slide, normalizedSlide);
            } else if (typeof normalizedSlide?.content === "string") {
                this.renderText(slide, { tag: "p", content: normalizedSlide.content });
            }
            slides.appendChild(slide);
        });

        carousel.append(previous, slides, next);
        parent.appendChild(carousel);
        this.carousels.push({ carousel, slides, previous, next, index: 0 });
    }

    renderScrollCarousel(parent, object) {
        const carousel = document.createElement("div");
        const slides = this.parseArray(object.slides || object.images, "scroll carousel slides");

        carousel.className = "scroll_carousel";
        carousel.setAttribute("aria-label", object.label || "Carousel");
        this.applyObjectOptions(carousel, object);

        slides.forEach(slideObject => {
            const image = document.createElement("img");
            const slide = typeof slideObject === "string" ? { src: slideObject } : slideObject;
            if (!slide || typeof slide.src !== "string") return;
            image.src = slide.src;
            image.alt = typeof slide.alt === "string" ? slide.alt : "";
            this.applyObjectOptions(image, slide);
            carousel.appendChild(image);
        });

        parent.appendChild(carousel);
    }

    activateCarousel(carousel) {
        const items = [...carousel.slides.children];
        const update = () => items.forEach((item, index) => { item.hidden = index !== carousel.index; });
        carousel.showPrevious = () => {
            carousel.index = (carousel.index - 1 + items.length) % items.length;
            update();
        };
        carousel.showNext = () => {
            carousel.index = (carousel.index + 1) % items.length;
            update();
        };
        carousel.previous.addEventListener("click", carousel.showPrevious);
        carousel.next.addEventListener("click", carousel.showNext);
        carousel.previous.disabled = items.length < 2;
        carousel.next.disabled = items.length < 2;
    }

    renderOverlay(parent, object) {
        const image = document.createElement("img");
        image.src = typeof object.src === "string" ? object.src : "";
        image.alt = typeof object.alt === "string" ? object.alt : "";
        image.classList.add("super_page_overlay");
        this.applyObjectOptions(image, object);
        if (!["left", "right", "center"].some(name => image.classList.contains(name))) image.classList.add("center");
        parent.appendChild(image);
    }
}
