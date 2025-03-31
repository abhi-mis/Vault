"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, LineChart, Loader2 } from 'lucide-react';

interface Position {
  id: string;
  description: string;
}

interface DifficultyLevel {
  level: number;
  description: string;
}

export default function NewInterview() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState(3);
  const [isStarting, setIsStarting] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPositionsAndDifficulty = async () => {
      try {
        const token = localStorage.getItem('token');
        const url = process.env.NEXT_PUBLIC_API_URL;
        const { data } = await axios.get(
          `${url}/api/interviews/positions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPositions(data.positions);
        setDifficultyLevels(data.difficultyLevels);
      } catch (error) {
        console.error('Error fetching positions:', error);
        setError('Failed to load available positions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositionsAndDifficulty();
  }, []);

  const startInterview = async () => {
    if (!selectedRole) return;

    setIsStarting(true);
    try {
      const token = localStorage.getItem('token');
      const url = process.env.NEXT_PUBLIC_API_URL;
      const { data } = await axios.post(
        `${url}/api/interviews`,
        { 
          role: selectedRole,
          difficulty: selectedDifficulty 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2900')] opacity-10 bg-cover bg-center" />
      
      <div className="relative max-w-4xl mx-auto">
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
          className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden"
        >
          <div className="p-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">
                Start New Interview
              </h1>
              <p className="text-white/70 text-lg">
                Choose your target role and difficulty level
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Select Position</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {positions.map((position) => (
                    <motion.button
                      key={position.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole(position.id)}
                      className={`p-6 text-left rounded-xl border transition-all duration-300 ${
                        selectedRole === position.id
                          ? 'bg-white/15 border-yellow-400/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <h3 className="text-xl font-semibold text-white mb-2">{position.id}</h3>
                      <p className="text-white/70">{position.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Select Difficulty</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {difficultyLevels.map((level) => (
                    <motion.button
                      key={level.level}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDifficulty(level.level)}
                      className={`p-4 rounded-xl border text-center transition-all duration-300 ${
                        selectedDifficulty === level.level
                          ? 'bg-white/15 border-yellow-400/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-2xl font-bold text-white mb-2">{level.level}</div>
                      <p className="text-white/70 text-sm">{level.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startInterview}
                disabled={!selectedRole || isStarting}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  !selectedRole || isStarting
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400'
                }`}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <LineChart className="w-5 h-5" />
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