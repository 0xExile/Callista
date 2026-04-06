import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { HelpCircle, Mail, MessageSquare, ArrowLeft } from 'lucide-react';

export const SupportPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-20 px-4 space-y-12">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-beige-500 hover:text-beige-900 font-bold uppercase tracking-widest text-xs transition-all group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Return to Home
      </Link>

      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8 text-beige-600" />
        </div>
        <h1 className="text-5xl font-serif font-bold text-beige-900">Support Center</h1>
        <p className="text-beige-600 font-medium">How can I help you today?</p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-white/60 backdrop-blur-md p-10 rounded-[40px] border border-beige-200 space-y-6 text-center">
          <div className="w-12 h-12 bg-beige-100 rounded-xl flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-beige-600" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-beige-900">Email Me</h3>
          <p className="text-beige-600">Send me an email and I'll get back to you as soon as I can!</p>
          <button 
            onClick={() => window.open('mailto:callistalearning@gmail.com', '_blank')}
            className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all"
          >
            Send Email
          </button>
        </div>

        <div className="bg-white/60 backdrop-blur-md p-10 rounded-[40px] border border-beige-200 space-y-6 text-center">
          <div className="w-12 h-12 bg-beige-100 rounded-xl flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6 text-beige-600" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-beige-900">Start Chat</h3>
          <p className="text-beige-600">Talk to Callista AI for instant help with your studies!</p>
          <button 
            onClick={() => navigate('/ai')}
            className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all"
          >
            Go to Chat
          </button>
        </div>
      </div>
    </div>
  );
};
