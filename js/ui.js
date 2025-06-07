// AlejandrIA - UI Helper Functions and Enhancements

class UIEnhancements {
    constructor() {
        this.initializeAnimations();
        this.initializeTooltips();
        this.initializeKeyboardShortcuts();
        this.initializeAccessibility();
    }

    initializeAnimations() {
        // Add smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';

        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-visible');
                }
            });
        }, observerOptions);

        // Observe message elements as they're added
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            const mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.classList && node.classList.contains('message')) {
                            observer.observe(node);
                        }
                    });
                });
            });

            mutationObserver.observe(chatMessages, { childList: true });
        }
    }

    initializeTooltips() {
        // Simple tooltip implementation
        const tooltipElements = document.querySelectorAll('[title]');
        
        tooltipElements.forEach(element => {
            const originalTitle = element.getAttribute('title');
            
            element.addEventListener('mouseenter', (e) => {
                // Remove default title to prevent browser tooltip
                element.removeAttribute('title');
                
                // Create custom tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';
                tooltip.textContent = originalTitle;
                document.body.appendChild(tooltip);
                
                // Position tooltip
                const rect = element.getBoundingClientRect();
                tooltip.style.position = 'absolute';
                tooltip.style.left = `${rect.left + rect.width / 2}px`;
                tooltip.style.top = `${rect.top - 5}px`;
                tooltip.style.transform = 'translate(-50%, -100%)';
                
                // Store reference
                element._tooltip = tooltip;
            });
            
            element.addEventListener('mouseleave', (e) => {
                // Restore title attribute
                element.setAttribute('title', originalTitle);
                
                // Remove tooltip
                if (element._tooltip) {
                    element._tooltip.remove();
                    delete element._tooltip;
                }
            });
        });
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Focus on message input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const messageInput = document.getElementById('messageInput');
                if (messageInput) {
                    messageInput.focus();
                }
            }
            
            // Ctrl/Cmd + /: Toggle voice recording
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                const voiceBtn = document.getElementById('voiceBtn');
                if (voiceBtn) {
                    voiceBtn.click();
                }
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                const settingsModal = document.getElementById('settingsModal');
                if (settingsModal && settingsModal.style.display !== 'none') {
                    settingsModal.style.display = 'none';
                }
            }
            
            // Ctrl/Cmd + Shift + C: Clear chat
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                if (confirm('¿Estás seguro de que quieres limpiar la conversación?')) {
                    if (window.alejandria) {
                        window.alejandria.clearChat();
                    }
                }
            }
        });
    }

    initializeAccessibility() {
        // Add ARIA live regions for dynamic content
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.setAttribute('aria-live', 'polite');
            typingIndicator.setAttribute('aria-label', 'Estado de escritura');
        }

        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.setAttribute('role', 'log');
            chatMessages.setAttribute('aria-label', 'Historial de conversación');
            chatMessages.setAttribute('aria-live', 'polite');
        }

        // Ensure buttons have proper ARIA labels
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-label') && button.getAttribute('title')) {
                button.setAttribute('aria-label', button.getAttribute('title'));
            }
        });
    }

    // Utility function to format tables in messages
    static createTable(headers, rows) {
        const table = document.createElement('table');
        table.className = 'message-table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        return table.outerHTML;
    }

    // Utility function to show notifications
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Icon based on type
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
        
        notification.insertBefore(icon, notification.firstChild);
        
        // Add to document
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('notification-show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    // Utility function to copy text to clipboard
    static copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                UIEnhancements.showNotification('Copiado al portapapeles', 'success');
            }).catch(err => {
                console.error('Error al copiar:', err);
                UIEnhancements.showNotification('Error al copiar', 'error');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                UIEnhancements.showNotification('Copiado al portapapeles', 'success');
            } catch (err) {
                UIEnhancements.showNotification('Error al copiar', 'error');
            }
            document.body.removeChild(textArea);
        }
    }

    // Add copy buttons to code blocks
    static addCopyButtons() {
        const codeBlocks = document.querySelectorAll('.code-block');
        codeBlocks.forEach(block => {
            if (!block.querySelector('.copy-button')) {
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-button';
                copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                copyButton.title = 'Copiar código';
                copyButton.addEventListener('click', () => {
                    const code = block.textContent;
                    UIEnhancements.copyToClipboard(code);
                });
                block.appendChild(copyButton);
            }
        });
    }
}

// Add custom CSS for notifications and other UI enhancements
const style = document.createElement('style');
style.textContent = `
    /* Skip link for accessibility */
    .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--accent-primary);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 0 0 4px 0;
        z-index: 1000;
    }
    
    .skip-link:focus {
        top: 0;
    }
    
    /* Custom tooltips */
    .custom-tooltip {
        background-color: var(--bg-tertiary);
        color: var(--text-primary);
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        box-shadow: var(--shadow-md);
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        animation: tooltipFadeIn 0.2s ease forwards;
    }
    
    @keyframes tooltipFadeIn {
        to {
            opacity: 1;
        }
    }
    
    /* Notification styles */
    .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .notification {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 250px;
        max-width: 400px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    }
    
    .notification-show {
        transform: translateX(0);
    }
    
    .notification i {
        font-size: 1.25rem;
    }
    
    .notification-success i {
        color: #10b981;
    }
    
    .notification-error i {
        color: #ef4444;
    }
    
    .notification-warning i {
        color: #f59e0b;
    }
    
    .notification-info i {
        color: var(--accent-primary);
    }
    
    /* Copy button for code blocks */
    .code-block {
        position: relative;
        padding-right: 3rem;
    }
    
    .copy-button {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background-color: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 0.375rem;
        padding: 0.375rem 0.5rem;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }
    
    .copy-button:hover {
        opacity: 1;
    }
    
    /* Fade in animation for messages */
    .message {
        opacity: 0;
        animation: messageSlideIn 0.3s ease forwards;
    }
    
    @keyframes messageSlideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Enhanced focus styles */
    :focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
    }
    
    /* Loading spinner */
    .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid var(--bg-tertiary);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

document.head.appendChild(style);

// Initialize UI enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiEnhancements = new UIEnhancements();
    
    // Add copy buttons to code blocks when they appear
    const observer = new MutationObserver(() => {
        UIEnhancements.addCopyButtons();
    });
    
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        observer.observe(chatMessages, { childList: true, subtree: true });
    }
});