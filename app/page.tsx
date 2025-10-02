import Image from 'next/image';
import Link from 'next/link';
import Filters from './components/Filters';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#141414] px-10 pt-4 pb-8">
      <header className="relative w-full">
        <Link href="/" className="block w-28 hover:opacity-80 transition-opacity duration-200">
          <div className="relative w-32 h-auto aspect-[4/1]">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              fill 
              className="object-contain invert" 
              priority
            />
          </div>
        </Link>
        <div className="absolute right-4 top-0 flex items-center gap-6">
          <a 
            href="#" 
            className="text-white text-xl hover:underline underline-offset-4 transition-all duration-200"
          >
            Category
          </a>
          <button 
            className="bg-[#262626] text-white px-6 py-2 rounded-full text-lg font-medium hover:bg-[#333] transition-colors duration-200 cursor-pointer"
          >
            Submit
          </button>
        </div>
      </header>
      
      {/* Hero Section */}
      <main className="flex flex-col items-center justify-start pt-20 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent">
          Curated Website<br />
          Design Inspiration
        </h1>
        <p className="text-base md:text-lg text-gray-300 max-w-2xl leading-relaxed">
          Handpicked curated website designs to inspire your next project
        </p>
      </main>
      
      {/* Filters Section */}
      <Filters />
    </div>
  );
}
