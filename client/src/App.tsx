import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState('00:00');

  const handleStartRecord = () => {
    setIsRecording(true);
    // Timer functionality would go here in a real implementation
  };

  const handleStopRecord = () => {
    setIsRecording(false);
    // Stop recording functionality would go here in a real implementation
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Main Heading */}
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          🎥 Record Your Meeting
        </h1>

        {/* Video Element */}
        <div className="mb-8">
          <div className="w-4/5 mx-auto bg-black rounded-lg overflow-hidden shadow-lg">
            <video 
              className="w-full aspect-video bg-gray-900"
              controls={false}
              autoPlay
              muted
            >
              <div className="flex items-center justify-center h-full text-white text-lg">
                Camera preview would appear here
              </div>
            </video>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-gray-900 text-white text-2xl font-mono px-6 py-3 rounded-lg shadow-md">
            ⏱️ {timer}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          {!isRecording && (
            <Button
              onClick={handleStartRecord}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              ▶️ Start Record
            </Button>
          )}
          
          {isRecording && (
            <Button
              onClick={handleStopRecord}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              ⏹️ Stop Record
            </Button>
          )}
        </div>

        {/* Your Recordings Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
              📁 Your Recordings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg">No recordings yet</p>
              <p className="text-sm mt-2">Your recorded meetings will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;