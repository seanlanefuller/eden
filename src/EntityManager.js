import * as THREE from 'three';
import { LOCATIONS } from './data/locations.js';

export class EntityManager {
    constructor(worldManager, buildingManager) {
        this.world = worldManager;
        this.buildingManager = buildingManager;
        this.entities = [];
    }

    spawnLocations(scene) {
        const waitForHeightData = () => {
            if (this.world.heightData) {
                this.doSpawn(scene);
            } else {
                console.log("EntityManager: Waiting for terrain height data...");
                setTimeout(waitForHeightData, 100);
            }
        };
        waitForHeightData();
    }

    doSpawn(scene) {
        LOCATIONS.forEach(loc => {
            const pos = this.world.mapToWorld(loc.x, loc.y);
            let model;

            // Updated condition to include new types and ID 19 (Trading Post)
            if (loc.category === 'Building' ||
                ['Picnic', 'Shelter', 'Restroom', 'WaterFountain', 'Vending'].includes(loc.category) ||
                [6, 15, 19, 20].includes(loc.id)) {
                model = this.buildingManager.createBuilding(loc);
            } else {
                model = this.createGardenMarker(loc);
                // Adjust simple markers
                const h = this.world.getTerrainHeight(pos.x, pos.z);
                model.userData.yOffset = (model.userData.yOffset || 0) + h;
            }

            // Note: Buildings already have full height adjusted in createBuilding
            // Markers need manual adjustment here OR Inside createGardenMarker.
            // Let's rely on createBuilding handling it for buildings.
            // For markers, we just added the offset above.

            // If createBuilding returns a wrapper with y position set, we should respect it.
            // If model.position.y is already set, we add it? 
            // BuildingManager.createBuilding returns a wrapper at `position.y = baseHeight`.

            // Current code: `model.position.set(pos.x, model.userData.yOffset || 0, pos.z);`
            // This OVERWRITES the Y set by BuildingManager!

            // Fix: Add to existing Y
            const currentY = model.position.y;
            const extraOffset = model.userData.yOffset || 0;

            model.position.set(pos.x, currentY + extraOffset, pos.z);

            model.userData = { ...model.userData, locationId: loc.id, name: loc.name, ...loc };

            scene.add(model);
            this.entities.push(model);
        });

        // Manual Spawns
        // Fountain in Little Smith Lake (User Corrected Coords)
        this.buildingManager.createFountain(scene, 321, -238);
    }

    createSign(loc) {
        const group = new THREE.Group();

        // 1. Texture Generation
        const canvas = document.createElement('canvas');
        canvas.width = 512; // Double width
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background (Wood)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = '#A0522D'; // Grain
        for (let i = 0; i < 100; i++) {
            ctx.fillRect(Math.random() * 512, Math.random() * 128, 30, 2);
        }

        // Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px Arial'; // Slightly larger
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 492, 108);

        // Wrap Text Logic
        const words = loc.name.split(' ');
        if (loc.name.length > 25 && words.length > 2) {
            const mid = Math.floor(words.length / 2);
            const line1 = words.slice(0, mid).join(' ');
            const line2 = words.slice(mid).join(' ');
            ctx.fillText(line1, 256, 45);
            ctx.fillText(line2, 256, 85);
        } else {
            ctx.fillText(loc.name, 256, 64);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;

        // 2. Mesh Construction
        // Post
        const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.y = 0.75;
        group.add(post);

        // Board (Wider)
        const boardGeo = new THREE.BoxGeometry(4, 1, 0.1);
        const boardMat = new THREE.MeshStandardMaterial({ map: tex });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 2; // Top of post
        group.add(board);

        group.userData = { yOffset: 0 }; // Base offset
        return group;
    }

    createGardenMarker(loc) {
        return this.createSign(loc);
    }

    update(deltaTime) {
        // Potential animation updates here
    }
}
