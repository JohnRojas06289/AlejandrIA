import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        n8nUrl: N8N_WEBHOOK_URL ? 'configured' : 'not configured'
    });
});

// Main proxy endpoint
app.post('/api/alejandria', async (req, res) => {
    try {
        console.log('=== NUEVA SOLICITUD ===');
        console.log('Headers:', req.headers);
        console.log('Body recibido:', JSON.stringify(req.body, null, 2));
        
        if (!N8N_WEBHOOK_URL) {
            console.error('N8N_WEBHOOK_URL no está configurado');
            return res.status(500).json({ 
                error: 'N8N webhook URL not configured',
                details: 'Please set N8N_WEBHOOK_URL in your .env file'
            });
        }

        // Validar el nuevo formato
        const { conversationId, message } = req.body;
        
        if (!conversationId || !message) {
            console.error('Formato de payload inválido');
            return res.status(400).json({
                error: 'Invalid payload format',
                details: 'Required fields: conversationId, message'
            });
        }

        // Preparar payload para n8n con el nuevo formato
        const n8nPayload = {
            conversationId,
            message
        };

        console.log('Enviando a n8n:', N8N_WEBHOOK_URL);
        console.log('Payload para n8n:', JSON.stringify(n8nPayload, null, 2));
        
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'AlejandrIA-Proxy/1.0'
            },
            body: JSON.stringify(n8nPayload)
        });

        console.log('Respuesta de n8n - Status:', response.status);
        console.log('Respuesta de n8n - Headers:', response.headers.raw());

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error de n8n:', errorText);
            return res.status(response.status).json({ 
                error: 'N8N webhook error',
                status: response.status,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('Datos de respuesta de n8n:', JSON.stringify(data, null, 2));
        
        // Adaptar si la respuesta es un array
        let formattedData = data;
        if (Array.isArray(data) && data.length > 0) {
            formattedData = {
                conversationId: data[0].conversation_id || data[0].conversationId,
                reply: data[0].content
            };
        }

        // Verificar que la respuesta tenga el formato esperado
        if (formattedData.conversationId && formattedData.reply) {
            console.log('✅ Respuesta válida recibida de n8n');
            console.log(`📋 Conversation ID: ${formattedData.conversationId}`);
            console.log(`💬 Reply: ${formattedData.reply.substring(0, 100)}...`);
        } else {
            console.warn('⚠️ Formato de respuesta inesperado de n8n:', data);
        }
        
        res.json(formattedData);
        
    } catch (err) {
        console.error('Error en el proxy:', err);
        res.status(500).json({ 
            error: 'Proxy error', 
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: error.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

app.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 Proxy backend iniciado en http://localhost:${PORT}`);
    console.log(`📡 N8N Webhook URL: ${N8N_WEBHOOK_URL || 'NO CONFIGURADO'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log('=================================');
});