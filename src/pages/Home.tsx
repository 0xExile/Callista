import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Layout, Brain, MessageSquare, ArrowRight, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Star4 = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5L12 0Z" fill="currentColor" />
  </svg>
);

export const Home = () => {
  const [isDonationModalOpen, setIsDonationModalOpen] = React.useState(false);

  return (
    <div className="space-y-32 pb-20">
      {/* Donation Modal */}
      <AnimatePresence>
        {isDonationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-beige-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl border border-beige-200 overflow-hidden"
            >
              <div className="p-10 space-y-8 text-center">
                <div className="inline-flex p-4 bg-beige-100 rounded-3xl text-beige-800">
                  <Heart className="w-10 h-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-serif font-bold text-beige-900">Thank You!</h3>
                  <p className="text-beige-600 leading-relaxed font-medium">
                    We truly appreciate your support! We are currently working on integrating a secure payment gateway for donations. 
                    Please check back soon to help us keep Callista free for all students.
                  </p>
                </div>
                <button 
                  onClick={() => setIsDonationModalOpen(false)}
                  className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
          <Star4 className="absolute top-10 left-10 w-24 h-24 text-beige-100 animate-soft-fade" />
          <Star4 className="absolute bottom-20 right-10 w-32 h-32 text-beige-100 animate-soft-fade delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-beige-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-beige-100 rounded-full border border-beige-200 text-beige-600 text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-4 h-4" />
            Empowering Your Learning Journey
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-serif font-bold text-beige-900 leading-[1.1] tracking-tight"
          >
            Master Anything with <span className="sheen-text">Callista</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-beige-600 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Experience a personalized learning journey powered by AI analogies, 
            interactive tools, and a space designed for focus.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-8"
          >
            <Link
              to="/ai"
              className="px-10 py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-xl shadow-beige-900/20 flex items-center gap-3"
            >
              Start Learning <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/hub"
              className="px-10 py-5 bg-white text-beige-800 border border-beige-200 rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-50 transition-all shadow-lg"
            >
              Explore Tools
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: "Callista AI",
            desc: "Complex concepts explained through your favorite analogies. Anime, Gaming, or Roblox vibes.",
            icon: MessageSquare,
            link: "/ai",
            color: "bg-beige-100/80"
          },
          {
            title: "Study Space",
            desc: "Your command center. Manage tasks, notes, and flashcards in a beautifully organized environment.",
            icon: Layout,
            link: "/study",
            color: "bg-white/80"
          },
          {
            title: "Interactive Hub",
            desc: "Gamified learning modules. Quizzes, flashcards, and more to keep your brain sharp.",
            icon: Brain,
            link: "/hub",
            color: "bg-beige-50/80"
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`group p-10 rounded-[48px] border border-beige-200 ${feature.color} hover:shadow-2xl transition-all duration-500 space-y-6 relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-sheen opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
            <div className="w-16 h-16 bg-beige-800 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
              <feature.icon className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-serif font-bold text-beige-900">{feature.title}</h3>
              <p className="text-beige-600 font-medium leading-relaxed">{feature.desc}</p>
            </div>
            <Link
              to={feature.link}
              className="inline-flex items-center gap-2 text-beige-800 font-bold uppercase tracking-widest text-xs group-hover:gap-4 transition-all"
            >
              Open Module <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-4 space-y-20">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-beige-900">How Callista Works</h2>
          <p className="text-beige-600 font-medium max-w-xl mx-auto">Three simple steps to mastering any subject with ease.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-beige-200 -translate-y-1/2 z-0" />
          
          {[
            { step: "01", title: "Choose Your Mode", desc: "Select from Anime, Gamer, or Roblox analogies to match your vibe." },
            { step: "02", title: "Ask Anything", desc: "Type in any concept you're struggling with, from calculus to history." },
            { step: "03", title: "Master the Concept", desc: "Get an interactive explanation and test your knowledge in the hub." }
          ].map((item, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-white border-2 border-beige-800 rounded-full flex items-center justify-center text-2xl font-serif font-bold text-beige-800 shadow-xl">
                {item.step}
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-beige-900 uppercase tracking-wider">{item.title}</h4>
                <p className="text-beige-600 font-medium text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="max-w-5xl mx-auto px-4 py-20 bg-beige-900 rounded-[64px] text-white text-center space-y-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-sheen opacity-10 pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl md:text-5xl font-serif font-bold">Start Your Learning Journey</h2>
          <p className="text-beige-400 font-medium max-w-xl mx-auto">
            Join a growing community of students who are mastering complex topics with ease. 
            Callista is here to help you achieve your dream grades.
          </p>
          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-3xl font-serif font-bold">100%</div>
              <div className="text-beige-400 font-bold uppercase tracking-widest text-[10px]">Personalized</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif font-bold">24/7</div>
              <div className="text-beige-400 font-bold uppercase tracking-widest text-[10px]">AI Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-serif font-bold">Free</div>
              <div className="text-beige-400 font-bold uppercase tracking-widest text-[10px]">For Students</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Me Section */}
      <section className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-beige-900">About Me</h2>
          <div className="w-24 h-1 bg-beige-800 mx-auto rounded-full" />
        </div>
        <div className="bg-white/60 backdrop-blur-md p-10 md:p-16 rounded-[64px] border border-beige-200 shadow-xl shadow-beige-900/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-sheen opacity-10 pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="w-48 h-48 bg-beige-100 rounded-[48px] flex items-center justify-center shrink-0 border border-beige-200 shadow-inner">
              <Star4 className="w-24 h-24 text-beige-300" />
            </div>
            <div className="space-y-6">
              <p className="text-xl text-beige-800 leading-relaxed font-medium">
                Hello! I’m Alishka Srivastava, and I’m thrilled to introduce you to Callista! What began as a simple idea has blossomed into a powerful tool for students. I truly understand the struggle of balancing studies, social life, and extracurriculars while striving for those top grades. That’s precisely why I created Callista—to lend a helping hand! With Callista, all your study materials and notes are neatly organized in one place, allowing you to focus on what really matters. As a 6th grader myself, I know how overwhelming expectations can feel, and I wanted to ensure that no one has to face these challenges alone. Together, we can turn aspirations into achievements and make those dream grades a reality!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section id="donation-section" className="max-w-5xl mx-auto px-4 pb-20">
        <div className="bg-beige-100/50 backdrop-blur-md p-12 md:p-20 rounded-[64px] border border-beige-200 text-center space-y-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-sheen opacity-20 pointer-events-none" />
          <div className="space-y-6 relative z-10">
            <div className="inline-flex p-4 bg-beige-800 rounded-3xl shadow-xl text-white mb-4">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-beige-900 leading-tight">
              Support Callista's Mission
            </h2>
            <p className="text-xl text-beige-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Callista is free for everyone. If you find it helpful, consider making a donation to help us keep it running and build more amazing tools for students like you!
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDonationModalOpen(true)}
            className="relative z-10 px-12 py-6 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all shadow-2xl flex items-center gap-3 mx-auto"
          >
            <Heart className="w-6 h-6" />
            Donate Now
          </motion.button>
        </div>
      </section>
    </div>
  );
};
