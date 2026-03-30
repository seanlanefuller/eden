import * as THREE from 'three';

export class WorldManager {
    constructor() {
        // Scale Factor: 100 map units = 700 meters
        this.SCALE_FACTOR = 7.0;
        this.isShowingTextures = false;

        // No more centering offsets. (0,0) is origin.
    }

    // Convert Map Coordinates (0-100) to World Coordinates (Meters)
    // Map (0,0) is Bottom-Left. 3D X+ is Right, Z- is Forward (North).
    // Map X (0 to 100) -> World X (0 to 700)
    // Map Y (0 to 100) -> World -Z (0 to -700)
    mapToWorld(mapX, mapY) {
        const worldX = mapX * this.SCALE_FACTOR;
        const worldZ = -(mapY * this.SCALE_FACTOR);
        return new THREE.Vector3(worldX, 0, worldZ);
    }

    createProceduralTextures() {
        const createTex = (drawFn) => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            drawFn(canvas.getContext('2d'));
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            return tex;
        };

        const drawTriangles = (ctx, count, color1, color2) => {
            for (let i = 0; i < count; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? color1 : color2;
                ctx.beginPath();
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                const s = 4; // Scale
                ctx.moveTo(x, y);
                ctx.lineTo(x + (Math.random() - 0.5) * s, y + (Math.random() - 0.5) * s);
                ctx.lineTo(x + (Math.random() - 0.5) * s, y + (Math.random() - 0.5) * s);
                ctx.fill();
            }
        };

        // 1. Grass (Greener / More Vibrant)
        // 1a. Lightest Grass
        this.lightestGrassTex = createTex(ctx => {
            ctx.fillStyle = '#bdfa4b'; // Less yellow, more green
            ctx.fillRect(0, 0, 512, 512);
            drawTriangles(ctx, 40000, '#9cd641', '#d0fb7a');
        });

        // 1d. Light Grass (Transition)
        this.lightGrassTex = createTex(ctx => {
            ctx.fillStyle = '#66d64b'; // Vibrant Green
            ctx.fillRect(0, 0, 512, 512);
            drawTriangles(ctx, 40000, '#52c43b', '#7aeb60');
        });

        // 1b. Medium Grass
        this.mediumGrassTex = createTex(ctx => {
            ctx.fillStyle = '#3cb650'; // Rich Green
            ctx.fillRect(0, 0, 512, 512);
            drawTriangles(ctx, 40000, '#32a344', '#4cc960');
        });

        // 1c. Forest Floor
        this.forestTex = createTex(ctx => {
            ctx.fillStyle = '#1e5c30'; // Deep green
            ctx.fillRect(0, 0, 512, 512);
            drawTriangles(ctx, 40000, '#2d7a40', '#154020');
        });

        // 2. Pavement (Hard grey with noise)
        this.pavementTex = createTex(ctx => {
            ctx.fillStyle = '#444';
            ctx.fillRect(0, 0, 512, 512);
            // Pavement needs finer grain, use small triangles
            for (let i = 0; i < 20000; i++) {
                ctx.fillStyle = `rgb(${60 + Math.random() * 20}, ${60 + Math.random() * 20}, ${60 + Math.random() * 20})`;
                ctx.beginPath();
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                ctx.moveTo(x, y);
                ctx.lineTo(x + 1, y + 2);
                ctx.lineTo(x - 1, y + 1);
                ctx.fill();
            }
        });

        // 3. Pea Gravel (Dotted tan/brown)
        this.gravelTex = createTex(ctx => {
            ctx.fillStyle = '#a68a64';
            ctx.fillRect(0, 0, 512, 512);
            drawTriangles(ctx, 30000, '#8b7355', '#c2a681');
        });

        // 4. Water (Deep blue with subtle sparkles)
        this.waterTex = createTex(ctx => {
            ctx.fillStyle = '#0077be'; // Brighter Ocean Blue
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = '#0099cc'; // Lighter Blue highlights
            ctx.globalAlpha = 0.3;
            // Larger flowy triangles
            for (let i = 0; i < 5000; i++) {
                ctx.beginPath();
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                ctx.moveTo(x, y);
                ctx.lineTo(x + 6, y + 2);
                ctx.lineTo(x + 2, y + 6);
                ctx.fill();
            }
        });
    }

    toggleTextures() {
        this.isShowingTextures = !this.isShowingTextures;
        if (this.terrainMaterial) {
            this.terrainMaterial.uniforms.isShowingTextures.value = this.isShowingTextures;
        }
    }

    createTerrain(scene) {
        this.createProceduralTextures();

        const img = new Image();
        img.src = 'research/clean_garden_map.gif';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 512, 512);
            this.maskData = ctx.getImageData(0, 0, 512, 512).data;
            const maskData = this.maskData;

            // Generate Heightmap
            this.generateHeightMap(maskData);

            // Load visual map texture
            const loader = new THREE.TextureLoader();
            const gardenMap = loader.load('research/garden_map.gif');
            gardenMap.colorSpace = THREE.SRGBColorSpace;

            const classificationMap = new THREE.CanvasTexture(canvas);
            classificationMap.colorSpace = THREE.NoColorSpace;
            classificationMap.minFilter = THREE.NearestFilter;
            classificationMap.magFilter = THREE.NearestFilter;

            const vertexShader = `
                varying vec2 vUv;
                uniform sampler2D heightMap;
                uniform float heightScale;

                void main() {
                    vUv = uv;
                    vec4 heightData = texture2D(heightMap, uv);
                    vec3 pos = position;
                    pos.z += heightData.r * heightScale; // Displace along normal (Local Z)
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `;

            const fragmentShader = `
                varying vec2 vUv;
                uniform sampler2D gardenMap;
                uniform sampler2D classificationMap;
                uniform sampler2D lightestGrassTex;
                uniform sampler2D lightGrassTex;
                uniform sampler2D mediumGrassTex;
                uniform sampler2D forestTex;
                uniform sampler2D pavementTex;
                uniform sampler2D gravelTex;
                uniform sampler2D waterTex;
                uniform bool isShowingTextures;
                uniform float uTime;

                void main() {
                    vec3 mask = texture2D(classificationMap, vUv).rgb;
                    vec4 baseColor = texture2D(gardenMap, vUv);
                    
                    // Color Definitions from Research
                    vec3 cWater = vec3(115.0/255.0, 206.0/255.0, 229.0/255.0);
                    vec3 cGrassDark = vec3(96.0/255.0, 156.0/255.0, 135.0/255.0);   // Dark
                    vec3 cGrassMed = vec3(135.0/255.0, 182.0/255.0, 150.0/255.0);  // Medium
                    vec3 cGrassLight2 = vec3(187.0/255.0, 217.0/255.0, 184.0/255.0); // Light-Medium
                    vec3 cGrassLight1 = vec3(219.0/255.0, 227.0/255.0, 183.0/255.0); // Lightest (Standard)
                    
                    vec3 cPaths = vec3(252.0/255.0, 250.0/255.0, 244.0/255.0);
                    vec3 cTrails = vec3(159.0/255.0, 127.0/255.0, 71.0/255.0);

                    // Sample high-res tiled textures
                    vec2 tiledUv = vUv * 100.0;
                    vec4 texLightest = texture2D(lightestGrassTex, tiledUv);
                    vec4 texLight = texture2D(lightGrassTex, tiledUv);
                    vec4 texMedGrass = texture2D(mediumGrassTex, tiledUv);
                    vec4 texForest = texture2D(forestTex, tiledUv);
                    vec4 texPavement = texture2D(pavementTex, tiledUv);
                    vec4 texGravel = texture2D(gravelTex, tiledUv);
                    
                    // Moving Water
                    vec2 waterUv = tiledUv + vec2(uTime * 0.05, uTime * 0.02);
                    vec4 texWater = texture2D(waterTex, waterUv);
                    // Fake Transparency: Mix water with gravel bed (50%)
                    texWater = mix(texGravel, texWater, 0.5); 

                    vec4 finalColor = baseColor;

                    if (isShowingTextures) {
                        float threshold = 0.10; // Tighter threshold
                        if (distance(mask, cPaths) < threshold) finalColor = texPavement;
                        else if (distance(mask, cTrails) < threshold) finalColor = texGravel;
                        else if (distance(mask, cWater) < threshold) finalColor = texWater;
                        else if (distance(mask, cGrassDark) < threshold) finalColor = texForest;
                        else if (distance(mask, cGrassMed) < 0.15) finalColor = texMedGrass;
                        else if (distance(mask, cGrassLight2) < 0.10) finalColor = texLight;
                        else finalColor = texLightest; // Default to lightest
                    }

                    gl_FragColor = finalColor;
                }
            `;

            this.terrainMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    gardenMap: { value: gardenMap },
                    classificationMap: { value: classificationMap },
                    heightMap: { value: this.heightTexture },
                    heightScale: { value: 30.0 }, // Max height 30m (Reduced 50%)
                    lightestGrassTex: { value: this.lightestGrassTex },
                    lightGrassTex: { value: this.lightGrassTex },
                    mediumGrassTex: { value: this.mediumGrassTex },
                    forestTex: { value: this.forestTex },
                    pavementTex: { value: this.pavementTex },
                    gravelTex: { value: this.gravelTex },
                    waterTex: { value: this.waterTex },
                    isShowingTextures: { value: this.isShowingTextures },
                    uTime: { value: 0 }
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide
            });

            const geometry = new THREE.PlaneGeometry(700, 700, 256, 256);

            const plane = new THREE.Mesh(geometry, this.terrainMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.position.set(350, 0, -350);
            plane.receiveShadow = true;
            scene.add(plane);

            const gridHelper = new THREE.GridHelper(700, 100);
            gridHelper.position.set(350, 0.05, -350);
            scene.add(gridHelper);
        };
    }

    generateHeightMap(maskData) {
        const size = 512;
        this.heightData = new Float32Array(size * size);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;

                // Read Mask Color
                const mr = maskData[idx];
                const mg = maskData[idx + 1];
                const mb = maskData[idx + 2];

                // Check Water
                const isWater = Math.sqrt((mr - 115) ** 2 + (mg - 206) ** 2 + (mb - 229) ** 2) < 40;

                let height = 0;

                if (!isWater) {
                    const ny = 1.0 - (y / size);
                    const nx = x / size;

                    // Base Slope
                    const baseHeight = ny * 1.0;

                    // Noise (Shifted to be positive so land sits ON TOP of base slope)
                    const noiseRaw =
                        Math.sin(nx * 10 + ny * 12) * 0.05 +
                        Math.sin(nx * 25 - ny * 20) * 0.02 +
                        Math.cos(nx * 50 + ny * 50) * 0.01;

                    const noisePositive = noiseRaw + 0.08; // Ensure > 0

                    height = baseHeight + noisePositive;
                } else {
                    // Water: Follow the base slope (lowest surrounding terrain level)
                    // Raise slightly to reduce bank steepness
                    const ny = 1.0 - (y / size);
                    height = ny * 1.0 + 0.02;
                }

                // Store Normalized Height (0-1)
                this.heightData[y * size + x] = height;

                // Write to texture (Red channel)
                const cVal = Math.floor(height * 255);
                imgData.data[idx] = cVal;     // R
                imgData.data[idx + 1] = cVal;   // G
                imgData.data[idx + 2] = cVal;   // B
                imgData.data[idx + 3] = 255;    // A
            }
        }

        ctx.putImageData(imgData, 0, 0);
        this.heightTexture = new THREE.CanvasTexture(canvas);
        this.heightTexture.minFilter = THREE.LinearFilter;
        this.heightTexture.magFilter = THREE.LinearFilter;
    }

    getTerrainHeight(x, z) {
        if (!this.heightData) return 0;

        // Map World to Heightmap Coords
        const pctZ = -z / 700;
        const imgY = Math.floor((1 - pctZ) * 511);
        const imgX = Math.floor((x / 700) * 511);

        if (imgX < 0 || imgX > 511 || imgY < 0 || imgY > 511) return 0;

        const h = this.heightData[imgY * 512 + imgX];
        // Quantize to match 8-bit texture precision used in shader
        const quantizedH = Math.floor(h * 255) / 255;
        return quantizedH * 30.0;
    }

    identifyTerrain(x, z) {
        if (!this.maskData) return "Unknown";

        // Map World to Heightmap Coords
        const pctZ = -z / 700;
        const imgY = Math.floor((1 - pctZ) * 511);
        const imgX = Math.floor((x / 700) * 511);

        if (imgX < 0 || imgX > 511 || imgY < 0 || imgY > 511) return "Void";

        const idx = (imgY * 512 + imgX) * 4;
        const r = this.maskData[idx];
        const g = this.maskData[idx + 1];
        const b = this.maskData[idx + 2];

        const dist = (r2, g2, b2) => Math.sqrt((r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2);

        if (dist(252, 250, 244) < 40) return "Path";
        if (dist(159, 127, 71) < 40) return "Mulch Trail";
        if (dist(115, 206, 229) < 40) return "Water";
        if (dist(96, 156, 135) < 50) return "Forest Floor";
        if (dist(135, 182, 150) < 50) return "Grass";

        return "Grass"; // Default
    }

    update(time) {
        if (this.terrainMaterial) {
            this.terrainMaterial.uniforms.uTime.value = time;
        }
    }
}
