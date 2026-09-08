// src/ui/UIManager.js
export class UIManager {
    constructor() {
        this.staminaBar = document.getElementById('stamina-bar');
        this.alertText = document.getElementById('alert-text');
        this.interactPrompt = document.getElementById('interact-prompt');
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

    showInteractPrompt(show) {
        if (this.interactPrompt) {
            this.interactPrompt.style.opacity = show ? '1' : '0';
        }
    }
}
