import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AuctionCard from '@/components/AuctionCard';
import FigmaUIOverlay from '@/components/FigmaUIOverlay';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-[family-name:var(--font-geist-sans)] relative">
      <FigmaUIOverlay />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 w-full pb-20">
          <Hero />

          <section className="container max-w-screen-xl mx-auto px-4 -mt-10 sm:-mt-20 relative z-20">
            <AuctionCard />
          </section>
        </main>

        <footer className="w-full border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Drop Street. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
