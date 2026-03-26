export { ProjectNode, TrackNode, BookNode, AppNode, FontNode }
import { handleSearchParam } from '/js/urlEngine.js';

class ProjectNode {
    constructor({
        title = "",
        subtitle = "",
        author = "",
        genres = "",
        type = "",
        image = "/assets/placeholder.webp",
        date = new Date,
        data = {}
    }) {
        this.title = title;
        this.subtitle = subtitle;
        this.author = author;
        this.genres = genres;
        this.type = type;
        this.image = image;

        this.date = date;
        this.data = data;
        this.card;
    }

    createBaseCard() {
        const card = document.createElement('div');
        card.className = "card hor";
        this.card = card;
        return card;
    }
}

class TrackNode extends ProjectNode {

    open() {
        search_content.classList.remove('open');
        page_content.classList.add('open');
        page_content.innerHTML = "";
        // console.log(this.data);
        page_content.appendChild(create_track_page(this));
    }

    create() {
        const card = this.createBaseCard();
        var platforms = [];
        var actions = [];

        if (this.data['Spotify Link']) platforms.push(['spotify', this.data['Spotify Link']])
        if (this.data['YouTube Link']) platforms.push(['youtube', this.data['YouTube Link']])
        if (this.data['SoundCloud Link']) platforms.push(['soundcloud', this.data['SoundCloud Link']])
        if (this.data['Deezer Link']) platforms.push(['deezer', this.data['Deezer Link']])
        
        if (this.data['Downloadable']) actions.push(['download', "console.log('Download')" ])

        if (this.data['Track Release Date']) this.date = new Date(this.data['Track Release Date']);
        
        card.innerHTML = `
            <img src="${this.image}">
            <div class="ver align metadata">
                <h2>${this.title}</h2>
                <span>${this.subtitle}</span>
                <h5>${this.author}</h5>
            </div>
            <div class="hor align right info">${platforms.map(v => `<a target="_blank" href="${v[1]}"><i class="fa-brands fa-${v[0]}"></i></a>`).join('')}${actions.map(v => `<a onclick="${v[1]}"><i class="fa-solid fa-${v[0]}"></i></a>`).join('')}</div>
        `;

        card.addEventListener('click', (e) => {
            handleSearchParam({delete_all: true, to_set: [ ["track", this.data['Track ID']] ]})
            this.open();
        })

        return card;
    }

    

}

class BookNode extends ProjectNode {
    create() {
        const card = this.createBaseCard();
        card.classList.add('book');
        var platforms = [];

        // if (this.data['Spotify Link']) platforms.push(['spotify', this.data['Spotify Link']])
        // if (this.data['YouTube Link']) platforms.push(['youtube', this.data['YouTube Link']])
        if (this.data['Physical Book']) platforms.push(['book', this.data['Physical Book']])
        if (this.data['E-Book']) platforms.push(['file', this.data['E-Book']])

        if (this.data['Book Release Date']) this.date = new Date(this.data['Book Release Date']);
        
        card.innerHTML = `
            <img src="${this.image}">
            <div class="ver align metadata">
                <h2>${this.title}</h2>
                <span>${this.subtitle}</span>
                <h5>${this.author}</h5>
            </div>
            <div class="hor align right info">${platforms.map(v => `<a target="_blank" href="${v[1]}"><i class="fa-solid fa-${v[0]}"></i></a>`).join('')}</div>
        `;

        return card;
    }
}

class AppNode extends ProjectNode {
    create() {
        const card = this.createBaseCard();
        var platforms = [];

        if (this.data['Windows Link']) platforms.push(['windows', this.data['Windows Link']])
        if (this.data['Android Link']) platforms.push(['android', this.data['Android Link']])
        if (this.data['iOS Link']) platforms.push(['apple', this.data['iOS Link']])
        if (this.data['Web Link']) platforms.push(['html5', this.data['Web Link']])

        if (this.data['App Release Date']) this.date = new Date(this.data['App Release Date']);
        
        card.innerHTML = `
            <img src="${this.image}">
            <div class="ver align metadata">
                <h2>${this.title}</h2>
                <span>${this.subtitle}</span>
                <h5>${this.author}</h5>
            </div>
            <div class="hor align right info">${platforms.map(v => `<a target="_blank" href="${v[1]}"><i class="fa-brands fa-${v[0]}"></i></a>`).join('')}</div>
        `;

        return card;
    }
}

class PackNode extends ProjectNode {
    create() {
        const card = this.createBaseCard();
        var platforms = [];

        // if (this.data['Windows Link']) platforms.push(['windows', this.data['Windows Link']])
        // if (this.data['Android Link']) platforms.push(['android', this.data['Android Link']])
        // if (this.data['iOS Link']) platforms.push(['apple', this.data['iOS Link']])
        // if (this.data['Web Link']) platforms.push(['html5', this.data['Web Link']])

        if (this.data['Pack Release Date']) this.date = new Date(this.data['Pack Release Date']);
        
        card.innerHTML = `
            <img src="${this.image}">
            <div class="ver align metadata">
                <h2>${this.title}</h2>
                <span>${this.subtitle}</span>
                <h5>${this.author}</h5>
            </div>
            <div class="hor align right info"><i class="fa-solid fa-folder">+?</i></div>
        `;

        return card;
    }
}

const font_quote = [
    "Maître Corbeau, sur un arbre perché, Tenait en son bec un fromage.",
    "Maître Renard, par l'odeur alléché, Lui tint à peu près ce langage :",
    "Je ne me repose plus, les couleurs s'évadent de ma tête.",
    "La vie est rose, et je me pose si elle est amoureuse.",
    "There is my coffin, will you lay inside, take a look at them from the bottom of their foot.",
    "You had to fake your death to see if I really care.",
    "There's a bee where there's a fool, it will sting when they will loose hope.",
    "I've been hearing thoughts, that you don't like me enough.",
    "J'ai rarement vu une personne aussi bête que moi.",
    "Un peu de rhum pour digérer la nuit, elle aime les hommes qui rêvent beaucoup la nuit.",
    "Les abeilles ne font plus de miel, l'humain devient l'orage que le diable aime.",
    "Elles sont trop noires ses idées, j'ai décidé qu'un jour je dessinerai notre vie dans un futur proche.",
    "I know it's wrong, but I gotta ask: are you free tonight, yeah are you free tonight.",
    "Aita vau i te 'eaha te rave, no te here hau atu."
]
class FontNode extends ProjectNode {
    create() {
        const card = this.createBaseCard();

        if (this.data['Font Release Date']) this.date = new Date(this.data['Font Release Date']);
        
        var quote = font_quote[ Math.floor(Math.random() * font_quote.length) ];

        card.innerHTML = `
            <div class="ver align metadata">
                <h2>${this.title}</h2>
                <h5>${this.author}</h5>
            </div>
            <div class="hor align right info"><span>${quote}</span></div>
        `;

        return card;
    }
}

class CanonNode extends ProjectNode {
    create() {
        const card = this.createBaseCard();
        card.classList.add('canon');

        if (this.data['Canon Release Date']) this.date = new Date(this.data['Canon Release Date']);

        card.innerHTML = `
            <img src="${this.image}">
            <div class="ver align metadata">
                <h2>${this.title}</h2>
                <span>${this.subtitle}</span>
            </div>
            <div class="square info">
                <a><i class="fa-solid fa-music"></i></a>
                <a><i class="fa-solid fa-image"></i></a>
                <a><i class="fa-solid fa-gamepad"></i></a>
                <a><i>+1</i>...</a>
            </div>
        `;

        return card;
    }
}


function create_track_page(node) {
    var data = node.data;
    var platforms = [];
    var actions = [];

    if (data['Spotify Link']) platforms.push(['spotify', data['Spotify Link']]);
    if (data['YouTube Link']) platforms.push(['youtube', data['YouTube Link']]);
    if (data['SoundCloud Link']) platforms.push(['soundcloud', data['SoundCloud Link']]);
    if (data['Deezer Link']) platforms.push(['deezer', data['Deezer Link']]);
    
    if (data['Downloadable']) actions.push(['download', (e) => { e.preventDefault(); console.log('Download') } ]);

    const track_display = document.createElement('div'); track_display.classList.add('track_display');

    const img_icon = document.createElement('img');
    const main_metadata = document.createElement('div'); main_metadata.classList.add('hor');
    const meta_title = document.createElement('div'); meta_title.classList = 'ver align'
    const meta_link = document.createElement('div'); meta_link.classList = 'hor align links';

    const title = document.createElement('h1');
    const artists = document.createElement('h3');
    const type = document.createElement('span');

    for (const platform of platforms) {
        const a_link = document.createElement('a');
        const i_icon = document.createElement('i');
        i_icon.classList = "fa-brands fa-" + platform[0];
        a_link.href = platform[1];
        a_link.target = '_blank';
        a_link.appendChild(i_icon);
        meta_link.appendChild(a_link);
    };

    for (const action of actions) {
        const a_link = document.createElement('a');
        const i_icon = document.createElement('i');
        i_icon.classList = "fa-solid fa-" + action[0];
        a_link.addEventListener('click', action[1]);
        a_link.appendChild(i_icon);
        meta_link.appendChild(a_link);
    };

    img_icon.src = data['Cover Art'] ? node.image : '/assets/placeholder.webp';
    title.textContent = data['Track Name'];
    artists.textContent = data['Track Artists'];
    type.textContent = data['Track Type']

    track_display.appendChild(img_icon);
    track_display.appendChild(main_metadata);

    main_metadata.appendChild(meta_title)
    main_metadata.appendChild(meta_link);

    meta_title.appendChild(title);
    meta_title.appendChild(artists);
    meta_title.appendChild(type);

    return track_display;
}

// <div class="track_display">
//     <img src="assets/placeholder.webp">
//     <div class="hor">
//         <div class="ver align">
//             <h1>Title</h1>
//             <h3>Artists</h3>
//             <span>Type</span>
//         </div>
//         <div class="hor align links">
//             <a><i class="fa-brands fa-deezer"></i></a>
//             <a><i class="fa-brands fa-spotify"></i></a>
//             <a><i class="fa-brands fa-youtube"></i></a>
//             <a><i class="fa-brands fa-soundcloud"></i></a>
//             <a><i class="fa-solid fa-download"></i></a>
//         </div>
//     </div>
// </div>