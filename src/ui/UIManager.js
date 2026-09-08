// src/ui/UIManager.js
export class UIManager {
    constructor() {
        this.staminaBar = document.getElementById('stamina-bar');
        this.alertText = document.getElementById('alert-text');
        this.interactPrompt = document.getElementById('interact-prompt');
        this.scoreText = document.getElementById('score-text'); // NUEVO
    }

    updateStamina(currentStamina) {
        if (!this.staminaBar) return;
        this.staminaBar.style.width = `${currentStamina}%`;
        if (currentStamina < 30) {
            this.staminaBar.style.background = '#ffaa00';
            this.staminaBar.style.boxShadow = '0 0 10px #ffaa00';
        } else {
            this.staminaBar.style.background = '#00ff88';
            this.staminaBar.style.boxShadow = '0 0 10px #00ff88';
        }
    }

    setAlert(isAlerted) {
        if (this.alertText) {
            this.alertText.style.opacity = isAlerted ? '1' : '0';
        }
    }

    showInteractPrompt(text) {
        if (!this.interactPrompt) return;
        if (text) {
            this.interactPrompt.innerText = text;
            this.interactPrompt.style.opacity = '1';
        } else {
            this.interactPrompt.style.opacity = '0';
        }
    }

    // NUEVO: Actualizar el contador
    updateScore(current, max) {
        if (this.scoreText) {
            this.scoreText.innerText = `Basura: ${current} / ${max}`;
            if(current >= max) {
                this.scoreText.innerText = "¡NIVEL COMPLETADO!";
                this.scoreText.style.color = "#00ff88";
            }
        }
    }
}
