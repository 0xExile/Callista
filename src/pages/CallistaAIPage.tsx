import React from 'react';
import { useLocation } from 'react-router-dom';
import { CallistaAI } from '../components/CallistaAI';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const CallistaAIPage = () => {
  const location = useLocation();
  const { initialMessages, initialSessionId } = location.state || {};

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-12 px-4">
      <div className="text-center space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-serif font-bold tracking-tight text-beige-900"
        >
          Learn with <span className="sheen-text">Callista AI</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-beige-600 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Your AI learning companion. Get help with complex topics, 
          plan your study schedule, and manage stress with ease!
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-beige-200/20 blur-3xl rounded-[64px] pointer-events-none" />
        <CallistaAI 
          initialMessages={initialMessages} 
          initialSessionId={initialSessionId} 
          key={initialSessionId || 'new-chat'}
        />
      </motion.div>

      {/* Modes Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        {[
          { title: "Anime Analogy", desc: "Learn through the lens of your favorite shonen and slice-of-life series.", icon: "🌸" },
          { title: "Pro Gamer", desc: "Level up your knowledge with mechanics from competitive gaming.", icon: "🎮" },
          { title: "Roblox Vibes", desc: "Simple, fun explanations based on tycoon and simulator logic.", icon: "🧱" }
        ].map((mode, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white border border-beige-200 rounded-[32px] space-y-4 shadow-sm"
          >
            <div className="text-4xl">{mode.icon}</div>
            <h3 className="text-xl font-bold text-beige-900 uppercase tracking-wider">{mode.title}</h3>
            <p className="text-beige-600 font-medium text-sm leading-relaxed">{mode.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
