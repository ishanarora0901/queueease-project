import React, { useState } from 'react';
import { feedbackApi } from '../../api/campusApis';
import { Star, MessageSquare, CheckCircle, AlertCircle, Send } from 'lucide-react';

export const StudentFeedback = () => {
  const [category, setCategory] = useState('Queue Experience');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide feedback comments.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await feedbackApi.submitFeedback({
        category,
        rating,
        comment,
      });

      if (res.data.success) {
        setSubmitted(true);
        setComment('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Feedback & Grievances</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Share your experience with campus counters, staff availability, and queue times to help us continuously improve
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Feedback Submitted Successfully</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thank you for sharing your thoughts. Campus administration regularly reviews student feedback to optimize service efficiency.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
            >
              Submit Another Response
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Feedback Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="Queue Experience">Smart Queue Waiting Experience</option>
                <option value="Staff Behavior">Counter Officer & Staff Interaction</option>
                <option value="Service Delay">Service Turnaround & Wait Time</option>
                <option value="CAD Document Service">CAD Certificate & Transcripts Issuance</option>
                <option value="Payment Issue">Online Fee Payment & Receipts</option>
                <option value="General Suggestion">General Campus Improvement Idea</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-2">Overall Satisfaction Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : 'Needs Improvement'}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Your Detailed Feedback / Complaint</label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your experience or suggest how we can make campus services more convenient..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-teal-400" />
              {loading ? 'Submitting...' : 'Submit Grievance / Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

