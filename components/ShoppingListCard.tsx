
import React, { useState } from 'react';
import { ShoppingListData } from '../types';
import { ShoppingBasket, CheckCircle2, Circle, Copy, Check, Printer, ShieldCheck } from 'lucide-react';

interface Props {
  data: ShoppingListData;
}

export const ShoppingListCard: React.FC<Props> = ({ data }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = Array.from(new Set(data.ingredients.map(i => i.category)));

  const handleCopy = () => {
    const text = `GUSTO Einkaufsliste: ${data.dishName} (${data.servings} Pers.)\n\n` + 
      data.ingredients.map(i => `- ${i.quantity} ${i.unit} ${i.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  return (
    <div className="animate-gusto space-y-8">
      <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-neutral-100 border border-neutral-100 relative overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <ShoppingBasket size={240} />
        </div>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-neutral-50 pb-8">
          <div>
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              Sicher generierte Liste
            </div>
            <h2 className="text-4xl md:text-5xl font-serif text-neutral-900 leading-tight">{data.dishName}</h2>
            <p className="text-neutral-500 mt-2 font-light">Zutaten für {data.servings} Personen – perfekt skaliert.</p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handlePrint} className="p-4 hover:bg-neutral-50 rounded-2xl transition-all text-neutral-400 hover:text-neutral-900 border border-neutral-100">
              <Printer size={20} />
            </button>
            <button onClick={handleCopy} className="p-4 hover:bg-neutral-900 rounded-2xl transition-all text-neutral-400 hover:text-white border border-neutral-100 bg-white hover:border-neutral-900 flex items-center gap-2 font-medium">
              {copied ? <Check size={20} /> : <Copy size={20} />}
              <span className="text-sm">Kopieren</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {categories.map(category => (
            <div key={category} className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-300 border-l-2 border-neutral-900 pl-4">
                {category}
              </h3>
              <ul className="space-y-1">
                {data.ingredients
                  .filter(i => i.category === category)
                  .map((ingredient, idx) => {
                    const id = `${category}-${idx}`;
                    const isChecked = checkedItems[id];
                    return (
                      <li 
                        key={id}
                        onClick={() => toggleItem(id)}
                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-neutral-50 ${isChecked ? 'bg-neutral-50/50' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`transition-transform duration-300 ${isChecked ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {isChecked ? (
                              <CheckCircle2 size={22} className="text-neutral-900" />
                            ) : (
                              <Circle size={22} className="text-neutral-200 group-hover:text-neutral-400" />
                            )}
                          </div>
                          <span className={`text-neutral-800 transition-all font-medium ${isChecked ? 'line-through text-neutral-300' : ''}`}>
                            {ingredient.name}
                          </span>
                        </div>
                        <span className={`text-sm font-mono tracking-tighter transition-all ${isChecked ? 'text-neutral-300' : 'text-neutral-400 group-hover:text-neutral-900'}`}>
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>

        {data.notes && (
          <div className="mt-16 p-8 bg-neutral-900 rounded-[1.5rem] text-white overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2">
                <ShieldCheck size={14} className="text-neutral-500" />
                GUSTO Empfehlung
              </h4>
              <p className="text-lg font-serif italic leading-relaxed opacity-90">"{data.notes}"</p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10 transform rotate-12">
              <Check size={120} />
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center px-4">
        <p className="text-neutral-300 text-[10px] uppercase tracking-[0.3em] font-bold">
          Verarbeitet über GUSTO Secure-API Bridge
        </p>
      </div>
    </div>
  );
};
