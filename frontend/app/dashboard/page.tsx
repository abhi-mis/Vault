"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Award, Calendar, ChevronDown, LogOut, PlusCircle, Target, X, BarChart2, Clock, Filter } from 'lucide-react';

interface Interview {
  _id: string;
  role: string;
  questions: Array<{
    question: string;
    answer: string;
    feedback: string;
    score: number;
  }>;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/interviews/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterviews(data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewInterview = () => {
    router.push('/interview/new');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const getAverageScore = (interview: Interview) => {
    const scores = interview.questions.map(q => q.score);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  };

  const sortedInterviews = [...interviews].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return getAverageScore(b) - getAverageScore(a);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2900')] opacity-10 bg-cover bg-center" />
      
      <div className="relative max-w-[90rem] mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Interview Dashboard</h1>
            <p className="text-white/70">Your preparation journey at a glance</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startNewInterview}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:from-yellow-300 hover:to-orange-400 shadow-lg shadow-orange-500/30 transition-all duration-300"
            >
              <PlusCircle className="w-5 h-5" />
              New Interview
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 backdrop-blur-lg transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </motion.button>
          </div>
        </div>

        {/* Stats Overview */}
        {interviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6"
            >
              <div className="flex items-center gap-4">
                <BarChart2 className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-white/70">Total Interviews</p>
                  <h3 className="text-2xl font-bold text-white">{interviews.length}</h3>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6"
            >
              <div className="flex items-center gap-4">
                <Award className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-white/70">Average Score</p>
                  <h3 className="text-2xl font-bold text-white">
                    {(interviews.reduce((acc, interview) => acc + getAverageScore(interview), 0) / interviews.length).toFixed(1)}
                  </h3>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6"
            >
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-white/70">Last Interview</p>
                  <h3 className="text-2xl font-bold text-white">
                    {new Date(interviews[0]?.createdAt).toLocaleDateString()}
                  </h3>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Controls */}
        {interviews.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-white/70">
              <Filter className="w-5 h-5" />
              <span>Sort by:</span>
            </div>
            <button
              onClick={() => setSortBy('date')}
              className={`px-4 py-2 rounded-lg transition-all ${
                sortBy === 'date'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy('score')}
              className={`px-4 py-2 rounded-lg transition-all ${
                sortBy === 'score'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Score
            </button>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : interviews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20"
          >
            <Target className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Start Your Journey</h3>
            <p className="text-white/70 mb-6">Begin your interview preparation by taking your first practice interview</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startNewInterview}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-3 rounded-xl font-semibold hover:from-yellow-300 hover:to-orange-400 shadow-lg shadow-orange-500/30 transition-all duration-300"
            >
              Take First Interview
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedInterviews.map((interview) => (
              <motion.div
                key={interview._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedInterview(selectedInterview === interview._id ? null : interview._id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{interview.role}</h3>
                      <div className="flex items-center text-white/70 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(interview.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-yellow-400 font-bold text-xl">
                        {getAverageScore(interview).toFixed(1)}
                      </div>
                      <div className="text-white/50 text-sm">Average Score</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-white/70 text-sm mb-2">
                      <span>Progress</span>
                      <span>{interview.questions.length} Questions</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                        style={{ width: `${(getAverageScore(interview) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedInterview === interview._id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-6 space-y-4">
                        {interview.questions.map((q, index) => (
                          <div key={index} className="bg-white/5 rounded-xl p-4">
                            <p className="text-white/90 font-medium mb-2">{q.question}</p>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                                  style={{ width: `${(q.score / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-white/90 font-semibold min-w-[40px]">{q.score}/10</span>
                            </div>
                            {q.feedback && (
                              <p className="mt-2 text-white/70 text-sm">{q.feedback}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}