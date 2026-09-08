// src/systems/AudioEngine.js
export class AudioEngine {
    constructor() {
        // Inicializamos la librería nativa de audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.isInitialized = false;
    }

    async init() {
        // Desbloqueamos el audio (Requisito de Chrome/Safari)
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        this.isInitialized = true;
        this.startAmbientMusic();
    }

    startAmbientMusic() {
        // Sintetizador 1: Un tono bajo continuo (Drone)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 55; // Frecuencia muy baja, estilo película de terror
        
        // Sintetizador 2: LFO (Low Frequency Oscillator) para dar sensación de pulsación/respiración
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15; // Pulsa muy lento
        
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.4;
        
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        lfo.start();
        
        // Volumen base
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    }

    playAlertSound() {
        if (!this.isInitialized) return;
        
        // Sonido sintético de alarma (Onda cuadrada disonante)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        // Caída rápida de tono para que suene como un "Pew!" de alerta
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playHideSound() {
        if (!this.isInitialized) return;
        
        // Sonido de "Swoosh" grave al esconderse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }
    playCollectSound() {
        if (!this.isInitialized) return;
        // Sonido de "campanita" / recompensa al agarrar basura
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
}
