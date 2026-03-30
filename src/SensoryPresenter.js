import * as THREE from 'three';

export class SensoryPresenter {
    constructor() {
        // Scene setup
        // Scene setup
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color(0x87CEEB); // Old solid color
        // Reduced visibility for performance
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 120); // Adjusted for new Far Clip

        // Skybox with Gradient Shader
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `;
        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize( vWorldPosition + offset ).y;
                gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
            }
        `;
        const uniforms = {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xffffff) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
        };
        // Radius 120 to fit inside Far Clip (125)
        const skyGeo = new THREE.SphereGeometry(120, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide,
            depthWrite: false // Ensure it doesn't mess with depth buffer
        });
        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.sky);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 125); // Reduced Far Clip (50%)



        this.camera.position.set(0, 1.7, 0); // Eye level

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Lighting
        this.setupLighting();

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 200, 100);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 300;
        dirLight.shadow.camera.bottom = -300;
        dirLight.shadow.camera.left = -300;
        dirLight.shadow.camera.right = 300;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        // Lock Sky to Camera
        if (this.sky) {
            this.sky.position.copy(this.camera.position);
        }
        this.renderer.render(this.scene, this.camera);
    }
}
