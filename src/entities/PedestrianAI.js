// src/entities/PedestrianAI.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class PedestrianAI {
    constructor(scene, player, startPos, waypoints) {
        this.scene = scene;
        this.player = player;
        this.waypoints = waypoints;
        this.currentWaypoint = 0;

        this.speed = 2.0;
        this.state = 'PATROL';
        this.visionRange = 10;
        this.visionAngle = Math.PI / 5;
        this.hearingRange = 8;

        this._buildModel(startPos);
    }

    _buildModel(pos) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(pos);

        const bodyGeo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x882222 }); 
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0;
        body.castShadow = true;
        this.mesh.add(body);

        this.flashlight = new THREE.SpotLight(0xffffff, 3, this.visionRange, this.visionAngle, 0.5, 1);
        this.flashlight.position.set(0, 1.2, 0);
        this.flashlight.target.position.set(0, 0, 1);
        this.flashlight.castShadow = true;
        
        this.mesh.add(this.flashlight);
        this.mesh.add(this.flashlight.target);

        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (!this.player) return;

        // Si el jugador se escondió, pierde el interés
        if (this.player.isHidden) {
            if (this.state === 'ALERT') {
                this.state = 'PATROL';
                this.flashlight.color.setHex(0xffffff); // Linterna blanca
                this.speed = 2.0;
            }
        }

        const distanceToPlayer = this.mesh.position.distanceTo(this.player.mesh.position);

        // Solo detectamos si el jugador NO está escondido
        if (!this.player.isHidden) {
            if (this.player.isSprinting && distanceToPlayer < this.hearingRange) {
                this.state = 'ALERT';
            }

            const dirToPlayer = new THREE.Vector3().subVectors(this.player.mesh.position, this.mesh.position).normalize();
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();
            const angleToPlayer = forward.angleTo(dirToPlayer);

            if (distanceToPlayer < this.visionRange && angleToPlayer < this.visionAngle) {
                this.state = 'ALERT';
            }
        }

        // Máquina de Estados
        if (this.state === 'PATROL') {
            this.patrol(deltaTime);
        } else if (this.state === 'ALERT') {
            this.flashlight.color.setHex(0xff0000);
            this.speed = 3.5;
            this.moveTo(this.player.mesh.position, deltaTime);
        }
    }

    patrol(deltaTime) {
        if (this.waypoints.length === 0) return;
        const target = this.waypoints[this.currentWaypoint];
        
        this.moveTo(target, deltaTime);

        if (this.mesh.position.distanceTo(target) < 0.5) {
            this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
        }
    }

    moveTo(target, deltaTime) {
        const direction = new THREE.Vector3().subVectors(target, this.mesh.position);
        direction.y = 0; 
        
        if (direction.lengthSq() > 0.01) {
            direction.normalize();
            this.mesh.position.addScaledVector(direction, this.speed * deltaTime);

            const targetAngle = Math.atan2(direction.x, direction.z);
            const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            this.mesh.quaternion.slerp(targetRotation, 5 * deltaTime);
        }
    }
}
