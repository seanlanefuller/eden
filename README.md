# Eden: The Garden

A real-time, 3D interactive simulation of a botanical garden. This project provides a virtual exploration experience where users can navigate through a digital recreation of physical locations, featuring atmospheric immersion, spatial accuracy, and a living world simulation.

## Features

- **Real-Time 3D Simulation:** Interactive exploration of a 118-acre botanical garden.
- **Atmospheric Immersion:** Spatial audio (spatialized bird chirps, wind, and water) and dynamic visuals.
- **Dual Locomotion Modes:**
  - **Walk Mode:** Gravity-based movement with terrain collision.
  - **Fly Mode:** Free-flight camera control for debugging and aerial views.
- **HUD Interface:** Real-time display of coordinates, heading, and speed.
- **Modular Architecture:** Extensible system with a Simulation Kernel, World Manager, Entity Manager, and Sensory Presenter.

## Getting Started

### Prerequisites

A modern web browser with WebGL support.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Open `index.html` in your web browser.

## Controls

- **WASD / Arrow Keys:** Move
- **Mouse:** Look around (Pointer Lock)
- **Space:** Jump (in Walk Mode)
- **F:** Toggle between Walk and Fly modes

## Technical Overview

The system is built with a modular design:

- **Simulation Kernel:** Manages the game loop and global state.
- **World Manager:** Handles terrain generation and coordinate mapping (1 Map Unit ≈ 7 Meters).
- **Entity Manager:** Controls dynamic objects like flora and fauna.
- **Sensory Presenter:** Manages rendering and spatial audio synthesis.

## License

This project is licensed under the [MIT License](LICENSE.md).
