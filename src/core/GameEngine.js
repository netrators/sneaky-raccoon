// src/core/GameEngine.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { PropsManager } from '../entities/Props.js';
import { InputManager } from '../systems/InputManager.js';
import { Player } from '../entities/Player.js';
import { PedestrianAI } from '../entities/PedestrianAI.js';
import { UIManager } from '../ui/UIManager.js';
import { AudioEngine } from '../systems/AudioEngine.js'; // NUEVO IMPORT

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
        this.uiManager = null;
        this.audioEngine = null; // NUEVO
        
        this.interactionCooldown = false;
        this.wasAlertedLastFrame = false; // Control para no repetir el sonido 60 veces por segundo
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
        this.uiManager = new UIManager();
        this.audioEngine = new AudioEngine(); // Instanciamos el audio
        this.player = new Player(this.scene);
        this.player.isHidden = false; 

        const waypoints = [
            new THREE.Vector3(-10, 0, 8),
            new THREE.Vector3(10, 0, 8)
        ];
        const guard1 = new PedestrianAI(this.scene, this.player, waypoints[0], waypoints);
        this.guards.push(guard1);

        // --- SISTEMA DE INICIO (Menú) ---
        const startScreen = document.getElementById('start-screen');
        startScreen.addEventListener('click', async () => {
            // Al hacer clic, activamos el audio, ocultamos el menú y arrancamos el juego
            await this.audioEngine.init();
            startScreen.style.opacity = '0';
            setTimeout(() => {
                startScreen.style.display = 'none';
                this.animate(); // Arrancamos el bucle SOLO cuando el usuario hace clic
            }, 500);
        });

        console.log("🦝 Fase 6: Audio nativo preparado, esperando clic del usuario.");
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
            if (!this.player.isHidden) {
                this.player.update(deltaTime, this.inputManager.keys);
            }
            
            this.camera.position.lerp(new THREE.Vector3(this.player.mesh.position.x, 15, this.player.mesh.position.z + 10), 5 * deltaTime);
            this.camera.lookAt(this.player.mesh.position);
            
            this.uiManager.updateStamina(this.player.stamina);
            
            let canHide = false;
            this.propsManager.props.forEach(dumpster => {
                if (this.player.mesh.position.distanceTo(dumpster.position) < 2.5) {
                    canHide = true;
                }
            });

            this.uiManager.showInteractPrompt(canHide && !this.player.isHidden);

            if (canHide && this.inputManager.keys.interact && !this.interactionCooldown) {
                this.player.isHidden = !this.player.isHidden;
                this.player.mesh.visible = !this.player.isHidden;
                
                this.audioEngine.playHideSound(); // Suena al meterse/salir del basurero
                
                this.interactionCooldown = true;
                setTimeout(() => this.interactionCooldown = false, 500);
            }
        }

        let anyAlert = false;
        this.guards.forEach(guard => {
            guard.update(deltaTime);
            if (guard.state === 'ALERT') anyAlert = true;
        });
        
        // Lógica para que el sonido de alerta solo suene UNA VEZ al ser detectado
        if (anyAlert && !this.wasAlertedLastFrame) {
            this.audioEngine.playAlertSound();
        }
        this.wasAlertedLastFrame = anyAlert;
        
        this.uiManager.setAlert(anyAlert);
        
        this.renderer.render(this.scene, this.camera);
    }
}
