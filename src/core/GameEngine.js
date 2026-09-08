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
        // Niebla azul cielo brillante, mucho más suave para ver más lejos
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 15, 15);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // --- MEJORA DE GRÁFICOS ---
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Llamamos a la nueva función de luz de día
        this._setupDayLighting();
        
        this.propsManager = new PropsManager(this.scene);
        this.propsManager.buildWorld(); // <--- ACTUALIZADO A MUNDO ABIERTO

        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.audioEngine = new AudioEngine(); 
        this.player = new Player(this.scene);
        
        this.maxScore = 15; // Ahora hay 15 basuras en el mapa

        // Generar 5 Cazadores (Guardias) aleatorios
        for (let i = 0; i < 5; i++) {
            const rx = (Math.random() - 0.5) * 80;
            const rz = (Math.random() - 0.5) * 80;
            const wp1 = new THREE.Vector3(rx - 15, 0, rz);
            const wp2 = new THREE.Vector3(rx + 15, 0, rz);
            // Cada guardia patrullará entre dos puntos aleatorios
            const guard = new PedestrianAI(this.scene, this.player, wp1, [wp1, wp2]);
            this.guards.push(guard);
        }

    _setupDayLighting() 
        // Luz ambiental blanca y potente (llena todo de luz)
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); 
        this.scene.add(ambientLight);

        // El Sol: Luz directa desde arriba a la derecha
        const sunLight = new THREE.DirectionalLight(0xfffaee, 1.5); // Ligeramente amarillenta
        sunLight.position.set(20, 30, 10); 
        sunLight.castShadow = true;
        
        // Mejoramos la resolución de las sombras (Gráficos más altos)
        sunLight.shadow.mapSize.width = 2048; 
        sunLight.shadow.mapSize.height = 2048;
        
        // Expandimos el área que recibe sombras
        sunLight.shadow.camera.left = -30;
        sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30;
        sunLight.shadow.camera.bottom = -30;
        
        this.scene.add(sunLight);
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
