class AlejandrIAChat {
    constructor() {
        this.messages = [];
        this.isProcessing = false;
        // Configuración simplificada del webhook URL
        this.webhookUrl = 'http://localhost:3001/api/alejandria';
        this.conversationContext = [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
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
        this.webhookUrlInput = document.getElementById('webhookUrl');
        
        // Configurar input del webhook URL
        if (this.webhookUrlInput) {
            this.webhookUrlInput.value = this.webhookUrl;
            // Permitir que el usuario cambie la URL si es necesario
            this.webhookUrlInput.addEventListener('change', (e) => {
                this.webhookUrl = e.target.value;
                localStorage.setItem('webhookUrl', this.webhookUrl);
            });
        }
        
        // Theme elements
        this.themeToggle = document.getElementById('themeToggle');
        
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
        // Load webhook URL from localStorage if exists
        const savedWebhookUrl = localStorage.getItem('webhookUrl');
        if (savedWebhookUrl) {
            this.webhookUrl = savedWebhookUrl;
            if (this.webhookUrlInput) {
                this.webhookUrlInput.value = this.webhookUrl;
            }
        }

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
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    openSettings() {
        this.settingsModal.style.display = 'flex';
    }

    closeSettingsModal() {
        this.settingsModal.style.display = 'none';
    }

    clearChat() {
        this.messages = [];
        this.conversationContext = [];
        this.chatMessages.innerHTML = '';
        this.welcomeScreen.style.display = 'flex';
        this.chatMessages.style.display = 'none';
    }

    async sendMessage(messageText = null) {
        const text = messageText || this.messageInput.value.trim();
        
        if (!text || this.isProcessing) return;

        // Hide welcome screen on first message
        if (this.messages.length === 0) {
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
        avatar.textContent = message.type === 'user' ? 'U' : 'AI';
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-wrapper';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Parse and render content with proper formatting
        content.innerHTML = this.formatMessageContent(message.content);
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(message.timestamp);
        
        contentWrapper.appendChild(content);
        contentWrapper.appendChild(time);
        
        messageEl.appendChild(avatar);
        messageEl.appendChild(contentWrapper);
        
        this.chatMessages.appendChild(messageEl);
        this.scrollToBottom();

        // Speak assistant messages if enabled
        if (message.type === 'assistant' && window.speechHandler) {
            window.speechHandler.speak(message.content);
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
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async processMessage(userMessage) {
        try {
            console.log('Enviando mensaje a:', this.webhookUrl);
            
            // Prepare the request payload
            const payload = {
                message: userMessage,
                context: this.conversationContext,
                timestamp: new Date().toISOString(),
                sessionId: this.getSessionId()
            };

            console.log('Payload:', payload);

            // Send to webhook
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            
            this.hideTypingIndicator();
            
            // Add AI response
            if (data.response) {
                this.addMessage('assistant', data.response);
            } else {
                throw new Error('No response received from webhook');
            }

        } catch (error) {
            console.error('Error processing message:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', `Lo siento, hubo un error al procesar tu mensaje: ${error.message}. Por favor, verifica que el backend esté ejecutándose correctamente.`);
        }
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('alejandria-session-id');
        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('alejandria-session-id', sessionId);
        }
        return sessionId;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.alejandria = new AlejandrIAChat();
});