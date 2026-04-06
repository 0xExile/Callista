import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, CheckCircle2, Users, ArrowLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, auth } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';

export const ReviewPage = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !review.trim() || !auth.currentUser) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhoto: auth.currentUser.photoURL || '',
        rating,
        comment: review,
        timestamp: serverTimestamp()
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-32 px-4 text-center space-y-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-beige-500 hover:text-beige-900 font-bold uppercase tracking-widest text-xs transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to Home
        </Link>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-bold text-beige-900">Thank You!</h1>
          <p className="text-xl text-beige-600">Your feedback helps us make Callista even better for everyone.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => setSubmitted(false)}
            className="px-8 py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all"
          >
            Write Another Review
          </button>
          <Link 
            to="/all-reviews"
            className="px-8 py-4 bg-white border-2 border-beige-200 text-beige-800 rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-50 transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            View Other Reviews
          </Link>
        </div>
      </div>
    );
  }

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
          <MessageSquare className="w-8 h-8 text-beige-600" />
        </div>
        <h1 className="text-5xl font-serif font-bold text-beige-900">Customer Reviews</h1>
        <p className="text-beige-600 font-medium">We value your thoughts and experiences.</p>
        
        <Link 
          to="/all-reviews"
          className="inline-flex items-center gap-2 text-beige-600 hover:text-beige-900 font-bold uppercase tracking-widest text-sm transition-colors"
        >
          <Users className="w-4 h-4" />
          View reviews by other users
        </Link>
      </div>

      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 space-y-12">
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-serif font-bold text-beige-900">Share Your Experience</h2>
          
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-all transform hover:scale-125 active:scale-95"
              >
                <Star 
                  className={cn(
                    "w-12 h-12 transition-colors",
                    (hoverRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-beige-200"
                  )} 
                />
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-widest text-beige-600 ml-4">Your Thoughts</label>
            <textarea 
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What do you love about Callista? What can we improve?"
              rows={6}
              className="w-full p-6 bg-beige-50 border-2 border-beige-100 rounded-[32px] focus:outline-none focus:border-beige-400 transition-all text-lg"
            />
          </div>

          <button 
            type="submit"
            disabled={rating === 0 || !review.trim() || isSubmitting}
            className="w-full py-5 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
