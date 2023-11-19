
import React from "react"

const ContactPage = () => {

  let labelClasses = "block text-gray-700 dark:text-gray-300 font-base mb-2"
  return (
    <div className="flex flex-col items-center my-8 px-4 md:px-0">
      <form name="contact" data-netlify="true" method="POST" action="/thank-you/" className="w-full max-w-lg p-4">
        <input type="hidden" name="contact" value='Contact Form' />
        <div className="mb-4">
          <label className={labelClasses} htmlFor="name">
            Your Name:
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="name"
            type="text"
            name="name"
            placeholder="John Doe"
          />
        </div>
        <div className="mb-4">
          <label className={labelClasses} htmlFor="email">
            Your Email:
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            name="email"
            placeholder="johndoe@example.com"
          />
        </div>
        <div className="mb-4">
          <label className={labelClasses} htmlFor="message">
            Message:
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="message"
            name="message"
            rows="5"
            placeholder="Enter your message here"
          ></textarea>
        </div>
        <div className="flex">
          <button
            className="bg-blue-500 hover:bg-blue-700 dark:bg-purple-900 dark:hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

export default ContactPage