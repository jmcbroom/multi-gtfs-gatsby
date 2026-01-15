
import React from "react"
import ContactForm from "../components/ContactForm"

const ContactPage = () => {
  return (
    <div className="flex flex-col items-center my-8 px-4 md:px-0">
      <ContactForm />
    </div>
  )
}

export default ContactPage

export const Head = () => {
  const title = "Contact Us | transit.det.city";
  const description = "Get in touch with the transit.det.city team.";
  const url = "https://transit.det.city/contact-us";

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