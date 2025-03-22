"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Target, Brain, LineChart } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2900')] opacity-10 bg-cover bg-center" />
      
      <div className="relative container mx-auto px-4 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-yellow-300 mr-2" />
            <span className="text-white/90 text-sm">AI-Powered Interview Preparation</span>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">Interview Skills</span>
            <br />With Confidence
          </h1>
          
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Practice with our advanced AI system that provides personalized feedback 
            and helps you prepare for your dream job interview.
          </p>
          
          <div className="space-x-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-10 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Practicing Now
            </motion.button>
            
            <Link
              href="/about"
              className="inline-flex items-center text-white border-2 border-white/30 px-10 py-4 rounded-full font-semibold hover:bg-white/10 transition-all duration-300"
            >
              Learn More
            </Link>
          </div>
        </motion.div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Target className="w-8 h-8 text-blue-400" />}
            title="Role-Specific Questions"
            description="Get curated questions tailored to your industry and experience level, ensuring relevant practice."
            delay={0.2}
          />
          <FeatureCard
            icon={<Brain className="w-8 h-8 text-purple-400" />}
            title="AI-Powered Feedback"
            description="Receive instant, detailed feedback on your responses with actionable improvement suggestions."
            delay={0.4}
          />
          <FeatureCard
            icon={<LineChart className="w-8 h-8 text-pink-400" />}
            title="Track Progress"
            description="Visualize your improvement journey with comprehensive performance analytics and insights."
            delay={0.6}
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode;
  title: string; 
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="group bg-white/10 backdrop-blur-lg p-8 rounded-2xl hover:bg-white/15 transition-all duration-300 border border-white/10"
    >
      <div className="mb-6 p-3 inline-block bg-white/5 rounded-xl group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-semibold text-white mb-4">{title}</h3>
      <p className="text-white/70 leading-relaxed">{description}</p>
    </motion.div>
  );
}