// src/entities/PedestrianAI.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class PedestrianAI {
    constructor(scene, player, startPos, waypoints) {
        this.scene = scene;
        this.player = player;
        this.waypoints = waypoints; // Array de posiciones Vector3 por donde patrullará
        this.currentWaypoint = 0;

        this.speed = 2.0;
        this.state = 'PATROL'; // Estados: PATROL, ALERT
        this.visionRange = 10; // Qué tan lejos llega su luz
        this.visionAngle = Math.PI / 5; // Ángulo del cono de visión (unos 36 grados)
        this.hearingRange = 8; // Distancia a la que escucha tus pasos si corres

        this._buildModel(startPos);
    }

    _buildModel(pos) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(pos);

        // Cuerpo del guardia (Cápsula roja para distinguirlo)
        const bodyGeo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x882222 }); 
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0;
        body.castShadow = true;
        this.mesh.add(body);

        // La Linterna (Un foco de luz pegado a su cuerpo)
        this.flashlight = new THREE.SpotLight(0xffffff, 3, this.visionRange, this.visionAngle, 0.5, 1);
        this.flashlight.position.set(0, 1.2, 0); // Altura del pecho
        this.flashlight.target.position.set(0, 0, 1); // Apuntando hacia adelante
        this.flashlight.castShadow = true;
        
        this.mesh.add(this.flashlight);
        this.mesh.add(this.flashlight.target); // Vital para que la luz rote con el guardia

        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (!this.player) return;

        const distanceToPlayer = this.mesh.position.distanceTo(this.player.mesh.position);

        // 1. Detección por Sonido (Si el mapache corre cerca)
        if (this.player.isSprinting && distanceToPlayer < this.hearingRange) {
            this.state = 'ALERT';
        }

        // 2. Detección por Luz (Cono de visión)
        // Calculamos el vector dirección desde el guardia hacia el jugador
        const dirToPlayer = new THREE.Vector3().subVectors(this.player.mesh.position, this.mesh.position).normalize();
        // Calculamos hacia dónde está mirando el guardia actualmente
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();
        // Comparamos el ángulo entre ambos vectores
        const angleToPlayer = forward.angleTo(dirToPlayer);

        if (distanceToPlayer < this.visionRange && angleToPlayer < this.visionAngle) {
            this.state = 'ALERT';
        }

        // 3. Máquina de Estados (Actuar según lo detectado)
        if (this.state === 'PATROL') {
            this.flashlight.color.setHex(0xffffff); // Luz blanca normal
            this.speed = 2.0;
            this.patrol(deltaTime);
        } else if (this.state === 'ALERT') {
            this.flashlight.color.setHex(0xff0000); // ¡Luz roja de alarma!
            this.speed = 3.5; // Corre más rápido para atraparte
            this.moveTo(this.player.mesh.position, deltaTime); // Persigue al jugador
        }
    }

    patrol(deltaTime) {
        if (this.waypoints.length === 0) return;
        const target = this.waypoints[this.currentWaypoint];
        
        this.moveTo(target, deltaTime);

        // Si llegamos al punto actual, cambiamos al siguiente
        if (this.mesh.position.distanceTo(target) < 0.5) {
            this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
        }
    }

    moveTo(target, deltaTime) {
        const direction = new THREE.Vector3().subVectors(target, this.mesh.position);
        direction.y = 0; // Evita que mire al cielo o al piso
        
        if (direction.lengthSq() > 0.01) {
            direction.normalize();
            // Moverse
            this.mesh.position.addScaledVector(direction, this.speed * deltaTime);

            // Rotar fluidamente hacia la dirección
            const targetAngle = Math.atan2(direction.x, direction.z);
            const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
            this.mesh.quaternion.slerp(targetRotation, 5 * deltaTime);
        }
    }
}
