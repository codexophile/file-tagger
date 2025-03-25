import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, X, Copy, Play, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EnhancedFileTagger = () => {
  const [files, setFiles] = useState([]);
  const [tagGroups, setTagGroups] = useState({});
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [dropActive, setDropActive] = useState(false);

  // Simulate loading the INI file data
  useEffect(() => {
    const sampleData = {
      "Category 1": { "Tag1": "", "Tag2": "" },
      "Category 2": { "Tag3": "", "Tag4": "" }
    };
    setTagGroups(sampleData);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDropActive(true);
  };

  const handleDragLeave = () => {
    setDropActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDropActive(false);
    // In a real implementation, this would handle actual files
    const newFiles = Array.from(e.dataTransfer.files).map(f => ({
      name: f.name,
      path: f.path,
      error: false
    }));
    setFiles([...files, ...newFiles]);
  };

  const toggleTag = (tag) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          mb-8 p-8 rounded-lg border-2 border-dashed transition-all duration-300
          ${dropActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${files.length === 0 ? 'h-40' : 'min-h-40'}
          flex flex-col items-center justify-center
        `}
      >
        <p className="text-gray-500 mb-4">
          {dropActive ? 'Drop files here!' : 'Drag and drop files here'}
        </p>
        
        {/* File List */}
        {files.length > 0 && (
          <div className="w-full max-w-2xl">
            {files.map((file, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-3 my-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center">
                  {file.error ? (
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  )}
                  <span className="truncate max-w-md">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tag Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(tagGroups).map(([groupName, tags]) => (
          <Card key={groupName} className="transition-transform duration-200 hover:scale-102">
            <CardHeader>
              <CardTitle className="text-lg">{groupName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.keys(tags).map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`
                      px-3 py-1 rounded-full transition-all duration-200
                      ${selectedTags.has(tag)
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex gap-4">
        <button className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200">
          <Copy className="w-5 h-5" />
        </button>
        <button className="p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors duration-200">
          <Play className="w-5 h-5" />
        </button>
        <button className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200">
          <Trash2 className="w-5 h-5" />
        </button>
        <button className="p-3 bg-gray-500 text-white rounded-full shadow-lg hover:bg-gray-600 transition-colors duration-200">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Status Messages */}
      {files.some(f => f.error) && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            Some files could not be accessed. Please check the file paths.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default EnhancedFileTagger;
