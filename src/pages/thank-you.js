
import { useEffect } from 'react';
import React from 'react';
import { navigate } from '@reach/router';

const ThankYouPage = () => {

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('../');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center mb-8 mt-16">
      <h2>Thank you for your submission!</h2>
      <p>You will be redirected to the homepage in 5 seconds.</p>
    </div>
  );
};

export default ThankYouPage;
