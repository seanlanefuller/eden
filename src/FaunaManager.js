import * as THREE from 'three';
import { CONFIG } from './Config.js';

export class FaunaManager {
    constructor(worldManager, vegetationManager) {
        this.world = worldManager;
        this.vegetation = vegetationManager;

        this.squirrels = [];
        this.birds = [];
        this.butterflies = [];

        // Materials cache for efficiency
        this.materials = {
            cardinal: new THREE.MeshStandardMaterial({ color: 0xC41E3A }), // Red
            bluejay: new THREE.MeshStandardMaterial({ color: 0x2B60DE }),  // Blue
            goldfinch: new THREE.MeshStandardMaterial({ color: 0xFFD700 }), // Yellow
            robin: new THREE.MeshStandardMaterial({ color: 0x808080 }),    // Grey

            monarch: new THREE.MeshStandardMaterial({ color: 0xFF8C00, side: THREE.DoubleSide }), // Dark Orange
            swallowtail: new THREE.MeshStandardMaterial({ color: 0xFFFF00, side: THREE.DoubleSide }), // Yellow
            sulphur: new THREE.MeshStandardMaterial({ color: 0xFAFAD2, side: THREE.DoubleSide }), // Light Yellow
            blackswallowtail: new THREE.MeshStandardMaterial({ color: 0x2F2F2F, side: THREE.DoubleSide }), // Black
            bee: new THREE.MeshStandardMaterial({ color: 0xFFD700 }) // Yellow
        };
    }

    createBirdMesh() {
        // Random Species common in AL
        const keys = ['cardinal', 'bluejay', 'goldfinch', 'robin'];
        const species = keys[Math.floor(Math.random() * keys.length)];
        const mat = this.materials[species];

        const group = new THREE.Group();
        group.userData.name = species.charAt(0).toUpperCase() + species.slice(1) + " (Bird)";

        // Body
        const bodyGeo = new THREE.ConeGeometry(0.2, 0.6, 8);
        const body = new THREE.Mesh(bodyGeo, mat);
        body.rotation.x = Math.PI / 2;
        group.add(body);

        // Wings
        const wingGeo = new THREE.BoxGeometry(0.6, 0.05, 0.3);
        const lWing = new THREE.Mesh(wingGeo, mat);
        lWing.position.set(-0.35, 0.1, 0);
        group.add(lWing);

        const rWing = new THREE.Mesh(wingGeo, mat);
        rWing.position.set(0.35, 0.1, 0);
        group.add(rWing);

        group.userData = { lWing, rWing, flapPhase: Math.random() * 100 };
        return group;
    }

    createButterflyMesh() {
        // Random Species common in AL
        const keys = ['monarch', 'swallowtail', 'sulphur', 'blackswallowtail'];
        const species = keys[Math.floor(Math.random() * keys.length)];
        const mat = this.materials[species];

        const group = new THREE.Group();
        group.userData.name = species.charAt(0).toUpperCase() + species.slice(1) + " (Butterfly)";

        // Wings (2 angled planes)
        const wingGeo = new THREE.PlaneGeometry(0.2, 0.2); // Smaller wings

        const lWing = new THREE.Mesh(wingGeo, mat);
        lWing.position.set(-0.1, 0, 0);
        lWing.rotation.y = -Math.PI / 6; // V shape
        group.add(lWing);

        const rWing = new THREE.Mesh(wingGeo, mat);
        rWing.position.set(0.1, 0, 0);
        rWing.rotation.y = Math.PI / 6;
        group.add(rWing);

        group.userData = { lWing, rWing, flapPhase: Math.random() * 100 };
        return group;
    }

    createSquirrelMesh() {
        const group = new THREE.Group();
        group.userData.name = "Eastern Grey Squirrel";
        const furMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const tailMat = new THREE.MeshStandardMaterial({ color: 0xA0522D });

        const bodyGeo = new THREE.BoxGeometry(0.2, 0.2, 0.4);
        const body = new THREE.Mesh(bodyGeo, furMat);
        body.position.y = 0.15;
        group.add(body);

        const headGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        const head = new THREE.Mesh(headGeo, furMat);
        head.position.set(0, 0.25, 0.25);
        group.add(head);

        const tailGeo = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.position.set(0, 0.35, -0.2);
        tail.rotation.x = -Math.PI / 4;
        group.add(tail);
        group.userData.tail = tail;

        const legGeo = new THREE.BoxGeometry(0.08, 0.15, 0.08);
        const legs = [];
        [[-0.1, 0.15], [0.1, 0.15], [-0.1, -0.15], [0.1, -0.15]].forEach(p => {
            const l = new THREE.Mesh(legGeo, furMat);
            l.position.set(p[0], 0.07, p[1]);
            group.add(l);
            legs.push(l);
        });
        group.userData.legs = legs;

        return group;
    }

    initialize(scene) {
        const waitForHeight = () => {
            if (this.world.heightData) {
                this.spawnFauna(scene);
            } else {
                setTimeout(waitForHeight, 100);
            }
        };
        waitForHeight();
    }

    spawnFauna(scene) {
        const DENSITY = CONFIG.FAUNA_DENSITY;

        this.spawnSquirrels(scene, Math.max(1, Math.floor(5 * DENSITY)));
        this.spawnBirds(scene, Math.max(1, Math.floor(30 * DENSITY)));
        this.spawnButterflies(scene, Math.max(1, Math.floor(10 * DENSITY)));
        this.spawnBees(scene, Math.max(1, Math.floor(10 * DENSITY)));
        this.spawnFish(scene, DENSITY);
    }

    spawnSquirrels(scene, count) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 700;
            const z = -Math.random() * 700;

            const squirrel = this.createSquirrelMesh();
            const groundH = this.world.getTerrainHeight(x, z);
            squirrel.position.set(x, groundH, z);

            squirrel.userData.velocity = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(2 + Math.random() * 3);
            squirrel.userData.isMoving = true;
            squirrel.userData.moveTimer = Math.random() * 5;
            squirrel.userData.animTime = Math.random() * 100;

            scene.add(squirrel);
            this.squirrels.push(squirrel);
        }
    }

    spawnBirds(scene, count) {
        // Lewis Bird Watch (Loc 21) => 168, -259
        const birdWatchX = 168;
        const birdWatchZ = -259;

        for (let i = 0; i < count; i++) {
            let x, z;
            // 60% chance to be at Bird Watch
            if (Math.random() < 0.6) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * 40;
                x = birdWatchX + Math.cos(angle) * r;
                z = birdWatchZ + Math.sin(angle) * r;
            } else {
                x = Math.random() * 700;
                z = -Math.random() * 700;
            }

            const y = 20 + Math.random() * 30; // Flying height

            const mesh = this.createBirdMesh();
            mesh.position.set(x, y, z);

            mesh.userData.center = new THREE.Vector3(x, y, z);
            mesh.userData.radius = 10 + Math.random() * 30;
            mesh.userData.speed = 1 + Math.random() * 2;
            mesh.userData.angle = Math.random() * Math.PI * 2;

            scene.add(mesh);
            this.birds.push(mesh);
        }
    }

    spawnButterflies(scene, count) {
        // Pollinator Walk (Map 41, 30) -> World 287, -210
        const targetX = 287;
        const targetZ = -210;
        const spread = 40;

        for (let i = 0; i < count; i++) {
            let x, z;
            if (Math.random() < 0.8) {
                x = targetX + (Math.random() - 0.5) * spread;
                z = targetZ + (Math.random() - 0.5) * spread;
            } else {
                x = Math.random() * 700;
                z = -Math.random() * 700;
            }

            const mesh = this.createButterflyMesh();
            const groundH = this.world.getTerrainHeight(x, z);
            mesh.position.set(x, groundH + 1 + Math.random() * 2, z);

            mesh.userData.anchor = new THREE.Vector3(x, 0, z);

            scene.add(mesh);
            this.butterflies.push(mesh);
        }
    }

    createBeeMesh() {
        const group = new THREE.Group();
        group.userData.name = "Bee";
        const mat = this.materials.bee;
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

        // Body: Small Sphere
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mat);
        group.add(body);

        // Stripes
        const s1 = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 4, 8), stripeMat);
        s1.rotation.y = Math.PI / 2;
        group.add(s1);

        // Wings
        const wingGeo = new THREE.PlaneGeometry(0.15, 0.1);
        const wingMat = new THREE.MeshBasicMaterial({ color: 0xDDDDDD, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const lWing = new THREE.Mesh(wingGeo, wingMat);
        lWing.position.set(-0.05, 0.05, 0);
        lWing.rotation.x = -Math.PI / 4;
        group.add(lWing);

        const rWing = new THREE.Mesh(wingGeo, wingMat);
        rWing.position.set(0.05, 0.05, 0);
        rWing.rotation.x = Math.PI / 4;
        group.add(rWing);

        // Buzzing logic handled by update
        group.userData = { velocity: new THREE.Vector3() };

        return group;
    }

    spawnBees(scene, count) {
        // Pollinator Walk (287, -210) & Wicks (224, -245)
        // Focus on Pollinator Walk
        const cx = 287;
        const cz = -210;

        this.bees = [];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 25;
            const x = cx + Math.cos(angle) * r;
            const z = cz + Math.sin(angle) * r;

            // Low to ground
            const h = this.world.getTerrainHeight(x, z);
            const y = h + 0.5 + Math.random() * 1.5;

            const bee = this.createBeeMesh();
            bee.position.set(x, y, z);

            // Use butterfly update logic or new Logic? 
            // Let's add them to butterflies array for now as they share "Insect" logic in update,
            // OR add specific bee update.
            // Let's create `this.bees` and update them.

            bee.userData.anchor = new THREE.Vector3(x, y, z);
            bee.userData.phase = Math.random() * 100;

            scene.add(bee);
            this.bees.push(bee);
        }
    }

    update(deltaTime) {
        if (!this.world.heightData) return;

        // Squirrels
        this.squirrels.forEach(sq => {
            sq.userData.moveTimer -= deltaTime;
            if (sq.userData.moveTimer <= 0) {
                sq.userData.isMoving = !sq.userData.isMoving;
                sq.userData.moveTimer = 2 + Math.random() * 4;
                if (sq.userData.isMoving) {
                    sq.userData.velocity.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(2 + Math.random() * 3);
                }
            }

            if (sq.userData.isMoving) {
                const vel = sq.userData.velocity;
                sq.position.addScaledVector(vel, deltaTime);
                if (sq.position.x < 0 || sq.position.x > 700) vel.x *= -1;
                if (sq.position.z > 0 || sq.position.z < -700) vel.z *= -1;

                // Water Check (Avoid Water)
                if (this.world.identifyTerrain(sq.position.x, sq.position.z) === 'Water') {
                    // Turn around
                    vel.x *= -1;
                    vel.z *= -1;
                    // Push back slightly?
                    const back = vel.clone().normalize().multiplyScalar(0.5);
                    sq.position.add(back);
                }

                const h = this.world.getTerrainHeight(sq.position.x, sq.position.z);
                sq.position.y = h;
                sq.lookAt(sq.position.x + vel.x, sq.position.y, sq.position.z + vel.z);

                sq.userData.animTime += deltaTime * 15;
                const legOffset = Math.sin(sq.userData.animTime) * 0.05;
                sq.userData.legs[0].position.z = 0.15 + legOffset;
                sq.userData.legs[1].position.z = 0.15 - legOffset;
                sq.userData.legs[2].position.z = -0.15 - legOffset;
                sq.userData.legs[3].position.z = -0.15 + legOffset;
                sq.userData.tail.rotation.z = Math.sin(sq.userData.animTime * 0.5) * 0.1;
            } else {
                sq.userData.legs.forEach(leg => leg.position.setY(0.07));
            }
        });

        // Birds - Flapping
        this.birds.forEach(b => {
            b.userData.angle += b.userData.speed * deltaTime * 0.5;
            const r = b.userData.radius;
            const c = b.userData.center;

            // Move tangent to circle
            const tx = -Math.sin(b.userData.angle);
            const tz = Math.cos(b.userData.angle);

            b.position.x = c.x + Math.cos(b.userData.angle) * r;
            b.position.z = c.z + Math.sin(b.userData.angle) * r;
            // Face forward
            b.lookAt(b.position.x + tx, b.position.y, b.position.z + tz);

            // Flap Wings
            b.userData.flapPhase += deltaTime * 10;
            const flap = Math.sin(b.userData.flapPhase) * 0.5;
            b.userData.lWing.rotation.z = flap;
            b.userData.rWing.rotation.z = -flap;
        });

        // Butterflies - Flapping
        this.butterflies.forEach(bf => {
            bf.userData.flapPhase += deltaTime * 12; // Fast flutter
            const anchor = bf.userData.anchor;

            bf.position.x = anchor.x + Math.sin(bf.userData.flapPhase * 0.1) * 2;
            bf.position.z = anchor.z + Math.cos(bf.userData.flapPhase * 0.07) * 2;

            const h = this.world.getTerrainHeight(bf.position.x, bf.position.z);
            const offset = 1.5 + Math.sin(bf.userData.flapPhase * 0.3) * 0.5;
            bf.position.y = h + offset;

            bf.lookAt(bf.position.x + Math.sin(Date.now() * 0.001), bf.position.y, bf.position.z + Math.cos(Date.now() * 0.001));

            // Wing Flap (V shape open/close)
            const flap = Math.abs(Math.sin(bf.userData.flapPhase)) * 1.0;
            bf.userData.lWing.rotation.y = -0.2 + flap;
            bf.userData.rWing.rotation.y = 0.2 - flap;
        });

        // Fish - Swimming
        if (this.fish) {
            this.fish.forEach(f => {
                const vel = f.userData.velocity;
                f.position.addScaledVector(vel, deltaTime);

                // Stay in Water Check
                // Project ahead
                const ahead = f.position.clone().addScaledVector(vel, 2.0); // look 2m ahead
                if (this.world.identifyTerrain(ahead.x, ahead.z) !== 'Water') {
                    // Turn around
                    vel.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI + (Math.random() - 0.5));
                }

                // Wiggle Animation
                f.userData.animTime += deltaTime * 5;
                f.rotation.y = Math.atan2(-vel.z, vel.x); // Face direction (using -z for 3js logic)
                const wiggle = Math.sin(f.userData.animTime) * 0.2;
                f.rotation.y += wiggle;
            });
        }

        // Bees - Buzzing
        if (this.bees) {
            this.bees.forEach(b => {
                b.userData.phase += deltaTime * 20; // Fast buzz
                const anchor = b.userData.anchor;

                // Jittery movement
                b.position.x = anchor.x + Math.sin(b.userData.phase * 0.5) * 1.0;
                b.position.y = anchor.y + Math.cos(b.userData.phase * 0.3) * 0.5;
                b.position.z = anchor.z + Math.cos(b.userData.phase * 0.4) * 1.0;

                b.lookAt(b.position.x + Math.random() - 0.5, b.position.y, b.position.z + Math.random() - 0.5);
            });
        }
    }

    createFishMesh() {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0xFF8C00 }); // Goldfish/Koi color

        const bodyGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
        const body = new THREE.Mesh(bodyGeo, mat);
        body.rotation.z = -Math.PI / 2;
        group.add(body);

        const tailGeo = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            -0.2, 0, 0,   // Base
            -0.4, 0.1, 0, // Top Tip
            -0.4, -0.1, 0 // Bot Tip
        ]);
        tailGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const tail = new THREE.Mesh(tailGeo, mat);
        group.add(tail);

        return group;
    }

    spawnFish(scene, density = 1.0) {
        this.fish = [];

        // Definition of Lakes
        const lakes = [
            { name: "Little Smith Lake", centerX: 287, centerZ: -210, range: 40, count: 5 },
            { name: "Lake Lonnie", centerX: 350, centerZ: -600, range: 60, count: 5 }
        ];

        lakes.forEach(lake => {
            let spawned = 0;
            let attempts = 0;
            const targetCount = Math.max(1, Math.floor(lake.count * density)); // Apply Density

            while (spawned < targetCount && attempts < 100) {
                attempts++;
                const r = Math.random() * lake.range;
                const theta = Math.random() * Math.PI * 2;
                const x = lake.centerX + Math.cos(theta) * r;
                const z = lake.centerZ + Math.sin(theta) * r;

                if (this.world.identifyTerrain(x, z) === 'Water') {
                    const fish = this.createFishMesh();
                    // Just below surface (water level depends on heightmap, but water implies flat base + 0.02)
                    // Heightmap logic: height = 1.0 - y/size + 0.02.
                    const surfaceY = this.world.getTerrainHeight(x, z);

                    fish.position.set(x, surfaceY - 0.2, z); // 20cm underwater
                    fish.userData.velocity = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(0.5); // slow
                    fish.userData.animTime = Math.random() * 100;

                    scene.add(fish);
                    this.fish.push(fish);
                    spawned++;
                }
            }
        });
    }
}
