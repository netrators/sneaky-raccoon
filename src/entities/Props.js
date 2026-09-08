import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class PropsManager {
    constructor(scene) {
        this.scene = scene;
        this.props = []; 
        this.trashBags = []; 
    }

    buildWorld() {
        const floorGeo = new THREE.PlaneGeometry(150, 150);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 1.0 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        for (let i = 0; i < 50; i++) {
            const rx = (Math.random() - 0.5) * 120;
            const rz = (Math.random() - 0.5) * 120;
            this.createTree(rx, 0, rz);
        }

        for (let i = 0; i < 10; i++) {
            const rx = (Math.random() - 0.5) * 100;
            const rz = (Math.random() - 0.5) * 100;
            this.createDumpster(rx, 1, rz);
        }

        for (let i = 0; i < 15; i++) {
            const rx = (Math.random() - 0.5) * 100;
            const rz = (Math.random() - 0.5) * 100;
            this.createTrashBag(rx, 0, rz);
        }
    }

    createTree(x, y, z) {
        const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1.0 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 1.5, z);
        trunk.castShadow = true; trunk.receiveShadow = true;
        this.scene.add(trunk);

        const leavesGeo = new THREE.IcosahedronGeometry(2.5, 1);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.8 });
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
}
