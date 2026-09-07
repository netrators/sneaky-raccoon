import { GameEngine } from './core/GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
    // Instanciamos el motor apuntando al div del HTML
    const engine = new GameEngine('game-container');
    
    // Arrancamos todo
    engine.init();
});
