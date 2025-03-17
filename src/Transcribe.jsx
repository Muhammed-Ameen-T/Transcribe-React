import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Copy, ArrowDownToLine, ArrowUpFromLine, Settings, RotateCcw } from 'lucide-react';

const Transcribe = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [textToSpeak, setTextToSpeak] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('speech-to-text');
  const [language, setLanguage] = useState('en-US');
  const speechRecognition = useRef(null);
  const synth = useRef(window.speechSynthesis);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);

  // Use refs to track the final transcript and the last processed result
  const finalTranscriptBuffer = useRef('');
  const lastProcessedTranscript = useRef('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = true;
      speechRecognition.current.interimResults = true;
      speechRecognition.current.lang = language;

      speechRecognition.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Process results from the event
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript = transcript; // Only take the latest final result
          } else {
            interimTranscript = transcript; // Only take the latest interim result
          }
        }

        // Debug logging to see what’s happening
        console.log('Final:', finalTranscript, 'Interim:', interimTranscript, 'Buffer:', finalTranscriptBuffer.current);

        // Update state only if there’s new final content
        setTranscribedText(() => {
          if (finalTranscript && finalTranscript !== lastProcessedTranscript.current) {
            // Append new final transcript if it’s different from the last processed one
            finalTranscriptBuffer.current = finalTranscriptBuffer.current + finalTranscript + ' ';
            lastProcessedTranscript.current = finalTranscript; // Update the last processed transcript
            return finalTranscriptBuffer.current.trim();
          }
          // Show the current buffer plus interim as a preview
          return (finalTranscriptBuffer.current + interimTranscript).trim();
        });
      };

      speechRecognition.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
      };

      speechRecognition.current.onend = () => {
        setIsRecording(false);
      };
    }

    // Populate voice options for text-to-speech
    const populateVoiceList = () => {
      const voices = synth.current.getVoices();
      setVoiceOptions(voices);
      if (voices.length > 0) {
        setSelectedVoice(voices[0].name);
      }
    };

    populateVoiceList();
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = populateVoiceList;
    }

    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
    };
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      speechRecognition.current.stop();
    } else {
      setTranscribedText('');
      finalTranscriptBuffer.current = ''; // Reset buffer
      lastProcessedTranscript.current = ''; // Reset last processed transcript
      speechRecognition.current.start();
    }
    setIsRecording(!isRecording);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const speakText = () => {
    if (textToSpeak.trim() === '') return;

    if (isPlaying) {
      synth.current.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const selectedVoiceObj = voiceOptions.find(voice => voice.name === selectedVoice);
    if (selectedVoiceObj) {
      utterance.voice = selectedVoiceObj;
    }
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.onend = () => setIsPlaying(false);

    synth.current.speak(utterance);
    setIsPlaying(true);
  };

  const exportTranscription = () => {
    const element = document.createElement('a');
    const file = new Blob([transcribedText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'transcription.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const importText = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTextToSpeak(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Transcribe</h1>
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-2 text-blue-100">Speech to Text & Text to Speech Converter</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-grow p-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 font-medium text-lg ${activeTab === 'speech-to-text' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('speech-to-text')}
          >
            Speech to Text
          </button>
          <button
            className={`py-3 px-6 font-medium text-lg ${activeTab === 'text-to-speech' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('text-to-speech')}
          >
            Text to Speech
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
                <select 
                  value={selectedVoice} 
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md p-2"
                >
                  {voiceOptions.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Speech Rate: {speechRate}
                </label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pitch: {speechPitch}
                </label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'speech-to-text' ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Speech to Text</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setTranscribedText('')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Clear"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => copyToClipboard(transcribedText)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={exportTranscription}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Download as text file"
                  >
                    <ArrowDownToLine className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={transcribedText}
                  onChange={(e) => setTranscribedText(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your transcription will appear here..."
                />
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={toggleRecording}
                    className={`p-4 rounded-full shadow-lg transition-all ${
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isRecording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                {isRecording ? 'Recording... Speak now' : 'Click the microphone to start recording'}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Text to Speech</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setTextToSpeak('')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Clear"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <label className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                    <ArrowUpFromLine className="w-5 h-5" />
                    <input
                      type="file"
                      accept=".txt"
                      onChange={importText}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={textToSpeak}
                  onChange={(e) => setTextToSpeak(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter text to be spoken..."
                />
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={speakText}
                    className={`p-4 rounded-full shadow-lg transition-all ${
                      isPlaying 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={textToSpeak.trim() === ''}
                  >
                    {isPlaying ? <Square className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                {isPlaying ? 'Speaking...' : 'Click the play button to hear the text'}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Transcribe App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Transcribe;