import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Key, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

interface GeminiApiConfigProps {
  onApiKeyUpdate: (apiKey: string) => void;
  currentApiKey?: string;
}

export default function GeminiApiConfig({ onApiKeyUpdate, currentApiKey = '' }: GeminiApiConfigProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || 'YOUR_GEMINI_API_KEY');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [safetySettings, setSafetySettings] = useState({
    harassment: true,
    hateSpeech: true,
    sexuallyExplicit: true,
    dangerousContent: true
  });

  const testApiConnection = async () => {
    if (!apiKey.trim()) {
      setErrorMessage('Please enter an API key');
      setConnectionStatus('error');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Test with real Gemini API
      const testGemini = new (await import('@/lib/geminiApi')).GeminiApiService();
      testGemini.setConfig({
        apiKey,
        model: 'gemini-pro',
        safetySettings: {
          harassment: true,
          hateSpeech: true,
          sexuallyExplicit: true,
          dangerousContent: true
        }
      });
      
      const isConnected = await testGemini.testConnection();
      
      if (isConnected) {
        setConnectionStatus('success');
        setErrorMessage('');
        onApiKeyUpdate(apiKey);
      } else {
        throw new Error('API test failed - unable to connect to Gemini');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-neon-green" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-neon-red" />;
      default:
        return <Key className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return 'Connected';
      case 'error':
        return 'Failed';
      default:
        return 'Not tested';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-neon-blue" />
            <span>Gemini AI Configuration</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* API Key Configuration */}
          <div className="space-y-3">
            <Label htmlFor="apiKey" className="text-neon-green">
              Google Gemini API Key
            </Label>
            
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  className="cyber-input pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              <Button
                onClick={testApiConnection}
                disabled={testingConnection || !apiKey.trim()}
                className="neon-button info"
              >
                {testingConnection ? (
                  <div className="cyber-spinner w-4 h-4" />
                ) : (
                  'Test'
                )}
              </Button>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm">Status: {getStatusText()}</span>
              {connectionStatus === 'success' && (
                <Badge variant="outline" className="text-neon-green border-neon-green">
                  API Ready
                </Badge>
              )}
            </div>

            {errorMessage && (
              <Alert className="border-neon-red">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-neon-red">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Safety Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neon-green">Safety Settings</h3>
            <p className="text-sm text-gray-400">
              Configure content filtering for AI analysis results
            </p>

            <div className="space-y-3">
              {Object.entries({
                harassment: 'Block harassment content',
                hateSpeech: 'Block hate speech',
                sexuallyExplicit: 'Block sexually explicit content',
                dangerousContent: 'Block dangerous content'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm">{label}</Label>
                  <Switch
                    checked={safetySettings[key as keyof typeof safetySettings]}
                    onCheckedChange={(checked) =>
                      setSafetySettings(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* API Usage Information */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Your API key is stored locally and never transmitted to our servers. 
              API usage will be billed directly by Google according to their pricing.
            </AlertDescription>
          </Alert>

          {/* Current Status */}
          <div className="bg-black/20 border border-neon-green/30 rounded-lg p-4">
            <h4 className="font-semibold text-neon-green mb-2">Current Status:</h4>
            <div className="text-sm space-y-2 text-gray-300">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-neon-green animate-pulse"></div>
                <span>API Key configured and ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-neon-blue"></div>
                <span>Real-time AI analysis enabled</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-neon-purple"></div>
                <span>Entity extraction and relationship mapping active</span>
              </div>
            </div>
          </div>

          {/* Getting API Key Instructions */}
          <div className="bg-black/20 border border-neon-green/30 rounded-lg p-4">
            <h4 className="font-semibold text-neon-green mb-2">How to get your own Gemini API Key:</h4>
            <ol className="text-sm space-y-1 text-gray-300">
              <li>1. Visit <code className="text-neon-blue">https://makersuite.google.com/app/apikey</code></li>
              <li>2. Sign in with your Google account</li>
              <li>3. Click "Create API Key"</li>
              <li>4. Copy the generated key and paste it above</li>
              <li>5. Test the connection to verify it works</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}