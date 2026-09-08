// src/entities/Props.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class PropsManager {
    constructor(scene) {
        this.scene = scene;
        this.props = []; // Contenedores grandes (para esconderse)
        this.trashBags = []; // Pequeñas bolsas (para recolectar)
    }

    buildAlley() {
        const floorGeo = new THREE.PlaneGeometry(30, 60);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        const wallGeo = new THREE.BoxGeometry(1, 10, 60);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222 }); 
        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.position.set(-15, 5, 0);
        this.scene.add(leftWall);
        const rightWall = new THREE.Mesh(wallGeo, wallMat);
        rightWall.position.set(15, 5, 0);
        this.scene.add(rightWall);

        this.createDumpster(-12, 1, -10);
        this.createDumpster(12, 1, 5);
        this.createDumpster(-12, 1, 15);

        this.createStreetLight(-14, 6, -5);
        this.createStreetLight(14, 6, 10);

        // NUEVO: Crear las bolsas de basura objetivo
        this.createTrashBag(-10, 0, -2);
        this.createTrashBag(10, 0, 15);
        this.createTrashBag(0, 0, 20);
        this.createTrashBag(12, 0, -8);
        this.createTrashBag(-5, 0, 10);
    }

    createDumpster(x, y, z) {
        const geo = new THREE.BoxGeometry(3, 2, 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x113322 }); 
        const dumpster = new THREE.Mesh(geo, mat);
        dumpster.position.set(x, y, z);
        dumpster.castShadow = true;
        dumpster.receiveShadow = true;
        this.scene.add(dumpster);
        this.props.push(dumpster);
    }

    createTrashBag(x, y, z) {
        // Una bolsa de basura negra pequeña
        const geo = new THREE.DodecahedronGeometry(0.5, 0); // Parece una bolsa arrugada
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
        this.scene.add(pole);

        const light = new THREE.PointLight(0xffaa00, 5, 15);
        light.position.set(x, y, z);
        light.castShadow = true;
        light.shadow.bias = -0.005; 
        this.scene.add(light);
    }
}
