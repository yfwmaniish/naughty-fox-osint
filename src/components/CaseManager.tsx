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
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'analyzing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Case Management</CardTitle>
          <Button onClick={onNewCase} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Case
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('draft')}>
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('analyzing')}>
                Analyzing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus('completed')}>
                Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Case List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {cases.length === 0 ? (
                <div>
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <div>No cases found. Create your first case to get started.</div>
                </div>
              ) : (
                <div>No cases match your search criteria.</div>
              )}
            </div>
          ) : (
            filteredCases.map((caseData) => (
              <div
                key={caseData.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedCaseId === caseData.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => onCaseSelect(caseData)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{caseData.name}</h3>
                      <Badge className={getStatusColor(caseData.status)}>
                        {caseData.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Subject: {caseData.subject}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{caseData.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{caseData.files.length} files</span>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onCaseSelect(caseData)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Open Case
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCase(caseData.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Case
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}