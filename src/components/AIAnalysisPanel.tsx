import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  AtSign, 
  Globe, 
  Building,
  AlertTriangle,
  TrendingUp,
  Shield,
  Clock,
  Network
} from 'lucide-react';
import { AIAnalysis, Entity, Relationship, TimelineEvent, Insight } from '@/types';

interface AIAnalysisPanelProps {
  analysis: AIAnalysis | null;
  isAnalyzing: boolean;
}

const getEntityIcon = (type: string) => {
  switch (type) {
    case 'person': return <User className="h-4 w-4" />;
    case 'email': return <Mail className="h-4 w-4" />;
    case 'phone': return <Phone className="h-4 w-4" />;
    case 'location': return <MapPin className="h-4 w-4" />;
    case 'username': return <AtSign className="h-4 w-4" />;
    case 'url': return <Globe className="h-4 w-4" />;
    case 'organization': return <Building className="h-4 w-4" />;
    default: return <Globe className="h-4 w-4" />;
  }
};

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'pattern': return <TrendingUp className="h-4 w-4" />;
    case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
    case 'risk': return <Shield className="h-4 w-4" />;
    case 'connection': return <Network className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getRiskColor = (risk: number) => {
  if (risk <= 2) return 'text-green-600';
  if (risk <= 3.5) return 'text-yellow-600';
  return 'text-red-600';
};

export default function AIAnalysisPanel({ analysis, isAnalyzing }: AIAnalysisPanelProps) {
  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>AI Analysis in Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={33} className="w-full" />
            <div className="text-sm text-gray-600">
              Analyzing uploaded content and extracting entities...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Upload content and run analysis to see AI insights
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          AI Analysis Results
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Confidence: {Math.round(analysis.confidence * 100)}%
            </Badge>
            <Badge variant={analysis.riskScore <= 2 ? 'default' : analysis.riskScore <= 3.5 ? 'secondary' : 'destructive'}>
              Risk: {analysis.riskScore.toFixed(1)}/5.0
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="entities" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="relationships">Relations</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="entities" className="space-y-3">
            <div className="text-sm font-medium">Identified Entities ({analysis.entities.length})</div>
            {analysis.entities.map((entity) => (
              <div key={entity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getEntityIcon(entity.type)}
                  <div>
                    <div className="font-medium">{entity.value}</div>
                    <div className="text-xs text-gray-500 capitalize">{entity.type}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">{entity.mentions} mentions</div>
                  <div className="flex items-center space-x-1">
                    <div className={`h-2 w-8 rounded-full ${getConfidenceColor(entity.confidence)}`}></div>
                    <span className="text-xs">{Math.round(entity.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="relationships" className="space-y-3">
            <div className="text-sm font-medium">Entity Relationships ({analysis.relationships.length})</div>
            {analysis.relationships.map((rel) => {
              const sourceEntity = analysis.entities.find(e => e.id === rel.source);
              const targetEntity = analysis.entities.find(e => e.id === rel.target);
              return (
                <div key={rel.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      {sourceEntity?.value} → {targetEntity?.value}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(rel.confidence * 100)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 capitalize mb-1">
                    Relationship: {rel.type}
                  </div>
                  <div className="text-xs text-gray-500">
                    Evidence: {rel.evidence.join(', ')}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3">
            <div className="text-sm font-medium">Timeline Events ({analysis.timeline.length})</div>
            {analysis.timeline.map((event) => (
              <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-gray-500">
                    {event.date.toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-1">{event.description}</div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs capitalize">
                    {event.type}
                  </Badge>
                  <div className="text-xs text-gray-500">Source: {event.source}</div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="insights" className="space-y-3">
            <div className="text-sm font-medium">AI Insights ({analysis.insights.length})</div>
            {analysis.insights.map((insight) => (
              <Alert key={insight.id} className={insight.impact === 'high' || insight.impact === 'critical' ? 'border-red-200' : ''}>
                <div className="flex items-start space-x-2">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">{insight.title}</div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={insight.impact === 'high' || insight.impact === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.impact.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <AlertDescription className="text-sm">
                      {insight.description}
                    </AlertDescription>
                    {insight.recommendations.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        <strong>Recommendations:</strong> {insight.recommendations.join('; ')}
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}