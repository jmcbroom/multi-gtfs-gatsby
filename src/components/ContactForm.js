// components/ContactForm.js
import React, { useState } from 'react';
import { navigate } from 'gatsby';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const response = await fetch('/.netlify/functions/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Redirect to home page after successful submission
        navigate('/', {
          state: { feedbackSubmitted: true }
        });
      } else {
        console.error('Form submission failed!');
        setError(true);
      }
    } catch (err) {
      console.error('An error occurred during form submission:', err);
      setError(true);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto text-sm md:text-base">
      <h2 className="my-6 text-xl font-bold">Website Feedback</h2>

      {/* Notice about scope */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          <strong>Note:</strong> This form is for feedback about the transit.det.city website only.
          We do not operate the buses or transit services. For questions about schedules, fares,
          or service issues, please contact the transit agency directly.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          <span className="text-gray-700 dark:text-gray-300">Name</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 rounded px-3 py-2 mt-1 w-full"
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-700 dark:text-gray-300">Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 rounded px-3 py-2 mt-1 w-full"
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-700 dark:text-gray-300">Message</span>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 rounded px-3 py-2 mt-1 w-full"
          />
        </label>

        {error && (
          <p className="text-red-600 dark:text-red-400 mb-4">
            Something went wrong. Please try again.
          </p>
        )}

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-2 px-6 rounded transition-colors"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
