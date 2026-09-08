// src/entities/Props.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class PropsManager {
    constructor(scene) {
        this.scene = scene;
        this.props = []; 
        this.trashBags = []; 
    }

    buildAlley() {
        // Suelo un poco más claro
        const floorGeo = new THREE.PlaneGeometry(50, 80);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Muros
        const wallGeo = new THREE.BoxGeometry(1, 10, 60);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x555555 }); 
        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.position.set(-15, 5, 0);
        leftWall.castShadow = true; leftWall.receiveShadow = true;
        this.scene.add(leftWall);
        
        const rightWall = new THREE.Mesh(wallGeo, wallMat);
        rightWall.position.set(15, 5, 0);
        rightWall.castShadow = true; rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        // Contenedores
        this.createDumpster(-12, 1, -10);
        this.createDumpster(12, 1, 5);
        this.createDumpster(-12, 1, 15);

        // Farolas (Ahora apagadas por ser de día)
        this.createStreetLight(-14, 6, -5);
        this.createStreetLight(14, 6, 10);

        // --- NUEVO: Añadir árboles (Low Poly) ---
        this.createTree(-14, 0, 2);
        this.createTree(14, 0, -8);
        this.createTree(-14, 0, 22);
        this.createTree(14, 0, 18);

        // Bolsas de basura
        this.createTrashBag(-10, 0, -2);
        this.createTrashBag(10, 0, 15);
        this.createTrashBag(0, 0, 20);
        this.createTrashBag(12, 0, -8);
        this.createTrashBag(-5, 0, 10);
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
