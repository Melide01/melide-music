export { Model3D, Camera3D, Scene3D, Renderer3D, Light3D }

class Model3D {
    constructor({
        name = "",
        file = ""
    }) {
        this.name = name;
        this.file = file;

        this.object;
        this.scene;
    }

    create() {
        var loader = new GLTFLoader();

        loader.load(
            this.file,
            (gltf) => {
                this.object = gltf.scene;
                this.scene.add_child(this);
                console.log("File loaded succesfully");
            },

            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },

            (error) => { console.log(error); }
            
        );
    }
}

class Camera3D {
    constructor({
        name = "",
        
        fov = 50,
        aspect = window.innerWidth / window.innerHeight,

        near = 0.1,
        far = 100,

    }) {
        this.name = name;
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.camera;
    }

    create() {
        this.camera = new THREE.PerspectiveCamera(
            this.fov,
            this.aspect,
            this.near,
            this.far
        )
    }
}

class Scene3D {
    constructor({
        name = ""
    }) {
        this.name = name;
        
        this.scene;
        this.camera;
        this.objects = [];
    }

    add_child(node) {
        console.log(node.object);
        this.objects.push(node);
        this.scene.add(node.object);
    }

    create() {
        this.scene = new THREE.Scene();
    }
}

class Renderer3D {
    constructor({
        name = "",
        alpha = true,
        width = window.innerWidth,
        height = window.innerHeight
    }) {
        this.name = name;
        this.alpha = alpha;
        this.width = width;
        this.height = height;

        this.renderer;
        this.scene;
        this.camera;
    }

    create() {
        this.renderer = new THREE.WebGLRenderer({ alpha: this.alpha });
        this.renderer.setSize(this.width, this.height);
    }
}

class Light3D {
    constructor({
        type = "directional",
        color = "0xffffff",
        intensity = 1,
        shadows = false,
        position = [0,0,0]
    }) {
        this.type = type;
        this.color = color;
        this.intensity = intensity;
        this.shadows = shadows;
        this.position = position;

        this.light;
        this.scene;
    }

    create() {
        switch (this.type) {
            case 'directional':
                this.light = new THREE.DirectionalLight(this.color, this.intensity);
                this.light.position.set(this.position[0], this.position[1], this.position[2]);
                this.light.castShadow = this.shadows;
                break;
            case 'ambient':
                this.light = new THREE.AmbientLight(this.color, this.intensity);
                break;
        }
            
    }
}