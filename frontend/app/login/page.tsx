"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Lock, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const { data } = await axios.post(`http://localhost:5000${endpoint}`, formData);
      
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 flex flex-col justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2900')] opacity-10 bg-cover bg-center" />
      
      <Link 
        href="/"
        className="absolute top-8 left-8 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h2>
          <p className="text-white/70">
            {isLogin ? 'Continue your interview preparation journey' : 'Start your interview preparation journey'}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/10 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="pl-10 w-full bg-white/5 border border-white/10 rounded-xl py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all duration-300"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="pl-10 w-full bg-white/5 border border-white/10 rounded-xl py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all duration-300"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="pl-10 w-full bg-white/5 border border-white/10 rounded-xl py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all duration-300"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-300 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-gray-900 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 shadow-lg shadow-orange-500/30 transition-all duration-300"
            >
              {isLogin ? 'Sign in' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-center text-sm text-white/70 hover:text-white transition-colors"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}