import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Brain, Plus } from 'lucide-react';
import '../styles/dark-theme.css';

export default function OSINTReportGenerator() {
  useEffect(() => {
    // Apply dark theme to body
    document.body.classList.add('dark-theme');
    document.documentElement.classList.add('dark-theme');
    
    return () => {
      document.body.classList.remove('dark-theme');
      document.documentElement.classList.remove('dark-theme');
    };
  }, []);

  const createNewCase = () => {
    console.log('Create new case clicked');
  };

  return (
    <div className="min-h-screen dark-theme bg-gradient-to-br from-black via-gray-900 to-black text-white relative overflow-hidden">
      {/* Simple Matrix-like background */}
      <div className="absolute inset-0 opacity-10">
        <div className="matrix-bg"></div>
      </div>
      
      {/* Header */}
      <div className="terminal-window mb-6 mx-4 sm:mx-6 lg:mx-8">
        <div className="terminal-header relative">
          <div className="terminal-dot red animate-pulse"></div>
          <div className="terminal-dot yellow animate-pulse"></div>
          <div className="terminal-dot green animate-pulse"></div>
          <span className="text-green-400 font-mono text-sm ml-4 font-semibold">
            OSINT-ANALYZER v2.0.1 [SYSTEM ONLINE]
          </span>
          <div className="ml-auto flex items-center space-x-2">
            <div className="status-dot online"></div>
            <span className="text-xs text-green-400 font-mono">SECURE CONNECTION</span>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Shield className="h-10 w-10 text-green-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-400 tracking-wider">
                  OSINT REPORT GENERATOR
                </h1>
                <p className="text-sm text-blue-400 font-mono uppercase tracking-widest">
                  AI-POWERED INTELLIGENCE ANALYSIS PLATFORM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="cyber-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Brain className="h-16 w-16 text-green-400 mb-4" />
            <h2 className="text-2xl font-semibold text-green-400 mb-2">
              Welcome to OSINT Report Generator
            </h2>
            <p className="text-blue-400 text-center mb-6">
              Create a new case or select an existing one to start your OSINT investigation
            </p>
            <Button onClick={createNewCase} size="lg" className="bg-green-400 text-black hover:bg-green-300">
              <Plus className="h-5 w-5 mr-2" />
              Create New Case
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
