// src/core/GameEngine.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { PropsManager } from '../entities/Props.js';
import { InputManager } from '../systems/InputManager.js';
import { Player } from '../entities/Player.js';

export class GameEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`No se encontró el contenedor: ${containerId}`);

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        this.propsManager = null;
        this.inputManager = null;
        this.player = null;
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x05060a, 0.03);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        // Iniciamos la cámara en el centro, luego seguirá al jugador dinámicamente
        this.camera.position.set(0, 15, 15);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this._setupNightLighting();
        
        this.propsManager = new PropsManager(this.scene);
        this.propsManager.buildAlley();

        // --- NUEVO: Inicializar Sistemas y Jugador ---
        this.inputManager = new InputManager();
        this.player = new Player(this.scene);

        this.animate();
        console.log("🦝 Fase 3: Mapache y controles listos");
    }

    _setupNightLighting() {
        const ambientLight = new THREE.AmbientLight(0x101525, 0.5); 
        this.scene.add(ambientLight);

        const moonLight = new THREE.DirectionalLight(0x88aaff, 0.8);
        moonLight.position.set(-10, 20, -10);
        moonLight.castShadow = true;
        
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
        
        const deltaTime = this.clock.getDelta();
        
        // Actualizar la lógica del jugador pasándole los inputs del teclado
        if (this.player && this.inputManager) {
            this.player.update(deltaTime, this.inputManager.keys);
            
            // --- CÁMARA CON SEGUIMIENTO SUAVE (LERP) ---
            // Queremos que la cámara esté siempre arriba (y=15) y atrás (z=10) del mapache
            const idealCameraPos = new THREE.Vector3(
                this.player.mesh.position.x,
                15,
                this.player.mesh.position.z + 10
            );
            
            // Interpolar la posición actual hacia la ideal (el '0.05' dicta qué tan elástica/suave es)
            this.camera.position.lerp(idealCameraPos, 5 * deltaTime);
            this.camera.lookAt(this.player.mesh.position);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}
