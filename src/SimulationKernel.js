import { WorldManager } from './WorldManager.js';
import { EntityManager } from './EntityManager.js';
import { BuildingManager } from './BuildingManager.js';
import { SensoryPresenter } from './SensoryPresenter.js';
import { UserInterface } from './UserInterface.js';
import { SoundManager } from './SoundManager.js';
import { VegetationManager } from './VegetationManager.js';
import { FaunaManager } from './FaunaManager.js';

export class SimulationKernel {
    constructor() {
        this.lastTime = 0;
        this.isRunning = false;

        // Initialize Subsystems
        this.presenter = new SensoryPresenter();
        this.world = new WorldManager();
        this.buildings = new BuildingManager(this.world);
        this.entities = new EntityManager(this.world, this.buildings);
        this.ui = new UserInterface(this.presenter.camera, document.body);
        this.sound = new SoundManager(this.presenter.camera);
        this.vegetation = new VegetationManager(this.world);
        this.fauna = new FaunaManager(this.world, this.vegetation);

        // Link subsystems
        this.ui.connectToWorld(this.world);
        this.ui.connectAudio(this.sound);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();

        // Initial Position: User Request (381, -152) Ground Level
        // Spawn at Y=2 (Approx eye level assuming flat ground or handled by physics)
        this.presenter.camera.position.set(381, 2, -152);

        // Initialize Scene visuals
        this.world.createTerrain(this.presenter.scene);
        this.entities.spawnLocations(this.presenter.scene);
        this.vegetation.initialize(this.presenter.scene);
        this.fauna.initialize(this.presenter.scene);
        this.sound.initialize(this.presenter.scene, this.world);

        this.loop(this.lastTime);
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000; // Seconds
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.loop(time));
    }

    update(deltaTime) {
        // Update Physics/Input
        this.ui.update(deltaTime, this.world, this.presenter.scene);
        this.world.update(this.lastTime / 1000);
        this.buildings.update(deltaTime);

        // Sound Update
        // Check speed threshold (0.5 m/s) to avoid playing steps when sliding very slowly
        const speedSq = this.ui.velocity ? (this.ui.velocity.x * this.ui.velocity.x + this.ui.velocity.z * this.ui.velocity.z) : 0;
        const isMoving = speedSq > 0.25;

        this.sound.update(deltaTime, this.presenter.camera.position, isMoving, this.ui.isFlying);

        // Feature Updates
        this.fauna.update(deltaTime);

        // Update Game State / Entities
        // this.entities.update(deltaTime);
    }

    render() {
        this.presenter.render();
    }
}
