import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>جٹ کلینز - جٹ برادری کا انسائیکلو پیڈیا</title>
        <meta name="description" content="جٹ برادری کی تاریخ، ثقافت اور روایات کا جامع انسائیکلو پیڈیا" />
        <link rel="icon" href="/jutt-icon.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-amber-50">
        {/* Navigation */}
        <nav className="p-4 bg-teal-700 text-white shadow-md">
          <div className="container mx-auto flex justify-center sm:justify-start">
            <h1 className="text-2xl font-bold font-noto-urdu">جٹ کلینز</h1>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto px-4 py-12">
          <section className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-teal-900 mb-6 font-noto-urdu">
              جٹ برادری کا مکمل انسائیکلو پیڈیا
            </h2>
            <p className="text-xl text-teal-800 mb-4 font-noto-urdu">
              دریافت کریں جٹ قوم کی شاندار تاریخ، ثقافت، روایات اور عظیم شخصیات کے بارے میں جامع معلومات
            </p>
            <p className="text-lg text-teal-900 italic mb-8 font-noto-urdu">
              &quot;جٹ دی شان، زمین تے ایمان دی پہچان&quot;
            </p>
            <Link href="/articles" passHref legacyBehavior>
              <a className="inline-block bg-teal-600 hover:bg-teal-800 text-white px-8 py-3 rounded-lg font-medium shadow-md transition duration-300">
                مضامین دیکھیں
              </a>
            </Link>
          </section>

          {/* Features Section */}
          <section className="mt-16">
            <h3 className="text-3xl font-bold text-center text-teal-900 mb-12 font-noto-urdu">
              ہمارے خاص موضوعات
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div 
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 hover:shadow-lg transition duration-300 transform hover:-translate-y-1"
                >
                  <div className="bg-teal-600 p-6 text-white">
                    <h4 className="font-bold text-xl font-noto-urdu">{feature.title}</h4>
                  </div>
                  <div className="p-6">
                    <p className="text-teal-700 text-base font-noto-urdu">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-teal-700 text-white py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-teal-200 text-sm font-noto-urdu">
              © {new Date().getFullYear()} جٹ کلینز - تمام حقوق محفوظ ہیں
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}