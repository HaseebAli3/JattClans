import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

export default function Home() {
  // Updated historical and inspirational Urdu quotes about Jutt community
  const braveQuotes = [
    "جٹ کی بہادری تاریخ کے اوراق میں سونے سے لکھی گئی ہے، ہماری ہمت ہماری شناخت ہے",
    "جٹ کی تلوار ہمیشہ حق کے لیے اٹھی، ہمارے آباؤ اجداد نے کبھی جھکنا نہ سیکھا",
    "جٹ قوم کی داستانیں بہادری اور قربانی کی عظیم مثالیں ہیں",
    "ہم جٹ ہیں، ہماری رگوں میں ہمت اور غیرت کا خون دوڑتا ہے",
    "جٹ کا عزم پہاڑوں کو چیر دیتا ہے، ہماری تاریخ گواہ ہے"
  ];

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Function to rotate quotes
  const rotateQuotes = useCallback(() => {
    setCurrentQuoteIndex((prev) => 
      prev === braveQuotes.length - 1 ? 0 : prev + 1
    );
  }, [braveQuotes.length]);

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(rotateQuotes, 5000);
    return () => clearInterval(interval);
  }, [rotateQuotes]);

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
        <nav className="p-4 bg-teal-700 text-white shadow-md sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold font-noto-urdu">جٹ کلینز</h1>
            <Link href="/articles" passHref legacyBehavior>
              <a className="text-sm md:text-base bg-teal-600 hover:bg-teal-800 px-3 py-1 rounded-md transition-colors">
                مضامین
              </a>
            </Link>
          </div>
        </nav>

        {/* Hero Section with Rotating Quotes */}
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
            
            {/* Animated Quotes Section */}
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

            {/* Hadith Section with Reference */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8 max-w-2xl mx-auto border-l-4 border-teal-500"
            >
              <div className="flex items-start mb-3">
                <div className="bg-teal-100 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-teal-900 font-noto-urdu">
                  رسول اللہ صلی اللہ علیہ وسلم کا فرمان
                </h3>
              </div>
              
              <div className="bg-teal-50 p-4 md:p-5 rounded-md mb-3">
                <p className="text-base md:text-lg text-gray-800 font-noto-urdu leading-relaxed">
                  &quot;بے شک اللہ تعالیٰ نے تم سے جاہلیت کی نخوت و غرور کو ختم کر دیا اور باپ دادا کا نام لے کر فخر کرنے سے روک دیا۔ اب دو قسم کے لوگ ہیں: ایک متقی و پرہیزگار مومن اور دوسرا بدبخت فاجر۔ تم سب آدم کی اولاد ہو اور آدم مٹی سے پیدا ہوئے ہیں۔ لوگوں کو اپنی قوموں پر فخر کرنا چھوڑ دینا چاہیے کیونکہ ان کے آباء جہنم کے کوئلوں میں سے کوئلہ ہیں اس لیے کہ وہ کافر تھے اور کوئلے پر فخر کرنے کے کیا معنی۔ اگر انہوں نے اپنے آباء پر فخر کرنا نہ چھوڑا تو اللہ کے نزدیک اس گبریلے کیڑے سے بھی زیادہ ذلیل ہو جائیں گے جو اپنی ناک سے گندگی کو دھکیل کر لے جاتا ہے۔&quot;
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-teal-700 font-medium">
                  <span className="font-bold">حوالہ:</span> سنن الترمذی، کتاب المناقب، باب فضل العرب، حدیث نمبر 3955
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Link href="/articles" passHref legacyBehavior>
                <a className="inline-flex items-center bg-teal-600 hover:bg-teal-800 text-white px-6 py-2 md:px-8 md:py-3 rounded-lg font-medium shadow-md transition duration-300 hover:scale-105">
                  <span className="mr-2 font-noto-urdu">مضامین دیکھیں</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </Link>
            </motion.div>
          </section>

          {/* Features Grid */}
          <section className="mt-10 md:mt-16">
            <motion.h3 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-xl md:text-3xl font-bold text-center text-teal-900 mb-6 md:mb-10 font-noto-urdu"
            >
              ہمارے خاص موضوعات
            </motion.h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[
                {
                  title: "تاریخی مقامات",
                  description: "جٹ قوم سے منسلک اہم تاریخی مقامات اور ان کی کہانیاں",
                  icon: "🏰"
                },
                {
                  title: "قومی رہنما",
                  description: "جٹ برادری کے عظیم رہنماؤں کی زندگی کے اہم واقعات",
                  icon: "👑"
                },
                {
                  title: "ثقافتی ورثہ",
                  description: "روایتی رقص، موسیقی، پکوان اور تہوار",
                  icon: "🎭"
                },
                {
                  title: "جنگی خدمات",
                  description: "جٹ قوم کی فوجی خدمات اور بہادری کے قصے",
                  icon: "⚔️"
                },
                {
                  title: "زرعی روایات",
                  description: "کاشتکاری اور زمین داری سے متعلق روایتی علم",
                  icon: "🌾"
                },
                {
                  title: "ادبی خدمات",
                  description: "جٹ ادیبوں، شاعروں اور دانشوروں کا تعارف",
                  icon: "📚"
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + (index * 0.1), duration: 0.5 }}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 hover:shadow-lg transition duration-300 flex flex-col h-full"
                >
                  <div className="bg-teal-600 p-4 md:p-6 text-white flex items-center">
                    <span className="text-2xl mr-3">{feature.icon}</span>
                    <h4 className="font-bold text-base md:text-xl font-noto-urdu">{feature.title}</h4>
                  </div>
                  <div className="p-4 md:p-6 flex-grow">
                    <p className="text-teal-700 text-sm md:text-base font-noto-urdu">{feature.description}</p>
                  </div>
                  <div className="px-4 pb-4">
                    <Link href="/articles" passHref legacyBehavior>
                      <a className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center">
                        <span className="font-noto-urdu">مزید پڑھیں</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-12 md:mt-16 bg-teal-700 rounded-xl p-6 md:p-8 text-center text-white"
          >
            <h3 className="text-xl md:text-2xl font-bold mb-4 font-noto-urdu">کیا آپ جٹ برادری کے بارے میں مزید جاننا چاہتے ہیں؟</h3>
            <p className="mb-6 text-teal-100 font-noto-urdu">ہمارے جامع انسائیکلوپیڈیا میں جٹ قوم کی تاریخ، ثقافت اور روایات کے بارے میں مکمل معلومات حاصل کریں</p>
            <Link href="/articles" passHref legacyBehavior>
              <a className="inline-flex items-center bg-white text-teal-700 hover:bg-gray-100 px-6 py-2 md:px-8 md:py-3 rounded-lg font-medium shadow-md transition duration-300">
                <span className="mr-2 font-noto-urdu">ابھی دریافت کریں</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </Link>
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="bg-teal-800 text-white py-6 md:py-8 mt-12 md:mt-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-bold font-noto-urdu">جٹ کلینز</h2>
                <p className="text-teal-200 text-sm mt-1 font-noto-urdu">جٹ برادری کا مکمل انسائیکلوپیڈیا</p>
              </div>
              <div className="flex space-x-4">
                <a href="#" className="text-teal-200 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                  </svg>
                </a>
                <a href="#" className="text-teal-200 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                  </svg>
                </a>
                <a href="#" className="text-teal-200 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="border-t border-teal-700 mt-6 pt-6 text-center">
              <p className="text-teal-200 text-sm font-noto-urdu">
                © {new Date().getFullYear()} جٹ کلینز - تمام حقوق محفوظ ہیں
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}