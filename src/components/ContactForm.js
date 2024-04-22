// components/ContactForm.js
import React, { useState } from 'react';

  const ContactForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      message: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      setLoading(true);

      try {
        const response = await fetch('/.netlify/functions/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          console.log('Form submitted successfully!');
          setSuccess(true);
          // Handle success (e.g., show a success message)
        } else {
          console.error('Form submission failed!');
          // Handle failure (e.g., show an error message)
        }
      } catch (error) {
        console.error('An error occurred during form submission:', error);
      }

      setLoading(false);
    };

    return (
      <form onSubmit={handleSubmit} className="max-w-sm mx-auto text-sm md:text-base">
        <h2 className="my-8">Contact form</h2>
        <label className="block mb-2">
          Name:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 px-3 py-2 mt-1 w-full"
          />
        </label>
        <br />
        <label className="block mb-2">
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 px-3 py-2 mt-1 w-full"
          />
        </label>
        <br />
        <label className="block mb-2">
          Message:
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 px-3 py-2 mt-1 w-full"
          />
        </label>
        <br />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-800 text-white dark:text-zinc-800 dark:hover:text-zinc-400 font-bold py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        {success && <p className="font-semibold text-gray-200 dark:text-zinc-500 mt-8">Form submitted successfully!</p>}
      </form>
    );
  };

  export default ContactForm;
