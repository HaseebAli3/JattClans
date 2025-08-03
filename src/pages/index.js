import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>جٹ کلینز - جٹ برادری کا  انسائیکلو پیڈیا</title>
        <link rel="icon" href="/jutt-icon.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-coral-50">
        {/* Navigation with left-aligned title */}
        <nav className="p-4 bg-teal-700 text-white shadow-md">
          <div className="container mx-auto flex items-center">
            <h1 className="text-2xl font-bold font-noto-urdu">جٹ کلینز</h1>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-teal-900 mb-6 font-noto-urdu">
              جٹ برادری کا مکمل  انسائیکلو پیڈیا
            </h2>
            <p className="text-xl text-teal-800 mb-8">
              دریافت کریں جٹ قوم کی شاندار تاریخ، ثقافت، روایات اور عظیم شخصیات کے بارے میں جامع معلومات
            </p>
            <Link href="/articles">
              <button className="bg-coral-600 hover:bg-coral-700 text-white px-8 py-3 rounded-lg font-medium shadow-md transition">
                مضامین دیکھیں
              </button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-12">
          <h3 className="text-3xl font-bold text-center text-teal-900 mb-12 font-noto-urdu">ہمارے خاص موضوعات</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 hover:shadow-lg transition">
              <div className="bg-teal-600 p-3 sm:p-6 text-white">
                <h4 className="font-bold text-base sm:text-xl font-noto-urdu">تاریخی مقامات</h4>
              </div>
              <div className="p-3 sm:p-6">
                <p className="text-teal-700 text-sm sm:text-base">جٹ قوم سے منسلک اہم تاریخی مقامات اور ان کی کہانیاں</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 hover:shadow-lg transition">
              <div className="bg-teal-600 p-3 sm:p-6 text-white">
                <h4 className="font-bold text-base sm:text-xl font-noto-urdu">قومی رہنما</h4>
              </div>
              <div className="p-3 sm:p-6">
                <p className="text-teal-700 text-sm sm:text-base">جٹ برادری کے عظیم رہنماؤں کی زندگی کے اہم واقعات</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 hover:shadow-lg transition">
              <div className="bg-teal-600 p-3 sm:p-6 text-white">
                <h4 className="font-bold text-base sm:text-xl font-noto-urdu">ثقافتی ورثہ</h4>
              </div>
              <div className="p-3 sm:p-6">
                <p className="text-teal-700 text-sm sm:text-base">روایتی رقص، موسیقی، پکوان اور تہوار</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 hover:shadow-lg transition">
              <div className="bg-teal-600 p-3 sm:p-6 text-white">
                <h4 className="font-bold text-base sm:text-xl font-noto-urdu">جنگی خدمات</h4>
              </div>
              <div className="p-3 sm:p-6">
                <p className="text-teal-700 text-sm sm:text-base">جٹ قوم کی فوجی خدمات اور بہادری کے قصے</p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 hover:shadow-lg transition">
              <div className="bg-teal-600 p-3 sm:p-6 text-white">
                <h4 className="font-bold text-base sm:text-xl font-noto-urdu">زرعی روایات</h4>
              </div>
              <div className="p-3 sm:p-6">
                <p className="text-teal-700 text-sm sm:text-base">کاشتکاری اور زمین داری سے متعلق روایتی علم</p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-teal-100 hover:shadow-lg transition">
              <div className="bg-teal-600 p-3 sm:p-6 text-white">
                <h4 className="font-bold text-base sm:text-xl font-noto-urdu">ادبی خدمات</h4>
              </div>
              <div className="p-3 sm:p-6">
                <p className="text-teal-700 text-sm sm:text-base">جٹ ادیبوں، شاعروں اور دانشوروں کا تعارف</p>
              </div>
            </div>
          </div>
        </section>

        {/* Simple Footer */}
        <footer className="bg-teal-700 text-white py-4">
          <div className="container mx-auto px-4 text-center">
            <p className="text-coral-200 text-sm">© {new Date().getFullYear()} جٹ کلینز - تمام حقوق محفوظ ہیں</p>
          </div>
        </footer>
      </div>
    </>
  );
}