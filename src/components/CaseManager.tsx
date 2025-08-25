import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  FolderOpen, 
  Calendar,
  User,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OSINTCase } from '@/types';
import { getCases, deleteCase } from '@/lib/storage';

interface CaseManagerProps {
  onCaseSelect: (caseData: OSINTCase) => void;
  onNewCase: () => void;
  selectedCaseId?: string;
}

export default function CaseManager({ onCaseSelect, onNewCase, selectedCaseId }: CaseManagerProps) {
  const [cases, setCases] = useState<OSINTCase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = () => {
    const loadedCases = getCases();
    setCases(loadedCases);
  };

  const handleDeleteCase = (caseId: string) => {
    if (confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      deleteCase(caseId);
      loadCases();
    }
  };

  const filteredCases = cases.filter(caseData => {
    const matchesSearch = caseData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseData.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || caseData.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'border-neon-yellow text-neon-yellow bg-yellow-900/20';
      case 'analyzing': return 'border-neon-blue text-neon-blue bg-blue-900/20 animate-pulse';
      case 'completed': return 'border-neon-green text-neon-green bg-green-900/20';
      default: return 'border-gray-500 text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '◐';
      case 'analyzing': return '◑';
      case 'completed': return '●';
      default: return '○';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="macos-input pl-10 w-full text-sm"
            style={{ color: '#ffffff !important' }}
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="macos-input text-sm"
          style={{ color: '#ffffff !important' }}
        >
          <option value="all" style={{color: '#ffffff', backgroundColor: '#2c2c2e'}}>All Status</option>
          <option value="draft" style={{color: '#ffffff', backgroundColor: '#2c2c2e'}}>Draft</option>
          <option value="analyzing" style={{color: '#ffffff', backgroundColor: '#2c2c2e'}}>Analyzing</option>
          <option value="completed" style={{color: '#ffffff', backgroundColor: '#2c2c2e'}}>Completed</option>
        </select>
      </div>

      {/* Case List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredCases.length === 0 ? (
          <div className="text-center py-8">
            {cases.length === 0 ? (
              <div className="animate-fade-in">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                <div className="text-white font-semibold mb-1">Database Empty</div>
                <div className="text-gray-400 text-sm">Create your first case to begin</div>
              </div>
            ) : (
              <div className="text-white font-semibold">No matches found</div>
            )}
          </div>
        ) : (
          filteredCases.map((caseData, index) => (
            <div
              key={caseData.id}
              className={`macos-card p-4 cursor-pointer transition-all duration-200 ${
                selectedCaseId === caseData.id 
                  ? 'ring-2 ring-blue-500 bg-blue-500/10' 
                  : 'hover:bg-gray-700/50'
              }`}
              onClick={() => onCaseSelect(caseData)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm truncate mb-1">
                        {caseData.name || 'Unnamed Case'}
                      </h3>
                      <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        caseData.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                        caseData.status === 'analyzing' ? 'bg-blue-500/20 text-blue-400' :
                        caseData.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {getStatusIcon(caseData.status)} {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-3">
                    <span className="text-gray-500">Subject:</span> <span className="text-white">{caseData.subject || 'Unknown'}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span className="text-white">{caseData.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <User className="h-3 w-3" />
                      <span className="text-white">{caseData.files.length} files</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCase(caseData.id);
                  }}
                  className="text-gray-400 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              {/* Case ID display */}
              <div className="absolute top-2 right-2 text-xs text-gray-500 opacity-50">
                #{caseData.id.slice(-6).toUpperCase()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
