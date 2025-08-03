import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

export default function Home() {
  const braveQuotes = [
    "جٹ کی بہادری تاریخ کے اوراق میں سونے سے لکھی گئی ہے، ہماری ہمت ہماری شناخت ہے",
    "جٹ کی تلوار ہمیشہ حق کے لیے اٹھی، ہمارے آباؤ اجداد نے کبھی جھکنا نہ سیکھا",
    "جٹ قوم کی داستانیں بہادری اور قربانی کی عظیم مثالیں ہیں",
    "ہم جٹ ہیں، ہماری رگوں میں ہمت اور غیرت کا خون دوڑتا ہے",
    "جٹ کا عزم پہاڑوں کو چیر دیتا ہے، ہماری تاریخ گواہ ہے"
  ];

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const rotateQuotes = useCallback(() => {
    setCurrentQuoteIndex((prev) => 
      prev === braveQuotes.length - 1 ? 0 : prev + 1
    );
  }, [braveQuotes.length]);

  useEffect(() => {
    const interval = setInterval(rotateQuotes, 5000);
    return () => clearInterval(interval);
  }, [rotateQuotes]);

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
        <nav className="p-4 bg-teal-700 text-white shadow-md sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold font-noto-urdu">جٹ کلینز</h1>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-6 md:py-12">
          <section className="max-w-3xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-5xl font-bold text-teal-900 mb-6 font-noto-urdu"
            >
              جٹ برادری کا مکمل انسائیکلو پیڈیا
            </motion.h2>
            
            <div className="min-h-[80px] md:min-h-[100px] flex items-center justify-center mb-6 md:mb-8">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuoteIndex}
                  variants={quoteVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className="text-xl md:text-2xl font-extrabold text-black font-noto-urdu px-4"
                >
                  {braveQuotes[currentQuoteIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-8"
            >
              <Link href="/articles" passHref legacyBehavior>
                <a className="inline-flex items-center bg-teal-600 hover:bg-teal-800 text-white px-8 py-3 rounded-lg font-medium shadow-md transition duration-300 hover:scale-105">
                  <span className="mr-2 font-noto-urdu">مضامین دیکھیں</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </Link>
            </motion.div>
          </section>

          <footer className="bg-teal-800 text-white py-6 md:py-8 mt-12 md:mt-16">
            <div className="container mx-auto px-4 text-center">
              <p className="text-teal-200 text-sm font-noto-urdu">
                © {new Date().getFullYear()} جٹ کلینز - تمام حقوق محفوظ ہیں
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}