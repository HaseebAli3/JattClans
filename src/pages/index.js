import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

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

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => 
        prev === braveQuotes.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [braveQuotes.length]);

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
            <h2 className="text-2xl md:text-5xl font-bold text-teal-900 mb-6 font-noto-urdu">
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
                  className="text-xl md:text-2xl font-extrabold text-black font-noto-urdu px-4"
                >
                  {braveQuotes[currentQuoteIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Hadith Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-2xl mx-auto">
              <h3 className="text-lg md:text-xl font-bold text-teal-900 mb-4 font-noto-urdu">
                رسول اللہ صلی اللہ علیہ وسلم کا فرمان
              </h3>
              <p className="text-base md:text-lg text-gray-800 font-noto-urdu leading-relaxed">
                رسول اللہ صلی اللہ علیہ وسلم نے فرمایا: <br />
                &quot;بے شک اللہ تعالیٰ نے تم سے جاہلیت کی نخوت و غرور کو ختم کر دیا اور باپ دادا کا نام لے کر فخر کرنے سے روک دیا۔ اب دو قسم کے لوگ ہیں: ایک متقی و پرہیزگار مومن اور دوسرا بدبخت فاجر۔ تم سب آدم کی اولاد ہو اور آدم مٹی سے پیدا ہوئے ہیں۔ لوگوں کو اپنی قوموں پر فخر کرنا چھوڑ دینا چاہیے کیونکہ ان کے آباء جہنم کے کوئلوں میں سے کوئلہ ہیں اس لیے کہ وہ کافر تھے اور کوئلے پر فخر کرنے کے کیا معنی۔ اگر انہوں نے اپنے آباء پر فخر کرنا نہ چھوڑا تو اللہ کے نزدیک اس گبریلے کیڑے سے بھی زیادہ ذلیل ہو جائیں گے جو اپنی ناک سے گندگی کو دھکیل کر لے جاتا ہے۔&quot;
              </p>
            </div>

            <Link href="/articles" passHref legacyBehavior>
              <a className="inline-block bg-teal-600 hover:bg-teal-800 text-white px-6 py-2 md:px-8 md:py-3 rounded-lg font-medium shadow-md transition duration-300 hover:scale-105">
                مضامین دیکھیں
              </a>
            </Link>
          </section>

          {/* Features Grid */}
          <section className="mt-12 md:mt-16">
            <h3 className="text-xl md:text-3xl font-bold text-center text-teal-900 mb-8 md:mb-12 font-noto-urdu">
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
                  <div className="bg-teal-600 p-3 md:p-6 text-white">
                    <h4 className="font-bold text-base md:text-xl font-noto-urdu">{feature.title}</h4>
                  </div>
                  <div className="p-3 md:p-6">
                    <p className="text-teal-700 text-xs md:text-base font-noto-urdu">{feature.description}</p>
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