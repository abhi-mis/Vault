"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, LineChart, Loader2, BookOpen, Briefcase, Sparkles } from 'lucide-react';

interface Position {
  id: string;
  description: string;
}

interface Topic {
  id: string;
  description: string;
}

interface DifficultyLevel {
  level: number;
  description: string;
}

export default function NewInterview() {
  const router = useRouter();
  const [interviewType, setInterviewType] = useState<'position' | 'topic'>('position');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState(3);
  const [questionCount, setQuestionCount] = useState(5);
  const [isStarting, setIsStarting] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);
  const [questionCounts, setQuestionCounts] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const url = process.env.NEXT_PUBLIC_API_URL;
        const { data } = await axios.get(
          `${url}/api/interviews/options`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPositions(data.positions);
        setTopics(data.topics);
        setDifficultyLevels(data.difficultyLevels);
        setQuestionCounts(data.questionCounts);
      } catch (error) {
        console.error('Error fetching options:', error);
        setError('Failed to load interview options. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const startInterview = async () => {
    if (!selectedSubject) return;

    setIsStarting(true);
    try {
      const token = localStorage.getItem('token');
      const url = process.env.NEXT_PUBLIC_API_URL;
      const { data } = await axios.post(
        `${url}/api/interviews`,
        { 
          type: interviewType,
          subject: selectedSubject,
          difficulty: selectedDifficulty,
          questionCount
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push(`/interview/${data._id}`);
    } catch (error) {
      console.error('Error starting interview:', error);
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 text-center">
          <p className="text-white mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  const subjects = interviewType === 'position' ? positions : topics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2900')] opacity-10 bg-cover bg-center mix-blend-overlay" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 overflow-hidden shadow-2xl"
        >
          <div className="p-12">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-yellow-400" />
                <h1 className="text-5xl font-bold text-white">
                  Start New Interview
                </h1>
              </div>
              <p className="text-white/70 text-xl">
                Customize your interview experience
              </p>
            </div>

            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Interview Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setInterviewType('position');
                      setSelectedSubject('');
                    }}
                    className={`p-8 rounded-2xl border flex items-center gap-6 transition-all duration-300 ${
                      interviewType === 'position'
                        ? 'bg-white/15 border-yellow-400/50 shadow-lg shadow-yellow-400/10'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`p-4 rounded-xl ${interviewType === 'position' ? 'bg-yellow-400/20' : 'bg-white/10'}`}>
                      <Briefcase className={`w-8 h-8 ${interviewType === 'position' ? 'text-yellow-400' : 'text-white'}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-semibold text-white mb-2">Position Based</h3>
                      <p className="text-white/70 text-lg">Interview for specific roles and career paths</p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setInterviewType('topic');
                      setSelectedSubject('');
                    }}
                    className={`p-8 rounded-2xl border flex items-center gap-6 transition-all duration-300 ${
                      interviewType === 'topic'
                        ? 'bg-white/15 border-yellow-400/50 shadow-lg shadow-yellow-400/10'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`p-4 rounded-xl ${interviewType === 'topic' ? 'bg-yellow-400/20' : 'bg-white/10'}`}>
                      <BookOpen className={`w-8 h-8 ${interviewType === 'topic' ? 'text-yellow-400' : 'text-white'}`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-semibold text-white mb-2">Topic Based</h3>
                      <p className="text-white/70 text-lg">Focus on specific technical subjects</p>
                    </div>
                  </motion.button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Select {interviewType === 'position' ? 'Position' : 'Topic'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjects.map((subject) => (
                    <motion.button
                      key={subject.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`p-6 text-left rounded-2xl border transition-all duration-300 ${
                        selectedSubject === subject.id
                          ? 'bg-white/15 border-yellow-400/50 shadow-lg shadow-yellow-400/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <h3 className="text-2xl font-semibold text-white mb-3">{subject.id}</h3>
                      <p className="text-white/70 text-lg">{subject.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Select Difficulty</h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                  {difficultyLevels.map((level) => (
                    <motion.button
                      key={level.level}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDifficulty(level.level)}
                      className={`p-6 rounded-2xl border text-center transition-all duration-300 ${
                        selectedDifficulty === level.level
                          ? 'bg-white/15 border-yellow-400/50 shadow-lg shadow-yellow-400/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-3xl font-bold text-white mb-3">{level.level}</div>
                      <p className="text-white/70 text-lg">{level.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Number of Questions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {questionCounts.map((count) => (
                    <motion.button
                      key={count}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setQuestionCount(count)}
                      className={`p-6 rounded-2xl border text-center transition-all duration-300 ${
                        questionCount === count
                          ? 'bg-white/15 border-yellow-400/50 shadow-lg shadow-yellow-400/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-3xl font-bold text-white mb-2">{count}</div>
                      <p className="text-white/70 text-lg">Questions</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-12 space-x-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 text-xl text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startInterview}
                disabled={!selectedSubject || isStarting}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-semibold transition-all duration-300 ${
                  !selectedSubject || isStarting
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400 shadow-lg shadow-orange-500/25'
                }`}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <LineChart className="w-6 h-6" />
                    Start Interview
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}