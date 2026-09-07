import * as THREE from 'three';

export class GameEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`No se encontró el contenedor: ${containerId}`);

        // Variables principales
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock(); // Para manejar físicas independientemente de los FPS
        
        // Elementos de prueba (Los quitaremos en la Fase 2)
        this.testCube = null;
    }

    init() {
        // 1. Crear la Escena
        this.scene = new THREE.Scene();
        // Color de niebla para darle atmósfera de callejón nocturno
        this.scene.fog = new THREE.FogExp2(0x05060a, 0.05);

        // 2. Configurar la Cámara (Perspectiva)
        this.camera = new THREE.PerspectiveCamera(
            60, // Campo de visión (FOV)
            window.innerWidth / window.innerHeight,
            0.1, // Distancia mínima de renderizado
            100  // Distancia máxima de renderizado
        );
        // Posicionamos la cámara simulando una vista isométrica / top-down
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);

        // 3. Configurar el Renderizador
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimización para móviles
        // Activamos las sombras (vital para nuestro juego de sigilo)
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.appendChild(this.renderer.domElement);

        // 4. Configurar eventos de ventana
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Iniciar elementos temporales y luces
        this._setupBasicLighting();
        this._createTestScene();

        // 5. Iniciar el Bucle del Juego
        this.animate();
        console.log("🦝 Trash Raccoon 4.0: Game Engine Inicializado");
    }

    _setupBasicLighting() {
        // Luz base nocturna (azul oscuro)
        const ambientLight = new THREE.AmbientLight(0x202545, 1.5); 
        this.scene.add(ambientLight);

        // Luz de luna / Luz principal direccional
        const dirLight = new THREE.DirectionalLight(0xb5c7ff, 1.0);
        dirLight.position.set(5, 10, -5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
    }

    _createTestScene() {
        // Un plano que será el "suelo"
        const floorGeo = new THREE.PlaneGeometry(20, 20);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2; // Acostar el plano
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Un cubo que representará al mapache por ahora
        const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
        const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff6600 }); // Naranja chillón
        this.testCube = new THREE.Mesh(cubeGeo, cubeMat);
        this.testCube.position.y = 0.5;
        this.testCube.castShadow = true;
        this.scene.add(this.testCube);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = this.clock.getDelta();

        // Rotar el cubo de prueba temporalmente para ver que hay movimiento
        if (this.testCube) {
            this.testCube.rotation.y += 1 * deltaTime;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
