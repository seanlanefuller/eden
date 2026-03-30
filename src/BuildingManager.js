import * as THREE from 'three';

export class BuildingManager {
    constructor(worldManager) {
        this.world = worldManager; // Dependency Injection
        this.materials = {
            white: new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.8 }),
            brick: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 }),
            stone: new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.7 }),
            glass: new THREE.MeshStandardMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.5, metalness: 0.3, roughness: 0.1 }),
            wood: new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.8 }),
            roof: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1.0 }),
            screen: new THREE.MeshStandardMaterial({ color: 0x444444, wireframe: true }),
            deck: new THREE.MeshStandardMaterial({ color: 0xA0522D, roughness: 0.9 }),
            thatched: new THREE.MeshStandardMaterial({ color: 0xE4D96F, roughness: 1.0 }), // Straw yellow
            hedge: new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 1.0 }), // Forest Green
            lawn: new THREE.MeshStandardMaterial({ color: 0x7CFC00, roughness: 1.0 }) // Lawn Green
        };
    }

    // Helper to find ground height for a building area
    getGroundHeight(centerX, centerZ, width, depth) {
        if (!this.world || !this.world.heightData) return 0;

        // Check 5 points: Center + 4 Corners
        const points = [
            { x: centerX, z: centerZ },
            { x: centerX - width / 2, z: centerZ - depth / 2 },
            { x: centerX + width / 2, z: centerZ - depth / 2 },
            { x: centerX - width / 2, z: centerZ + depth / 2 },
            { x: centerX + width / 2, z: centerZ + depth / 2 },
        ];

        let minH = Infinity;
        points.forEach(p => {
            const h = this.world.getTerrainHeight(p.x, p.z);
            if (h < minH) minH = h;
        });

        return minH;
    }

    createBuilding(loc) {
        const x = loc.x * 7.0;
        const z = -(loc.y * 7.0);

        // Estimate rough footprint (improve per building if needed)
        // Estimate rough footprint (improve per building if needed)
        let width = 20;
        let depth = 20;

        // Use smaller footprint for small structures to avoid sinking into distant low-ground
        if (loc.category === "Picnic" || loc.category === "WaterFountain" || loc.category === "Vending" || loc.id === 19) {
            width = 4;
            depth = 4;
        }

        const baseHeight = this.getGroundHeight(x, z, width, depth);

        let buildingGroup;
        switch (loc.id) {
            case 1: buildingGroup = this.createPropstGuestCenter(); break;
            case 2: buildingGroup = this.createTeledyneTerrace(); break;
            case 5: buildingGroup = this.createMurrayHall(); break;
            case 6: buildingGroup = this.createTrainGarden(x, z, baseHeight); break;
            case 10: buildingGroup = this.createSummerHouse(); break;
            case 15: buildingGroup = this.createMotherEarth(); break;
            case 19: buildingGroup = this.createTradingPostHut(); break;
            case 20: buildingGroup = this.createWicksGarden(); break;
            case 23: buildingGroup = this.createButterflyHouse(); break;
            case 25: buildingGroup = this.createAmphitheatre(); break;
            case 26: buildingGroup = this.createAdminBuilding(); break;
            case 27: buildingGroup = this.createNicholsArbor(); break;
            case 28: buildingGroup = this.createGrishamPavilion(); break;
            case 50: buildingGroup = this.createGiftShop(); break;
            case 51: buildingGroup = this.createBistro(); break;
            default:
                if (loc.category === "Picnic") buildingGroup = this.createPicnicArea();
                else if (loc.category === "Shelter") buildingGroup = this.createShelter();
                else if (loc.category === "Restroom") buildingGroup = this.createRestroom();
                else if (loc.category === "WaterFountain") buildingGroup = this.createDrinkingFountain();
                else if (loc.category === "Vending") buildingGroup = this.createVending();
                else buildingGroup = this.createGenericBuilding(loc);
                break;
        }

        // Apply ground height offset
        // User said: "lowest level of terrain it is built on"
        // baseHeight is the min height.
        // If building models are centered at Y=0 local, we lift them by baseHeight.
        // Some models have internal yOffset (e.g. Propst starts at y=1). 
        // We add baseHeight to the final group position.

        // Use a wrapper group to handle the elevation offset cleanly
        const wrapper = new THREE.Group();
        wrapper.add(buildingGroup);
        wrapper.position.y = baseHeight;

        return wrapper;
    }

    createPropstGuestCenter() {
        const group = new THREE.Group();

        // Materials
        const brickMat = this.materials.brick;
        const stoneMat = this.materials.stone;
        const whiteMat = this.materials.white; // Neoclassical/Stucco
        const roofMat = this.materials.roof;
        const glassMat = this.materials.glass;
        const woodMat = this.materials.wood;

        // --- 1. MAIN HALL (Isenberg Grand Hall - Neoclassical) ---
        const mainGroup = new THREE.Group();

        // Foundation
        const mainBase = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 24), stoneMat);
        mainBase.position.y = 1;
        mainGroup.add(mainBase);

        // Body (Brick with White Columns/Pilasters hint)
        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(38, 14, 22), brickMat);
        mainBody.position.y = 8;
        mainGroup.add(mainBody);

        // Portico (Entrance)
        const porticoBase = new THREE.Mesh(new THREE.BoxGeometry(18, 1, 10), stoneMat);
        porticoBase.position.set(0, 1.5, 14);
        mainGroup.add(porticoBase);

        // Columns
        const colGeo = new THREE.CylinderGeometry(0.8, 0.8, 14, 16);
        for (let i = 0; i < 4; i++) {
            const col = new THREE.Mesh(colGeo, whiteMat);
            const x = -6 + i * 4; // -6, -2, 2, 6
            col.position.set(x, 8.5, 16); // Base is 1.5, Height 14 -> Top 15.5. Center 8.5.
            mainGroup.add(col);
        }

        // Pediment (Triangle Roof above Entrance)
        const pediment = new THREE.Mesh(new THREE.ConeGeometry(19, 5, 4), whiteMat);
        pediment.rotation.y = Math.PI / 4; // Align square base to be diamond, so profile is triangle
        pediment.scale.set(1, 1, 0.3);   // Flatten depth
        pediment.position.set(0, 17, 16);
        mainGroup.add(pediment);

        // Main Roof
        const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(28, 10, 4), roofMat);
        mainRoof.rotation.y = Math.PI / 4;
        mainRoof.scale.set(1.2, 1, 0.8);
        mainRoof.position.set(0, 20, 0);
        mainGroup.add(mainRoof);

        group.add(mainGroup);


        // --- 2. CONSERVATORY (Right Wing - East) ---
        // Jewel-like glass structure, suitable for weddings
        const consGroup = new THREE.Group();
        consGroup.position.set(35, 0, 5); // Offset to right and slightly forward

        // Base wall
        const consBase = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 4, 8), brickMat);
        consBase.position.y = 2;
        consGroup.add(consBase);

        // Glass Dome/Walls (Octagonal)
        const consGlass = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 8, 8), glassMat);
        consGlass.position.y = 8;
        consGroup.add(consGlass);

        // Roof (Glass cone/pyramid)
        const consRoof = new THREE.Mesh(new THREE.ConeGeometry(10, 6, 8), glassMat);
        consRoof.position.y = 15;
        consGroup.add(consRoof);

        // Frame/Ribs (White metal structure)
        const ribGeo = new THREE.BoxGeometry(0.5, 12, 0.5);
        for (let i = 0; i < 8; i++) {
            const rib = new THREE.Mesh(ribGeo, whiteMat);
            const angle = i * Math.PI / 4;
            rib.position.set(9 * Math.cos(angle), 8, 9 * Math.sin(angle));
            rib.lookAt(0, 8, 0);
            consGroup.add(rib);
        }

        group.add(consGroup);

        // Connector (Main <-> Conservatory)
        const conn1 = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 8), whiteMat);
        conn1.position.set(20, 5, 5);
        group.add(conn1);


        // --- 3. CARRIAGE HOUSE (Left Wing - West) ---
        // Rustic, charming, exposed beams
        const carrGroup = new THREE.Group();
        carrGroup.position.set(-35, 0, 0);

        // Stone Base
        const carrBase = new THREE.Mesh(new THREE.BoxGeometry(26, 2, 16), stoneMat);
        carrBase.position.y = 1;
        carrGroup.add(carrBase);

        // Wood/Stucco Body
        const carrBody = new THREE.Mesh(new THREE.BoxGeometry(24, 10, 14), whiteMat); // Stucco look
        carrBody.position.y = 7;
        carrGroup.add(carrBody);

        // Beams/Detailing
        const beamGeo = new THREE.BoxGeometry(0.8, 10, 14.5);
        for (let j = 0; j < 3; j++) {
            const beam = new THREE.Mesh(beamGeo, woodMat);
            beam.position.set(-10 + j * 10, 7, 0); // exposed framing
            carrGroup.add(beam);
        }

        // Roof
        const carrRoof = new THREE.Mesh(new THREE.ConeGeometry(18, 7, 4), roofMat);
        carrRoof.rotation.y = Math.PI / 4;
        carrRoof.scale.set(1.2, 1, 1);
        carrRoof.position.y = 15.5;
        carrGroup.add(carrRoof);

        // Large rustic Doors (for carriage entry style)
        const door = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 1), woodMat);
        door.position.set(0, 4.5, 7.5); // Front face
        carrGroup.add(door);

        group.add(carrGroup);

        // Connector (Main <-> Carriage)
        const conn2 = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 8), brickMat);
        conn2.position.set(-20, 5, 0);
        group.add(conn2);


        group.userData = { yOffset: 0 };
        return group;
    }

    createTeledyneTerrace() {
        const group = new THREE.Group();
        // Formal Wedding Garden "Outdoor Room"
        const width = 20;
        const depth = 30;

        // 1. Foundation / Ground
        const base = new THREE.Mesh(new THREE.BoxGeometry(width + 2, 1, depth + 2), this.materials.stone);
        base.position.y = 0.5;
        group.add(base);

        // 2. Central Lawn
        const lawn = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 24), this.materials.lawn);
        lawn.position.y = 1.1; // Slightly above stone base
        group.add(lawn);

        // 3. Central Walkway (Aisle)
        const path = new THREE.Mesh(new THREE.BoxGeometry(4, 0.25, 24), this.materials.stone);
        path.position.y = 1.12;
        group.add(path);

        // 4. Hedge Walls (Enclosure)
        // Tall, manicured boxwood
        const hedgeGeoH = new THREE.BoxGeometry(width, 3, 2);
        const hedgeGeoV = new THREE.BoxGeometry(2, 3, depth);
        const hedgeMat = this.materials.hedge;

        // Back Wall (Behind Arch)
        const backHedge = new THREE.Mesh(hedgeGeoH, hedgeMat);
        backHedge.position.set(0, 2.5, -14); // North end
        group.add(backHedge);

        // Side Walls
        const leftHedge = new THREE.Mesh(hedgeGeoV, hedgeMat);
        leftHedge.position.set(-9, 2.5, 0);
        group.add(leftHedge);

        const rightHedge = new THREE.Mesh(hedgeGeoV, hedgeMat);
        rightHedge.position.set(9, 2.5, 0);
        group.add(rightHedge);

        // 5. Stone Arch (Focal Point)
        const archGroup = new THREE.Group();
        const colGeo = new THREE.BoxGeometry(1.5, 5, 1.5);
        const col1 = new THREE.Mesh(colGeo, this.materials.white); // Limestone look
        col1.position.set(-3, 2.5, 0);
        const col2 = new THREE.Mesh(colGeo, this.materials.white);
        col2.position.set(3, 2.5, 0);

        const topGeo = new THREE.BoxGeometry(9, 1.5, 1.5);
        const top = new THREE.Mesh(topGeo, this.materials.white);
        top.position.set(0, 5.75, 0);

        // Keystone / Detail
        const keystone = new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 1.6), this.materials.stone);
        keystone.position.set(0, 5.75, 0);

        archGroup.add(col1, col2, top, keystone);
        archGroup.position.set(0, 1, -12); // At the end of the aisle
        group.add(archGroup);

        // 6. Seating (Rows of chairs)
        // 2 sides, ~8 rows
        const chairGeo = new THREE.BoxGeometry(0.6, 0.5, 0.6);
        const chairMat = this.materials.white;

        for (let row = 0; row < 8; row++) {
            const z = -8 + row * 1.5;
            // Left block
            for (let c = 0; c < 4; c++) {
                const chair = new THREE.Mesh(chairGeo, chairMat);
                chair.position.set(-3 - c * 1.0, 1.35, z);
                group.add(chair);
            }
            // Right block
            for (let c = 0; c < 4; c++) {
                const chair = new THREE.Mesh(chairGeo, chairMat);
                chair.position.set(3 + c * 1.0, 1.35, z);
                group.add(chair);
            }
        }

        group.userData = { yOffset: 0 };
        return group;
    }

    createMurrayHall() {
        const group = new THREE.Group();
        // Elegant, expansive windows, neutral-toned, wraparound deck
        const bodyGeo = new THREE.BoxGeometry(14, 8, 10);
        const body = new THREE.Mesh(bodyGeo, this.materials.white);
        body.position.y = 4.5;
        group.add(body);

        // Large Windows (Represented by glass strips)
        const winGeo = new THREE.BoxGeometry(13.5, 4, 10.2);
        const win = new THREE.Mesh(winGeo, this.materials.glass);
        win.position.y = 5;
        group.add(win);

        // Wraparound Deck
        const deckGeo = new THREE.BoxGeometry(18, 0.5, 14);
        const deck = new THREE.Mesh(deckGeo, this.materials.deck);
        deck.position.y = 0.75;
        group.add(deck);

        group.userData = { yOffset: 0 };
        return group;
    }

    createSummerHouse() {
        const group = new THREE.Group();
        // Simple, rustic house for rest
        const bodyGeo = new THREE.BoxGeometry(6, 4, 6);
        const body = new THREE.Mesh(bodyGeo, this.materials.wood);
        body.position.y = 2;
        group.add(body);

        const roofGeo = new THREE.ConeGeometry(5, 3, 4);
        const roof = new THREE.Mesh(roofGeo, this.materials.wood);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 5;
        group.add(roof);

        group.userData = { yOffset: 0 };
        return group;
    }

    createButterflyHouse() {
        const group = new THREE.Group();
        // Anderson Education Center & Purdy Butterfly House
        // Education Center part
        const edGeo = new THREE.BoxGeometry(10, 6, 8);
        const ed = new THREE.Mesh(edGeo, this.materials.white);
        ed.position.set(-6, 3, 0);
        group.add(ed);

        // Butterfly House (large open-air screened dome)
        const domeGeo = new THREE.SphereGeometry(8, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeo, this.materials.screen);
        dome.position.set(4, 0, 0);
        group.add(dome);

        group.userData = { yOffset: 0 };
        return group;
    }

    createAmphitheatre() {
        const group = new THREE.Group();
        // Open-air stage with Doric columns
        const stageGeo = new THREE.CircleGeometry(10, 32, 0, Math.PI);
        const stage = new THREE.Mesh(stageGeo, this.materials.stone);
        stage.rotation.x = -Math.PI / 2;
        group.add(stage);

        // Salvaged Columns framing the stage
        const colGeo = new THREE.CylinderGeometry(0.5, 0.6, 8, 12);
        const leftCol = new THREE.Mesh(colGeo, this.materials.stone);
        leftCol.position.set(-8, 4, -1);
        group.add(leftCol);

        const rightCol = new THREE.Mesh(colGeo, this.materials.stone);
        rightCol.position.set(8, 4, -1);
        group.add(rightCol);

        // Seating (simple steps)
        for (let r = 1; r <= 3; r++) {
            const seatGeo = new THREE.RingGeometry(12 + r * 2, 13 + r * 2, 32, 1, 0, Math.PI);
            const seat = new THREE.Mesh(seatGeo, this.materials.stone);
            seat.rotation.x = -Math.PI / 2;
            seat.position.y = r * 0.5;
            group.add(seat);
        }

        group.userData = { yOffset: 0.1 };
        return group;
    }

    createAdminBuilding() {
        const group = new THREE.Group();
        // Modern office building
        const bodyGeo = new THREE.BoxGeometry(12, 10, 8);
        const body = new THREE.Mesh(bodyGeo, this.materials.stone);
        body.position.y = 5;
        group.add(body);

        // Window Rows
        for (let h = 0; h < 3; h++) {
            const winGeo = new THREE.BoxGeometry(10, 1.5, 8.2);
            const win = new THREE.Mesh(winGeo, this.materials.glass);
            win.position.y = 2.5 + h * 3;
            group.add(win);
        }

        group.userData = { yOffset: 0 };
        return group;
    }

    createNicholsArbor() {
        const group = new THREE.Group();
        // Rustic tradition meets elegance, wooden doors, pergola
        const bodyGeo = new THREE.BoxGeometry(10, 7, 8);
        const body = new THREE.Mesh(bodyGeo, this.materials.wood);
        body.position.y = 3.5;
        group.add(body);

        // Pergola attachment
        const pergolaGroup = new THREE.Group();
        const postGeo = new THREE.BoxGeometry(0.3, 5, 0.3);
        const beamGeo = new THREE.BoxGeometry(8, 0.3, 0.3);

        for (let i = 0; i < 4; i++) {
            const x = (i % 2 === 0 ? -4 : 4);
            const z = (i < 2 ? 6 : 10);
            const post = new THREE.Mesh(postGeo, this.materials.wood);
            post.position.set(x, 2.5, z);
            pergolaGroup.add(post);
        }

        for (let j = 0; j < 5; j++) {
            const beam = new THREE.Mesh(beamGeo, this.materials.wood);
            beam.rotation.y = Math.PI / 2;
            beam.position.set(-4 + j * 2, 5, 8);
            pergolaGroup.add(beam);
        }
        group.add(pergolaGroup);

        group.userData = { yOffset: 0 };
        return group;
    }

    createGrishamPavilion() {
        const group = new THREE.Group();
        // Large, covered outdoor pavilion
        const floorGeo = new THREE.BoxGeometry(15, 0.5, 12);
        const floor = new THREE.Mesh(floorGeo, this.materials.stone);
        group.add(floor);

        const postGeo = new THREE.BoxGeometry(0.4, 6, 0.4);
        [[-7, -5.5], [7, -5.5], [7, 5.5], [-7, 5.5]].forEach(p => {
            const post = new THREE.Mesh(postGeo, this.materials.wood);
            post.position.set(p[0], 3, p[1]);
            group.add(post);
        });

        const roofGeo = new THREE.BoxGeometry(16, 1, 13);
        const roof = new THREE.Mesh(roofGeo, this.materials.roof);
        roof.position.y = 6.5;
        group.add(roof);

        group.userData = { yOffset: 0.1 };
        return group;
    }

    createWicksGarden() {
        const group = new THREE.Group();

        // 1. Dinosaur Theme (Detailed Stegosaurus)
        const dinoGroup = new THREE.Group();
        const stoneMat = this.materials.stone;

        // Main Body (Torso) - Large Ellipsoid
        const bodyGeo = new THREE.SphereGeometry(3.5, 16, 16);
        const body = new THREE.Mesh(bodyGeo, stoneMat);
        body.scale.set(1.6, 1.1, 0.9); // Elongated and slightly flattened
        body.position.y = 4;
        dinoGroup.add(body);

        // Neck - Tapered cylinders curving forward
        const neckGeo = new THREE.CylinderGeometry(0.8, 1.2, 3, 12);
        const neck = new THREE.Mesh(neckGeo, stoneMat);
        neck.rotation.z = -Math.PI / 3;
        neck.position.set(-5, 5, 0);
        dinoGroup.add(neck);

        // Head - Boxy snout + Cranium
        const headGroup = new THREE.Group();
        const cranium = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1), stoneMat);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.8), stoneMat);
        snout.position.set(-1.2, -0.1, 0); // Stick out front
        headGroup.add(cranium);
        headGroup.add(snout);
        headGroup.position.set(-7, 6, 0);
        headGroup.rotation.z = 0.2; // Look slightly down
        dinoGroup.add(headGroup);

        // Tail - Tapered cone segments curving back
        const tailGeo = new THREE.ConeGeometry(1.0, 7, 12);
        const tail = new THREE.Mesh(tailGeo, stoneMat);
        tail.rotation.z = Math.PI / 2.5;
        tail.position.set(6, 4, 0);
        dinoGroup.add(tail);

        // Legs - Heavy pillars
        const legGeo = new THREE.CylinderGeometry(0.8, 0.7, 4, 8);
        const legs = [
            { x: -3, z: 2 }, { x: -3, z: -2 }, // Front
            { x: 3, z: 2.2 }, { x: 3, z: -2.2 }  // Back (Wider stance)
        ];
        legs.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, stoneMat);
            leg.position.set(pos.x, 2, pos.z);
            dinoGroup.add(leg);
        });

        // PLATES (Stegosaurus feature) - Alternating rows
        const plateGeo = new THREE.CylinderGeometry(0.1, 1, 1.5, 3); // Extruded triangle-ish
        for (let i = 0; i < 7; i++) {
            const t = i / 6; // 0 to 1
            // Curve along spine: Neck -> Back -> Tail
            const x = -5 + t * 11;
            const yOffset = Math.sin(t * Math.PI) * 1.5; // Arc up

            // Staggered plates
            const plateScale = 0.5 + Math.sin(t * Math.PI) * 0.8; // Small at ends, big in middle

            const plateL = new THREE.Mesh(plateGeo, stoneMat);
            plateL.scale.set(1, 1, 0.2); // Flat
            plateL.position.set(x, 4.5 + yOffset, 0.4);
            plateL.rotation.x = -0.2;
            plateL.scale.multiplyScalar(plateScale);
            dinoGroup.add(plateL);

            const plateR = new THREE.Mesh(plateGeo, stoneMat);
            plateR.scale.set(1, 1, 0.2);
            plateR.position.set(x + 0.8, 4.5 + yOffset, -0.4); // Staggered X slightly
            plateR.rotation.x = 0.2;
            plateR.scale.multiplyScalar(plateScale);
            dinoGroup.add(plateR);
        }

        // THAGOMIZER (Tail Spikes)
        const spikeGeo = new THREE.ConeGeometry(0.15, 1.5, 8);
        for (let j = 0; j < 4; j++) {
            const spike = new THREE.Mesh(spikeGeo, stoneMat);
            const side = j % 2 === 0 ? 1 : -1;
            const dist = 0.5 + Math.floor(j / 2) * 0.5;
            spike.position.set(8.5 + dist, 4 - dist * 0.5, side * 0.5);
            spike.rotation.z = -Math.PI / 3; // Point back
            spike.rotation.x = side * Math.PI / 4; // Point out
            dinoGroup.add(spike);
        }

        dinoGroup.position.set(-10, 0, -10);
        group.add(dinoGroup);

        // 2. Space Station Node (Detailed)
        const spaceGroup = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.3, metalness: 0.8 });
        const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.6 });
        const solarMat = new THREE.MeshStandardMaterial({ color: 0x000088, roughness: 0.2, metalness: 0.5, emissive: 0x000044 });

        // A. Central Hub Node
        const hubGeo = new THREE.SphereGeometry(2.5, 16, 16);
        const hub = new THREE.Mesh(hubGeo, metalMat);
        hub.position.y = 5;
        spaceGroup.add(hub);

        // B. Main Cylindrical Module (Living Quarters)
        const mainModGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
        const mainMod = new THREE.Mesh(mainModGeo, metalMat);
        mainMod.rotation.z = Math.PI / 2;
        mainMod.position.y = 5;
        spaceGroup.add(mainMod);

        // B.1 End Cap / Airlock
        const capGeo = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
        const leftCap = new THREE.Mesh(capGeo, darkMetalMat);
        leftCap.rotation.z = Math.PI / 2;
        leftCap.position.set(-4.5, 5, 0);
        spaceGroup.add(leftCap);

        const rightCap = new THREE.Mesh(capGeo, darkMetalMat);
        rightCap.rotation.z = Math.PI / 2;
        rightCap.position.set(4.5, 5, 0);
        spaceGroup.add(rightCap);

        // C. Vertical Lab Module
        const labGeo = new THREE.CylinderGeometry(1.8, 1.8, 6, 16);
        const labMod = new THREE.Mesh(labGeo, metalMat);
        labMod.position.set(0, 8, 0); // Stick up from hub
        spaceGroup.add(labMod);

        // C.1 Lab Dome
        const domeGeo = new THREE.SphereGeometry(1.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const labDome = new THREE.Mesh(domeGeo, metalMat);
        labDome.position.set(0, 11, 0);
        spaceGroup.add(labDome);

        // D. Solar Array Truss Structure
        const trussGeo = new THREE.BoxGeometry(16, 0.5, 0.5);
        const truss = new THREE.Mesh(trussGeo, darkMetalMat);
        truss.position.set(0, 5, 0);
        spaceGroup.add(truss);

        // E. Solar Panels (Segmented)
        const panelGeo = new THREE.BoxGeometry(3, 8, 0.1);
        // Left Wing
        for (let i = 0; i < 3; i++) {
            const panel = new THREE.Mesh(panelGeo, solarMat);
            // Rotated to catch "sun"
            panel.rotation.x = Math.PI / 4;
            panel.position.set(-5 - i * 3.5, 5, 0);
            spaceGroup.add(panel);
        }
        // Right Wing
        for (let i = 0; i < 3; i++) {
            const panel = new THREE.Mesh(panelGeo, solarMat);
            panel.rotation.x = Math.PI / 4;
            panel.position.set(5 + i * 3.5, 5, 0);
            spaceGroup.add(panel);
        }

        // F. Comms Dish
        const dishGeo = new THREE.ConeGeometry(2, 1, 16, 1, true);
        const dish = new THREE.Mesh(dishGeo, metalMat);
        dish.position.set(2, 9, 2);
        dish.rotation.x = -Math.PI / 3;
        dish.rotation.z = -Math.PI / 6;
        spaceGroup.add(dish);

        // Antenna
        const antGeo = new THREE.CylinderGeometry(0.05, 0.05, 3);
        const antenna = new THREE.Mesh(antGeo, darkMetalMat);
        antenna.position.set(2, 9, 2);
        antenna.lookAt(2 + 10, 9 + 10, 2 + 10); // Point random direction
        spaceGroup.add(antenna);

        spaceGroup.position.set(15, 0, 15);
        group.add(spaceGroup);

        group.userData = { yOffset: 0 };
        return group;
    }

    createMotherEarth() {
        const group = new THREE.Group();
        // Mother Earth Sculpture (Billboard/Sprite)

        // Load Texture
        const loader = new THREE.TextureLoader();
        const tex = loader.load('research/MotherEarth.jpg');
        tex.colorSpace = THREE.SRGBColorSpace;

        // Use a Billboard (Sprite matches camera rotation automatically)
        const mat = new THREE.SpriteMaterial({ map: tex });
        const sprite = new THREE.Sprite(mat);

        // Adjust scale (assuming portrait or square-ish, 3x4 meters roughly?)
        // Let's make it significant
        sprite.scale.set(7, 5, 1);

        // Lift so bottom is on ground (Sprite center is 0,0, so lift by half height)
        sprite.position.y = 2.5;

        group.add(sprite);

        // Add a base
        const baseGeo = new THREE.BoxGeometry(2, 0.5, 2);
        const baseMat = this.materials.stone;
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.25;
        group.add(base);

        group.userData = { yOffset: 0 };
        return group;
    }

    createGenericBuilding(loc) {
        const group = new THREE.Group();
        const bodyGeo = new THREE.BoxGeometry(8, 6, 8);
        const mat = (loc.category === 'Building') ? this.materials.white : this.materials.stone;
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 3;
        group.add(body);

        const roofGeo = new THREE.ConeGeometry(6, 3, 4);
        const roof = new THREE.Mesh(roofGeo, this.materials.roof);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 7.5;
        group.add(roof);

        group.userData = { yOffset: 0 };
        return group;
    }

    createFountain(scene, x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        // 1. Base (Concrete Bowl)
        const bowlGeo = new THREE.CylinderGeometry(2.5, 1.5, 1, 16); // Reduced 50% (5 -> 2.5, 3 -> 1.5)
        const bowl = new THREE.Mesh(bowlGeo, this.materials.stone);
        bowl.position.y = 0.5;
        group.add(bowl);

        // 2. Central Spire
        const spireGeo = new THREE.CylinderGeometry(0.5, 0.8, 3, 8);
        const spire = new THREE.Mesh(spireGeo, this.materials.stone);
        spire.position.y = 2;
        group.add(spire);

        // 3. Water Particles (Points)
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = []; // Custom data for simulation

        for (let i = 0; i < count; i++) {
            positions.push(0, 3.5, 0); // Start at top of spire

            // Initial velocity: Up + random spread
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 0.5;
            const vx = Math.cos(angle) * r;
            const vy = 4 + Math.random() * 2; // Upward burst
            const vz = Math.sin(angle) * r;
            velocities.push(vx, vy, vz);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const waterMat = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.2,
            transparent: true,
            opacity: 0.6
        });

        const points = new THREE.Points(geometry, waterMat);
        group.add(points);

        scene.add(group);

        // Animation State
        if (!this.animatedObjects) this.animatedObjects = [];
        this.animatedObjects.push({
            mesh: points,
            velocities: velocities,
            initialPos: { x: 0, y: 3.5, z: 0 },
            gravity: -9.8
        });

        // ground height
        const h = this.world.getTerrainHeight(x, z);
        group.position.y = h;
    }

    createPicnicArea() {
        const group = new THREE.Group();
        // Picnic Table
        const woodMat = this.materials.wood;

        // Table Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1), woodMat);
        top.position.y = 0.8;
        group.add(top);

        // Benches
        const b1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.4), woodMat);
        b1.position.set(0, 0.45, 0.8);
        group.add(b1);
        const b2 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.4), woodMat);
        b2.position.set(0, 0.45, -0.8);
        group.add(b2);

        // Legs (simplified X shape or just posts)
        const legGeo = new THREE.BoxGeometry(0.1, 0.8, 1.8);
        const l1 = new THREE.Mesh(legGeo, woodMat);
        l1.position.set(-0.8, 0.4, 0);
        group.add(l1);
        const l2 = new THREE.Mesh(legGeo, woodMat);
        l2.position.set(0.8, 0.4, 0);
        group.add(l2);

        group.userData = { yOffset: 0.1 };
        return group;
    }

    createShelter() {
        const group = new THREE.Group();
        // Roof on posts
        const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 3);
        const postMat = this.materials.wood;

        [[-2, -2], [2, -2], [2, 2], [-2, 2]].forEach(p => {
            const post = new THREE.Mesh(postGeo, postMat);
            post.position.set(p[0], 1.5, p[1]);
            group.add(post);
        });

        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 1.5, 4), this.materials.roof);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 3.75;
        roof.scale.set(1, 0.5, 1);
        group.add(roof);

        // Concrete Pad
        const pad = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.2, 4.5), this.materials.stone);
        pad.position.y = 0.1;
        group.add(pad);

        group.userData = { yOffset: 0 };
        return group;
    }

    createRestroom() {
        const group = new THREE.Group();
        // Small brick building
        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 3), this.materials.brick);
        body.position.y = 1.5;
        group.add(body);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 3.2), this.materials.roof);
        roof.position.y = 3.15;
        group.add(roof);

        // Doors (Male/Female)
        const doorGeo = new THREE.BoxGeometry(0.8, 2, 0.1);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });

        const d1 = new THREE.Mesh(doorGeo, doorMat);
        d1.position.set(-1, 1, 1.5);
        group.add(d1);

        const d2 = new THREE.Mesh(doorGeo, doorMat);
        d2.position.set(1, 1, 1.5);
        group.add(d2);

        group.userData = { yOffset: 0 };
        return group;
    }

    createDrinkingFountain() {
        const group = new THREE.Group();
        // Stainless steel pillar
        const metalMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.8, roughness: 0.2 });

        const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 0.4), this.materials.stone); // Decorative stone base
        post.position.y = 0.5;
        group.add(post);

        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 0.2), metalMat);
        bowl.position.set(0.3, 0.9, 0);
        group.add(bowl);

        group.userData = { yOffset: 0 };
        return group;
    }

    createVending() {
        const group = new THREE.Group();
        // Red Box (Coke machine style)
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.0), new THREE.MeshStandardMaterial({ color: 0xCC0000 }));
        body.position.y = 1.1;
        group.add(body);

        // Lit panel
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.1), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0x555555 }));
        panel.position.set(0, 1.3, 0.5);
        group.add(panel);

        group.userData = { yOffset: 0 };
        return group;
    }

    createGiftShop() {
        // The Chrysalis Gift Shop
        const group = new THREE.Group();
        // Modern, glass front, curved roof?
        const body = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 8), this.materials.white);
        body.position.y = 2.5;
        group.add(body);

        // Glass Front
        const glass = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.2), this.materials.glass);
        glass.position.set(0, 2, 4);
        group.add(glass);

        // Awning
        const awning = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.2, 2), new THREE.MeshStandardMaterial({ color: 0x228B22 })); // Green awning
        awning.position.set(0, 3.8, 5);
        awning.rotation.x = 0.2;
        group.add(awning);

        // Sign
        group.userData = { yOffset: 0 };
        return group;
    }

    createBistro() {
        // Fern & Feast Bistro
        const group = new THREE.Group();
        // Cafe style, patio tables?
        const body = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 8), this.materials.brick);
        body.position.y = 2.5;
        group.add(body);

        // Patio area out front
        const patio = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 6), this.materials.stone);
        patio.position.set(0, 0.1, 7);
        group.add(patio);

        // Simple Umbrella tables
        for (let i = 0; i < 3; i++) {
            const x = -4 + i * 4;
            // Table
            const t = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.8), this.materials.white);
            t.position.set(x, 0.6, 7);
            group.add(t);
            // Umbrella
            const u = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xFF0000 }));
            u.position.set(x, 2.2, 7);
            group.add(u);
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), this.materials.white);
            p.position.set(x, 1.1, 7);
            group.add(p);
        }

        group.userData = { yOffset: 0 };
        return group;
    }

    createTrainGarden(centerX, centerZ, baseHeight) {
        const group = new THREE.Group();
        // Fenced Area (Reduced 30%: 25 -> 17.5)
        const fenceR = 17.5;
        const postGeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        const fenceMat = this.materials.wood;

        const circumference = 2 * Math.PI * fenceR;
        const postCount = Math.floor(circumference / 3);

        for (let i = 0; i < postCount; i++) {
            const angle = (i / postCount) * Math.PI * 2;
            const lx = Math.cos(angle) * fenceR;
            const lz = Math.sin(angle) * fenceR;

            // World Height Adjusted
            let yPos = 0.75; // Default local if no world
            if (this.world && this.world.heightData) {
                const wx = centerX + lx;
                const wz = centerZ + lz;
                const h = this.world.getTerrainHeight(wx, wz);
                // Convert world height to local group height (group is at baseHeight)
                yPos = (h - baseHeight) + 0.75;
            }

            const post = new THREE.Mesh(postGeo, fenceMat);
            post.position.set(lx, yPos, lz);
            post.rotation.y = -angle;
            group.add(post);

            if (i < postCount) {
                const r1 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.1), fenceMat);
                r1.position.set(lx, yPos + 0.45, lz);
                r1.rotation.y = -angle + Math.PI / 2;
                group.add(r1);

                const r2 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.1), fenceMat);
                r2.position.set(lx, yPos - 0.25, lz);
                r2.rotation.y = -angle + Math.PI / 2;
                group.add(r2);
            }
        }

        // Tracks (G-Scale Loop) - Scaled Down (0.7x)
        const scale = 0.7;
        const trackCrv = new THREE.CatmullRomCurve3([
            new THREE.Vector3(15 * scale, 0.2, 0 * scale),
            new THREE.Vector3(10 * scale, 0.2, 10 * scale),
            new THREE.Vector3(-10 * scale, 0.2, 10 * scale),
            new THREE.Vector3(-15 * scale, 0.2, 0 * scale),
            new THREE.Vector3(-10 * scale, 0.2, -10 * scale),
            new THREE.Vector3(10 * scale, 0.2, -10 * scale)
        ], true);

        const trackGeo = new THREE.TubeGeometry(trackCrv, 100, 0.3 * scale, 3, true);
        const trackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const track = new THREE.Mesh(trackGeo, trackMat);
        group.add(track);

        // Train
        const trainGroup = new THREE.Group();
        const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3, 16), new THREE.MeshStandardMaterial({ color: 0x000000 }));
        boiler.rotation.z = Math.PI / 2;
        boiler.position.y = 1;
        trainGroup.add(boiler);
        const cab = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 2), new THREE.MeshStandardMaterial({ color: 0x8B0000 }));
        cab.position.set(-2, 1.5, 0);
        trainGroup.add(cab);
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 1), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        stack.position.set(1, 2, 0);
        trainGroup.add(stack);
        const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
        [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(p => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.rotation.x = Math.PI / 2;
            w.position.set(p[0], 0.6, p[1]);
            trainGroup.add(w);
        });

        trainGroup.position.set(15 * scale, 0.2, 0);
        trainGroup.rotation.y = Math.PI / 2;
        trainGroup.scale.set(scale, scale, scale);
        group.add(trainGroup);

        // Village
        const villageMat = new THREE.MeshStandardMaterial({ color: 0xF5F5DC });
        const roofTileMat = new THREE.MeshStandardMaterial({ color: 0xB22222 });
        const houses = [
            { x: 5 * scale, z: 5 * scale }, { x: -5 * scale, z: 5 * scale },
            { x: 0, z: 0 }, { x: 6 * scale, z: -4 * scale }, { x: -7 * scale, z: -3 * scale }
        ];

        houses.forEach(h => {
            const hG = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(2 * scale, 2 * scale, 2 * scale), villageMat);
            body.position.y = 1 * scale;
            hG.add(body);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5 * scale, 1.5 * scale, 4), roofTileMat);
            roof.position.y = 2.75 * scale;
            roof.rotation.y = Math.PI / 4;
            hG.add(roof);
            hG.position.set(h.x, 0.2, h.z);
            group.add(hG);
        });

        group.userData = { yOffset: 0.1 };
        return group;
    }

createTradingPostHut() {
    const group = new THREE.Group();
    // Rustic hut, small
    const body = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 5), this.materials.wood);
    body.position.y = 1.75;
    group.add(body);

    // Thatched Roof (Overhanging Cone)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 3, 8), this.materials.thatched);
    roof.position.y = 5;
    // Make it slightly ragged?
    roof.scale.set(1.2, 1, 1.2);
    group.add(roof);

    // Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x3E2723 }));
    door.position.set(0, 1.1, 2.5);
    group.add(door);

    // Sign Post nearby
    const signGroup = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 0.2), this.materials.wood);
    post.position.y = 1;
    signGroup.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0xD2B48C }));
    board.position.set(0, 1.8, 0.1);
    signGroup.add(board);

    signGroup.position.set(3, 0, 3);
    signGroup.rotation.y = -Math.PI / 4;
    group.add(signGroup);

    group.userData = { yOffset: 0 };
    return group;
}

update(deltaTime) {
    if (!this.animatedObjects) return;

    this.animatedObjects.forEach(obj => {
        const positions = obj.mesh.geometry.attributes.position.array;
        const vels = obj.velocities;

        for (let i = 0; i < vels.length / 3; i++) {
            const idx = i * 3;

            // Update Physics
            vels[idx + 1] += obj.gravity * deltaTime; // Gravity

            positions[idx] += vels[idx] * deltaTime;
            positions[idx + 1] += vels[idx + 1] * deltaTime;
            positions[idx + 2] += vels[idx + 2] * deltaTime;

            // Reset if below water line (approx y < 0 relative to fountain base which is at y=0.5)
            // Let's say it hits the "bowl" water level at y=1.0 relative to group
            if (positions[idx + 1] < 1.0) {
                // Reset to top
                positions[idx] = 0;
                positions[idx + 1] = 3.5;
                positions[idx + 2] = 0;

                // New Velocity
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * 1.5; // Wider spread
                vels[idx] = Math.cos(angle) * r;
                vels[idx + 1] = 5 + Math.random() * 3; // Reset vertical impulse
                vels[idx + 2] = Math.sin(angle) * r;
            }
        }
        obj.mesh.geometry.attributes.position.needsUpdate = true;
    });
}
}
