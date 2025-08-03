import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us - Jatt Clans</title>
        <meta name="description" content="Learn about Jatt Clans' mission and values" />
        <link rel="icon" href="/jutt-icon.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-coral-50">
        {/* Imported Navbar Component */}
        <Navbar activePage="about" />
        
        {/* Hero Section */}
        <section className="bg-teal-700 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="bg-coral-500 p-4 rounded-full">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Heritage, Our Pride</h1>
              <p className="text-xl">
                Preserving the glorious legacy of the Jatt community for future generations
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="bg-teal-100 p-6 rounded-xl mb-8">
                  <div className="flex items-center mb-4">
                    <div className="bg-teal-600 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-teal-800">Our Mission</h2>
                  </div>
                  <p className="text-teal-700">
                    Jatt Clans is dedicated to documenting, preserving, and celebrating the rich history and cultural heritage of the Jatt community worldwide.
                  </p>
                </div>
              </div>
              <div>
                <div className="space-y-6">
                  {[
                    {
                      icon: (
                        <svg className="w-6 h-6 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                      ),
                      text: "Document authentic Jatt history from reliable sources"
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      ),
                      text: "Connect Jatt communities across the globe"
                    },
                    {
                      icon: (
                        <svg className="w-6 h-6 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                      ),
                      text: "Educate younger generations about their heritage"
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1 mr-4">
                        {item.icon}
                      </div>
                      <p className="text-teal-800">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-teal-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-teal-800 mb-4">Our Core Values</h2>
              <p className="text-teal-700 max-w-2xl mx-auto">
                The principles that guide everything we do at Jatt Clans
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: "📜",
                  title: "Authenticity",
                  description: "Factual accuracy in all our content"
                },
                {
                  icon: "👥",
                  title: "Community",
                  title: "Community",
                  description: "Bringing Jatt people together"
                },
                {
                  icon: "🛡️",
                  title: "Preservation",
                  description: "Safeguarding cultural traditions"
                },
                {
                  icon: "🎓",
                  title: "Education",
                  description: "Resources to learn about Jatt history"
                },
                {
                  icon: "🌎",
                  title: "Global Reach",
                  description: "Recognizing worldwide Jatt impact"
                },
                {
                  icon: "💡",
                  title: "Innovation",
                  description: "Modern technology for ancient traditions"
                }
              ].map((value, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold text-teal-800 mb-2">{value.title}</h3>
                  <p className="text-teal-700">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-teal-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="bg-teal-600 p-2 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
              <p className="text-xl mb-8">
                Connect with us to learn more about Jatt heritage and contribute to our mission.
              </p>
              <Link href="/contact">
                <button className="bg-coral-600 hover:bg-coral-700 text-white px-8 py-3 rounded-lg font-medium shadow-md transition">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-teal-800 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2">
                <h3 className="text-xl font-bold mb-4">Jatt Clans</h3>
                <p className="text-teal-300">
                  Preserving and celebrating Jatt heritage for future generations.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Navigation</h4>
                <ul className="space-y-2">
                  <li><Link href="/articles" className="text-teal-300 hover:text-white transition">Articles</Link></li>
                  <li><Link href="/about" className="text-teal-300 hover:text-white transition">About</Link></li>
                  <li><Link href="/contact" className="text-teal-300 hover:text-white transition">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-4">Account</h4>
                <ul className="space-y-2">
                  <li><Link href="/profile" className="text-teal-300 hover:text-white transition">Profile</Link></li>
                  <li><Link href="/admin" className="text-teal-300 hover:text-white transition">Admin</Link></li>
                  <li><Link href="/logout" className="text-teal-300 hover:text-white transition">Logout</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-teal-700 pt-8 text-center text-teal-400 text-sm">
              <p>© {new Date().getFullYear()} Jatt Clans. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}