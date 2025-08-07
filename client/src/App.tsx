import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Recording {
  id: string;
  name: string;
  url: string;
  timestamp: Date;
}

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState('00:00');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  
  // Refs for managing recording state
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerSecondsRef = useRef(0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecord = async () => {
    try {
      // Request screen capture with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      // Set video source and ensure it's muted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      
      // Reset recorded chunks
      recordedChunksRef.current = [];
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      // Handle stop event
      mediaRecorder.onstop = () => {
        // Combine chunks into a blob
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const timestamp = new Date();
        const fileName = `meeting-recording-${Date.now()}.webm`;
        
        const newRecording: Recording = {
          id: Date.now().toString(),
          name: fileName,
          url: url,
          timestamp: timestamp
        };
        
        // Add to recordings list
        setRecordings(prev => [newRecording, ...prev]);
        
        // Reset recorded chunks
        recordedChunksRef.current = [];
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Start timer
      timerSecondsRef.current = 0;
      intervalIdRef.current = window.setInterval(() => {
        timerSecondsRef.current += 1;
        setTimer(formatTime(timerSecondsRef.current));
      }, 1000);
      
      // Update UI state
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please make sure you grant screen sharing permission.');
    }
  };

  const handleStopRecord = () => {
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear timer
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    // Reset timer display
    setTimer('00:00');
    timerSecondsRef.current = 0;
    
    // Update UI state
    setIsRecording(false);
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
    setRecordings(prev => {
      const recording = prev.find(r => r.id === recordingId);
      if (recording) {
        URL.revokeObjectURL(recording.url);
      }
      return prev.filter(r => r.id !== recordingId);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Main Heading */}
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Record Your Meeting
        </h1>

        {/* Video Element - 80% width and centered */}
        <div className="flex justify-center mb-8">
          <div className="w-4/5 bg-black rounded-lg overflow-hidden shadow-lg">
            <video 
              ref={videoRef}
              className="w-full aspect-video bg-gray-900"
              controls={false}
              autoPlay
              muted
              playsInline
            />
          </div>
        </div>

        {/* Timer in 00:00 format */}
        <div className="text-center mb-6">
          <div className={`inline-block bg-gray-900 text-white text-2xl font-mono px-6 py-3 rounded-lg shadow-md ${isRecording ? 'recording-pulse' : ''}`}>
            {timer}
          </div>
        </div>

        {/* Control Buttons - Side by side */}
        <div className="flex justify-center items-center gap-4 mb-12 min-h-[60px]">
          {!isRecording && (
            <Button
              onClick={handleStartRecord}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg"
            >
              Start Record
            </Button>
          )}
          
          {isRecording && (
            <Button
              onClick={handleStopRecord}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg"
            >
              Stop Record
            </Button>
          )}
        </div>

        {/* Your Recordings Section */}
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
                  <div 
                    key={recording.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {recording.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {recording.timestamp.toLocaleString()}
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