
import React, { useState } from 'react';
import { generateShoppingList } from './services/geminiService';
import { AppState } from './types';
import { LoadingState } from './components/LoadingState';
import { ShoppingListCard } from './components/ShoppingListCard';
import { Utensils, Users, Sparkles, ChefHat, ArrowRight, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [dish, setDish] = useState('');
  const [servings, setServings] = useState(2);
  const [state, setState] = useState<AppState>({
    loading: false,
    error: null,
    list: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dish.trim()) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await generateShoppingList(dish, servings);
      setState({ loading: false, error: null, list: result });
      setTimeout(() => {
        const resultArea = document.getElementById('result-area');
        if (resultArea) {
          resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      setState({ 
        loading: false, 
        error: err.message || 'Die GUSTO-Schnittstelle konnte Ihre Anfrage momentan nicht verarbeiten.', 
        list: null 
      });
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 pointer-events-auto">
             <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white shadow-xl">
                <ChefHat size={20} />
             </div>
             <span className="font-serif font-bold text-xl tracking-tighter">GUSTO.</span>
          </div>
          <div className="pointer-events-auto hidden md:block">
             <div className="px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-neutral-100 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Secure Cloud API Active
             </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-16 px-6 max-w-4xl mx-auto text-center animate-gusto">
        <h1 className="text-6xl md:text-8xl font-serif text-neutral-900 mb-6 tracking-tighter leading-none">
          Einkaufen <br/> <span className="italic font-normal opacity-40">neu gedacht.</span>
        </h1>
        <p className="text-neutral-500 font-light text-lg max-w-md mx-auto leading-relaxed">
          GUSTO verwandelt Ihre kulinarischen Ideen in perfekt organisierte Einkaufslisten.
        </p>
      </header>

      <main className="px-6 max-w-4xl mx-auto space-y-24">
        {/* Entry Form */}
        <section className="animate-gusto" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-4 md:p-6 shadow-xl shadow-neutral-100 border border-neutral-100 flex flex-col md:flex-row items-stretch md:items-center gap-4">
              
              <div className="flex-grow flex items-center px-4 gap-4">
                <Utensils className="text-neutral-300" size={24} />
                <input
                  type="text"
                  value={dish}
                  onChange={(e) => setDish(e.target.value)}
                  placeholder="Was möchten Sie kochen?"
                  className="w-full py-4 bg-transparent border-none focus:ring-0 text-xl md:text-2xl font-serif text-neutral-800 placeholder-neutral-200"
                />
              </div>

              <div className="w-px h-12 bg-neutral-100 hidden md:block"></div>

              <div className="flex items-center px-4 gap-4 md:w-48 justify-between md:justify-start">
                <Users className="text-neutral-300" size={20} />
                <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      className="w-8 h-8 rounded-full border border-neutral-100 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                    >-</button>
                    <span className="font-mono font-bold text-lg w-6 text-center">{servings}</span>
                    <button 
                      type="button"
                      onClick={() => setServings(servings + 1)}
                      className="w-8 h-8 rounded-full border border-neutral-100 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                    >+</button>
                </div>
              </div>

              <button
                type="submit"
                disabled={state.loading || !dish}
                className="bg-neutral-900 text-white px-8 py-5 rounded-[1.8rem] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-800 active:scale-[0.97] transition-all disabled:opacity-20 shadow-2xl shadow-neutral-300"
              >
                {state.loading ? '...' : <ArrowRight size={20} />}
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 opacity-40 px-4">
                {['Pasta Carbonara', 'Wiener Schnitzel', 'Thai Curry', 'Shakshuka'].map(suggestion => (
                    <button 
                        key={suggestion}
                        type="button"
                        onClick={() => setDish(suggestion)}
                        className="text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity border-b border-transparent hover:border-neutral-900"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
          </form>
        </section>

        {/* Results Area */}
        <section id="result-area" className="min-h-[400px]">
          {state.loading && <LoadingState />}
          
          {state.error && (
            <div className="p-12 bg-neutral-50 rounded-[2rem] text-neutral-500 text-center animate-gusto border border-neutral-100">
              <AlertCircle size={40} className="mx-auto mb-4 text-red-300" />
              <p className="font-serif italic text-xl mb-4 leading-relaxed">{state.error}</p>
              <button 
                onClick={() => setState(s => ({...s, error: null}))} 
                className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-900 hover:opacity-50 transition-opacity"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {!state.loading && state.list && (
            <ShoppingListCard data={state.list} />
          )}

          {!state.loading && !state.list && !state.error && (
            <div className="text-center py-32 opacity-10">
              <ChefHat size={80} className="mx-auto mb-6" />
              <p className="font-serif text-3xl italic tracking-tighter">Ihre Küche erwartet Sie.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-40 text-center border-t border-neutral-50 pt-12 pb-24 px-6">
        <p className="text-neutral-300 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">GUSTO Intelligence Service</p>
        <p className="text-neutral-400 text-[10px] font-medium max-w-xs mx-auto leading-loose">
          &copy; {new Date().getFullYear()} – All Rights Reserved.<br/>
          Entwickelt für kulinarische Präzision.
        </p>
      </footer>
    </div>
  );
};

export default App;
