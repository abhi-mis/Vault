"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ChevronRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Question {
  _id: string;
  question: string;
  answer?: string;
  feedback?: string;
  score?: number;
}

const Interview = () => {
  const router = useRouter();
  const { id } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transcriptBuffer, setTranscriptBuffer] = useState('');

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition({
    commands: [
      {
        command: '*',
        callback: (command) => {
          setTranscriptBuffer(prev => prev + ' ' + command);
        }
      }
    ]
  });

  useEffect(() => {
    if (browserSupportsSpeechRecognition) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => console.log('Microphone permission granted'))
        .catch(err => {
          console.error('Microphone permission denied:', err);
          setErrorMessage('Please allow microphone access to use speech recognition.');
        });
    }
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/interviews/${id}/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResponses(response.data);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setErrorMessage('Failed to load questions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [id, router]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setErrorMessage('');
    setTranscriptBuffer('');
    resetTranscript();
    SpeechRecognition.startListening({ 
      continuous: true,
      language: 'en-US'
    });
  }, [resetTranscript]);

  const stopRecording = useCallback(async () => {
    SpeechRecognition.stopListening();
    setIsRecording(false);
    
    const finalTranscript = (transcriptBuffer + ' ' + transcript).trim();
    
    if (!finalTranscript) {
      setErrorMessage('No speech detected. Please try again and speak clearly.');
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const currentQuestion = responses[currentIndex];
      if (!currentQuestion?._id) {
        setErrorMessage('Invalid question data. Please refresh the page.');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/interviews/${id}/answer`,
        {
          questionId: currentQuestion._id,
          answer: finalTranscript,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const updatedResponses = [...responses];
      updatedResponses[currentIndex] = {
        ...updatedResponses[currentIndex],
        answer: finalTranscript,
        feedback: response.data.feedback,
        score: response.data.score,
      };
      setResponses(updatedResponses);
    } catch (error) {
      console.error('Error processing answer:', error);
      setErrorMessage(
        (error as any).response?.data?.message || 
        'Failed to process your answer. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, transcriptBuffer, currentIndex, responses, id]);

  const handleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < responses.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetTranscript();
      setTranscriptBuffer('');
      setErrorMessage('');
    } else {
      router.push('/dashboard');
    }
  }, [currentIndex, responses.length, resetTranscript, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!browserSupportsSpeechRecognition || !isMicrophoneAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white font-semibold mb-4">Speech recognition is not available</p>
          <p className="text-white/70 mb-4">Please ensure:</p>
          <ul className="text-white/70 list-disc list-inside text-left space-y-2">
            <li>You're using a modern browser (Chrome recommended)</li>
            <li>You've granted microphone permissions</li>
            <li>Your microphone is properly connected</li>
          </ul>
        </div>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8">
          <p className="text-white">No questions available for this interview.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = responses[currentIndex];
  const currentTranscript = (transcriptBuffer + ' ' + transcript).trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2900')] opacity-10 bg-cover bg-center" />
      
      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Question {currentIndex + 1} of {responses.length}
                </h2>
                <div className="h-2 bg-white/10 rounded-full w-64 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / responses.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            {currentQuestion && (
              <div className="bg-white/5 rounded-xl p-6 mb-8">
                <p className="text-xl text-white/90">{currentQuestion.question}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${listening ? 'bg-red-400 animate-pulse' : 'bg-white/30'}`} />
                  <span className="text-white/70">
                    {listening ? 'Recording...' : 'Not recording'}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRecording}
                  disabled={isProcessing}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isRecording 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Start Recording
                    </>
                  )}
                </motion.button>
              </div>

              <div className="bg-white/5 rounded-xl p-6 min-h-[120px]">
                <p className="text-white/90">
                  {currentTranscript || 'Your answer will appear here...'}
                </p>
              </div>

              <AnimatePresence>
                {currentQuestion?.feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-xl font-semibold text-white">Feedback</h3>
                    <div className="bg-white/5 rounded-xl p-6">
                      <p className="text-white/90 mb-4">{currentQuestion.feedback}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                            style={{ width: `${(currentQuestion.score ?? 0) / 10 * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold">
                          {currentQuestion.score}/10
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm"
                >
                  {errorMessage}
                </motion.div>
              )}

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextQuestion}
                  disabled={!currentQuestion?.answer || isProcessing}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    !currentQuestion?.answer || isProcessing
                      ? 'bg-white/10 text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400'
                  }`}
                >
                  {currentIndex === responses.length - 1 ? 'Finish' : 'Next Question'}
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Interview;