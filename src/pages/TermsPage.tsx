import React from 'react';
import { motion } from 'motion/react';
import { FileText, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage = () => {
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
          <FileText className="w-8 h-8 text-beige-600" />
        </div>
        <h1 className="text-5xl font-serif font-bold text-beige-900">Terms of Service</h1>
        <p className="text-beige-600 font-medium">Last updated: March 30, 2026</p>
      </div>

      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 space-y-8 text-beige-800 leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-beige-400" />
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Callista Learning, you agree to be bound by these terms. 
            If you do not agree, please do not use our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-beige-400" />
            2. User Responsibilities
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your account information 
            and for all activities that occur under your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
            <FileText className="w-6 h-6 text-beige-400" />
            3. Intellectual Property
          </h2>
          <p>
            All content and software on Callista Learning are the property of Callista Learning 
            or its licensors and are protected by copyright and other laws.
          </p>
        </section>
      </div>
    </div>
  );
};
