import React from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, XCircle, AlertCircle, ArrowLeft, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RefundPolicyPage = () => {
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
          <RefreshCcw className="w-8 h-8 text-beige-600" />
        </div>
        <h1 className="text-5xl font-serif font-bold text-beige-900">Refund & Cancellation</h1>
        <p className="text-beige-600 font-medium">Last updated: March 30, 2026</p>
      </div>

      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 space-y-8 text-beige-800 leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3 text-beige-900">
            <Heart className="w-6 h-6 text-beige-400" />
            1. Free Service & Donations
          </h2>
          <p>
            Callista Learning is currently a free platform designed to support students. Any donations made to the platform are voluntary and are used to maintain our servers and develop new features. As these are voluntary contributions to support a free service, donations are generally non-refundable.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3 text-beige-900">
            <XCircle className="w-6 h-6 text-beige-400" />
            2. Account Cancellation
          </h2>
          <p>
            You may stop using our services or delete your account at any time. To delete your account and all associated data (including gems, XP, and study notes), please visit your Account page or contact our support team. Once an account is deleted, the data cannot be recovered.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3 text-beige-900">
            <AlertCircle className="w-6 h-6 text-beige-400" />
            3. Future Paid Features
          </h2>
          <p>
            In the event that Callista introduces paid premium features or subscriptions in the future, specific refund terms for those services will be clearly outlined at the time of purchase. We aim to provide a fair and transparent experience for all our users.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold flex items-center gap-3 text-beige-900">
            <RefreshCcw className="w-6 h-6 text-beige-400" />
            4. Contact Us
          </h2>
          <p>
            If you have any questions about our Refund or Cancellation policy, or if you encounter any issues with a donation, please reach out to us at <span className="font-bold text-beige-900">callistalearning@gmail.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
};
