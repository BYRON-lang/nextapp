import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#141414] p-4">
      <header className="relative w-full">
        <div className="relative w-24 h-9">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            fill 
            className="object-contain invert" 
            priority
          />
        </div>
        <div className="absolute right-4 top-0">
          <a 
            href="#" 
            className="text-white text-xl hover:underline underline-offset-4 transition-all duration-200"
          >
            Category
          </a>
        </div>
      </header>
    </div>
  );
}
