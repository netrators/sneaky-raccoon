// src/core/GameEngine.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { PropsManager } from '../entities/Props.js';
import { InputManager } from '../systems/InputManager.js';
import { Player } from '../entities/Player.js';
import { PedestrianAI } from '../entities/PedestrianAI.js';
import { UIManager } from '../ui/UIManager.js'; // NUEVO IMPORT

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
        this.guards = [];
        this.uiManager = null; // NUEVO
        
        this.interactionCooldown = false; // Evita spamear el botón de esconderse
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x05060a, 0.03);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
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

        this.inputManager = new InputManager();
        this.uiManager = new UIManager(); // Iniciamos la UI
        this.player = new Player(this.scene);
        // Inicializamos al mapache como NO escondido
        this.player.isHidden = false; 

        const waypoints = [
            new THREE.Vector3(-10, 0, 8),
            new THREE.Vector3(10, 0, 8)
        ];
        const guard1 = new PedestrianAI(this.scene, this.player, waypoints[0], waypoints);
        this.guards.push(guard1);

        this.animate();
        console.log("🦝 Fase 5: UI y Mecánicas de Sigilo integradas");
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
        
        if (this.player && this.inputManager) {
            // Solo se mueve si no está escondido
            if (!this.player.isHidden) {
                this.player.update(deltaTime, this.inputManager.keys);
            }
            
            this.camera.position.lerp(new THREE.Vector3(this.player.mesh.position.x, 15, this.player.mesh.position.z + 10), 5 * deltaTime);
            this.camera.lookAt(this.player.mesh.position);
            
            // --- ACTUALIZAR UI DE ESTAMINA ---
            this.uiManager.updateStamina(this.player.stamina);
            
            // --- MECÁNICA DE ESCONDERSE ---
            let canHide = false;
            // Revisamos si hay un contenedor (dumpster) cerca (menos de 2.5 metros)
            this.propsManager.props.forEach(dumpster => {
                if (this.player.mesh.position.distanceTo(dumpster.position) < 2.5) {
                    canHide = true;
                }
            });

            // Mostramos el texto en pantalla si puede esconderse y aún no lo está
            this.uiManager.showInteractPrompt(canHide && !this.player.isHidden);

            // Si presiona espacio cerca de un contenedor
            if (canHide && this.inputManager.keys.interact && !this.interactionCooldown) {
                this.player.isHidden = !this.player.isHidden; // Cambia el estado
                this.player.mesh.visible = !this.player.isHidden; // Oculta el modelo 3D
                
                this.interactionCooldown = true;
                setTimeout(() => this.interactionCooldown = false, 500); // Medio segundo antes de poder salir
            }
        }

        // --- ACTUALIZAR GUARDIAS Y UI DE ALERTA ---
        let anyAlert = false;
        this.guards.forEach(guard => {
            guard.update(deltaTime);
            if (guard.state === 'ALERT') anyAlert = true;
        });
        
        // Si al menos un guardia nos vio, muestra la palabra ¡DETECTADO!
        this.uiManager.setAlert(anyAlert);
        
        this.renderer.render(this.scene, this.camera);
    }
}
