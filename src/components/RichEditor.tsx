import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface RichEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function RichEditor({ content, onContentChange, tags, onTagsChange }: RichEditorProps) {
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investigation Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter your investigation notes, findings, and observations here. You can include names, locations, dates, usernames, phone numbers, and any other relevant information..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
        />
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Add tags (e.g., LinkedIn, Alias, Evidence)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={addTag} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500">
          <strong>Tip:</strong> Include structured information like names, emails, phone numbers, usernames, 
          locations, and dates. The AI will automatically extract and analyze these entities.
        </div>
      </CardContent>
    </Card>
  );
}