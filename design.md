Logical Design for "The Garden"
1. Executive Summary
The project is a real-time, 3D interactive simulation of a botanical garden. It functions as a virtual exploration experience where a user can navigate through a digital recreation of physical locations, interacting with the environment through movement and sensory feedback (visuals, audio). The system emphasizes atmospheric immersion, spatial accuracy relative to a reference map, and a living world simulation populated by dynamic flora and fauna.

2. High-Level Architecture
The system is composed of five primary subsystems:

Simulation Kernel: Manages the main game loop, time delta calculation, and global state synchronization.
World Manager: Handles the static environment, terrain generation, and coordinate mapping.
Entity Manager: Controls dynamic and static objects within the world (structures, plants, animals).
Sensory Presenter: Responsible for rendering the visual scene and synthesizing the audio landscape.
User Interface & Control: Bridges user input to avatar actions and displays informational overlays.
3. Subsystem Breakdown
3.1 Simulation Kernel
Heartbeat: A continuous loop that updates the state of the world every frame.
Time Management: Tracks elapsed time to drive animations (e.g., butterfly wings, water ripples) and physics calculations.
State Machine: Manages global states such as "Walking Mode", "Flying Mode", or "Menu Active".
3.2 World Manager
Cartography Engine:
Data Source: Reads a 2D map representation (image/grid) where pixel colors or values denote terrain types (Water, Path, Grass, Forest).
Coordinate System: Maps a normalized 2D map coordinate system (0-100) to a 3D world coordinate system (e.g., -5000 to +5000 meters).
Spatial Querying: Provides functionality to check terrain type at any given location (used for collision and sound triggers).
Terrain Generator:
Constructs the physical ground mesh based on the map data.
Applies procedural textures (grass, pavement, water) generated on-the-fly to ensure variety and lack of tiling artifacts.
3.3 Entity Manager
Structural Layer:
Location Registry: A database of Points of Interest (POIs) with metadata (Name, ID, Type, Map Coordinate).
3D Models: Manages the loading and placement of building models and hardscape elements at their corresponding world coordinates.
Vegetation Layer:
Procedural Placement: Spawns trees, bushes, and flowers based on the underlying terrain type (e.g., trees spawn in "Forest" zones).
Visual Variety: Handles geometry and material variations for plants.
Fauna Layer:
Flocking/Swarm Agents: Manages collections of small animals (Butterflies, Birds).
Behavior Rules:
Wander: Random movement within defined bounds.
Wrap: Agents transporting across world boundaries to maintain population density.
Animation: Procedural animation based on movement speed and time (wing flapping).
3.4 Sensory Presenter
Visual Renderer:
Scene Graph: Hierarchical organization of all visible objects.
Environmental Effects: Skybox generation, distance fog for depth perception, and dynamic lighting (sun/ambient).
Audio Projector:
Spatial Audio: Sounds are attached to specific 3D locations (e.g., fountains, bird nests).
Ambient Zones: Global or large-area sounds (wind, water flow) that fade in/out based on player location.
3.5 User Interface & Control
Input Handler: Captures keyboard (WASD/Arrows) and mouse (Look) inputs.
Physics/Locomotion:
Walk Mode: Gravity-based movement with terrain collision (prevents walking into water/dense forest).
Fly Mode: Free-flight camera control for debugging or aerial views.
Teleporter: Instant translation of the user's position to known POIs defined in the Location Registry.
Heads-Up Display (HUD):
Minimap: A 2D overlay showing player position relative to the world bounds.
Coordinates: Real-time display of X/Y/Z position.
Contextual UI: Instructions and interactive menus (Teleport menu).
4. Data Flow
Initialization: The system loads the Map Data. The Location Registry initializes POIs. Terrain is generated.
Update Loop:
Input: User presses key -> Controller updates velocity vector.
Physics: Controller queries World Manager ("Am I on valid terrain?") -> Position updated.
Entities: Fauna updates position/animation based on time.
Render: Camera moves to new User position. Scene is drawn. Audio listener position updated.
5. Extensibility
The design is modular. New "Layers" can be added to the Entity Manager (e.g., Weather Layer). The Cartography Engine abstracts the source map, allowing the world to be changed by swapping the source image. The Texture Generator allows for infinite visual variations without external asset dependencies.
