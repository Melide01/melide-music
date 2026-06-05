export function reveal_modal() {
    // const modal = document.getElementById('modal');
    image_modal_template.open()
    // modal.classList.toggle('open');
}

export async function fetch_json(url = "") {
    if (!url) return;
    
    try {
        
        const res = await fetch(url);
        const data = await res.json();
        return data;

    } catch (err) {

        console.error(err);
        return null;

    }
}