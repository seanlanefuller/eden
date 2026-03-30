import * as THREE from 'three';

export class SoundManager {
    constructor(camera) {
        this.camera = camera;
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);

        this.context = this.audioListener.context;

        // State
        this.nextBirdTime = 0;
        this.footstepTimer = 0;

        // Oscillators/Nodes
        this.windNode = null;
        this.waterNodes = []; // { mesh, sound }
    }

    initialize(scene, worldManager) {
        this.setupWind();
        this.setupWater(scene, worldManager);
        this.setupFountain(scene);
    }

    setupWind() {
        // Pink noise approximation for wind
        const bufferSize = 2 * this.context.sampleRate;
        const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // (roughly) compensate for gain
        }

        const windSound = new THREE.Audio(this.audioListener);
        windSound.setBuffer(noiseBuffer);
        windSound.setLoop(true);
        windSound.setVolume(0.00375); // Reduced 50% (was 0.0075)
        this.windNode = windSound;
    }

    setupWater(scene, worldManager) {
        // Damson Aquatic Garden is at x: 54, y: 65
        // Convert to World Coords using same logic as WorldManager.mapToWorld
        const waterX = 54 * 7;
        const waterZ = -(65 * 7);

        // Create Positional Audio
        const waterSound = new THREE.PositionalAudio(this.audioListener);

        // Synthesize Water Sound (Brown Noise with heavy filtering)
        const bufferSize = 2 * this.context.sampleRate;
        const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        waterSound.setBuffer(noiseBuffer);
        waterSound.setRefDistance(5); // Smaller audible radius
        waterSound.setRolloffFactor(2); // Sharper dropoff
        waterSound.setLoop(true);
        waterSound.setVolume(0.4); // Gentler volume

        // Create a mesh to hold the sound (Blue Sphere for visual debug/reality)
        const geo = new THREE.SphereGeometry(2, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0x0000FF, transparent: true, opacity: 0.5 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(waterX, 1, waterZ);

        mesh.add(waterSound);
        scene.add(mesh);

        this.waterNodes.push({ mesh, sound: waterSound });
    }

    setupFountain(scene) {
        const x = 321;
        const z = -238;

        const sound = new THREE.PositionalAudio(this.audioListener);

        // Similar noise buffer but pitch shift or just volume
        const bufferSize = 2 * this.context.sampleRate;
        const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.05 * white)) / 1.05; // Slightly harsher/brighter for splashing
            lastOut = output[i];
            output[i] *= 3.5;
        }

        sound.setBuffer(noiseBuffer);
        sound.setRefDistance(10); // Louder radius
        sound.setRolloffFactor(1); // Standard rolloff
        sound.setLoop(true);
        sound.setVolume(0.01);

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
        mesh.position.set(x, 2, z);
        mesh.add(sound);
        scene.add(mesh);

        this.waterNodes.push({ mesh, sound });
    }

    startAudio() {
        console.log("SoundManager: startAudio called. Context State:", this.context.state);
        if (this.context.state === 'suspended') {
            this.context.resume().then(() => {
                console.log("SoundManager: Audio Context Resumed!");
            });
        }
        if (this.windNode && !this.windNode.isPlaying) {
            this.windNode.play();
            console.log("SoundManager: Wind started.");
        }

        this.waterNodes.forEach(node => {
            if (node.sound && !node.sound.isPlaying) {
                node.sound.play();
            }
        });
    }

    playFootstep() {
        if (this.context.state !== 'running') return;

        // Use noise for grass/gravel step sound
        const bufferSize = this.context.sampleRate * 0.1; // 0.1 seconds
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseSrc = this.context.createBufferSource();
        noiseSrc.buffer = buffer;

        const gain = this.context.createGain();

        // Filter to make it sound like ground
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        noiseSrc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);

        // Sharp attack, fast decay
        const t = this.context.currentTime;
        gain.gain.setValueAtTime(0.1, t); // Higher volume
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        noiseSrc.start(t);
        noiseSrc.stop(t + 0.1);
    }

    playTeleportSound() {
        if (this.context.state !== 'running') return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        // Sci-fi teleport sweep
        const t = this.context.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.1); // Up
        osc.frequency.exponentialRampToValueAtTime(100, t + 1.0); // Down

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);

        osc.start(t);
        osc.stop(t + 1.0);
    }

    playBird() {
        if (this.context.state !== 'running') return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const panner = this.context.createStereoPanner();

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.context.destination);

        // Random pitch (2000 - 4000 Hz)
        const freq = 2000 + Math.random() * 2000;
        osc.frequency.setValueAtTime(freq, this.context.currentTime);
        // Simple "tweet" modulation
        osc.frequency.linearRampToValueAtTime(freq + 500, this.context.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(freq, this.context.currentTime + 0.2);

        // Random panning (Left/Right)
        panner.pan.value = Math.random() * 2 - 1;

        // Random loudness (Distance simulation)
        // Gain 0.02 to 0.1 (Variable distance)
        const loudness = 0.02 + Math.random() * 0.08;

        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(loudness, this.context.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);

        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    }

    update(deltaTime, playerPosition, isMoving, isFlying) {
        // Start audio on first update (if context resumed by interaction elsewhere)
        if (this.context.state === 'running' && this.windNode && !this.windNode.isPlaying) {
            this.windNode.play();
        }

        const time = this.context.currentTime;

        // Wind Swells
        if (this.windNode && this.windNode.isPlaying) {
            // Complex modulation for irregular lulls
            // Slower primary cycle (0.3) + secondary variation
            const rawSwell = (Math.sin(time * 0.3) + Math.cos(time * 0.13)) / 2; // -1 to 1 range approx

            // Silence Threshold: Map values < 0 to near-silence (lull)
            // Only swell when wave is positive
            let swellFactor = 0;
            if (rawSwell > 0) {
                swellFactor = rawSwell; // 0 to 1
            }

            // Smooth the transition? The sine wave is smooth enough.

            // Base ambient volume (very low) + Swell Volume
            const baseVol = 0.001;
            const maxSwellVol = 0.02; // Peak

            const targetVol = baseVol + (swellFactor * maxSwellVol);

            this.windNode.setVolume(targetVol);
        }

        // Birds: Random interval
        if (time > this.nextBirdTime) {
            this.playBird();
            this.nextBirdTime = time + 2 + Math.random() * 5; // Every 2-7 seconds
        }

        // Footsteps
        if (isMoving && !isFlying) {
            if (time > this.footstepTimer) {
                this.playFootstep();
                this.footstepTimer = time + 0.4; // approx 2.5 steps per second
            }
        }
    }
}
