const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = 5001; //might have to change to 5000 based on device 

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const system_prompt = `
You are an AI security analyst named "Contracto AI". Your task is to analyze the provided document text for potential security and privacy risks. You MUST respond with a valid JSON object and nothing else. Do not add any text before or after the JSON object.

The JSON object you return MUST have the following exact structure:
{
  "overallRisk": "...",
  "risks": [
    {
      "category": "...",
      "severity": "...",
      "score": 0,
      "description": "..."
    }
  ],
  "summary": "...",
  "helpfulSchemes": [
    {
        "name": "...",
        "description": "...",
        "link": "..."
    }
  ]
}

Follow these instructions with extreme precision:
1.  **Analyze Risks:** Generate the 'overallRisk', 'risks' array, and 'summary' as instructed previously.
2.  **Suggest Schemes:** Identify 2-3 relevant Indian government schemes (especially for Karnataka) based on the contract's context. Populate the 'helpfulSchemes' array with a name, description, and a real, valid URL for each. If none are found, this array should be empty [].
`;
// used the groq API key as gemini stopped working 
const LLM_API_KEY = "enter API key here";
const LLM_API_URL = "https://api.groq.com/openai/v1/chat/completions";

app.post('/analyze', async (req, res) => {
    const { document_text } = req.body;

    if (!document_text) {
        return res.status(400).json({ error: 'Document text is required.' });
    }
    console.log('Received document for analysis...');

    const payload = {
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: document_text }
        ],
        temperature: 0.2
    };

    try {
        console.log('Sending request to AI model...');
        const apiResponse = await fetch(LLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LLM_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            throw new Error(`AI API call failed with status ${apiResponse.status}: ${errorBody}`);
        }

        const result = await apiResponse.json();
        const responseText = result.choices?.[0]?.message?.content;

        if (responseText) {
            console.log('Successfully received analysis from AI.');
            res.setHeader('Content-Type', 'application/json');
            res.send(responseText);
        } else {
            throw new Error('Failed to get a valid response from the AI.');
        }
    } catch (error) {
        console.error('Error in /analyze route:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

app.listen(port, () => {
  console.log(`✅ Node.js server is running and listening on http://localhost:${port}`);
});
