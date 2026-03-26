const printful_worker = "https://merch.melide-s-account.workers.dev/";

const project_container = document.getElementById('project_container');
const loading_block = document.getElementById('loading_block');

var merch_data = {};
var merch_nodes = [];

document.addEventListener('DOMContentLoaded', () => {
    load();
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

    for (const node of merch_data['result']) merch_nodes.push(new MerchNode(node));
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

        return this.card;
    }
}

// {
//     "code": 200,
//     "result": [
//         { "id": 425414830, "external_id": "69c49174a928c4", "name": "Sweatshirt Édition 1 Pain", "variants": 32, "synced": 32, "thumbnail_url": "https://files.cdn.printful.com/files/b80/b8004f3c570705123bf4a74f163d9448_preview.png", "is_ignored": false },
//         { "id": 425414756, "external_id": "69c490e5db2184", "name": "Casquette Base", "variants": 3, "synced": 3, "thumbnail_url": "https://files.cdn.printful.com/files/ab3/ab34afd5185d0b2f6fe91ec28a51ae8e_preview.png", "is_ignored": false },
//         { "id": 425414681, "external_id": "69c490759907f5", "name": "T-shirt Oversize Base Crème", "variants": 4, "synced": 4, "thumbnail_url": "https://files.cdn.printful.com/files/6ad/6ad7d2dad66f8ca900615233332b6667_preview.png", "is_ignored": false }
//     ],
//     "extra": [],
//     "paging": {
//         "total": 3,
//         "limit": 20,
//         "offset": 0
//     }
// }