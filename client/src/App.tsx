import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Recording {
  id: string;
  name: string;
  url: string;
  timestamp: Date;
  fileSize: number;
}

function App() {
  // Initial state: not recording, so Stop Record button should be hidden
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState('00:00');
  const [recordings, setRecordings] = useState<Recording[]>([]);

  // Debug: Log the current state
  console.log('isRecording state:', isRecording);

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  const handleStartRecord = () => {
    setIsRecording(true);
    // For now, just toggle the state for visual testing
  };

  const handleStopRecord = () => {
    setIsRecording(false);
    setTimer('00:00');
  };

  const handleDownload = (recording: Recording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = recording.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (recordingId: string) => {
    setRecordings(prev => prev.filter(r => r.id !== recordingId));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Large heading: "Record Your Meeting" */}
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Record Your Meeting
        </h1>

        {/* Video element centered on the page, approximately 80% of page width */}
        <div className="flex justify-center mb-8">
          <div className={`w-4/5 bg-black rounded-lg overflow-hidden shadow-lg ${isRecording ? 'recording-active-border' : ''}`}>
            <video 
              className="w-full aspect-video bg-gray-900"
              controls={false}
              autoPlay
              muted
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Time indicator (timer) in "00:00" format */}
        <div className="text-center mb-6">
          <div className={`inline-block bg-gray-900 text-white text-2xl font-mono px-6 py-3 rounded-lg shadow-md ${isRecording ? 'recording-pulse' : ''}`}>
            {timer}
          </div>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-2">
            Recording state: {isRecording ? 'true' : 'false'}
          </div>
        </div>

        {/* Two buttons side-by-side: "Start Record" (green) and "Stop Record" (red) */}
        {/* Initial State: "Stop Record" button must be hidden initially */}
        <div className="flex justify-center items-center gap-4 mb-12">
          {isRecording === false ? (
            <Button
              onClick={handleStartRecord}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg"
            >
              Start Record
            </Button>
          ) : (
            <Button
              onClick={handleStopRecord}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg"
            >
              Stop Record
            </Button>
          )}
        </div>

        {/* Area named "Your Recordings" which is initially empty */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">
              Your Recordings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recordings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No recordings yet</p>
                <p className="text-sm mt-2">Your recorded meetings will appear here</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recordings.map((recording) => (
                  <Card key={recording.id} className="recording-item">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {recording.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(recording.fileSize)} MB
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleDownload(recording)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-md"
                          >
                            Download
                          </Button>
                          <Button
                            onClick={() => handleDelete(recording.id)}
                            variant="destructive"
                            className="px-4 py-2 text-sm rounded-md"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;