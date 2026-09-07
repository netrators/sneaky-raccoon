// src/entities/Props.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class PropsManager {
    constructor(scene) {
        this.scene = scene;
        this.props = []; // Aquí guardaremos los objetos para usarlos en físicas luego
    }

    buildAlley() {
        // 1. El Suelo (Asfalto rugoso)
        const floorGeo = new THREE.PlaneGeometry(30, 60);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            roughness: 0.9 // Hace que la luz no rebote mucho, como asfalto viejo
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 2. Las Paredes (Muros de ladrillo que encierran el callejón)
        const wallGeo = new THREE.BoxGeometry(1, 10, 60);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222 }); // Gris muy oscuro
        
        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.position.set(-15, 5, 0);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeo, wallMat);
        rightWall.position.set(15, 5, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.scene.add(rightWall);

        // 3. Colocar contenedores de basura (Dumpsters)
        this.createDumpster(-12, 1, -10);
        this.createDumpster(12, 1, 5);
        this.createDumpster(-12, 1, 15);

        // 4. Colocar farolas de luz
        this.createStreetLight(-14, 6, -5);
        this.createStreetLight(14, 6, 10);
    }

    createDumpster(x, y, z) {
        // Un bloque simple color verde industrial
        const geo = new THREE.BoxGeometry(3, 2, 2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x113322 }); 
        const dumpster = new THREE.Mesh(geo, mat);
        
        dumpster.position.set(x, y, z);
        dumpster.castShadow = true;
        dumpster.receiveShadow = true;
        
        this.scene.add(dumpster);
        this.props.push(dumpster);
    }

    createStreetLight(x, y, z) {
        // Poste temporal (un cilindro delgado)
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, y);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(x, y / 2, z);
        pole.castShadow = true;
        this.scene.add(pole);

        // Luz de la farola (PointLight que emite luz cálida/naranja)
        const light = new THREE.PointLight(0xffaa00, 5, 15); // Color cálido, intensidad, radio
        light.position.set(x, y, z);
        light.castShadow = true;
        // Este ajuste evita "artefactos" rayados en las sombras de Three.js
        light.shadow.bias = -0.005; 
        this.scene.add(light);
        
        // Foco visual (esferita brillante donde sale la luz)
        const bulbGeo = new THREE.SphereGeometry(0.3);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 }); // Material básico no requiere luz para verse
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(x, y, z);
        this.scene.add(bulb);
    }
}
