import { SimulationKernel } from './src/SimulationKernel.js';

window.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing The Garden...");
    const kernel = new SimulationKernel();
    kernel.start();
});
