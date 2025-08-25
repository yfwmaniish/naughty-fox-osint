import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAnalysis } from '@/types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Gemini API key not found. AI analysis will be disabled.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface OSINTAnalysisRequest {
  investigationNotes: string;
  caseName: string;
  subject: string;
  description: string;
}

export async function analyzeWithGemini(request: OSINTAnalysisRequest): Promise<AIAnalysis> {
  if (!genAI) {
    throw new Error('Gemini AI is not configured. Please check your API key.');
  }

  try {
    // Use the most commonly available model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
    
    console.log('🤖 Using Gemini model: gemini-1.5-flash');
    console.log('🔑 API Key (first 10 chars):', API_KEY?.substring(0, 10) + '...');

    const prompt = `
You are a professional OSINT (Open Source Intelligence) analyst. Analyze the following investigation data and provide structured intelligence insights.

CASE DETAILS:
- Case Name: ${request.caseName || 'Unnamed Case'}
- Subject: ${request.subject || 'Unknown Subject'}
- Description: ${request.description || 'No description provided'}

INVESTIGATION NOTES:
${request.investigationNotes}

Please analyze this information and provide a comprehensive OSINT analysis in the following JSON format:

{
  "entities": [
    {
      "id": "unique_id",
      "type": "person|location|organization|phone|email|username|website|ip_address|other",
      "value": "entity_value",
      "confidence": 0.0-1.0,
      "sources": ["source1", "source2"],
      "mentions": number_of_mentions
    }
  ],
  "relationships": [
    {
      "id": "unique_id",
      "source": "entity_id",
      "target": "entity_id", 
      "type": "relationship_type",
      "confidence": 0.0-1.0,
      "evidence": ["evidence1", "evidence2"]
    }
  ],
  "timeline": [
    {
      "id": "unique_id",
      "date": "ISO_date_string",
      "title": "event_title",
      "description": "event_description",
      "source": "source_of_information",
      "type": "social|financial|legal|communication|travel|other",
      "entities": ["entity_id1", "entity_id2"]
    }
  ],
  "insights": [
    {
      "id": "unique_id",
      "type": "pattern|anomaly|risk|recommendation|summary",
      "title": "insight_title",
      "description": "detailed_description",
      "confidence": 0.0-1.0,
      "impact": "low|medium|high|critical",
      "evidence": ["evidence1", "evidence2"],
      "recommendations": ["recommendation1", "recommendation2"]
    }
  ],
  "riskScore": 0.0-1.0,
  "confidence": 0.0-1.0,
  "processedAt": "current_ISO_date"
}

Focus on:
1. Extracting named entities (people, places, organizations, contacts)
2. Identifying relationships between entities
3. Creating a timeline of events if temporal information is available
4. Providing intelligence insights, patterns, and recommendations
5. Assessing overall risk and confidence levels

Be thorough but only include information that can be reasonably inferred from the provided data. If information is limited, reflect that in lower confidence scores.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response - no valid JSON found');
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    // Validate and structure the response
    const analysis: AIAnalysis = {
      entities: analysisData.entities || [],
      relationships: analysisData.relationships || [],
      timeline: analysisData.timeline?.map((item: any) => ({
        ...item,
        date: new Date(item.date || new Date())
      })) || [],
      insights: analysisData.insights || [],
      riskScore: Math.min(Math.max(analysisData.riskScore || 0, 0), 1),
      confidence: Math.min(Math.max(analysisData.confidence || 0, 0), 1),
      processedAt: new Date()
    };

    return analysis;
  } catch (error) {
    console.error('Gemini AI analysis error:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function isGeminiConfigured(): boolean {
  return !!API_KEY && !!genAI;
}
