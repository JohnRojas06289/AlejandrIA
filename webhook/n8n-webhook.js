const n8nFunctionNode = `
// Get the webhook data
const webhookData = items[0].json;

// Extract the message and context
const userMessage = webhookData.message;
const conversationContext = webhookData.context || [];
const sessionId = webhookData.sessionId;
const timestamp = webhookData.timestamp;

// Prepare the prompt for GPT-4
const systemPrompt = \`Eres AlejandrIA, un asistente inteligente especializado en ayudar a investigadores universitarios. 
Tu objetivo es:
1. Ayudar a encontrar otros investigadores en áreas específicas
2. Recomendar artículos de investigación relevantes
3. Conectar personas con intereses de investigación similares
4. Proporcionar información sobre proyectos de investigación en la universidad

Mantén un tono profesional pero amigable. Proporciona información específica y útil.
Si no tienes información sobre algo específico, sugiere alternativas o pide más detalles.\`;

// Build the messages array for GPT-4
const messages = [
    {
        role: "system",
        content: systemPrompt
    }
];

// Add conversation context
conversationContext.forEach(msg => {
    messages.push({
        role: msg.role,
        content: msg.content
    });
});

// Add the current user message
messages.push({
    role: "user",
    content: userMessage
});

// Return the prepared data for the next node
return {
    json: {
        messages: messages,
        sessionId: sessionId,
        timestamp: timestamp,
        originalMessage: userMessage
    }
};
`;

// Example n8n HTTP Request Node Configuration for OpenAI
const openAIConfiguration = {
    method: "POST",
    url: "https://api.openai.com/v1/chat/completions",
    authentication: "predefinedCredentialType",
    nodeCredentialType: "openAiApi",
    sendHeaders: true,
    headerParameters: {
        parameters: [
            {
                name: "Content-Type",
                value: "application/json"
            }
        ]
    },
    sendBody: true,
    bodyContentType: "json",
    requestBody: `{
        "model": "gpt-4",
        "messages": {{$json["messages"]}},
        "temperature": 0.7,
        "max_tokens": 1000,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0
    }`
};

// Example n8n Function Node to format the response
const formatResponseNode = `
// Get the OpenAI response
const openAIResponse = items[0].json;
const assistantMessage = openAIResponse.choices[0].message.content;

// Get the original webhook data
const webhookData = items[0].json;

// Format the response for the frontend
return {
    json: {
        response: assistantMessage,
        sessionId: webhookData.sessionId,
        timestamp: new Date().toISOString(),
        usage: openAIResponse.usage
    }
};
`;

// Example complete n8n workflow structure
const workflowStructure = {
    nodes: [
        {
            name: "Webhook",
            type: "n8n-nodes-base.webhook",
            position: [250, 300],
            parameters: {
                httpMethod: "POST",
                path: "/alejandria-chat",
                responseMode: "lastNode",
                responseData: "firstEntryJson"
            }
        },
        {
            name: "Prepare GPT-4 Request",
            type: "n8n-nodes-base.function",
            position: [450, 300],
            parameters: {
                functionCode: n8nFunctionNode
            }
        },
        {
            name: "OpenAI GPT-4",
            type: "n8n-nodes-base.httpRequest",
            position: [650, 300],
            parameters: openAIConfiguration
        },
        {
            name: "Format Response",
            type: "n8n-nodes-base.function",
            position: [850, 300],
            parameters: {
                functionCode: formatResponseNode
            }
        }
    ],
    connections: {
        "Webhook": {
            "main": [
                [
                    {
                        "node": "Prepare GPT-4 Request",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Prepare GPT-4 Request": {
            "main": [
                [
                    {
                        "node": "OpenAI GPT-4",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "OpenAI GPT-4": {
            "main": [
                [
                    {
                        "node": "Format Response",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        }
    }
};

/**
 * Additional n8n Nodes you might want to add:
 * 
 * 1. Database Node: Store conversation history
 * 2. Elasticsearch Node: Search through research papers
 * 3. Email Node: Send notifications about new connections
 * 4. Slack/Discord Node: Notify research groups
 * 5. Google Sheets Node: Track researcher database
 */

// Example error handling node
const errorHandlingNode = `
// Check if there was an error
const error = items[0].json.error;

if (error) {
    return {
        json: {
            response: "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.",
            error: true,
            errorMessage: error.message || "Unknown error",
            sessionId: items[0].json.sessionId,
            timestamp: new Date().toISOString()
        }
    };
}

// If no error, pass through
return items;
`;

// Example integration with research database
const researchDatabaseQuery = `
// Example of querying a research database
const searchTerm = items[0].json.searchTerm;
const field = items[0].json.field;

// This would connect to your university's research database
// For example, using a SQL query:
const query = \`
    SELECT 
        r.name,
        r.email,
        r.department,
        r.research_interests,
        r.recent_publications
    FROM researchers r
    WHERE r.research_interests LIKE '%\${searchTerm}%'
    OR r.department = '\${field}'
    ORDER BY r.citation_count DESC
    LIMIT 10
\`;

// Return the query for the next database node
return {
    json: {
        query: query,
        originalRequest: items[0].json
    }
};
`;

// Export the configuration for reference
module.exports = {
    workflowStructure,
    n8nFunctionNode,
    openAIConfiguration,
    formatResponseNode,
    errorHandlingNode,
    researchDatabaseQuery
};