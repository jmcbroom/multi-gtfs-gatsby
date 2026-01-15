
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

export const Head = () => {
  const title = "Thank You | transit.det.city";
  const description = "Thank you for your message.";
  const url = "https://transit.det.city/thank-you";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <link rel="canonical" href={url} />
    </>
  );
};
