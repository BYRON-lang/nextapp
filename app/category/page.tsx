import CategoriesSection from '../components/CategoriesSection';

export default function CategoryPage() {
  return (
    <div className="min-h-screen bg-[#141414] px-4 sm:px-6 lg:px-12 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start mb-12">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-b from-slate-200 to-slate-400 text-transparent bg-clip-text">
            Category
          </h1>
          <p className="text-lg md:text-xl mt-4 md:mt-0 md:pt-6 font-medium bg-gradient-to-b from-slate-200 to-slate-400 text-transparent bg-clip-text">
            Browse websites <br /> By categories
          </p>
        </div>
        
        <CategoriesSection />
      </div>
    </div>
  );
}