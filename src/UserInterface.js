import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { LOCATIONS } from './data/locations.js';

export class UserInterface {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement; // Usually document.body

        // Controls
        this.controls = new PointerLockControls(camera, document.body);

        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.center = new THREE.Vector2(0, 0);
        this.hudInfo = document.getElementById('center-info');

        // DOM Elements
        this.coordDiv = document.getElementById('coordinates');
        this.headingDiv = document.getElementById('heading');
        this.speedDiv = document.getElementById('speed');
        this.controlsHint = document.getElementById('controls-hint');

        // Input State
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false; // Space
        this.moveDown = false; // Shift

        this.isFlying = false;

        // Physics State
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.speed = 40.0; // m/s
        this.flySpeed = 80.0;
        this.playerHeight = 1.7;
        this.gravity = 9.8 * 10.0; // Scaled gravity
        this.playerHeight = 1.7;

        // Minimap Elements
        this.minimapDot = document.getElementById('player-dot');
        this.locationLabelsContainer = document.getElementById('location-labels');

        this.initInput();
        this.initMinimap();
        this.initTeleportMenu();
        this.initIntroScreen();
    }

    connectToWorld(worldManager) {
        this.world = worldManager;
    }

    connectAudio(soundManager) {
        this.soundManager = soundManager;
    }

    initInput() {
        // Remove click-to-capture from here, let Intro Screen handle initial capture
        this.controls.addEventListener('lock', () => {
            if (this.controlsHint) this.controlsHint.style.display = 'none';
        });

        this.controls.addEventListener('unlock', () => {
            if (this.controlsHint) this.controlsHint.style.display = 'block';
        });

        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
    }

    initIntroScreen() {
        this.introScreen = document.createElement('div');
        this.introScreen.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.95);
            color: #55ff55;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 100000;
            font-family: monospace;
            text-align: center;
        `;

        this.introScreen.innerHTML = `
            <h1 style="font-size: 3em; margin-bottom: 20px; color: #dbfa4b;">Huntsville Botanical Garden Simulation</h1>
            <p style="max-width: 600px; font-size: 1.2em; line-height: 1.5; margin-bottom: 40px;">
                Welcome to a virtual recreation of the Huntsville Botanical Garden.
                Explore the various gardens, exhibits, and landmarks including the new Fountain in Little Smith Lake.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; margin-bottom: 40px; border: 1px solid #555; padding: 20px;">
                <div><strong>W, A, S, D</strong></div><div>Move Forward/Left/Back/Right</div>
                <div><strong>MOUSE</strong></div><div>Look Around</div>
                <div><strong>SPACE</strong></div><div>Jump / Fly Up</div>
                <div><strong>SHIFT</strong></div><div>Fly Down</div>
                <div><strong>F</strong></div><div>Toggle Fly Mode</div>
                <div><strong>T</strong></div><div>Teleport Menu</div>
                <div><strong>O</strong></div><div>Toggle Map Textures</div>
                <div><strong>ESC</strong></div><div>Release Mouse / Close Menus</div>
            </div>

            <button id="start-btn" style="
                padding: 15px 40px;
                font-size: 1.5em;
                background: #55ff55;
                color: black;
                border: none;
                cursor: pointer;
                font-family: monospace;
                font-weight: bold;
            ">START SIMULATION</button>
        `;

        document.body.appendChild(this.introScreen);

        const btn = document.getElementById('start-btn');
        btn.onclick = () => {
            this.introScreen.style.display = 'none';
            this.controls.lock(); // Capture mouse
            if (this.soundManager) {
                this.soundManager.startAudio();
            }
        };
    }

    initMinimap() {
        if (!this.locationLabelsContainer) return;

        LOCATIONS.forEach(loc => {
            const div = document.createElement('div');
            div.className = 'location-marker';
            div.innerText = loc.id;
            div.title = loc.name;

            div.style.left = `${loc.x}%`;
            div.style.top = `${100 - loc.y}%`;

            this.locationLabelsContainer.appendChild(div);
        });
    }

    initTeleportMenu() {
        // Create Modal Overlay
        this.teleportMenu = document.createElement('div');
        this.teleportMenu.id = 'teleport-menu';
        this.teleportMenu.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #55ff55;
            padding: 20px;
            color: #55ff55;
            font-family: monospace;
            z-index: 99999;
            max-height: 80vh;
            overflow-y: auto;
            width: 400px;
            box-shadow: 0 0 20px #55ff55;
        `;

        const title = document.createElement('h2');
        title.innerText = "TELEPORT DESTINATION";
        title.style.textAlign = "center";
        title.style.borderBottom = "1px solid #55ff55";
        this.teleportMenu.appendChild(title);

        const closeHint = document.createElement('div');
        closeHint.innerText = "(Press ESC to Cancel)";
        closeHint.style.textAlign = "center";
        closeHint.style.fontSize = "12px";
        closeHint.style.marginBottom = "10px";
        this.teleportMenu.appendChild(closeHint);

        const list = document.createElement('div');
        list.style.display = "flex";
        list.style.flexDirection = "column";
        list.style.gap = "5px";

        LOCATIONS.forEach(loc => {
            const btn = document.createElement('button');
            btn.innerText = `${loc.id}. ${loc.name}`;
            btn.style.cssText = `
                background: none;
                border: 1px solid #33aa33;
                color: #55ff55;
                padding: 10px;
                text-align: left;
                cursor: pointer;
                font-family: monospace;
                font-size: 14px;
            `;
            btn.onmouseover = () => btn.style.background = "#003300";
            btn.onmouseout = () => btn.style.background = "none";
            btn.onclick = () => this.teleportTo(loc);
            list.appendChild(btn);
        });

        this.teleportMenu.appendChild(list);
        document.body.appendChild(this.teleportMenu);
    }

    toggleTeleportMenu(forceClose = false) {
        if (forceClose || this.teleportMenu.style.display === 'block') {
            this.teleportMenu.style.display = 'none';
            // Only relock if not forcing close from intro or something else
            if (!forceClose && !this.introScreen.style.display === 'block') {
                this.controls.lock();
            }
        } else {
            this.teleportMenu.style.display = 'block';
            this.controls.unlock(); // Release mouse to click
        }
    }

    teleportTo(loc) {
        // Convert to world coords
        const x = loc.x * 7.0;
        const z = -(loc.y * 7.0);

        // Find safe height
        let y = 10; // Default safety
        if (this.world) {
            y = this.world.getTerrainHeight(x, z);
        }

        // Teleport
        this.controls.getObject().position.set(x, y + 2.0, z); // 2m above ground
        this.velocity.set(0, 0, 0); // Kill momentum

        // Sound
        if (this.soundManager) {
            this.soundManager.playTeleportSound();
        }

        // Close menu & relock
        this.toggleTeleportMenu(true);
        this.controls.lock();
    }

    onKeyDown(event) {
        // ESC handling
        if (event.code === 'Escape') {
            if (this.teleportMenu.style.display === 'block') {
                this.toggleTeleportMenu(true);
                this.controls.lock(); // Return to game
            }
        }

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': this.moveForward = true; break;
            case 'ArrowLeft':
            case 'KeyA': this.moveLeft = true; break;
            case 'ArrowDown':
            case 'KeyS': this.moveBackward = true; break;
            case 'ArrowRight':
            case 'KeyD': this.moveRight = true; break;
            case 'Space': this.moveUp = true; break;
            case 'ShiftLeft': this.moveDown = true; break;
            case 'KeyF':
                this.isFlying = !this.isFlying;
                this.velocity.y = 0; // Reset vertical velocity on toggle
                console.log("Fly Mode:", this.isFlying);
                break;
            case 'KeyO':
                if (this.world) this.world.toggleTextures();
                break;
            case 'ArrowLeft':
                this.speed = Math.max(5, this.speed - 5);
                this.flySpeed = Math.max(10, this.flySpeed - 10);
                break;
            case 'ArrowRight':
                this.speed += 5;
                this.flySpeed += 10;
                break;
            case 'KeyT':
                this.toggleTeleportMenu();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': this.moveForward = false; break;
            case 'ArrowLeft':
            case 'KeyA': this.moveLeft = false; break;
            case 'ArrowDown':
            case 'KeyS': this.moveBackward = false; break;
            case 'ArrowRight':
            case 'KeyD': this.moveRight = false; break;
            case 'Space': this.moveUp = false; break;
            case 'ShiftLeft': this.moveDown = false; break;
        }
    }

    update(deltaTime, world, scene) {
        if (!this.controls.isLocked) return;

        // Deceleration (Friction)
        this.velocity.x -= this.velocity.x * 10.0 * deltaTime;
        this.velocity.z -= this.velocity.z * 10.0 * deltaTime;
        this.velocity.y -= this.velocity.y * 5.0 * deltaTime; // Vertical friction

        // Calculate Input Direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const currentSpeed = this.isFlying ? this.flySpeed : this.speed;

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 400.0 * deltaTime;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 400.0 * deltaTime;

        // Vertical Movement
        if (this.isFlying) {
            if (this.moveUp) this.velocity.y += 200.0 * deltaTime;
            if (this.moveDown) this.velocity.y -= 200.0 * deltaTime;
        } else {
            // Gravity
            this.velocity.y -= this.gravity * deltaTime;
        }

        // Apply Movement
        // PointerLockControls.moveRight/Forward moves relative to camera facing.
        this.controls.moveRight(-this.velocity.x * deltaTime);
        this.controls.moveForward(-this.velocity.z * deltaTime);
        this.controls.getObject().position.y += this.velocity.y * deltaTime;

        // Floor Collision
        const groundHeight = this.world.getTerrainHeight(this.controls.getObject().position.x, this.controls.getObject().position.z);
        if (this.controls.getObject().position.y < this.playerHeight + groundHeight) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = this.playerHeight + groundHeight;

            // Jump allowed if on ground
            if (this.moveUp && !this.isFlying) {
                this.velocity.y = 30.0; // Jump impluse
            }
        }

        this.updateHUD(world, scene);
    }

    updateHUD(world, scene) {
        if (!this.coordDiv) return;

        const pos = this.controls.getObject().position;
        this.coordDiv.innerText = `POS: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;

        // Heading (Yaw)
        const rotation = this.controls.getObject().rotation;
        let degrees = - (rotation.y * (180 / Math.PI)) % 360;
        if (degrees < 0) degrees += 360;
        this.headingDiv.innerText = `HDG: ${degrees.toFixed(0)}°`;

        // Approximate 2D Speed
        const speedSq = this.velocity.x ** 2 + this.velocity.z ** 2;
        const currentSpeed = Math.sqrt(speedSq);
        this.speedDiv.innerText = `SPD: ${currentSpeed.toFixed(1)} / SET: ${this.speed.toFixed(0)} m/s`;

        // Update Minimap Dot
        if (this.minimapDot) {
            const mapX = (pos.x / 7.0);
            const mapY = (-pos.z / 7.0);
            this.minimapDot.style.left = `${mapX}%`;
            this.minimapDot.style.top = `${100 - mapY}%`;
        }

        // Raycasting
        if (this.hudInfo && scene) {
            this.raycaster.setFromCamera(this.center, this.camera);
            const intersects = this.raycaster.intersectObjects(scene.children, true);

            let foundText = "";

            // Find first relevant hit
            for (let hit of intersects) {
                // Ignore player/helper objects if any
                // Bubble up to find a Group with name
                let obj = hit.object;
                let name = null;

                // Traverse up to find identified parent
                while (obj) {
                    if (obj.userData && obj.userData.name) {
                        name = obj.userData.name;
                        break;
                    }
                    obj = obj.parent;
                }

                if (name) {
                    foundText = name;
                    break;
                }

                // Use geometry id or material to identify terrain?
                // WorldManager terrain is a Mesh with ShaderMaterial
                if (hit.object.geometry && hit.object.geometry.type === 'PlaneGeometry' && hit.object.material.type === 'ShaderMaterial') {
                    // This is terrain
                    const p = hit.point;
                    foundText = world.identifyTerrain(p.x, p.z);
                    break;
                }
            }

            this.hudInfo.innerText = foundText;
        }
    }
}
