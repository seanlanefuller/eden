Implementation Plan - The Garden (Phased)
This plan outlines the development of "The Garden", a 3D interactive botanical garden simulation. The approach is phased, starting from a foundational grid and evolving into a realistic simulation.

User Review Required
IMPORTANT

World Scale: The garden is 118 acres ($\approx$ 480,000 $m^2$). Calculated Scale: A square area of $\approx$ 693m x 693m. Conversion: Mapping the 0-100 coordinate system to real-world meters means 1 Map Unit $\approx$ 7 Meters.

Phased Implementation
Phase 1: The Foundation (Skeleton & Scale)
Goal: Establish the application structure, game loop, and the physical world dimensions.

Project Setup: Create index.html, style.css, and main.js.
Simulation Kernel:
Set up the requestAnimationFrame loop.
Implement Time management (delta time).
World Manager (Physical):
Scale Implementation: Create a ground plane of 700m x 700m.
Coordinate System: Implement a function mapToWorld(x,y) that multiplies input by 7 and centers the map (offset by -350m to center 0,0).
Data Loading: Load the 30 locations from 
garden_map.txt
 and place simple colored markers (cubes) at their world coordinates.
Phase 2: The Explorer (Controls & Interface)
Goal: Allow the user to navigate the space effectively with specific controls.

User Interface (Input):
Keyboard: WASD (Move), Space (Jump), F (Toggle Fly/Walk).
Mouse: Pointer Lock API for look controls.
Physics Engine:
Walk Mode: Simple Euler integration for velocity. Apply gravity. Clamp height to ground level (0).
Fly Mode: Noclip style movement (move in camera direction), ignore gravity.
Heads-Up Display (HUD):
Create DOM overlay.
Display: Position (X, Y, Z), Heading (0-360 degrees), Speed (m/s).
Phase 3: The Senses (Audio & Environment)
Goal: Add immersive sensory feedback to bring the world to life.

Audio System (AudioContext):
Footsteps: Play trigger when moving in Walk mode (interval based on speed).
Ambience:
Wind: Procedural noise or looped sample, volume modulates slightly over time.
Birds: Random scheduler triggering short chirp samples with random pitch variance (0.9 - 1.1) and pan.
Spatial Zones (Water):
Identify water zones (Damson Aquatic Garden, lakes).
Check distance to these zones; fade in water loop when < 20 meters.
Visuals:
Basic lighting (Directional Sun + Hemisphere Ambient).
Skybox (Procedural blue gradient or simple texture).
Phase 4: Reality (Visual Fidelity - Future)
Goal: Replace placeholders with realistic procedural generation. (Note: This phase is detailed for roadmap purposes, initial work will focus on Phases 1-3)

Terrain: Heightmap generation based on data (hills vs flats).
Vegetation: Instance Mesh generation for trees/grass based on "Forest" or "Garden" map zones.
Structures: Replace cubes with approximate building shapes.
Technical Components (Revised)
Data Structures
Location: { id: number, name: string, category: string, mapCoords: [x,y], worldCoords: [x,y,z] }
Audio Logic
Dynamic Mix: Master Gain Node -> Logic to lower music/ambience when "speaking" (future proofing) or based on location.
Verification Plan (Manual)
Scale Check:
Fly from one corner (0,0) to opposite (100,100).
Expected: Distance traveled should be $\approx$ 1000m (diagonal of 700x700). Time taken at 5m/s walking speed should be $\approx$ 3 minutes.
Control Check:
Press W: Move forward.
Press Space: Vertical impulse (Jump).
Press F: Gravity disables, camera moves freely in 3D vector.
HUD Check:
Rotate 360 degrees; verify "Heading" updates 0 -> 360.
Audio Check:
Stand still: Hear only wind/birds.
Walk: Hear footsteps.
Fly: Footsteps stop.
Walk to "Damson Aquatic Garden": Water sound fades in.
