import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Home() {
  // Brave and powerful Urdu quotes about Jutt community
  const braveQuotes = [
    "جٹ دا جھنڈا ہمیشہ بلند رہے، ہمت ہماری شناخت ہے",
    "ہم جٹ ہیں، ہمت ہماری وراثت ہے، بزدلی ہمارے خون میں نہیں",
    "جٹ کی تلوار سے دشمن کبھی نہیں جیتے، ہماری بہادری کی داستانیں تاریخ سناتی ہیں",
    "جٹ کا ایک ہی نعرہ: زمین ہماری، ناموس ہماری، جان ہماری",
    "جٹ جھکنے سے پہلے ٹوٹ جاتا ہے"
  ];

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => 
        prev === braveQuotes.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animation variants
  const quoteVariants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <>
      <Head>
        <title>جٹ کلینز - جٹ برادری کا انسائیکلو پیڈیا</title>
        <meta name="description" content="جٹ برادری کی تاریخ، ثقافت اور روایات کا جامع انسائیکلو پیڈیا" />
        <link rel="icon" href="/jutt-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-amber-50">
        {/* Navigation */}
        <nav className="p-4 bg-teal-700 text-white shadow-md">
          <div className="container mx-auto flex justify-start">
            <h1 className="text-2xl font-bold font-noto-urdu">جٹ کلینز</h1>
          </div>
        </nav>

        {/* Hero Section with Rotating Quotes */}
        <main className="container mx-auto px-4 py-8 md:py-12">
          <section className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-teal-900 mb-6 font-noto-urdu">
              جٹ برادری کا مکمل انسائیکلو پیڈیا
            </h2>
            
            {/* Animated Quotes Section */}
            <div className="min-h-[80px] md:min-h-[100px] flex items-center justify-center mb-8">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuoteIndex}
                  variants={quoteVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="text-xl md:text-2xl font-bold text-amber-700 font-noto-urdu px-4"
                >
                  {braveQuotes[currentQuoteIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <Link href="/articles" passHref legacyBehavior>
              <a className="inline-block bg-teal-600 hover:bg-teal-800 text-white px-6 py-2 md:px-8 md:py-3 rounded-lg font-medium shadow-md transition duration-300 hover:scale-105">
                مضامین دیکھیں
              </a>
            </Link>
          </section>

          {/* Features Grid */}
          <section className="mt-12 md:mt-16">
            <h3 className="text-2xl md:text-3xl font-bold text-center text-teal-900 mb-8 md:mb-12 font-noto-urdu">
              ہمارے خاص موضوعات
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[
                {
                  title: "تاریخی مقامات",
                  description: "جٹ قوم سے منسلک اہم تاریخی مقامات اور ان کی کہانیاں"
                },
                {
                  title: "قومی رہنما",
                  description: "جٹ برادری کے عظیم رہنماؤں کی زندگی کے اہم واقعات"
                },
                {
                  title: "ثقافتی ورثہ",
                  description: "روایتی رقص، موسیقی، پکوان اور تہوار"
                },
                {
                  title: "جنگی خدمات",
                  description: "جٹ قوم کی فوجی خدمات اور بہادری کے قصے"
                },
                {
                  title: "زرعی روایات",
                  description: "کاشتکاری اور زمین داری سے متعلق روایتی علم"
                },
                {
                  title: "ادبی خدمات",
                  description: "جٹ ادیبوں، شاعروں اور دانشوروں کا تعارف"
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 hover:shadow-lg transition duration-300"
                >
                  <div className="bg-teal-600 p-4 md:p-6 text-white">
                    <h4 className="font-bold text-lg md:text-xl font-noto-urdu">{feature.title}</h4>
                  </div>
                  <div className="p-4 md:p-6">
                    <p className="text-teal-700 text-sm md:text-base font-noto-urdu">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-teal-700 text-white py-4 md:py-6 mt-8 md:mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-teal-200 text-xs md:text-sm font-noto-urdu">
              © {new Date().getFullYear()} جٹ کلینز - تمام حقوق محفوظ ہیں
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}