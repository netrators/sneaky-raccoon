// src/core/GameEngine.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
// ¡Importante usar el .js al final para GitHub Pages!
import { PropsManager } from '../entities/Props.js';

export class GameEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`No se encontró el contenedor: ${containerId}`);

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.propsManager = null;
    }

    init() {
        // 1. Escena y Niebla
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x05060a, 0.03); // Niebla atmosférica

        // 2. Cámara (Vista cenital / isométrica)
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 15, 20); // Más alta y un poco hacia atrás
        this.camera.lookAt(0, 0, 0);

        // 3. Renderizador
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this));

        // 4. Luces y Entorno
        this._setupNightLighting();
        
        // Llamamos a nuestro PropsManager
        this.propsManager = new PropsManager(this.scene);
        this.propsManager.buildAlley();

        // 5. Arrancar bucle
        this.animate();
        console.log("🦝 Fase 2: Entorno construido con éxito");
    }

    _setupNightLighting() {
        // Luz base (Azul noche, muy tenue)
        const ambientLight = new THREE.AmbientLight(0x101525, 0.5); 
        this.scene.add(ambientLight);

        // Luz de Luna (Azul claro, proyecta sombra general)
        const moonLight = new THREE.DirectionalLight(0x88aaff, 0.8);
        moonLight.position.set(-10, 20, -10);
        moonLight.castShadow = true;
        
        // Ajustamos la caja de sombras para que cubra todo el callejón
        moonLight.shadow.camera.left = -20;
        moonLight.shadow.camera.right = 20;
        moonLight.shadow.camera.top = 20;
        moonLight.shadow.camera.bottom = -20;
        
        this.scene.add(moonLight);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // const deltaTime = this.clock.getDelta(); // Lo usaremos en la siguiente fase
        
        this.renderer.render(this.scene, this.camera);
    }
}
