import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const subject = encodeURIComponent(`Contact from ${formData.name}`);
      const body = encodeURIComponent(`${formData.message}\n\nFrom: ${formData.name}\nEmail: ${formData.email}`);
      
      // Open user's email client
      window.location.href = `mailto:aliraza59905@gmail.com?subject=${subject}&body=${body}`;
      
      // Reset form and show success message
      setFormData({
        name: '',
        email: '',
        message: ''
      });
      setIsSubmitted(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us - Jatt Clans</title>
        <meta name="description" content="Get in touch with Jatt Clans team" />
        <link rel="icon" href="/jutt-icon.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-coral-50">
        {/* Imported Navbar Component */}
        <Navbar activePage="contact" />
        
        {/* Hero Section */}
        <section className="bg-teal-700 text-white py-8 sm:py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-center mb-4">
                <div className="bg-coral-500 p-3 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Get In Touch</h1>
              <p className="text-sm sm:text-lg">
                Have questions or suggestions? We'd love to hear from you!
              </p>
            </div>
          </div>
        </section>

        {/* Success Message */}
        {isSubmitted && (
          <div className="container mx-auto px-4 mt-6">
            <div className="max-w-2xl mx-auto bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div>
                  <h3 className="font-bold">Thank You!</h3>
                  <p>Your message has been prepared. Please check your email client to send it. We appreciate you reaching out to us!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Form Section */}
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-teal-800 mb-6">Send us a message</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-4 sm:mb-6">
                    <label htmlFor="name" className="block text-teal-700 font-medium mb-2 text-sm sm:text-base">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 text-teal-800 text-sm sm:text-base"
                      required
                    />
                  </div>
                  
                  <div className="mb-4 sm:mb-6">
                    <label htmlFor="email" className="block text-teal-700 font-medium mb-2 text-sm sm:text-base">
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 text-teal-800 text-sm sm:text-base"
                      required
                    />
                  </div>
                  
                  <div className="mb-6 sm:mb-8">
                    <label htmlFor="message" className="block text-teal-700 font-medium mb-2 text-sm sm:text-base">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="4"
                      className="w-full px-3 sm:px-4 py-2 border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 text-teal-800 text-sm sm:text-base"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`${isLoading ? 'bg-teal-400' : 'bg-teal-600 hover:bg-teal-700'} text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium shadow-md transition flex items-center text-sm sm:text-base`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Why Contact Section */}
        <section className="py-8 sm:py-12 bg-teal-50">
          <div className="container mx-auto px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-teal-800 mb-8 sm:mb-12">Why Reach Out?</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-4">
                  <div className="bg-teal-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-4 0H7a2 2 0 01-2-2v-6a2 2 0 012-2h2m4 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0h-2"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-teal-800">Share Your Story</h3>
                </div>
                <p className="text-teal-700 text-sm sm:text-base">Have a unique Jatt heritage story or article idea? Let us know and contribute to our community!</p>
              </div>
              
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-4">
                  <div className="bg-teal-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5v-4a2 2 0 012-2h10a2 2 0 012 2v4h-4m-6 0h.01M12 16h.01"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-teal-800">Collaborate with Us</h3>
                </div>
                <p className="text-teal-700 text-sm sm:text-base">Interested in partnering or collaborating on projects celebrating Jatt culture? Reach out!</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-teal-800 text-white py-6 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mb-4 sm:mb-8">
              <div className="col-span-2">
                <h3 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">Jatt Clans</h3>
                <p className="text-teal-300 text-sm sm:text-base">
                  Preserving and celebrating Jatt heritage for future generations.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Navigation</h4>
                <ul className="space-y-1 sm:space-y-2">
                  <li><Link href="/articles" className="text-teal-300 hover:text-white transition text-sm sm:text-base">Articles</Link></li>
                  <li><Link href="/about" className="text-teal-300 hover:text-white transition text-sm sm:text-base">About</Link></li>
                  <li><Link href="/contact" className="text-teal-300 hover:text-white transition text-sm sm:text-base">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">Account</h4>
                <ul className="space-y-1 sm:space-y-2">
                  <li><Link href="/profile" className="text-teal-300 hover:text-white transition text-sm sm:text-base">Profile</Link></li>
                  <li><Link href="/admin" className="text-teal-300 hover:text-white transition text-sm sm:text-base">Admin</Link></li>
                  <li><Link href="/logout" className="text-teal-300 hover:text-white transition text-sm sm:text-base">Logout</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-teal-700 pt-4 sm:pt-6 text-center text-teal-400 text-xs sm:text-sm">
              <p>© {new Date().getFullYear()} Jatt Clans. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}