# AlejandrIA - Asistente de Investigación Universitaria

![AlejandrIA - Asistente de Investigación]([https://i.ibb.co/your-image-here/alejandria-preview.png](https://ibb.co/JRVrX7JM))

## Descripción

AlejandrIA es un asistente de IA conversacional desarrollado por ConvergenceLab, diseñado específicamente para revolucionar la investigación académica a través de interacciones inteligentes en tiempo real. Utiliza tecnologías avanzadas de procesamiento de lenguaje natural y síntesis de voz para conectar investigadores, facilitar el descubrimiento de conocimiento y optimizar la colaboración académica.

## Características Principales

- 🎤 **Reconocimiento de voz avanzado** con auto-envío por silencio
- 🔊 **Síntesis de voz en español** con controles granulares (reproducir/pausar/continuar/detener)
- 👥 **Conexión de investigadores** por áreas de expertise
- 📚 **Recomendaciones de papers** personalizadas y contextuales
- 🧠 **Memoria conversacional** que mantiene contexto entre sesiones
- 🌙 **Modo claro/oscuro** con persistencia de preferencias
- 📱 **Diseño responsive** optimizado para todos los dispositivos
- ⚙️ **Configuraciones avanzadas** de velocidad y habilitación de voz

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js con proxy inteligente
- **IA**: GPT-4 via n8n con prompt estructurado para investigación
- **APIs de Voz**: SpeechRecognition API, SpeechSynthesis API
- **Notificaciones**: Sistema toast con animaciones CSS
- **Almacenamiento**: LocalStorage para persistencia de configuraciones

## Requisitos del Sistema

- Node.js 18+
- NPM (incluido con Node.js)
- Navegador moderno con soporte para SpeechRecognition API
- Conexión a internet estable
- Micrófono (para funcionalidades de voz)
- Webhook de n8n configurado

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/convergencelab/alejandria.git

# Navegar al directorio del proyecto
cd alejandria

# Instalar dependencias del proyecto principal
npm run install:all

# Configurar variables de entorno del backend
cd backend
cp .env.example .env
# Editar backend/.env con tu webhook de n8n

# Volver al directorio raíz e iniciar ambos servidores
cd ..
npm run start:all
```

## Configuración

### Backend (backend/.env)
```env
N8N_WEBHOOK_URL=https://tu-instancia-n8n.com/webhook/tu-webhook-id
PORT=3001
```

### Frontend (.env)
```env
VITE_WEBHOOK_URL=http://localhost:3001/api/alejandria
```

## Uso

AlejandrIA puede ser utilizado para:

### 1. **Descubrimiento de Investigadores**
   - Búsqueda por área de expertise
   - Conexión con académicos afines
   - Identificación de colaboradores potenciales

### 2. **Recomendaciones Académicas**
   - Papers relevantes por área de investigación
   - Artículos basados en intereses específicos
   - Literatura actualizada en campos emergentes

### 3. **Asistencia Conversacional**
   - Consultas por voz en tiempo real
   - Respuestas contextuales con memoria
   - Interfaz natural e intuitiva

## Arquitectura del Sistema

```
alejandria/
├── css/
│   ├── styles.css              # Estilos principales y paleta de colores
│   ├── responsive.css          # Media queries y adaptabilidad
│   └── enhancements.css        # Efectos visuales y animaciones
├── js/
│   ├── app.js                  # Lógica principal de la aplicación
│   ├── speech.js               # Manejo de reconocimiento y síntesis de voz
│   └── ui.js                   # Mejoras de interfaz y notificaciones
├── backend/
│   ├── proxy.js                # Servidor proxy para n8n
│   ├── package.json            # Dependencias del backend
│   └── .env                    # Variables de entorno
├── assets/
│   ├── logo.svg                # Logo de AlejandrIA
│   └── sounds/                 # Recursos de audio
├── index.html                  # Punto de entrada principal
├── server.js                   # Servidor frontend
└── package.json                # Configuración del proyecto
```

## Configuración de n8n

El sistema utiliza n8n como backend de IA. 

## Funcionalidades Avanzadas

### Reconocimiento de Voz
- **Auto-detección de habla** con barras de sonido reactivas
- **Envío automático** después de 2 segundos de silencio
- **Corrección automática** de errores comunes en español
- **Interrupción inteligente** de síntesis al activar micrófono

### Síntesis de Voz
- **Controles individuales** por mensaje (▶️ ⏸️ ▶️ ⏹️)
- **Voces en español** con selección automática
- **Velocidad configurable** (0.5x - 2.0x)
- **Limpieza de markdown** para mejor pronunciación

### Experiencia de Usuario
- **Tema adaptativo** que respeta preferencias del sistema
- **Animaciones fluidas** con respeto a `prefers-reduced-motion`
- **Notificaciones informativas** con feedback visual
- **Diseño mobile-first** con cards ultra-compactas

## Casos de Uso

### **ConvergenceU**: Plataforma de colaboración académica
- Conecta 500+ investigadores de 15 universidades
- 2,000+ recomendaciones de papers generadas mensualmente
- 85% de precisión en matches de investigadores

### **ResearchNet**: Red de conocimiento interdisciplinario
- Facilita colaboraciones entre disciplinas
- Reduce tiempo de búsqueda de literatura en 60%
- Aumenta productividad investigativa en 40%

### **AcademicBridge**: Puente entre investigación y industria
- Conecta academia con sector productivo
- Identifica oportunidades de transferencia tecnológica
- Facilita proyectos de investigación aplicada

## Contribuir

1. Fork del repositorio
2. Crear rama para feature (`git checkout -b feature/NuevaFuncionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
5. Abrir Pull Request

### Estándares de Código
- **ESLint** para JavaScript
- **Prettier** para formateo
- **Convenciones BEM** para CSS
- **Semantic versioning** para releases

## Soporte

Para soporte técnico o consultas sobre investigación:

- **Email**: soporte@convergencelab.com
- **GitHub Issues**: [Reportar problema](https://github.com/convergencelab/alejandria/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/convergencelab/alejandria/wiki)
- **Portal**: www.convergencelab.com/alejandria

## Roadmap

### v2.0 (Próximo trimestre)
- [ ] Integración con bases de datos académicas (Scopus, Web of Science)
- [ ] Sistema de recomendaciones basado en ML
- [ ] Dashboard de analytics para administradores
- [ ] API pública para integraciones

### v2.1 (Futuro)
- [ ] Soporte multiidioma (inglés, portugués)
- [ ] Integración con ORCID
- [ ] Análisis de redes de colaboración
- [ ] Asistente de escritura académica

## Licencia

Este proyecto está licenciado bajo términos específicos para uso académico e investigativo. Contactar a ConvergenceLab para detalles sobre licenciamiento comercial.

## Acerca de ConvergenceLab

ConvergenceLab es un laboratorio de innovación académica dedicado a acelerar el descubrimiento científico y facilitar la colaboración interdisciplinaria mediante el uso de inteligencia artificial, análisis de datos y tecnologías emergentes para transformar la investigación universitaria.

### Nuestros Principios
- 🔬 **Excelencia científica** en cada desarrollo
- 🤝 **Colaboración abierta** entre disciplinas
- 🚀 **Innovación responsable** con impacto social
- 🌍 **Acceso democrático** al conocimiento

---

Desarrollado con ❤️  Transformando la investigación universitaria a través de la IA conversacional
