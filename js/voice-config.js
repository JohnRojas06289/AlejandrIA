// Configuración avanzada para mejorar el reconocimiento de voz en español

class VoiceConfiguration {
    constructor() {
        this.spanishPhrases = [
            // Comandos comunes en investigación
            'buscar investigador',
            'encontrar artículo',
            'recomendar paper',
            'inteligencia artificial',
            'machine learning',
            'aprendizaje automático',
            'ciencias de datos',
            'investigación científica',
            'universidad',
            'profesor',
            'estudiante',
            'tesis',
            'doctorado',
            'maestría',
            'proyecto de investigación'
        ];
        
        this.commonWords = [
            'qué', 'quién', 'cómo', 'cuándo', 'dónde', 'por qué',
            'buscar', 'encontrar', 'mostrar', 'ayudar', 'explicar',
            'hola', 'gracias', 'por favor', 'adiós'
        ];
        
        this.setupVoiceEnhancements();
    }

    setupVoiceEnhancements() {
        // Configurar gramática para mejor reconocimiento
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.setupGrammar();
        }
        
        // Configurar procesamiento de texto post-reconocimiento
        this.setupTextProcessing();
    }

    setupGrammar() {
        // En algunos navegadores, podemos usar SpeechGrammarList
        if ('webkitSpeechGrammarList' in window || 'SpeechGrammarList' in window) {
            const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
            const grammar = this.createGrammar();
            
            if (window.speechHandler && window.speechHandler.recognition) {
                const grammarList = new SpeechGrammarList();
                grammarList.addFromString(grammar, 1);
                window.speechHandler.recognition.grammars = grammarList;
            }
        }
    }

    createGrammar() {
        // Crear gramática JSGF para mejorar el reconocimiento
        let grammar = '#JSGF V1.0; grammar research;\n';
        grammar += 'public <command> = ';
        
        const commands = [
            ...this.spanishPhrases,
            ...this.commonWords
        ];
        
        grammar += commands.join(' | ') + ';';
        return grammar;
    }

    setupTextProcessing() {
        // Interceptar y mejorar el texto reconocido
        if (window.speechHandler) {
            const originalCleanTranscript = window.speechHandler.cleanTranscript;
            window.speechHandler.cleanTranscript = (text) => {
                // Aplicar mejoras específicas para español
                let improved = this.improveSpanishText(text);
                // Aplicar limpieza original
                return originalCleanTranscript.call(window.speechHandler, improved);
            };
        }
    }

    improveSpanishText(text) {
        let improved = text.toLowerCase();
        
        // Correcciones comunes en español
        const corrections = {
            // Correcciones de homófonos
            'aver': 'a ver',
            'haber': 'a ver',
            'echo': 'hecho',
            'asta': 'hasta',
            'valla': 'vaya',
            
            // Correcciones técnicas
            'machín learning': 'machine learning',
            'machien learning': 'machine learning',
            'maching learning': 'machine learning',
            'intelijencia artificial': 'inteligencia artificial',
            'inteligencia artififial': 'inteligencia artificial',
            
            // Correcciones de comandos
            'busca': 'buscar',
            'encuentra': 'encontrar',
            'ayúdame': 'ayúdame a',
            'necesito': 'necesito encontrar',
            
            // Correcciones de puntuación hablada
            'punto': '.',
            'coma': ',',
            'pregunta': '?',
            'exclamación': '!',
            'dos puntos': ':',
            'punto y coma': ';',
            
            // Números hablados
            'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5',
            'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10'
        };
        
        // Aplicar correcciones
        Object.keys(corrections).forEach(wrong => {
            const regex = new RegExp('\\b' + wrong + '\\b', 'gi');
            improved = improved.replace(regex, corrections[wrong]);
        });
        
        // Mejorar capitalización
        improved = this.improveCapitalization(improved);
        
        // Limpiar espacios extra
        improved = improved.replace(/\s+/g, ' ').trim();
        
        return improved;
    }

    improveCapitalization(text) {
        // Capitalizar inicio de oraciones
        text = text.replace(/^./, str => str.toUpperCase());
        text = text.replace(/[.!?]\s+./g, str => str.toUpperCase());
        
        // Capitalizar nombres propios comunes en investigación
        const properNouns = [
            'Python', 'JavaScript', 'React', 'Node.js', 'GitHub',
            'Google', 'Microsoft', 'Amazon', 'IBM', 'OpenAI',
            'Universidad', 'Instituto', 'Departamento'
        ];
        
        properNouns.forEach(noun => {
            const regex = new RegExp('\\b' + noun.toLowerCase() + '\\b', 'gi');
            text = text.replace(regex, noun);
        });
        
        return text;
    }

    // Método para entrenar el reconocimiento con frases específicas
    trainWithPhrases(additionalPhrases = []) {
        this.spanishPhrases.push(...additionalPhrases);
        this.setupGrammar();
    }

    // Método para obtener sugerencias de texto basadas en contexto
    getContextualSuggestions(partialText) {
        const suggestions = [];
        const lowerText = partialText.toLowerCase();
        
        // Buscar coincidencias en frases comunes
        this.spanishPhrases.forEach(phrase => {
            if (phrase.toLowerCase().startsWith(lowerText)) {
                suggestions.push(phrase);
            }
        });
        
        // Buscar coincidencias parciales
        this.spanishPhrases.forEach(phrase => {
            if (phrase.toLowerCase().includes(lowerText) && !suggestions.includes(phrase)) {
                suggestions.push(phrase);
            }
        });
        
        return suggestions.slice(0, 5); // Máximo 5 sugerencias
    }

    // Configurar comandos de voz específicos
    setupVoiceCommands() {
        const commands = {
            'buscar investigador': () => {
                this.executeCommand('¿Qué investigadores trabajan en inteligencia artificial?');
            },
            'buscar artículo': () => {
                this.executeCommand('Recomiéndame artículos sobre machine learning');
            },
            'ayuda': () => {
                this.executeCommand('¿Cómo puedes ayudarme?');
            },
            'limpiar chat': () => {
                if (window.alejandria) {
                    window.alejandria.clearChat();
                }
            },
            'configuración': () => {
                if (window.alejandria) {
                    window.alejandria.openSettings();
                }
            }
        };
        
        return commands;
    }

    executeCommand(text) {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = text;
            if (window.alejandria) {
                window.alejandria.sendMessage(text);
            }
        }
    }

    // Método para detectar y corregir errores comunes
    detectAndCorrectErrors(text) {
        const errorPatterns = [
            // Detectar posibles errores de reconocimiento
            {
                pattern: /\b\w{1,2}\b/g, // Palabras muy cortas que podrían ser errores
                correction: (match) => {
                    const corrections = {
                        'q': 'que', 'k': 'que', 'x': 'por',
                        'n': 'en', 'd': 'de', 'p': 'para'
                    };
                    return corrections[match.toLowerCase()] || match;
                }
            }
        ];
        
        let corrected = text;
        errorPatterns.forEach(({ pattern, correction }) => {
            corrected = corrected.replace(pattern, correction);
        });
        
        return corrected;
    }
}

    // Inicializar configuración de voz cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.voiceConfig = new VoiceConfiguration();
    
    // Esperar a que speechHandler esté disponible
    const initializeVoiceEnhancements = () => {
        if (window.speechHandler) {
            // Mejorar el speechHandler existente
            window.voiceConfig.enhanceSpeechHandler();
            console.log('✅ Voice enhancements initialized');
        } else {
            // Reintentar en 100ms
            setTimeout(initializeVoiceEnhancements, 100);
        }
    };
    
    initializeVoiceEnhancements();
});

// Método para mejorar el speechHandler existente
VoiceConfiguration.prototype.enhanceSpeechHandler = function() {
    if (!window.speechHandler) return;
    
    // Sobrescribir el método de limpieza de texto
    const originalCleanTranscript = window.speechHandler.cleanTranscript;
    window.speechHandler.cleanTranscript = (text) => {
        // Aplicar nuestras mejoras primero
        let enhanced = this.improveSpanishText(text);
        enhanced = this.detectAndCorrectErrors(enhanced);
        
        // Luego aplicar la limpieza original
        return originalCleanTranscript.call(window.speechHandler, enhanced);
    };
    
    // Mejorar la configuración del recognition
    if (window.speechHandler.recognition) {
        const recognition = window.speechHandler.recognition;
        
        // Configuraciones adicionales para mejor reconocimiento en español
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5; // Más alternativas para mejor precisión
        
        // Configurar gramática si está disponible
        this.setupGrammar();
        
        // Agregar manejo de comandos de voz
        const originalOnResult = recognition.onresult;
        recognition.onresult = (event) => {
            // Procesar comandos de voz
            this.processVoiceCommands(event);
            // Ejecutar el handler original
            if (originalOnResult) {
                originalOnResult.call(recognition, event);
            }
        };
    }
    
    // Agregar sugerencias de autocompletado
    this.setupAutoSuggestions();
};

// Método para procesar comandos de voz específicos
VoiceConfiguration.prototype.processVoiceCommands = function(event) {
    const commands = this.setupVoiceCommands();
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            
            // Buscar coincidencias exactas
            if (commands[transcript]) {
                event.preventDefault?.();
                commands[transcript]();
                return;
            }
            
            // Buscar coincidencias parciales
            Object.keys(commands).forEach(command => {
                if (transcript.includes(command)) {
                    event.preventDefault?.();
                    commands[command]();
                    return;
                }
            });
        }
    }
};

// Método para configurar sugerencias automáticas
VoiceConfiguration.prototype.setupAutoSuggestions = function() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    
    let suggestionContainer = null;
    
    const showSuggestions = (suggestions) => {
        this.hideSuggestions();
        
        if (suggestions.length === 0) return;
        
        suggestionContainer = document.createElement('div');
        suggestionContainer.className = 'voice-suggestions';
        suggestionContainer.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
        `;
        
        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            item.style.cssText = `
                padding: 0.75rem 1rem;
                cursor: pointer;
                border-bottom: 1px solid var(--border-color);
                transition: background-color 0.2s ease;
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = 'var(--bg-tertiary)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
            });
            
            item.addEventListener('click', () => {
                messageInput.value = suggestion;
                this.hideSuggestions();
                messageInput.focus();
                // Enviar automáticamente si es un comando
                if (this.setupVoiceCommands()[suggestion]) {
                    setTimeout(() => {
                        if (window.alejandria) {
                            window.alejandria.sendMessage();
                        }
                    }, 100);
                }
            });
            
            suggestionContainer.appendChild(item);
        });
        
        const inputWrapper = messageInput.closest('.input-wrapper');
        if (inputWrapper) {
            inputWrapper.style.position = 'relative';
            inputWrapper.appendChild(suggestionContainer);
        }
    };
    
    this.hideSuggestions = () => {
        if (suggestionContainer) {
            suggestionContainer.remove();
            suggestionContainer = null;
        }
    };
    
    // Evento para mostrar sugerencias mientras se escribe
    messageInput.addEventListener('input', (e) => {
        const text = e.target.value.trim();
        if (text.length > 2) {
            const suggestions = this.getContextualSuggestions(text);
            showSuggestions(suggestions);
        } else {
            this.hideSuggestions();
        }
    });
    
    // Ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!messageInput.contains(e.target) && !suggestionContainer?.contains(e.target)) {
            this.hideSuggestions();
        }
    });
    
    // Manejar teclas de navegación
    messageInput.addEventListener('keydown', (e) => {
        if (suggestionContainer) {
            const items = suggestionContainer.querySelectorAll('.suggestion-item');
            let selectedIndex = Array.from(items).findIndex(item => 
                item.style.backgroundColor === 'var(--bg-tertiary)'
            );
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = (selectedIndex + 1) % items.length;
                    this.highlightSuggestion(items, selectedIndex);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
                    this.highlightSuggestion(items, selectedIndex);
                    break;
                case 'Enter':
                    if (selectedIndex >= 0) {
                        e.preventDefault();
                        items[selectedIndex].click();
                    }
                    break;
                case 'Escape':
                    this.hideSuggestions();
                    break;
            }
        }
    });
};

// Método auxiliar para resaltar sugerencias
VoiceConfiguration.prototype.highlightSuggestion = function(items, index) {
    items.forEach((item, i) => {
        item.style.backgroundColor = i === index ? 'var(--bg-tertiary)' : 'transparent';
    });
};

// Método para diagnosticar problemas de reconocimiento de voz
VoiceConfiguration.prototype.diagnoseVoiceIssues = function() {
    const issues = [];
    const recommendations = [];
    
    // Verificar soporte del navegador
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        issues.push('El navegador no soporta reconocimiento de voz');
        recommendations.push('Usa Chrome, Edge o Safari para mejor compatibilidad');
    }
    
    // Verificar permisos de micrófono
    navigator.permissions?.query({name: 'microphone'}).then(permission => {
        if (permission.state === 'denied') {
            issues.push('Permisos de micrófono denegados');
            recommendations.push('Permite el acceso al micrófono en la configuración del navegador');
        }
    });
    
    // Verificar conexión a internet
    if (!navigator.onLine) {
        issues.push('Sin conexión a internet');
        recommendations.push('El reconocimiento de voz requiere conexión a internet');
    }
    
    // Verificar idioma del sistema
    const systemLang = navigator.language || navigator.userLanguage;
    if (!systemLang.startsWith('es')) {
        recommendations.push('Considera cambiar el idioma del sistema a español para mejor reconocimiento');
    }
    
    return { issues, recommendations };
};

// Exportar la clase para uso global
window.VoiceConfiguration = VoiceConfiguration;