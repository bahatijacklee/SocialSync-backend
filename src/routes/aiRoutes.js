const express = require('express');
const router = express.Router();
const { generateContent, analyzeSentiment } = require('../services/geminiService');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Generate social media post
router.post('/generate-post', async (req, res) => {
    try {
        const { topic, tone, platform, length } = req.body;
        
        // Construct the prompt for Gemini
        const prompt = `Generate a ${tone} social media post for ${platform} about ${topic}. \n\nThe post should be approximately ${length} words long. \n\nInclude relevant hashtags if appropriate for the platform.`;

        const generatedContent = await generateContent(prompt);
        
        res.json({ 
            success: true, 
            content: generatedContent 
        });
    } catch (error) {
        console.error('Error generating post:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate post' 
        });
    }
});

// AI Chat Assistant
router.post('/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        // Construct the prompt for Gemini
        const prompt = `As a social media assistant, help with the following: ${message}\n\nContext: ${context || 'General social media assistance'}`;

        const response = await generateContent(prompt);
        
        res.json({ 
            success: true, 
            response: response 
        });
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process chat message' 
        });
    }
});

// Analyze sentiment of text
router.post('/analyze-sentiment', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: 'Text is required for sentiment analysis.' });
        }

        const sentimentResult = await analyzeSentiment(text);

        res.json({
            success: true,
            sentiment: sentimentResult // Gemini will return the formatted sentiment string
        });
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to analyze sentiment' 
        });
    }
});

// Temporary route to list available Gemini models
// router.get('/list-models', async (req, res) => {
//     if (!API_KEY) {
//         return res.status(500).json({ error: "GEMINI_API_KEY is not set." });
//     }
//     try {
//         const { models } = await genAI.listModels();
//         res.json(models.map(model => ({
//             name: model.name,
//             supportedGenerationMethods: model.supportedGenerationMethods,
//             version: model.version
//         })));
//     } catch (error) {
//         console.error("Error listing models:", error);
//         res.status(500).json({ error: "Failed to list models." });
//     }
// });

module.exports = router; 