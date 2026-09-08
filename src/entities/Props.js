// src/entities/Props.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class PropsManager {
    constructor(scene) {
        this.scene = scene;
        this.props = []; 
        this.trashBags = []; 
    }

    // src/entities/Props.js
    buildWorld() { // Cambiamos el nombre de buildAlley a buildWorld
        // Un suelo gigantesco verde oscuro (simulando pasto)
        const floorGeo = new THREE.PlaneGeometry(150, 150);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 1.0 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Generar 50 Árboles aleatorios
        for (let i = 0; i < 50; i++) {
            const rx = (Math.random() - 0.5) * 120; // Posición X aleatoria entre -60 y 60
            const rz = (Math.random() - 0.5) * 120; // Posición Z aleatoria entre -60 y 60
            this.createTree(rx, 0, rz);
        }

        // Generar 10 Contenedores para esconderse
        for (let i = 0; i < 10; i++) {
            const rx = (Math.random() - 0.5) * 100;
            const rz = (Math.random() - 0.5) * 100;
            this.createDumpster(rx, 1, rz);
        }

        // Generar 15 Bolsas de basura (objetivos)
        for (let i = 0; i < 15; i++) {
            const rx = (Math.random() - 0.5) * 100;
            const rz = (Math.random() - 0.5) * 100;
            this.createTrashBag(rx, 0, rz);
        }
    }

    createTree(x, y, z) {
        // Tronco
        const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1.0 }); // Café madera
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 1.5, z);
        trunk.castShadow = true; trunk.receiveShadow = true;
        this.scene.add(trunk);

        // Hojas (Icosaedro da un aspecto Low Poly muy bonito)
        const leavesGeo = new THREE.IcosahedronGeometry(2.5, 1);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.8 }); // Verde bosque
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(x, y + 4, z);
        leaves.castShadow = true; leaves.receiveShadow = true;
        this.scene.add(leaves);
    }

    createDumpster(x, y, z) {
        const geo = new THREE.BoxGeometry(3, 2, 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x113322 }); 
        const dumpster = new THREE.Mesh(geo, mat);
        dumpster.position.set(x, y, z);
        dumpster.castShadow = true; dumpster.receiveShadow = true;
        this.scene.add(dumpster);
        this.props.push(dumpster);
    }

    createTrashBag(x, y, z) {
        const geo = new THREE.DodecahedronGeometry(0.5, 0); 
        const mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
        const bag = new THREE.Mesh(geo, mat);
        bag.position.set(x, y + 0.4, z);
        bag.castShadow = true;
        this.scene.add(bag);
        this.trashBags.push(bag);
    }

    createStreetLight(x, y, z) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, y), new THREE.MeshStandardMaterial({ color: 0x555555 }));
        pole.position.set(x, y / 2, z);
        pole.castShadow = true;
        this.scene.add(pole);

        // Foco apagado
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        bulb.position.set(x, y, z);
        this.scene.add(bulb);
    }
}
