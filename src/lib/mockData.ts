import { OSINTCase, Entity, Relationship, TimelineEvent, Insight, AIAnalysis } from '@/types';

export const mockEntities: Entity[] = [
  {
    id: 'e1',
    type: 'person',
    value: 'John Smith',
    confidence: 0.95,
    sources: ['social_media', 'public_records'],
    mentions: 12
  },
  {
    id: 'e2',
    type: 'email',
    value: 'john.smith@email.com',
    confidence: 0.88,
    sources: ['document_analysis'],
    mentions: 3
  },
  {
    id: 'e3',
    type: 'phone',
    value: '+1-555-0123',
    confidence: 0.92,
    sources: ['contact_info'],
    mentions: 5
  },
  {
    id: 'e4',
    type: 'location',
    value: 'New York, NY',
    confidence: 0.78,
    sources: ['geolocation', 'social_media'],
    mentions: 8
  },
  {
    id: 'e5',
    type: 'username',
    value: '@johnsmith_ny',
    confidence: 0.85,
    sources: ['social_media'],
    mentions: 15
  }
];

export const mockRelationships: Relationship[] = [
  {
    id: 'r1',
    source: 'e1',
    target: 'e2',
    type: 'owns',
    confidence: 0.9,
    evidence: ['Email signature', 'Contact form']
  },
  {
    id: 'r2',
    source: 'e1',
    target: 'e3',
    type: 'uses',
    confidence: 0.85,
    evidence: ['Directory listing', 'Business card']
  },
  {
    id: 'r3',
    source: 'e1',
    target: 'e4',
    type: 'located_in',
    confidence: 0.75,
    evidence: ['Social media posts', 'Geotags']
  }
];

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 't1',
    date: new Date('2024-01-15'),
    title: 'Social Media Account Created',
    description: 'Subject created Twitter account @johnsmith_ny',
    source: 'Twitter API',
    type: 'social',
    entities: ['e1', 'e5']
  },
  {
    id: 't2',
    date: new Date('2024-02-20'),
    title: 'Business Registration',
    description: 'Registered Smith Consulting LLC in New York',
    source: 'State Business Registry',
    type: 'document',
    entities: ['e1', 'e4']
  },
  {
    id: 't3',
    date: new Date('2024-03-10'),
    title: 'Professional Network Activity',
    description: 'Updated LinkedIn profile with new business information',
    source: 'LinkedIn',
    type: 'social',
    entities: ['e1', 'e2']
  }
];

export const mockInsights: Insight[] = [
  {
    id: 'i1',
    type: 'pattern',
    title: 'Consistent Digital Footprint',
    description: 'Subject maintains consistent identity across multiple platforms with no significant discrepancies in personal information.',
    confidence: 0.92,
    impact: 'low',
    evidence: ['Social media profiles', 'Public records', 'Business registrations'],
    recommendations: ['Verify business legitimacy', 'Cross-reference with additional sources']
  },
  {
    id: 'i2',
    type: 'anomaly',
    title: 'Recent Business Activity',
    description: 'Significant increase in business-related social media activity starting February 2024, coinciding with LLC registration.',
    confidence: 0.78,
    impact: 'medium',
    evidence: ['Social media timeline', 'Business records'],
    recommendations: ['Investigate business operations', 'Check for related entities']
  },
  {
    id: 'i3',
    type: 'verification',
    title: 'Identity Verification Status',
    description: 'Subject identity appears legitimate with consistent information across verified sources.',
    confidence: 0.88,
    impact: 'low',
    evidence: ['Government records', 'Professional networks'],
    recommendations: ['Confirm with additional verification methods']
  }
];

export const mockAIAnalysis: AIAnalysis = {
  entities: mockEntities,
  relationships: mockRelationships,
  timeline: mockTimelineEvents,
  insights: mockInsights,
  riskScore: 2.3,
  confidence: 0.86,
  processedAt: new Date()
};

// Mock Gemini API simulation
export const simulateGeminiAnalysis = async (content: string, files: File[]): Promise<AIAnalysis> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Return mock analysis with some randomization
  const randomConfidence = 0.75 + Math.random() * 0.2;
  const randomRiskScore = Math.random() * 5 + 1;
  
  return {
    ...mockAIAnalysis,
    confidence: randomConfidence,
    riskScore: randomRiskScore,
    processedAt: new Date()
  };
};

export const generateMockReport = (caseData: Partial<OSINTCase>) => {
  return {
    id: 'report-' + Date.now(),
    caseId: caseData.id || 'unknown',
    sections: [
      {
        id: 'exec-summary',
        type: 'executive_summary' as const,
        title: 'Executive Summary',
        content: `This investigation focused on ${caseData.subject || 'the subject'} and utilized multiple OSINT sources to compile a comprehensive profile. Through AI-powered analysis of uploaded materials and cross-referenced public information, we identified ${mockEntities.length} key entities and ${mockRelationships.length} significant relationships. The overall risk assessment indicates a ${mockAIAnalysis.riskScore < 3 ? 'low' : mockAIAnalysis.riskScore < 4 ? 'medium' : 'high'} risk profile with ${Math.round(mockAIAnalysis.confidence * 100)}% confidence in our findings.`,
        order: 1,
        editable: true
      },
      {
        id: 'subject-profile',
        type: 'subject_profile' as const,
        title: 'Subject Profile',
        content: `**Primary Identity:** ${mockEntities.find(e => e.type === 'person')?.value || 'Unknown'}\n\n**Contact Information:**\n- Email: ${mockEntities.find(e => e.type === 'email')?.value || 'Not found'}\n- Phone: ${mockEntities.find(e => e.type === 'phone')?.value || 'Not found'}\n\n**Location:** ${mockEntities.find(e => e.type === 'location')?.value || 'Unknown'}\n\n**Online Presence:** Active across multiple social media platforms with consistent identity markers.`,
        order: 2,
        editable: true
      },
      {
        id: 'key-findings',
        type: 'key_findings' as const,
        title: 'Key Findings',
        content: mockInsights.map(insight => 
          `**${insight.title}** (${insight.impact.toUpperCase()} IMPACT)\n${insight.description}\n\nRecommendations: ${insight.recommendations.join(', ')}`
        ).join('\n\n'),
        order: 3,
        editable: true
      },
      {
        id: 'timeline',
        type: 'timeline' as const,
        title: 'Timeline of Events',
        content: mockTimelineEvents.map(event => 
          `**${event.date.toLocaleDateString()}** - ${event.title}\n${event.description}\nSource: ${event.source}`
        ).join('\n\n'),
        order: 4,
        editable: true
      },
      {
        id: 'ai-insights',
        type: 'ai_insights' as const,
        title: 'AI Analysis Insights',
        content: `**Analysis Confidence:** ${Math.round(mockAIAnalysis.confidence * 100)}%\n**Risk Score:** ${mockAIAnalysis.riskScore.toFixed(1)}/5.0\n**Entities Identified:** ${mockEntities.length}\n**Relationships Mapped:** ${mockRelationships.length}\n\n**Key Patterns Detected:**\n${mockInsights.filter(i => i.type === 'pattern').map(i => `- ${i.title}: ${i.description}`).join('\n')}`,
        order: 5,
        editable: true
      }
    ],
    metadata: {
      title: `OSINT Report - ${caseData.subject || 'Investigation'}`,
      investigator: 'System Generated',
      caseNumber: caseData.id || 'CASE-' + Date.now(),
      dateGenerated: new Date(),
      confidentialityLevel: 'confidential' as const,
      pageCount: 0,
      wordCount: 0
    },
    generatedAt: new Date(),
    lastModified: new Date(),
    status: 'draft' as const
  };
};