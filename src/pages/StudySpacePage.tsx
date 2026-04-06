import React from 'react';
import { StudySpace } from '../components/StudySpace';
import { motion } from 'motion/react';
import { Layout, Sparkles, Zap } from 'lucide-react';
import { useGems } from '../contexts/GemsContext';

export const StudySpacePage = () => {
  const { streakCount } = useGems();

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-12 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-beige-100 rounded-full border border-beige-200 text-beige-600 text-xs font-bold uppercase tracking-widest"
          >
            <Layout className="w-4 h-4" />
            Your Command Center
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-serif font-bold tracking-tight text-beige-900"
          >
            Study Space
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-beige-600 max-w-2xl leading-relaxed font-medium"
          >
            Manage your tasks, notes, and flashcards in a beautifully organized environment.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          <div className="px-8 py-4 bg-beige-800 text-white rounded-2xl text-sm font-bold tracking-widest uppercase shadow-xl shadow-beige-900/20 flex items-center gap-2">
            <Zap className="w-5 h-5 text-beige-400" />
            {streakCount} Day Streak 🔥
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <div className="absolute -inset-8 bg-beige-200/10 blur-3xl rounded-[64px] pointer-events-none" />
        <StudySpace />
      </motion.div>

      {/* Study Space Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-10 bg-beige-900 text-white rounded-[48px] space-y-6"
        >
          <h3 className="text-3xl font-serif font-bold">Smart Notes</h3>
          <p className="text-beige-300 font-medium leading-relaxed">
            Capture your thoughts and organize them by subject. Our smart tagging system 
            helps you find exactly what you need, when you need it.
          </p>
          <div className="pt-4 flex gap-4">
            <div className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">Markdown Support</div>
            <div className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">Auto-Save</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-10 bg-white border border-beige-200 rounded-[48px] space-y-6"
        >
          <h3 className="text-3xl font-serif font-bold text-beige-900">Task Management</h3>
          <p className="text-beige-600 font-medium leading-relaxed">
            Stay on top of your assignments with our integrated task tracker. 
            Set deadlines, prioritize, and crush your goals.
          </p>
          <div className="pt-4 flex gap-4">
            <div className="px-4 py-2 bg-beige-100 rounded-full text-xs font-bold uppercase tracking-widest text-beige-600">Priority Levels</div>
            <div className="px-4 py-2 bg-beige-100 rounded-full text-xs font-bold uppercase tracking-widest text-beige-600">Reminders</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
