class SabiusChat {
    constructor() {
        this.messages = [];
        this.isProcessing = false;
        
        // 🔧 FIX: Configuración dinámica de URL del backend
        this.webhookUrl = this.getBackendUrl();
        
        this.conversationContext = [];
        this.conversationId = null; // Se generará cuando inicie una nueva conversación
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
        
        // 🔧 NUEVO: Probar conexión al backend al inicializar
        this.testConnection();
    }

    // 🔧 NUEVO: Método para determinar la URL del backend
    getBackendUrl() {
        // Detectar si estamos en Railway o localhost
        const isRailway = window.location.hostname.includes('railway.app');
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        let backendUrl;
        
        if (isRailway) {
            // URL del backend en Railway 
            backendUrl = 'https://backend-production-6353.up.railway.app/api/Sabius';
        } else if (isLocalhost) {
            // Desarrollo local
            backendUrl = 'http://localhost:3001/api/Sabius';
        } else {
            // Fallback para otros entornos
            backendUrl = `${window.location.protocol}//${window.location.hostname}:3001/api/Sabius`;
        }
        
        console.log('🌐 Backend URL detectada:', backendUrl);
        console.log('🌍 Entorno actual:', { 
            hostname: window.location.hostname, 
            isRailway, 
            isLocalhost 
        });
        
        return backendUrl;
    }

    // 🔧 NUEVO: Probar conexión con el backend
    async testConnection() {
        try {
            const healthUrl = this.webhookUrl.replace('/api/Sabius', '/health');
            console.log('🔍 Probando conexión a:', healthUrl);
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                // Timeout para evitar esperas largas
                signal: AbortSignal.timeout(10000) // 10 segundos
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Backend health check exitoso:', data);
            
            // Mostrar notificación de éxito si está disponible
            if (this.showNotification) {
                this.showNotification(`Backend conectado: ${data.status}`, 'success');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error de conectividad con backend:', error);
            
            // Mostrar notificación de error
            if (this.showNotification) {
                this.showNotification(`Error de conexión: ${error.message}`, 'error');
            } else {
                // Fallback si showNotification no está disponible aún
                console.warn('⚠️ Backend no disponible:', error.message);
            }
            
            return false;
        }
    }

    initializeElements() {
        // Main elements
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        // Settings elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.clearChatBtn = document.getElementById('clearChat');
        
        // Theme elements
        this.themeToggle = document.getElementById('themeToggle');
        
        // Logo click para reload
        const logoSection = document.querySelector('.logo-section');
        if (logoSection) {
            logoSection.style.cursor = 'pointer';
            logoSection.addEventListener('click', () => {
                location.reload();
            });
        }
        
        // Quick action buttons
        this.quickActionBtns = document.querySelectorAll('.quick-action-btn');
    }

    attachEventListeners() {
        // Message handling
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        });

        // Quick actions
        this.quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.sendMessage();
            });
        });

        // Settings
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });

        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Voice button (connected to speech.js)
        this.voiceBtn.addEventListener('click', () => {
            if (window.speechHandler) {
                window.speechHandler.toggleRecording();
            }
        });
    }

    loadSettings() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
        
        // Add smooth transition effect
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('i');
        if (theme === 'light') {
            icon.className = 'fas fa-moon';
            this.themeToggle.setAttribute('title', 'Cambiar a modo oscuro');
        } else {
            icon.className = 'fas fa-sun';
            this.themeToggle.setAttribute('title', 'Cambiar a modo claro');
        }
    }

    openSettings() {
        this.settingsModal.style.display = 'flex';
        setTimeout(() => {
            this.settingsModal.querySelector('.modal-content').style.transform = 'translateY(0) scale(1)';
        }, 10);
    }

    closeSettingsModal() {
        const modalContent = this.settingsModal.querySelector('.modal-content');
        modalContent.style.transform = 'translateY(-20px) scale(0.95)';
        setTimeout(() => {
            this.settingsModal.style.display = 'none';
        }, 200);
    }

    clearChat() {
        const confirmed = confirm('¿Estás seguro de que quieres limpiar toda la conversación?');
        if (confirmed) {
            this.messages = [];
            this.conversationContext = [];
            this.conversationId = null; // Reset conversation ID
            this.chatMessages.innerHTML = '';
            this.welcomeScreen.style.display = 'flex';
            this.chatMessages.style.display = 'none';
            
            console.log('🗑️ Conversación limpiada - ID reseteado');
            this.showNotification('Conversación limpiada', 'success');
        }
    }

    async sendMessage(messageText = null) {
        const text = messageText || this.messageInput.value.trim();
        
        if (!text || this.isProcessing) return;

        // Generar nuevo conversation ID si es el primer mensaje
        if (this.messages.length === 0) {
            this.conversationId = this.generateNewConversationId();
            console.log('🆕 Nueva conversación iniciada:', this.conversationId);
            
            this.welcomeScreen.style.display = 'none';
            this.chatMessages.style.display = 'flex';
        }

        // Clear input
        if (!messageText) {
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
        }

        // Add user message
        this.addMessage('user', text);

        // Show typing indicator
        this.showTypingIndicator();

        // Send to webhook
        await this.processMessage(text);
    }

    addMessage(type, content) {
        const message = {
            type,
            content,
            timestamp: new Date()
        };

        this.messages.push(message);
        this.renderMessage(message);

        // Add to context for AI
        this.conversationContext.push({
            role: type === 'user' ? 'user' : 'assistant',
            content: content
        });

        // Keep only last 10 messages in context
        if (this.conversationContext.length > 10) {
            this.conversationContext = this.conversationContext.slice(-10);
        }
    }

    renderMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = message.type === 'user' ? 
            '<i class="fas fa-user"></i>' : 
            '<i class="fas fa-robot"></i>';
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-wrapper';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Parse and render content with proper formatting
        content.innerHTML = this.formatMessageContent(message.content);
        
        // Agregar controles de voz para mensajes del asistente
        if (message.type === 'assistant') {
            const voiceControls = document.createElement('div');
            voiceControls.className = 'message-voice-controls';
            
            const playBtn = document.createElement('button');
            playBtn.className = 'voice-control-btn voice-play-btn';
            playBtn.innerHTML = '<i class="fas fa-play"></i> Reproducir';
            playBtn.addEventListener('click', () => {
                if (window.speechHandler) {
                    window.speechHandler.speak(message.content, messageEl);
                }
            });
            
            const pauseBtn = document.createElement('button');
            pauseBtn.className = 'voice-control-btn voice-pause-btn';
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            pauseBtn.style.display = 'none';
            pauseBtn.addEventListener('click', () => {
                if (window.speechHandler) {
                    window.speechHandler.pauseSpeaking();
                    window.speechHandler.updateVoiceControls(messageEl, 'paused');
                }
            });
            
            const resumeBtn = document.createElement('button');
            resumeBtn.className = 'voice-control-btn voice-resume-btn';
            resumeBtn.innerHTML = '<i class="fas fa-play"></i> Continuar';
            resumeBtn.style.display = 'none';
            resumeBtn.addEventListener('click', () => {
                if (window.speechHandler) {
                    window.speechHandler.resumeSpeaking();
                    window.speechHandler.updateVoiceControls(messageEl, 'playing');
                }
            });
            
            const stopBtn = document.createElement('button');
            stopBtn.className = 'voice-control-btn voice-stop-btn';
            stopBtn.innerHTML = '<i class="fas fa-stop"></i> Detener';
            stopBtn.style.display = 'none';
            stopBtn.addEventListener('click', () => {
                if (window.speechHandler) {
                    window.speechHandler.stopSpeaking();
                    window.speechHandler.updateVoiceControls(messageEl, 'stopped');
                }
            });
            
            voiceControls.appendChild(playBtn);
            voiceControls.appendChild(pauseBtn);
            voiceControls.appendChild(resumeBtn);
            voiceControls.appendChild(stopBtn);
            content.appendChild(voiceControls);
        }
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(message.timestamp);
        
        contentWrapper.appendChild(content);
        contentWrapper.appendChild(time);
        
        messageEl.appendChild(avatar);
        messageEl.appendChild(contentWrapper);
        
        this.chatMessages.appendChild(messageEl);
        this.scrollToBottom();

        // Auto-reproducir si está habilitado y es la primera vez
        if (message.type === 'assistant' && window.speechHandler && window.speechHandler.voiceEnabled) {
            setTimeout(() => {
                window.speechHandler.speak(message.content, messageEl);
            }, 100);
        }
    }

    formatMessageContent(content) {
        // Escape HTML first
        let formatted = this.escapeHtml(content);
        
        // Format code blocks
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>');
        
        // Format inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Format bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Format italic text
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Format line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Format links
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(date) {
        return date.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'inline-flex';
        this.isProcessing = true;
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
        this.isProcessing = false;
    }
    scrollToBottom() {
    setTimeout(() => {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }, 50);
    }

    // 🔧 MEJORADO: Manejo de errores más robusto
    async processMessage(userMessage) {
        try {
            console.log('📤 Enviando mensaje a:', this.webhookUrl);
            
            // Prepare the request payload with conversation ID
            const payload = {
                conversationId: this.conversationId,
                message: userMessage
            };

            console.log('📦 Payload:', payload);

            // 🔧 MEJORADO: Configuración de fetch más robusta
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // Agregar headers adicionales para CORS
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
                // Timeout de 30 segundos
                signal: AbortSignal.timeout(30000)
            });

            console.log('📨 Response status:', response.status);
            console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                // Intentar leer el cuerpo del error
                let errorDetails;
                try {
                    errorDetails = await response.text();
                } catch (e) {
                    errorDetails = 'No se pudo leer el detalle del error';
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}. Detalles: ${errorDetails}`);
            }

            const data = await response.json();
            console.log('📨 Response data:', data);
            
            this.hideTypingIndicator();
            
            // Verificar el formato de respuesta
            if (data.reply) {
                this.addMessage('assistant', data.reply);
            } else if (data.response) {
                // Mantener compatibilidad con formato anterior
                this.addMessage('assistant', data.response);
            } else {
                throw new Error('No se recibió una respuesta válida del webhook. Formato esperado: {reply: "texto"} o {response: "texto"}');
            }

        } catch (error) {
            console.error('❌ Error procesando mensaje:', error);
            this.hideTypingIndicator();
            
            // 🔧 MEJORADO: Mensajes de error más específicos
            let errorMessage = 'Lo siento, hubo un error al procesar tu mensaje. ';
            
            if (error.name === 'AbortError') {
                errorMessage += 'La solicitud tomó demasiado tiempo. Intenta de nuevo.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage += 'No se pudo conectar con el servidor. Verifica tu conexión a internet y que el backend esté funcionando.';
            } else if (error.message.includes('CORS')) {
                errorMessage += 'Error de configuración CORS. Contacta al administrador.';
            } else {
                errorMessage += error.message;
            }
            
            this.addMessage('assistant', errorMessage);
            
            // 🔧 NUEVO: Sugerir verificar la conexión
            if (error.message.includes('Failed to fetch')) {
                setTimeout(() => {
                    this.testConnection();
                }, 2000);
            }
        }
    }

    generateNewConversationId() {
        // Generar un ID único para cada conversación
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 15);
        const conversationId = `conv-${timestamp}-${randomPart}`;
        return conversationId;
    }

    getSessionId() {
        // Mantener para compatibilidad, pero ahora devuelve el conversation ID
        return this.conversationId || this.generateNewConversationId();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = document.createElement('i');
        switch(type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                icon.className = 'fas fa-info-circle';
        }
        
        notification.appendChild(icon);
        notification.appendChild(document.createTextNode(message));
        
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('notification-show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    if (!window.Sabius) {
        window.Sabius = new SabiusChat();
        console.log('✅ SabiusChat initialized');
    } else {
        console.warn('SabiusChat already exists');
    }
});