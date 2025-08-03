import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

const braveQuotes = [
  "جٹ کی بہادری تاریخ کے اوراق میں سونے سے لکھی گئی ہے، ہماری ہمت ہماری شناخت ہے",
  "جٹ کی تلوار ہمیشہ حق کے لیے اٹھی، ہمارے آباؤ اجداد نے کبھی جھکنا نہ سیکھا",
  "جٹ قوم کی داستانیں بہادری اور قربانی کی عظیم مثالیں ہیں",
  "ہم جٹ ہیں، ہماری رگوں میں ہمت اور غیرت کا خون دوڑتا ہے",
  "جٹ کا عزم پہاڑوں کو چیر دیتا ہے، ہماری تاریخ گواہ ہے"
];

const features = [
  {
    title: "تاریخی مقامات",
    description: "جٹ قوم سے منسلک اہم تاریخی مقامات اور ان کی کہانیاں",
    
  },
  {
    title: "قومی رہنما",
    description: "جٹ برادری کے عظیم رہنماؤں کی زندگی کے اہم واقعات",
    
  },
  {
    title: "ثقافتی ورثہ",
    description: "روایتی رقص، موسیقی، پکوان اور تہوار",
   
  },
  {
    title: "جنگی خدمات",
    description: "جٹ قوم کی فوجی خدمات اور بہادری کے قصے",
    
  },
  {
    title: "زرعی روایات",
    description: "کاشتکاری اور زمین داری سے متعلق روایتی علم",
    
  },
  {
    title: "ادبی خدمات",
    description: "جٹ ادیبوں، شاعروں اور دانشوروں کا تعارف",
    
  }
];

const quoteVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function Home() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const rotateQuotes = useCallback(() => {
    setCurrentQuoteIndex((prev) => 
      prev === braveQuotes.length - 1 ? 0 : prev + 1
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(rotateQuotes, 5000);
    return () => clearInterval(interval);
  }, [rotateQuotes]);

  return (
    <>
      <Head>
        <title>جٹ کلینز - جٹ برادری کا انسائیکلو پیڈیا</title>
        <meta name="description" content="جٹ برادری کی تاریخ، ثقافت اور روایات کا جامع انسائیکلو پیڈیا" />
        <link rel="icon" href="/jutt-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-amber-50">
        <NavBar />
        
        <main className="container mx-auto px-4 py-6 md:py-12">
          <HeroSection currentQuoteIndex={currentQuoteIndex} />
          
          <FeaturesSection />
        </main>

        <Footer />
      </div>
    </>
  );
}

function NavBar() {
  return (
    <nav className="p-4 bg-teal-700 text-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold font-noto-urdu">جٹ کلینز</h1>
      </div>
    </nav>
  );
}

function HeroSection({ currentQuoteIndex }) {
  return (
    <section className="max-w-3xl mx-auto text-center">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl md:text-5xl font-bold text-teal-900 mb-6 font-noto-urdu"
      >
        جٹ برادری کا مکمل انسائیکلو پیڈیا
      </motion.h2>
      
      <QuoteSection currentQuoteIndex={currentQuoteIndex} />
      
      <HadithSection />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Link href="/articles" passHref legacyBehavior>
          <a className="inline-flex items-center bg-teal-600 hover:bg-teal-800 text-white px-6 py-2 md:px-8 md:py-3 rounded-lg font-medium shadow-md transition duration-300 hover:scale-105">
            <span className="mr-2 font-noto-urdu">مضامین دیکھیں</span>
            <ArrowIcon />
          </a>
        </Link>
      </motion.div>
    </section>
  );
}

function QuoteSection({ currentQuoteIndex }) {
  return (
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
  );
}

function HadithSection() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8 max-w-2xl mx-auto border-l-4 border-teal-500"
    >
      <div className="flex items-start mb-3">
        <div className="bg-teal-100 p-2 rounded-full mr-3">
          <DocumentIcon />
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
  );
}

function FeaturesSection() {
  return (
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
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }) {
  return (
    <motion.div 
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
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="bg-teal-800 text-white py-6 md:py-8 mt-12 md:mt-16">
      <div className="container mx-auto px-4 text-center">
        <p className="text-teal-200 text-sm font-noto-urdu">
          جٹ کلینز - تمام حقوق محفوظ ہیں
        </p>
      </div>
    </footer>
  );
}

function DocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}