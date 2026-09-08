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
        
        this.score = 0;
        this.maxScore = 15; 
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);

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

        this._setupDayLighting();
        
        this.propsManager = new PropsManager(this.scene);
        this.propsManager.buildWorld();

        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.audioEngine = new AudioEngine(); 
        this.player = new Player(this.scene);

        for (let i = 0; i < 5; i++) {
            const rx = (Math.random() - 0.5) * 80;
            const rz = (Math.random() - 0.5) * 80;
            const wp1 = new THREE.Vector3(rx - 15, 0, rz);
            const wp2 = new THREE.Vector3(rx + 15, 0, rz);
            const guard = new PedestrianAI(this.scene, this.player, wp1, [wp1, wp2]);
            this.guards.push(guard);
        }

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

    _setupDayLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); 
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xfffaee, 1.5); 
        sunLight.position.set(20, 30, 10); 
        sunLight.castShadow = true;
        
        sunLight.shadow.mapSize.width = 2048; 
        sunLight.shadow.mapSize.height = 2048;
        
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
            
            const idealCameraPos = new THREE.Vector3(
                this.player.mesh.position.x,
                4, 
                this.player.mesh.position.z + 8
            );
            this.camera.position.lerp(idealCameraPos, 5 * deltaTime);
            
            const lookTarget = new THREE.Vector3(
                this.player.mesh.position.x,
                1.5,
                this.player.mesh.position.z
            );
            this.camera.lookAt(lookTarget);
            
            this.uiManager.updateStamina(this.player.stamina);
            
            let promptText = null;
            let interactionTarget = null;
            let interactionType = null; 

            this.propsManager.props.forEach(dumpster => {
                if (this.player.mesh.position.distanceTo(dumpster.position) < 2.5) {
                    promptText = this.player.isHidden ? "Espacio - Salir" : "Espacio - Esconderse";
                    interactionType = 'HIDE';
                }
            });

            if (!this.player.isHidden) {
                this.propsManager.trashBags.forEach((bag, index) => {
                    if (this.player.mesh.position.distanceTo(bag.position) < 1.5) {
                        promptText = "Espacio - Recolectar";
                        interactionType = 'COLLECT';
                        interactionTarget = { object: bag, index: index };
                    }
                });
            }

            this.uiManager.showInteractPrompt(promptText);

            if (interactionType && this.inputManager.keys.interact && !this.interactionCooldown) {
                
                if (interactionType === 'HIDE') {
                    this.player.isHidden = !this.player.isHidden;
                    this.player.mesh.visible = !this.player.isHidden;
                    this.audioEngine.playHideSound();
                } 
                else if (interactionType === 'COLLECT') {
                    this.scene.remove(interactionTarget.object);
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
