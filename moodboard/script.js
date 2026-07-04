const url_prefix = "https://i.pinimg.com/";

const images = [
    "736x/d8/76/1c/d8761cb0f12f20fbacb7564f58f90d7e.jpg",
    "736x/fd/df/a8/fddfa8e85b753a6781798c38dcff4355.jpg",
    "736x/02/c1/ef/02c1ef8c69ad34e6d057a68b226e0f4e.jpg",
    "736x/8e/44/3d/8e443d19219dc043b2c8fd470864f850.jpg",
    "736x/aa/82/01/aa8201b542654efd6ae7a80f9c0459c5.jpg",

    "736x/ef/7e/30/ef7e302dc29d16e0cf18800e730ed5d0.jpg",
    "1200x/b1/10/96/b110960f488cf75e048803eb2eb16abf.jpg",
    "1200x/3c/5a/4a/3c5a4ae7cae44385e3b3547833def7a7.jpg",
    "736x/8a/15/e3/8a15e38a0e6afe046af58b7f45af97fb.jpg",
    
    "1200x/ce/c9/b8/cec9b8c2ce93186afde2707b54345215.jpg",
    "736x/a9/37/68/a9376893499696d2455666e62622d2e9.jpg",
    "1200x/37/19/c6/3719c67d02100cdf857f7739c6dcd47a.jpg",
    "736x/d2/09/27/d20927264c0a90ea5cb6f352919e8aae.jpg",
    "1200x/da/98/3b/da983bd55c3aed57cb04f17c2c994f14.jpg"
];

const moodgrid = document.getElementById('moodgrid');

document.addEventListener('DOMContentLoaded', () => {
    loadimages(images)
})

function loadimages(images) {
    moodgrid.innerHTML = "";

    const create_image = (img) => {
        var img_element = document.createElement('img');
        img_element.src = img;
        img_element.loading = "lazy";
        return img_element;
    }

    for (let i of images) {

        var img = create_image(url_prefix + i);
        moodgrid.appendChild(img);
    }
}