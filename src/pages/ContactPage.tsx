import React from 'react';
import { motion } from 'motion/react';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactPage = () => {
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
          <Mail className="w-8 h-8 text-beige-600" />
        </div>
        <h1 className="text-5xl font-serif font-bold text-beige-900">Contact Us</h1>
        <p className="text-beige-600 font-medium">We'd love to hear from you!</p>
      </div>

      <div className="grid grid-cols-1 gap-8 max-w-md mx-auto">
        <div className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-beige-200 text-center space-y-4">
          <div className="w-12 h-12 bg-beige-100 rounded-xl flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-beige-600" />
          </div>
          <h3 className="text-xl font-serif font-bold text-beige-900">Email</h3>
          <p className="text-beige-600 text-sm">callistalearning@gmail.com</p>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 space-y-8">
        <h2 className="text-3xl font-serif font-bold text-beige-900 text-center">Send us a Message</h2>
        <form 
          className="space-y-6 max-w-2xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Message sent! I'll get back to you soon.");
            (e.target as HTMLFormElement).reset();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input required type="text" placeholder="Your Name" className="w-full p-4 bg-beige-50 border border-beige-200 rounded-2xl focus:outline-none focus:border-beige-400 transition-all" />
            <input required type="email" placeholder="Your Email" className="w-full p-4 bg-beige-50 border border-beige-200 rounded-2xl focus:outline-none focus:border-beige-400 transition-all" />
          </div>
          <textarea required placeholder="Your Message" rows={6} className="w-full p-4 bg-beige-50 border border-beige-200 rounded-2xl focus:outline-none focus:border-beige-400 transition-all" />
          <button type="submit" className="w-full py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all flex items-center justify-center gap-2">
            Send Message
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
