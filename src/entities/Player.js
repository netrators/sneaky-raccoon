// src/entities/Player.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        
        this.speed = 4.0;
        this.sprintMultiplier = 2.0;
        this.stamina = 100;
        this.isSprinting = false; // NUEVO: Para que la IA sepa si hacemos ruido
        
        this.velocity = new THREE.Vector3();
        
        this._buildModel();
    }

    _buildModel() {
        this.mesh = new THREE.Group();
        this.mesh.position.set(0, 0.5, 0);

        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

        const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.5, 4, 8);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        body.position.y = 0.2;
        body.castShadow = true;
        this.mesh.add(body);

        const snoutGeo = new THREE.BoxGeometry(0.3, 0.2, 0.4);
        const snout = new THREE.Mesh(snoutGeo, detailMat);
        snout.position.set(0, 0.3, 0.6);
        snout.castShadow = true;
        this.mesh.add(snout);

        const tailGeo = new THREE.CylinderGeometry(0.1, 0.2, 0.8);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.rotation.x = -Math.PI / 4;
        tail.position.set(0, 0.2, -0.6);
        tail.castShadow = true;
        this.mesh.add(tail);

        this.scene.add(this.mesh);
    }

    update(deltaTime, inputKeys) {
        const moveDir = new THREE.Vector3(0, 0, 0);

        if (inputKeys.forward) moveDir.z -= 1;
        if (inputKeys.backward) moveDir.z += 1;
        if (inputKeys.left) moveDir.x -= 1;
        if (inputKeys.right) moveDir.x += 1;

        if (moveDir.length() > 0) moveDir.normalize();

        let currentSpeed = this.speed;
        this.isSprinting = false; // Reseteamos el estado cada frame

        if (inputKeys.sprint && this.stamina > 0 && moveDir.length() > 0) {
            currentSpeed *= this.sprintMultiplier;
            this.stamina -= 20 * deltaTime;
            this.isSprinting = true; // Hacemos ruido
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
