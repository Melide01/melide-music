import { reveal_modal, fetch_json } from '/js/Utils.js';
import { ModalData, toggle_modal, open_modal } from '/js/modalManager.js';
import { handleSearchParam, animateTransition } from '/js/urlEngine.js';
window.animateTransition = animateTransition;

const construction_alert_modal = new ModalData({
    title: "Attention",
    content: [
        "Cette partie du site est encore en construction et ne fonctionne pas encore.",
        "\nLes informations et les fonctionnalités présentes ne définissent pas le rendu final du site internet.",
        "\nMerci pour votre compréhension !"
    ],
    actions: [

    ]
});

const printful_worker = "https://merch.melide-s-account.workers.dev/";

const search_content = document.getElementById('search_content');
const project_container = document.getElementById('project_container');
const loading_block = document.getElementById('loading_block');
const page_content = document.getElementById('page_content');

const shop_display = page_content.querySelector('.shop_display');
const page_product_img = shop_display.querySelector('.product_img');
const page_meta = shop_display.querySelector('.ver.meta');
const product_select = page_meta.querySelector('.hor').querySelector('select[name="type"]');

var merch_data = {};
var merch_nodes = [];

function return_home() {
    search_content.classList.add('open');
    page_content.classList.remove('open');
    handleSearchParam({delete_all: true})
}
window.return_home = return_home;

document.addEventListener('DOMContentLoaded', () => {
    construction_alert_modal.open();
    load();
})

var current_product;
product_select.addEventListener('change', () => {
    var new_name = current_product.sync_product.name + " " + product_select.value;
    var new_data = current_product.sync_variants.filter(v => v.name === new_name)[0];
    update_product_info(new_data);
})

async function load() {
    project_container.appendChild(loading_block);
    const cache = localStorage.getItem('merch_data');

    if (cache) {
        merch_data = JSON.parse(cache);
    } else {
        const res = await fetch(printful_worker + "products");
        const data = await res.json();
        merch_data = data;
        localStorage.setItem('merch_data', JSON.stringify(merch_data));
    }

    for (const node of merch_data['result']) { console.log(node); merch_nodes.push(new MerchNode(node))};
    for (const node of merch_nodes) project_container.appendChild(node.create());

    loading_block.classList.remove('load');
}

async function order() {

}

class MerchNode {
    constructor({
        id = "",
        external_id = "",
        name = "",
        variants = -1,
        synced = -1,
        thumbnail_url = "",
        is_ignored = false
    }) {
        this.id = id;
        this.external_id = external_id;
        this.name = name;
        this.variants = variants;
        this.synced = synced;
        this.thumbnail_url = thumbnail_url;
        this.is_ignored = is_ignored;

        this.card;
    }

    create() {
        this.card = document.createElement('div');
        this.card.classList = 'ver padding merch_card'

        const img = document.createElement('img');
        const title = document.createElement('h2');
        const price = document.createElement('span');

        img.src = this.thumbnail_url;
        title.textContent = this.name;

        this.card.appendChild(img);
        this.card.appendChild(title);

        this.card.addEventListener('click', async () => {
            
            page_content.classList.add('open');
            search_content.classList.remove('open');
            
            const cache = JSON.parse(localStorage.getItem('product_data'));
            if (cache && [this.name] && cache[this.name]) {
                console.log('Cache');
                load_product_page(cache[this.name]);
            } else {
                unload_product_page();
                const res = await fetch(printful_worker + 'store-product?id=' + this.id);
                const data = await res.json();
                update_product_cache({ "load": true, "action": "set", "name": this.name, "data": data.result });
                
            }
        })

        return this.card;
    }
}

function update_product_cache({ action, name, data, load = false }) {
    var product_data = localStorage.getItem('product_data');
    if (!product_data) {
        product_data = {};
        localStorage.setItem('product_data', JSON.stringify(product_data));
    } else {
        product_data = JSON.parse(product_data);
    };

    switch (action) {
        case "set":
            product_data[name] = data;
            break;
        case "delete":
            delete product_data[name];
            break;
    };

    localStorage.setItem('product_data', JSON.stringify(product_data));
    
    if (load) load_product_page(JSON.parse(localStorage.getItem('product_data'))[name]);
}

function unload_product_page(data) {
    page_product_img.src = "";
    page_meta.querySelector('.ver').querySelector('h1').textContent = "";
    // page_meta.querySelector('.hor').querySelector('input[name="count"]').value = 1;
    product_select.innerHTML = "";
}
function load_product_page(data) {
    unload_product_page();
    current_product = data;
    var { sync_product, sync_variants } = data;
    page_product_img.src = sync_product.thumbnail_url;
    page_meta.querySelector('.ver').querySelector('h1').textContent = sync_product.name;
    for (const variant of sync_variants) product_select.appendChild(new Option(variant.name.replace(sync_product.name, "")));
    update_product_info(sync_variants[0])
}

function update_product_info(data) {
    // page_product_img.src = data.product.image;
    var cur = data.currency;
    switch (cur) {
        case 'EUR': cur = "€"; break;
    }
    page_meta.querySelector('.hor').querySelector('h1').textContent = data.retail_price + cur;
}