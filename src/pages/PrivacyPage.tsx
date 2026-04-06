import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPage = () => {
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
          <Shield className="w-8 h-8 text-beige-600" />
        </div>
        <h1 className="text-5xl font-serif font-bold text-beige-900">Privacy Policy</h1>
        <p className="text-beige-600 font-medium">Last updated: March 30, 2026</p>
      </div>

      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 space-y-8 text-beige-800 leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
            <Lock className="w-6 h-6 text-beige-400" />
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, 
            use our AI features, or contact support. This may include your name, email address, 
            and study preferences.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
            <Eye className="w-6 h-6 text-beige-400" />
            2. How We Use Your Information
          </h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, 
            including personalizing your learning experience with Callista AI.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
            <FileText className="w-6 h-6 text-beige-400" />
            3. Data Security
          </h2>
          <p>
            We take reasonable measures to help protect information about you from loss, 
            theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
          </p>
        </section>
      </div>
    </div>
  );
};
