"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, BrainCircuit, Code, LineChart, Palette, Settings, Target } from 'lucide-react';

const roles = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    icon: Code,
    description: 'Technical questions focused on coding, system design, and problem-solving'
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    icon: BrainCircuit,
    description: 'Questions about machine learning, statistics, and data analysis'
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    icon: Target,
    description: 'Product strategy, user experience, and business case scenarios'
  },
  {
    id: 'ux-designer',
    title: 'UX Designer',
    icon: Palette,
    description: 'Design thinking, user research, and interface design challenges'
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    icon: Settings,
    description: 'Infrastructure, automation, and deployment scenarios'
  }
];

export default function NewInterview() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const startInterview = async () => {
    if (!selectedRole) return;

    setIsStarting(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        'http://localhost:5000/api/interviews',
        { role: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push(`/interview/${data._id}`);
    } catch (error) {
      console.error('Error starting interview:', error);
      setIsStarting(false);
    }
  };

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
                Choose your target role to begin the interview
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <motion.button
                    key={role.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRole(role.title)}
                    className={`p-6 text-left rounded-xl border transition-all duration-300 ${
                      selectedRole === role.title
                        ? 'bg-white/15 border-yellow-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-4 ${
                      selectedRole === role.title ? 'text-yellow-400' : 'text-white/70'
                    }`} />
                    <h3 className="text-xl font-semibold text-white mb-2">{role.title}</h3>
                    <p className="text-white/70">{role.description}</p>
                  </motion.button>
                );
              })}
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
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
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