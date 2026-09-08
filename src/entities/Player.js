// src/entities/Player.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.speed = 4.0;
        this.sprintMultiplier = 2.0;
        this.stamina = 100;
        this.isSprinting = false;
        this.isHidden = false;
        this.velocity = new THREE.Vector3();
        
        // Creamos la figura procedural como "Plan B"
        this._buildProceduralModel();
        // Intentamos cargar el modelo real (Plan A)
        this._loadRealModel();
    }

    _buildProceduralModel() {
        this.mesh = new THREE.Group();
        this.mesh.position.set(0, 0.5, 0);

        this.fallbackBody = new THREE.Group(); // Agrupamos la geometría para ocultarla fácil luego
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.5, 4, 8), bodyMat);
        body.rotation.x = Math.PI / 2; body.position.y = 0.2; body.castShadow = true;
        this.fallbackBody.add(body);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        snout.position.set(0, 0.3, 0.6); snout.castShadow = true;
        this.fallbackBody.add(snout);

        this.mesh.add(this.fallbackBody);
        this.scene.add(this.mesh);
    }

    _loadRealModel() {
        const loader = new GLTFLoader();
        loader.load(
            './public/media/models/raccoon.glb', // <--- ¡AÑADIMOS /public/ AQUÍ!
            (gltf) => { ...
                const realModel = gltf.scene;
                // Escalar el modelo (ajusta este valor según el modelo que descargues)
                realModel.scale.set(0.5, 0.5, 0.5); 
                
                // Activar sombras en el modelo nuevo
                realModel.traverse((child) => {
                    if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
                });

                // Ocultar nuestro modelo procedural de cubos
                this.fallbackBody.visible = false;
                
                // Añadir el modelo 3D real
                this.mesh.add(realModel);
                console.log("¡Modelo de mapache 3D cargado con éxito!");
            },
            undefined, // Progreso de carga
            (error) => {
                // Si falla (porque no has creado la carpeta o descargado el modelo aún)
                console.log("No se encontró el modelo 3D del mapache. Usando geometría procedural por ahora.");
            }
        );
    }

    update(deltaTime, inputKeys) {
        const moveDir = new THREE.Vector3(0, 0, 0);

        if (inputKeys.forward) moveDir.z -= 1;
        if (inputKeys.backward) moveDir.z += 1;
        if (inputKeys.left) moveDir.x -= 1;
        if (inputKeys.right) moveDir.x += 1;

        if (moveDir.length() > 0) moveDir.normalize();

        let currentSpeed = this.speed;
        this.isSprinting = false; 

        if (inputKeys.sprint && this.stamina > 0 && moveDir.length() > 0) {
            currentSpeed *= this.sprintMultiplier;
            this.stamina -= 20 * deltaTime;
            this.isSprinting = true;
        } else if (this.stamina < 100) {
            this.stamina += 10 * deltaTime;
        }

        this.velocity.copy(moveDir).multiplyScalar(currentSpeed * deltaTime);
        this.mesh.position.add(this.velocity);

        if (moveDir.lengthSq() > 0.01) {
            const targetAngle = Math.atan2(moveDir.x, moveDir.z);
            const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            this.mesh.quaternion.slerp(targetRotation, 10 * deltaTime);
        }
    }
}
