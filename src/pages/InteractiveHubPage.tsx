import React from 'react';
import { InteractiveHub } from '../components/InteractiveHub';
import { motion } from 'motion/react';
import { Brain, Sparkles } from 'lucide-react';

export const InteractiveHubPage = () => {
  const [activeTab, setActiveTab] = React.useState<'quizzes' | 'games' | 'flashcards'>('flashcards');

  const handleCardClick = (tab: 'quizzes' | 'games' | 'flashcards') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-12 px-4">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-beige-100 rounded-full border border-beige-200 text-beige-600 text-xs font-bold uppercase tracking-widest"
        >
          <Brain className="w-4 h-4" />
          Gamified Learning
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl font-serif font-bold tracking-tight text-beige-900"
        >
          Interactive Hub
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-beige-600 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Gamified learning tools to keep you engaged and sharp.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className="absolute -inset-8 bg-beige-200/10 blur-3xl rounded-[64px] pointer-events-none" />
        <InteractiveHub defaultTab={activeTab} />
      </motion.div>

      {/* Interactive Hub Games */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        {[
          { title: "Quiz Master", desc: "Test your knowledge with dynamic quizzes that adapt to your level.", icon: "🏆", tab: 'quizzes' as const },
          { title: "Flashcard Flip", desc: "Master vocabulary and key terms with our interactive flashcard system.", icon: "🎴", tab: 'flashcards' as const },
          { title: "Concept Match", desc: "Connect related ideas in a fast-paced matching game.", icon: "🧩", tab: 'games' as const }
        ].map((game, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleCardClick(game.tab)}
            className="p-8 bg-white border border-beige-200 rounded-[40px] text-center space-y-4 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="text-5xl group-hover:scale-110 transition-transform duration-300">{game.icon}</div>
            <h3 className="text-xl font-bold text-beige-900 uppercase tracking-wider">{game.title}</h3>
            <p className="text-beige-600 font-medium text-sm leading-relaxed">{game.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
