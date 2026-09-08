// src/core/GameEngine.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { PropsManager } from '../entities/Props.js';
import { InputManager } from '../systems/InputManager.js';
import { Player } from '../entities/Player.js';
import { PedestrianAI } from '../entities/PedestrianAI.js';
import { UIManager } from '../ui/UIManager.js';
import { AudioEngine } from '../systems/AudioEngine.js'; 

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
        this.audioEngine = null; 
        
        this.interactionCooldown = false;
        this.wasAlertedLastFrame = false;
        
        // NUEVO: Variables de Puntuación
        this.score = 0;
        this.maxScore = 5; 
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
        this.audioEngine = new AudioEngine(); 
        this.player = new Player(this.scene);

        const waypoints = [
            new THREE.Vector3(-10, 0, 8),
            new THREE.Vector3(10, 0, 8)
        ];
        const guard1 = new PedestrianAI(this.scene, this.player, waypoints[0], waypoints);
        this.guards.push(guard1);

        const startScreen = document.getElementById('start-screen');
        startScreen.addEventListener('click', async () => {
            await this.audioEngine.init();
            startScreen.style.opacity = '0';
            setTimeout(() => {
                startScreen.style.display = 'none';
                this.animate();
            }, 500);
        });
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
            
            // LÓGICA DE INTERACCIONES (Esconderse o Recolectar)
            let promptText = null;
            let interactionTarget = null;
            let interactionType = null; // 'HIDE' o 'COLLECT'

            // 1. Revisar si hay basureros para esconderse
            this.propsManager.props.forEach(dumpster => {
                if (this.player.mesh.position.distanceTo(dumpster.position) < 2.5) {
                    promptText = this.player.isHidden ? "Espacio - Salir" : "Espacio - Esconderse";
                    interactionType = 'HIDE';
                }
            });

            // 2. Revisar si hay bolsas de basura para recoger (Solo si NO está escondido)
            if (!this.player.isHidden) {
                this.propsManager.trashBags.forEach((bag, index) => {
                    if (this.player.mesh.position.distanceTo(bag.position) < 1.5) {
                        promptText = "Espacio - Recolectar";
                        interactionType = 'COLLECT';
                        interactionTarget = { object: bag, index: index };
                    }
                });
            }

            // Mostrar el texto dinámico
            this.uiManager.showInteractPrompt(promptText);

            // EJECUTAR LA ACCIÓN AL PRESIONAR ESPACIO
            if (interactionType && this.inputManager.keys.interact && !this.interactionCooldown) {
                
                if (interactionType === 'HIDE') {
                    this.player.isHidden = !this.player.isHidden;
                    this.player.mesh.visible = !this.player.isHidden;
                    this.audioEngine.playHideSound();
                } 
                else if (interactionType === 'COLLECT') {
                    // Remover la bolsa de la escena
                    this.scene.remove(interactionTarget.object);
                    // Quitarla del arreglo para que no se pueda agarrar dos veces
                    this.propsManager.trashBags.splice(interactionTarget.index, 1);
                    
                    this.score++;
                    this.uiManager.updateScore(this.score, this.maxScore);
                    this.audioEngine.playCollectSound();
                }
                
                this.interactionCooldown = true;
                setTimeout(() => this.interactionCooldown = false, 500);
            }
        }

        let anyAlert = false;
        this.guards.forEach(guard => {
            guard.update(deltaTime);
            if (guard.state === 'ALERT') anyAlert = true;
        });
        
        if (anyAlert && !this.wasAlertedLastFrame) {
            this.audioEngine.playAlertSound();
        }
        this.wasAlertedLastFrame = anyAlert;
        
        this.uiManager.setAlert(anyAlert);
        
        this.renderer.render(this.scene, this.camera);
    }
}
