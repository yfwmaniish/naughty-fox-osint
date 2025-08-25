import { AIAnalysis, Entity, Relationship, TimelineEvent, Insight } from '@/types';

interface GeminiConfig {
  apiKey: string;
  model: string;
  safetySettings: {
    harassment: boolean;
    hateSpeech: boolean;
    sexuallyExplicit: boolean;
    dangerousContent: boolean;
  };
}

class GeminiApiService {
  private config: GeminiConfig | null = null;

  constructor() {
    // Auto-configure with provided API key
    this.config = {
      apiKey: 'YOUR_GEMINI_API_KEY',
      model: 'gemini-pro',
      safetySettings: {
        harassment: true,
        hateSpeech: true,
        sexuallyExplicit: true,
        dangerousContent: true
      }
    };
  }

  setConfig(config: GeminiConfig) {
    this.config = config;
  }

  async analyzeContent(content: string, files: File[]): Promise<AIAnalysis> {
    if (!this.config) {
      throw new Error('Gemini API not configured');
    }

    try {
      // Prepare the content for analysis
      const analysisPrompt = this.buildAnalysisPrompt(content, files);
      
      // Call Gemini API with retry logic
      let response;
      let retries = 3;
      
      while (retries > 0) {
        try {
          response = await this.callGeminiApi(analysisPrompt);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
        }
      }
      
      // Parse and structure the response
      return this.parseGeminiResponse(response);
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Return fallback analysis with error indication
      return {
        entities: [{
          id: 'error_entity',
          type: 'error',
          value: 'API Analysis Failed',
          confidence: 0,
          sources: ['API Error'],
          mentions: 1
        }],
        relationships: [],
        timeline: [],
        insights: [{
          id: 'error_insight',
          type: 'anomaly',
          title: 'Analysis Error',
          description: `Failed to analyze content: ${error instanceof Error ? error.message : 'Unknown error'}`,
          confidence: 0,
          impact: 'critical',
          evidence: ['API Error Log'],
          recommendations: ['Check API key and connectivity', 'Try again later']
        }],
        riskScore: 0,
        confidence: 0,
        processedAt: new Date()
      };
    }
  }

  private buildAnalysisPrompt(content: string, files: File[]): string {
    const fileDescriptions = files.map(file => 
      `File: ${file.name} (${file.type}, ${this.formatFileSize(file.size)})`
    ).join('\n');

    return `
You are an advanced OSINT (Open Source Intelligence) analyst AI. Analyze the following content and extract structured intelligence data.

CONTENT TO ANALYZE:
${content}

FILES PROVIDED:
${fileDescriptions}

ANALYSIS REQUIREMENTS:
1. ENTITY EXTRACTION: Identify and extract all relevant entities including:
   - Persons (names, aliases, handles)
   - Email addresses
   - Phone numbers
   - Physical locations (addresses, coordinates)
   - Usernames and social media handles
   - Organizations and companies
   - IP addresses and domains
   - URLs and websites

2. RELATIONSHIP MAPPING: Identify relationships between entities:
   - Who knows whom
   - Who works where
   - What belongs to whom
   - Geographic connections
   - Temporal relationships

3. TIMELINE CONSTRUCTION: Create a chronological timeline of events mentioned

4. RISK ASSESSMENT: Evaluate potential risks and assign confidence scores

5. INSIGHTS GENERATION: Provide analytical insights including:
   - Patterns detected
   - Anomalies or inconsistencies
   - Potential security concerns
   - Verification status of information

RESPONSE FORMAT: Provide your analysis in the following JSON structure:
{
  "entities": [
    {
      "id": "unique_id",
      "type": "person|email|phone|location|username|organization|ip|url",
      "value": "extracted_value",
      "confidence": 0.0-1.0,
      "sources": ["source_references"],
      "mentions": number_of_mentions
    }
  ],
  "relationships": [
    {
      "source": "entity_id",
      "target": "entity_id", 
      "type": "relationship_type",
      "confidence": 0.0-1.0,
      "evidence": ["supporting_evidence"]
    }
  ],
  "timeline": [
    {
      "date": "ISO_date",
      "title": "event_title",
      "description": "event_description",
      "source": "data_source",
      "type": "social|document|location|communication|transaction",
      "entities": ["related_entity_ids"]
    }
  ],
  "insights": [
    {
      "type": "pattern|anomaly|connection|risk|verification",
      "title": "insight_title",
      "description": "detailed_description", 
      "confidence": 0.0-1.0,
      "impact": "low|medium|high|critical",
      "evidence": ["supporting_evidence"],
      "recommendations": ["actionable_recommendations"]
    }
  ],
  "riskScore": 0.0-5.0,
  "confidence": 0.0-1.0
}

Ensure all extracted data is accurate, properly sourced, and includes appropriate confidence scores.
`;
  }

  private async callGeminiApi(prompt: string) {
    if (!this.config) {
      throw new Error('API not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          safetySettings: this.buildSafetySettings(),
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 8192,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Unknown error';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorText;
        } catch {
          errorMessage = errorText;
        }
        
        throw new Error(`Gemini API Error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No content generated by Gemini API');
      }
      
      const content = data.candidates[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Empty response from Gemini API');
      }
      
      return content;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - Gemini API took too long to respond');
      }
      
      throw error;
    }
  }

  private buildSafetySettings() {
    if (!this.config) return [];

    const categoryMap = {
      harassment: 'HARM_CATEGORY_HARASSMENT',
      hateSpeech: 'HARM_CATEGORY_HATE_SPEECH', 
      sexuallyExplicit: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      dangerousContent: 'HARM_CATEGORY_DANGEROUS_CONTENT'
    };

    return Object.entries(this.config.safetySettings).map(([key, enabled]) => ({
      category: categoryMap[key as keyof typeof categoryMap],
      threshold: enabled ? 'BLOCK_MEDIUM_AND_ABOVE' : 'BLOCK_NONE'
    }));
  }

  private parseGeminiResponse(response: string): AIAnalysis {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Extract JSON from response (find the largest JSON object)
      const jsonMatches = cleanResponse.match(/\{[\s\S]*\}/g);
      let jsonString = cleanResponse;
      
      if (jsonMatches && jsonMatches.length > 0) {
        // Use the largest JSON object found
        jsonString = jsonMatches.reduce((longest, current) => 
          current.length > longest.length ? current : longest
        );
      }
      
      const parsed = JSON.parse(jsonString);
      
      // Validate and transform the response
      return {
        entities: this.validateEntities(parsed.entities || []),
        relationships: this.validateRelationships(parsed.relationships || []),
        timeline: this.validateTimeline(parsed.timeline || []),
        insights: this.validateInsights(parsed.insights || []),
        riskScore: Math.max(0, Math.min(5, parsed.riskScore || 0)),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        processedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Raw response:', response);
      
      // Return a basic analysis if parsing fails
      return {
        entities: this.extractBasicEntities(response),
        relationships: [],
        timeline: [],
        insights: [{
          id: 'parse_error',
          type: 'anomaly',
          title: 'Response Parsing Issue',
          description: 'The AI provided analysis but in an unexpected format. Basic entity extraction was performed.',
          confidence: 0.3,
          impact: 'medium',
          evidence: ['Response format analysis'],
          recommendations: ['Review raw AI response', 'Try analysis again']
        }],
        riskScore: 1,
        confidence: 0.3,
        processedAt: new Date()
      };
    }
  }

  private extractBasicEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    let idCounter = 1;

    // Email pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    emails.forEach(email => {
      entities.push({
        id: `email_${idCounter++}`,
        type: 'email',
        value: email,
        confidence: 0.9,
        sources: ['Regex extraction'],
        mentions: 1
      });
    });

    // Phone pattern
    const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
    const phones = text.match(phoneRegex) || [];
    phones.forEach(phone => {
      entities.push({
        id: `phone_${idCounter++}`,
        type: 'phone',
        value: phone,
        confidence: 0.8,
        sources: ['Regex extraction'],
        mentions: 1
      });
    });

    // URL pattern
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    urls.forEach(url => {
      entities.push({
        id: `url_${idCounter++}`,
        type: 'url',
        value: url,
        confidence: 0.9,
        sources: ['Regex extraction'],
        mentions: 1
      });
    });

    return entities;
  }

  private validateEntities(entities: any[]): Entity[] {
    return entities.map((entity, index) => ({
      id: entity.id || `entity_${index}`,
      type: entity.type || 'unknown',
      value: entity.value || '',
      confidence: Math.max(0, Math.min(1, entity.confidence || 0)),
      sources: Array.isArray(entity.sources) ? entity.sources : [],
      mentions: Math.max(1, entity.mentions || 1)
    }));
  }

  private validateRelationships(relationships: any[]): Relationship[] {
    return relationships.map((rel, index) => ({
      id: `rel_${index}`,
      source: rel.source || '',
      target: rel.target || '',
      type: rel.type || 'related',
      confidence: Math.max(0, Math.min(1, rel.confidence || 0)),
      evidence: Array.isArray(rel.evidence) ? rel.evidence : []
    }));
  }

  private validateTimeline(timeline: any[]): TimelineEvent[] {
    return timeline.map((event, index) => ({
      id: `timeline_${index}`,
      date: event.date ? new Date(event.date) : new Date(),
      title: event.title || 'Unknown Event',
      description: event.description || '',
      source: event.source || 'Unknown',
      type: event.type || 'document',
      entities: Array.isArray(event.entities) ? event.entities : []
    }));
  }

  private validateInsights(insights: any[]): Insight[] {
    return insights.map((insight, index) => ({
      id: `insight_${index}`,
      type: insight.type || 'pattern',
      title: insight.title || 'Analysis Insight',
      description: insight.description || '',
      confidence: Math.max(0, Math.min(1, insight.confidence || 0)),
      impact: insight.impact || 'low',
      evidence: Array.isArray(insight.evidence) ? insight.evidence : [],
      recommendations: Array.isArray(insight.recommendations) ? insight.recommendations : []
    }));
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('API not configured');
    }

    try {
      const testPrompt = 'Test connection. Please respond with "Connection successful".';
      const response = await this.callGeminiApi(testPrompt);
      return response.toLowerCase().includes('connection successful');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const geminiApi = new GeminiApiService();