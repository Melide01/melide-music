// Data
var games_data = [];

// Import
const google_sheet_script = "https://script.google.com/macros/s/AKfycbxUxJcHeYWkjr72cOEcu-IU91rOWLv6kX-Vtb8BK0eGPJpiwGK51S6EaEQOy3C99hSvyA/exec";

const search_section = document.getElementById('search_section');
const game_container = document.getElementById('game_container');

const game_page_container = document.getElementById('game_page_container');
const header = document.getElementById('header');
const game_info = document.getElementById('game_info');

const go_back_button = document.getElementById('go_back_button');
const nav_point_see_button = document.getElementById('nav_point_see_button');

// Functions

document.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 250;
    header.classList.toggle('overlay', scrolled);
});
document.addEventListener('DOMContentLoaded', () => {

    // Setup
    go_back_button.querySelector('button').addEventListener('click', () => go_back())
    document.getElementById('search_pannel').querySelector('input[type="search"]').addEventListener('input', (e) => load_game_pannel(games_data, e.target.value))
    document.querySelectorAll('input[name="move_point"]').forEach(input => input.addEventListener('click', () => navigate_header_point(input.value)));

    nav_point_see_button.addEventListener('click', () => {
        let game = !!selected_game ? selected_game : nav_points[direction_map[dir_index]];
        load_game_page(game);
    });

    // Page Starting
    if (!sessionStorage.getItem("games_data")) {
        // Load or Reload
        fetch(google_sheet_script + "?get=games")
            .then(res => res.json())
            .then(data => {
                games_data = data.games_data;
                sessionStorage.setItem("games_data", JSON.stringify(games_data));
                load_game_pannel(games_data);
            })
            .catch(err => console.error(err));

    } else {
        // Retrieve
        games_data = JSON.parse(sessionStorage.getItem("games_data"));
        load_game_pannel(games_data);
    };
});

var nav_points = {
    pinned: null,
    newest: null,
    latest: null
};
var direction_map = [];
var dir_index = -1;
var selected_game = null;
var point_button_map = {};
function handle_header_nav_points(data) {
    console.log(data);
    var newest_game = data.filter(v => v['Update Date'] && v['Update Hook'] && v['Update Page']).sort((a, b) => new Date(b['Update Date']) - new Date(a['Update Date']))[0];
    var pinned_game = data.filter(v => v['Pinned']).sort((a, b) => new Date(b['Release Date']) - new Date(a['Release Date']))[0];
    var latest_game = data.filter(v => v['Release Date']).sort((a, b) => new Date(b['Release Date']) - new Date(a['Release Date'])).sort((a, b) => new Date(b['Update Date']) - new Date(a['Update Date']))[0];

    nav_points.newest = newest_game;
    nav_points.pinned = pinned_game;
    nav_points.latest = latest_game;

    const dumb_map = { nouveau: 'newest', épingler: 'pinned', dernièrement: 'latest' };

    document.querySelectorAll('input[name="nav_points_buttons"]').forEach(i => {
        point_button_map[dumb_map[i.value.toLocaleLowerCase()]] = i;
        i.addEventListener('click', () => navigate_header_point(0, dumb_map[i.value.toLocaleLowerCase()]));
    });

    if (pinned_game) {
        point_button_map['pinned'].classList.remove('disable');
        direction_map.push('pinned');
    };
    if (newest_game) {
        point_button_map['newest'].classList.remove('disable');
        direction_map.push('newest');
    };
    if (latest_game) {
        point_button_map['latest'].classList.remove('disable');
        direction_map.push('latest');
    };

    navigate_header_point(1);
};

var current_selected_button_point;
function navigate_header_point(dir = 0, name = "", prevent_anim = false, dont_change = false, game = null) {
    const new_index = parseFloat(dir_index) + parseFloat(dir);
    if (new_index >= direction_map.length || new_index < 0 && !dont_change) return;
    
    const header_game_display = header.querySelector('.header_game_display');
    const quick_nav_pannel = header_game_display.querySelector('.quick_nav_pannel');

    if (dont_change && game) {
        quick_nav_pannel.style.display = 'none';
        Object.entries(point_button_map).forEach(b => b[1].classList.remove('selected'))
    } else { quick_nav_pannel.style.display = 'grid'; }

    
    if (!prevent_anim) header_game_display.classList.add('load');

    if (name) {
        if (current_selected_button_point) current_selected_button_point.classList.remove('selected');
        point_button_map[name].classList.add('selected');
    } else if (new_index < direction_map.length && new_index >= 0 && !dont_change) {
        if (current_selected_button_point) current_selected_button_point.classList.remove('selected');
        point_button_map[direction_map[new_index]].classList.add('selected');
    }

    setTimeout(() => {
        header_game_display.classList.remove('load');
        if (game) { load_header_point(game); }
        if (name) {
            current_selected_button_point = point_button_map[name];
            dir_index = direction_map.indexOf(name);
            return load_header_point(nav_points[name]);
        };
        if (new_index < direction_map.length && new_index >= 0 && !dont_change) {
            dir_index = new_index;
            current_selected_button_point = point_button_map[direction_map[dir_index]];
            load_header_point(nav_points[direction_map[dir_index]]);
        }
    }, 500);
}

function load_header_point(game) {
    selected_game = game;

    const header_game_display = header.querySelector('.header_game_display');
    const tags_container = header.querySelector('.tags');
    const logo_title = header_game_display.querySelector('.logo_title');
    const logo_element = logo_title.querySelector('img');
    const title_element = logo_title.querySelector('h2');

    const description_element = header_game_display.querySelector('span');

    tags_container.innerHTML = "";
    game.Tags.split(',').map(v => v.trim()).forEach(l => {
        const span_el = document.createElement('span');
        span_el.textContent = l;
        tags_container.appendChild(span_el);
    });

    description_element.textContent = game.Description;

    header_game_display.style.backgroundImage = `url('${game['Game Banner Wide']}')`;
    logo_element.src = game['Game Logo'];
    title_element.textContent = game.Title;
}

function go_back() {
    selected_game = null;

    search_section.style.display = 'block';
    game_container.style.display = 'grid';

    header.classList.remove('inside');
    game_info.style.display = 'none';
    game_page_container.style.display = 'none';

    go_back_button.style.display = 'none';

    header.scrollIntoView({behavior: 'smooth', block: 'start'});
    navigate_header_point(0)
}

function load_game_page(game) {
    const header_game_display = header.querySelector('.header_game_display');
    const tags_container = header.querySelector('.tags');
    const logo_title = header_game_display.querySelector('.logo_title');
    const logo_element = logo_title.querySelector('img');
    const title_element = logo_title.querySelector('h2');

    const description_element = game_info.querySelector('span');
    const platforms_container_element = game_info.querySelector('.cta_container');

    // <a><i class="fa-brands fa-windows"></i>Windows</a>
    platforms_container_element.innerHTML = "";
    console.log(game)
    if (game['Web Link']) platforms_container_element.appendChild(platform_button('play', 'Jouer', game['Web Link']));
    if (game['iOS Link']) platforms_container_element.appendChild(platform_button('apple', 'iOS', game['iOS Link']));
    if (game['Android Link']) platforms_container_element.appendChild(platform_button('android', 'Android', game['Android Link']));
    if (game['Windows Link']) platforms_container_element.appendChild(platform_button('windows', 'Windows', game['Windows Link']));

    tags_container.innerHTML = "";
    game.Tags.split(',').map(v => v.trim()).forEach(l => {
        const span_el = document.createElement('span');
        span_el.textContent = l;
        tags_container.appendChild(span_el);
    })

    function platform_button (brand, text, href) {
        const a_el = document.createElement('a');
        const icon_el = document.createElement('i');
        const text_el = document.createTextNode(text);
        icon_el.classList = "fa-brands fa-" + brand;
        a_el.href = href;
        a_el.appendChild(icon_el);
        a_el.appendChild(text_el);
        return a_el;
    }

    description_element.textContent = game.Description;

    header_game_display.style.backgroundImage = `url('${game['Game Banner Wide']}')`;
    logo_element.src = game['Game Logo'];
    title_element.textContent = game.Title;
    
    game_page_container.innerHTML = '';
    parseMarkdown(game['Presentation Content'], '\\n').forEach(l => game_page_container.appendChild(l));

    search_section.style.display = 'none';
    game_container.style.display = 'none';

    header.classList.add('inside');
    game_info.style.display = 'grid';
    game_page_container.style.display = 'block';

    go_back_button.style.display = 'block';
}

var _game_card_elements = {};
function load_game_pannel(data, search_string = "") {
    // Setup Handler
    if (!Object.keys(_game_card_elements).length) {
        data.splice(0, 1);
        for (const game of data) {
            
            const card = game_container.appendChild(load_game_card(game));
            _game_card_elements[game['ID']] = card;
        };
    };
    
    // Main Sort by Date
    let sorted_by_date = games_data.sort((a, b) => new Date(b['Creation Date']) - new Date(a['Creation Date']));
    
    // Seearch Filter
    if (search_string.trim() !== "") {
        const lowerSearch = search_string.toLowerCase().trim();
        const searchWords = lowerSearch.split(/\s+/);
        
        sorted_by_date = sorted_by_date.filter(l => {
            const title = (l[2] || "").toLowerCase();
            const description = (l[3] || "").toLowerCase();
            const tags = (l[8] || "").split(',').map(v => v.trim().toLowerCase());

            let nameMatch, descMatch, tagMatch = false;

            if (lowerSearch.length >= 3 && name.includes(lowerSearch)) nameMatch = true;
            if (!nameMatch) descMatch = searchWords.some(word => word.length >= 3 && description.includes(word));
            if (!nameMatch && !descMatch) tagMatch = tags.some(tag => tag.includes(lowerSearch));
            
            return nameMatch || descMatch || tagMatch;
        });
        
        Object.entries(_game_card_elements).forEach(e => e[1].style.display = 'none');
    }

    // Format and render
    
    sorted_by_date = sorted_by_date.map(v => v['ID']);
    sorted_by_date.forEach(i => {
        _game_card_elements[i].style.display = "flex";
        game_container.appendChild(_game_card_elements[i]);
    })

    handle_header_nav_points(data);
}

function load_game_card(game_data) {
    const game_card = document.createElement('div');

    const logo_title_container = document.createElement('div');
    const h2_title = document.createElement('h2');
    const img_logo = document.createElement('img');

    const description_span = document.createElement('span');
    const platform_container_div = document.createElement('div');

    // Logo Title Container
    h2_title.textContent = game_data.Title;
    img_logo.src = game_data['Game Logo'];
    logo_title_container.classList.add('logo_title');
    logo_title_container.appendChild(h2_title);
    logo_title_container.appendChild(img_logo);
    // Game Card Container
    game_card.style.backgroundImage = "url('" + game_data['Game Banner Wide'] + "')";
    game_card.classList.add('game_card');
    description_span.textContent = game_data.Description;
    platform_container_div.classList.add('platform_container');
    game_card.appendChild(logo_title_container);
    game_card.appendChild(description_span);
    game_card.appendChild(platform_container_div);

    var each_platforms = game_data.Platforms.split(',').map(v => String(v.trim()).toLowerCase().replaceAll('ios', 'apple'));

    for (let platform of each_platforms) {
        const i_icon = document.createElement('i');
        var constructed_class = "fa-brands fa-" + platform;
        i_icon.classList = constructed_class;
        platform_container_div.appendChild(i_icon);
    };

    game_card.addEventListener('click', () => {
        header.scrollIntoView({behavior: 'smooth', block: 'start'});
        navigate_header_point(0, '', false, true, game_data);
    });

    // game_card.addEventListener('click', () => load_game_page(game_data));

    return game_card;
}