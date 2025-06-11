// Sabius - Enhanced Speech Recognition and Synthesis Handler

class SpeechHandler {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isRecording = false;
        this.voiceEnabled = true;
        this.voiceSpeed = 1.0;
        this.finalTranscript = '';
        this.interimTranscript = '';
        this.silenceTimer = null;
        this.silenceDelay = 500;
        this.currentUtterance = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isDetectingVoice = false;
        this.isPaused = false;
        this.pausedText = '';
        this.pausedPosition = 0;
        
        console.log('🎤 Initializing SpeechHandler...');
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
                
                // Si se deshabilita la voz, detener cualquier reproducción actual
                if (!this.voiceEnabled) {
                    this.stopSpeaking();
                    this.showNotification('Respuestas por voz deshabilitadas', 'info');
                } else {
                    this.showNotification('Respuestas por voz habilitadas', 'success');
                }
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
            if (this.voiceBtn) {
                this.voiceBtn.style.display = 'none';
            }
            return;
        }

        this.recognition = new SpeechRecognition();
        
        // CONFIGURACIÓN MEJORADA PARA MEJOR RECONOCIMIENTO
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'es-ES'; // Spanish language
        this.recognition.maxAlternatives = 3; // Considerar múltiples alternativas
        
        // Configuraciones adicionales específicas para WebKit
        if ('webkitSpeechRecognition' in window) {
            this.recognition.serviceURI = 'wss://www.google.com/speech-api/v2/recognize';
        }

        // Recognition event handlers
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.finalTranscript = '';
            this.interimTranscript = '';
            this.updateUIRecording(true);
            this.playSound('start');
            console.log('🎤 Speech recognition started');
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.updateUIRecording(false);
            this.playSound('stop');
            console.log('🔇 Speech recognition ended');
            
            // Auto-enviar si hay contenido
            if (this.finalTranscript.trim()) {
                setTimeout(() => {
                    if (window.Sabius) {
                        window.Sabius.sendMessage();
                    }
                }, 500);
            }
        };

        this.recognition.onresult = (event) => {
            this.finalTranscript = '';
            this.interimTranscript = '';

            // Procesar todos los resultados
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                
                if (result.isFinal) {
                    this.finalTranscript += transcript + ' ';
                    // Resetear timer cuando hay habla final
                    this.resetSilenceTimer();
                } else {
                    this.interimTranscript += transcript;
                    // Activar barras de sonido cuando hay habla
                    this.activateVoiceWaves();
                    // Resetear timer durante habla interina
                    this.resetSilenceTimer();
                }
            }

            // Limpiar y procesar el texto final
            if (this.finalTranscript) {
                const cleanedText = this.cleanTranscript(this.finalTranscript);
                this.messageInput.value = cleanedText;
                this.messageInput.dispatchEvent(new Event('input')); // Trigger auto-resize
                console.log('✅ Final transcript:', cleanedText);
                
                // Iniciar timer para envío automático
                this.startSilenceTimer();
            }
            
            // Mostrar resultado intermedio (opcional)
            if (this.interimTranscript && !this.finalTranscript) {
                const tempValue = this.messageInput.value;
                const cleanedInterim = this.cleanTranscript(this.interimTranscript);
                this.messageInput.value = tempValue + cleanedInterim;
                this.messageInput.style.fontStyle = 'italic';
                this.messageInput.style.opacity = '0.7';
            } else {
                this.messageInput.style.fontStyle = 'normal';
                this.messageInput.style.opacity = '1';
            }
        };

        this.recognition.onerror = (event) => {
            console.error('🚨 Speech recognition error:', event.error);
            this.isRecording = false;
            this.updateUIRecording(false);
            
            // Manejo específico de errores
            let errorMessage = 'Error en el reconocimiento de voz: ';
            let shouldRetry = false;
            
            switch(event.error) {
                case 'no-speech':
                    errorMessage += 'No se detectó habla. Intenta hablar más claro.';
                    shouldRetry = true;
                    break;
                case 'audio-capture':
                    errorMessage += 'No se pudo acceder al micrófono. Verifica los permisos.';
                    break;
                case 'not-allowed':
                    errorMessage += 'Permisos de micrófono denegados. Permite el acceso al micrófono.';
                    break;
                case 'network':
                    errorMessage += 'Error de conexión. Verifica tu conexión a internet.';
                    shouldRetry = true;
                    break;
                case 'aborted':
                    errorMessage += 'Reconocimiento cancelado.';
                    break;
                default:
                    errorMessage += event.error;
                    shouldRetry = true;
            }
            
            this.showNotification(errorMessage, 'error');
            
            // Auto-retry en algunos casos
            if (shouldRetry && this.autoRetryCount < 2) {
                this.autoRetryCount = (this.autoRetryCount || 0) + 1;
                setTimeout(() => {
                    console.log('🔄 Auto-retrying speech recognition...');
                    this.startRecording();
                }, 1000);
            } else {
                this.autoRetryCount = 0;
            }
        };

        this.recognition.onspeechstart = () => {
            console.log('🗣️ Speech detected');
        };

        this.recognition.onspeechend = () => {
            console.log('🤐 Speech ended');
        };

        this.recognition.onnomatch = () => {
            console.log('❓ No speech matches found');
            this.showNotification('No se pudo reconocer lo que dijiste. Intenta de nuevo.', 'warning');
        };
    }

    startSilenceTimer() {
        this.clearSilenceTimer();
        console.log('🔇 Starting silence timer...');
        this.silenceTimer = setTimeout(() => {
            console.log('📤 Auto-sending message due to silence');
            this.stopRecording();
            if (this.messageInput.value.trim()) {
                setTimeout(() => {
                    if (window.Sabius) {
                        window.Sabius.sendMessage();
                    }
                }, 500);
            }
        }, this.silenceDelay);
    }

    resetSilenceTimer() {
        this.clearSilenceTimer();
        this.startSilenceTimer();
    }

    clearSilenceTimer() {
        if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
        }
    }

    activateVoiceWaves() {
        const waves = document.querySelectorAll('.voice-wave');
        waves.forEach((wave, index) => {
            // Activar aleatoriamente algunas barras para simular detección de voz
            if (Math.random() > 0.3) {
                wave.classList.add('active');
                setTimeout(() => {
                    wave.classList.remove('active');
                }, 200 + Math.random() * 300);
            }
        });
    }

    async initializeAudioAnalysis() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.startVoiceDetection();
        } catch (error) {
            console.warn('Could not initialize audio analysis:', error);
        }
    }

    startVoiceDetection() {
        if (!this.analyser || !this.isRecording) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
        
        // Si hay actividad de voz, animar las barras
        if (average > 20) {
            this.activateVoiceWaves();
            this.resetSilenceTimer();
        }
        
        if (this.isRecording) {
            requestAnimationFrame(() => this.startVoiceDetection());
        }
    }

    cleanTranscript(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
            .replace(/^[,.!?]/, '') // Remover puntuación al inicio
            .charAt(0).toUpperCase() + text.slice(1); // Capitalizar primera letra
    }

    toggleRecording() {
        if (!this.recognition) {
            this.showNotification('El reconocimiento de voz no está disponible en este navegador', 'error');
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
        } else {
            // Si hay síntesis de voz activa, mostrar que se va a interrumpir
            if (this.synthesis.speaking) {
                this.showNotification('Interrumpiendo reproducción para escuchar...', 'info');
            }
            this.startRecording();
        }
    }

    async startRecording() {
        try {
            // Si la IA está hablando, detenerla primero
            if (this.synthesis.speaking) {
                console.log('🔇 Stopping AI speech to listen...');
                this.stopSpeaking();
                this.showNotification('IA silenciada para escuchar', 'info');
            }

            // Solicitar permisos de micrófono explícitamente
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // Liberar inmediatamente
            } catch (permissionError) {
                this.showNotification('Necesitas permitir el acceso al micrófono para usar esta función', 'error');
                return;
            }

            // Limpiar input previo si está vacío
            if (!this.messageInput.value.trim()) {
                this.messageInput.value = '';
            }

            // Limpiar timers anteriores
            this.clearSilenceTimer();

            this.recognition.start();
            console.log('🎙️ Starting speech recognition...');
            
            // Inicializar análisis de audio para barras reactivas
            this.initializeAudioAnalysis();
            
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.showNotification('Error al iniciar el reconocimiento de voz', 'error');
        }
    }

    stopRecording() {
        try {
            this.clearSilenceTimer();
            this.recognition.stop();
            console.log('⏹️ Stopping speech recognition...');
            
            // Detener análisis de audio
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }

    updateUIRecording(isRecording) {
        if (isRecording) {
            this.voiceBtn.classList.add('recording');
            this.voiceBtn.querySelector('i').className = 'fas fa-stop';
            this.voiceBtn.setAttribute('title', 'Detener grabación');
            
            // Crear indicador de voz mejorado
            this.createEnhancedVoiceIndicator();
            
            this.messageInput.placeholder = '🎤 Escuchando... Habla ahora';
            this.messageInput.style.borderColor = 'var(--voice-primary)';
        } else {
            this.voiceBtn.classList.remove('recording');
            this.voiceBtn.querySelector('i').className = 'fas fa-microphone';
            this.voiceBtn.setAttribute('title', 'Hablar');
            
            // Remover indicador
            this.removeVoiceIndicator();
            
            this.messageInput.placeholder = 'Escribe tu pregunta o usa el micrófono...';
            this.messageInput.style.borderColor = '';
            this.messageInput.style.fontStyle = 'normal';
            this.messageInput.style.opacity = '1';
        }
    }

    createEnhancedVoiceIndicator() {
        // Remover indicador existente
        this.removeVoiceIndicator();
        
        // Crear nuevo indicador
        this.voiceIndicator = document.createElement('div');
        this.voiceIndicator.className = 'voice-indicator';
        this.voiceIndicator.id = 'voiceIndicator';
        
        // Crear ondas de sonido
        for (let i = 0; i < 6; i++) {
            const wave = document.createElement('div');
            wave.className = 'voice-wave';
            this.voiceIndicator.appendChild(wave);
        }
        
        document.body.appendChild(this.voiceIndicator);
        
        // Animar entrada
        setTimeout(() => {
            this.voiceIndicator.style.opacity = '1';
            this.voiceIndicator.style.transform = 'translateX(-50%) scale(1)';
        }, 10);
    }

    removeVoiceIndicator() {
        const existing = document.getElementById('voiceIndicator');
        if (existing) {
            existing.style.opacity = '0';
            existing.style.transform = 'translateX(-50%) scale(0.8)';
            setTimeout(() => {
                existing.remove();
            }, 300);
        }
    }

    async speak(text, messageElement = null) {
        if (!this.voiceEnabled) return;
        await this.speakWithOpenAITTS(text);
    }

    pauseSpeaking() {
        if (this.synthesis.speaking && this.currentUtterance) {
            this.synthesis.pause();
            this.isPaused = true;
            console.log('⏸️ Speech paused');
            this.showNotification('Reproducción pausada', 'info');
        }
    }

    resumeSpeaking() {
        if (this.isPaused && this.currentUtterance) {
            this.synthesis.resume();
            this.isPaused = false;
            console.log('▶️ Speech resumed');
            this.showNotification('Reproducción reanudada', 'success');
        }
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
        
        // Actualizar todos los controles de voz visibles
        const allMessages = document.querySelectorAll('.message.assistant');
        allMessages.forEach(messageEl => {
            this.updateVoiceControls(messageEl, 'stopped');
        });
        
        this.currentUtterance = null;
        this.isPaused = false;
    }

    updateVoiceControls(messageElement, state) {
        const playBtn = messageElement.querySelector('.voice-play-btn');
        const pauseBtn = messageElement.querySelector('.voice-pause-btn');
        const resumeBtn = messageElement.querySelector('.voice-resume-btn');
        const stopBtn = messageElement.querySelector('.voice-stop-btn');
        
        if (!playBtn || !pauseBtn || !resumeBtn || !stopBtn) return;
        
        // Ocultar todos primero
        [playBtn, pauseBtn, resumeBtn, stopBtn].forEach(btn => {
            btn.style.display = 'none';
            btn.classList.remove('playing');
        });
        
        switch (state) {
            case 'playing':
                pauseBtn.style.display = 'flex';
                stopBtn.style.display = 'flex';
                pauseBtn.classList.add('playing');
                break;
            case 'paused':
                resumeBtn.style.display = 'flex';
                stopBtn.style.display = 'flex';
                break;
            case 'stopped':
            case 'error':
            default:
                playBtn.style.display = 'flex';
                break;
        }
    }

    cleanTextForSpeech(text) {
        // Remove markdown formatting
        let clean = text;
        
        // Remove code blocks
        clean = clean.replace(/```[\s\S]*?```/g, ' código omitido ');
        
        // Remove inline code
        clean = clean.replace(/`([^`]+)`/g, '$1');
        
        // Remove bold and italic markers
        clean = clean.replace(/\*\*(.+?)\*\*/g, '$1');
        clean = clean.replace(/\*(.+?)\*/g, '$1');
        
        // Remove links but keep text
        clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        
        // Remove special characters that might cause issues
        clean = clean.replace(/[#_~]/g, '');
        
        // Clean up extra spaces
        clean = clean.replace(/\s+/g, ' ').trim();
        
        return clean;
    }

    playSound(type) {
        try {
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
            oscillator.stop(audioContext.currentTime + 0.15);
            
            // Cleanup
            setTimeout(() => {
                audioContext.close();
            }, 200);
        } catch (error) {
            console.log('Audio feedback not available:', error);
        }
    }

    showNotification(message, type = 'info') {
        if (window.Sabius && window.Sabius.showNotification) {
            window.Sabius.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    async speakWithOpenAITTS(text) {
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error('Error en el backend TTS');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        } catch (error) {
            this.showNotification('Error al reproducir voz con OpenAI TTS', 'error');
            console.error(error);
        }
    }
}

// Initialize speech handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.speechHandler) {
        window.speechHandler = new SpeechHandler();
        console.log('✅ SpeechHandler initialized');
    } else {
        console.warn('SpeechHandler already exists');
    }
});