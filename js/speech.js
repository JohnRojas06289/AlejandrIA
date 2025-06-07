// AlejandrIA - Speech Recognition and Synthesis Handler

class SpeechHandler {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isRecording = false;
        this.voiceEnabled = true;
        this.voiceSpeed = 1.0;
        
        this.initializeRecognition();
        this.initializeElements();
        this.loadSettings();
    }

    initializeElements() {
        this.voiceBtn = document.getElementById('voiceBtn');
        this.voiceIndicator = document.getElementById('voiceIndicator');
        this.messageInput = document.getElementById('messageInput');
        this.voiceEnabledCheckbox = document.getElementById('voiceEnabled');
        this.voiceSpeedSlider = document.getElementById('voiceSpeed');
        this.voiceSpeedValue = document.getElementById('voiceSpeedValue');
        
        // Attach event listeners
        if (this.voiceEnabledCheckbox) {
            this.voiceEnabledCheckbox.addEventListener('change', (e) => {
                this.voiceEnabled = e.target.checked;
                localStorage.setItem('voiceEnabled', this.voiceEnabled);
            });
        }
        
        if (this.voiceSpeedSlider) {
            this.voiceSpeedSlider.addEventListener('input', (e) => {
                this.voiceSpeed = parseFloat(e.target.value);
                this.voiceSpeedValue.textContent = `${this.voiceSpeed.toFixed(1)}x`;
                localStorage.setItem('voiceSpeed', this.voiceSpeed);
            });
        }
    }

    loadSettings() {
        // Load voice enabled setting
        const savedVoiceEnabled = localStorage.getItem('voiceEnabled');
        if (savedVoiceEnabled !== null) {
            this.voiceEnabled = savedVoiceEnabled === 'true';
            if (this.voiceEnabledCheckbox) {
                this.voiceEnabledCheckbox.checked = this.voiceEnabled;
            }
        }
        
        // Load voice speed setting
        const savedVoiceSpeed = localStorage.getItem('voiceSpeed');
        if (savedVoiceSpeed !== null) {
            this.voiceSpeed = parseFloat(savedVoiceSpeed);
            if (this.voiceSpeedSlider) {
                this.voiceSpeedSlider.value = this.voiceSpeed;
                this.voiceSpeedValue.textContent = `${this.voiceSpeed.toFixed(1)}x`;
            }
        }
    }

    initializeRecognition() {
        // Check if speech recognition is available
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            // Hide voice button if not supported
            if (this.voiceBtn) {
                this.voiceBtn.style.display = 'none';
            }
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'es-ES'; // Spanish language

        // Recognition event handlers
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateUIRecording(true);
            console.log('Speech recognition started');
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.updateUIRecording(false);
            console.log('Speech recognition ended');
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update the input field with the transcription
            if (finalTranscript) {
                this.messageInput.value += finalTranscript;
                this.messageInput.dispatchEvent(new Event('input')); // Trigger auto-resize
            } else if (interimTranscript) {
                // Show interim results (optional)
                const currentValue = this.messageInput.value;
                const lastFinalIndex = currentValue.lastIndexOf(' ') + 1;
                this.messageInput.value = currentValue.substring(0, lastFinalIndex) + interimTranscript;
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isRecording = false;
            this.updateUIRecording(false);
            
            // Show error message to user
            let errorMessage = 'Error en el reconocimiento de voz: ';
            switch(event.error) {
                case 'no-speech':
                    errorMessage += 'No se detectó habla';
                    break;
                case 'audio-capture':
                    errorMessage += 'No se pudo capturar el audio';
                    break;
                case 'not-allowed':
                    errorMessage += 'Permisos de micrófono denegados';
                    break;
                default:
                    errorMessage += event.error;
            }
            
            this.showNotification(errorMessage, 'error');
        };
    }

    toggleRecording() {
        if (!this.recognition) {
            this.showNotification('El reconocimiento de voz no está disponible en este navegador', 'error');
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        try {
            this.recognition.start();
            this.playSound('start');
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.showNotification('Error al iniciar el reconocimiento de voz', 'error');
        }
    }

    stopRecording() {
        try {
            this.recognition.stop();
            this.playSound('stop');
            
            // Send message if there's content
            if (this.messageInput.value.trim()) {
                // Small delay to ensure final recognition results are processed
                setTimeout(() => {
                    if (window.alejandria) {
                        window.alejandria.sendMessage();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }

    updateUIRecording(isRecording) {
        if (isRecording) {
            this.voiceBtn.classList.add('recording');
            this.voiceBtn.querySelector('i').className = 'fas fa-stop';
            this.voiceIndicator.style.display = 'flex';
            this.messageInput.placeholder = 'Escuchando...';
        } else {
            this.voiceBtn.classList.remove('recording');
            this.voiceBtn.querySelector('i').className = 'fas fa-microphone';
            this.voiceIndicator.style.display = 'none';
            this.messageInput.placeholder = 'Escribe tu pregunta o usa el micrófono...';
        }
    }

    speak(text) {
        if (!this.voiceEnabled || !this.synthesis) {
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        // Remove markdown and formatting for speech
        const cleanText = this.cleanTextForSpeech(text);

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.rate = this.voiceSpeed;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        // Get Spanish voice if available
        const voices = this.synthesis.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }

        // Event handlers
        utterance.onstart = () => {
            console.log('Speech started');
        };

        utterance.onend = () => {
            console.log('Speech ended');
        };

        utterance.onerror = (event) => {
            console.error('Speech error:', event);
        };

        this.synthesis.speak(utterance);
    }

    cleanTextForSpeech(text) {
        // Remove markdown formatting
        let clean = text;
        
        // Remove code blocks
        clean = clean.replace(/```[\s\S]*?```/g, 'código omitido');
        
        // Remove inline code
        clean = clean.replace(/`([^`]+)`/g, '$1');
        
        // Remove bold and italic markers
        clean = clean.replace(/\*\*(.+?)\*\*/g, '$1');
        clean = clean.replace(/\*(.+?)\*/g, '$1');
        
        // Remove links but keep text
        clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        
        // Remove special characters that might cause issues
        clean = clean.replace(/[#_~]/g, '');
        
        return clean;
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }

    playSound(type) {
        // Create audio context for simple beeps
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'start') {
            oscillator.frequency.value = 880; // A5 note
            gainNode.gain.value = 0.1;
        } else {
            oscillator.frequency.value = 440; // A4 note
            gainNode.gain.value = 0.08;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    showNotification(message, type = 'info') {
        // Simple notification (you can enhance this with a toast library)
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // You could also show a visual notification here
        // For now, we'll just log to console
    }
}

// Initialize speech handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.speechHandler = new SpeechHandler();
});