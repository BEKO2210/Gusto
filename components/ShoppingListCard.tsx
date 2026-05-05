
import React, { useState } from 'react';
import { ShoppingListData } from '../types';
import { ShoppingBasket, CheckCircle2, Circle, Copy, Check, NotebookPen, ShieldCheck } from 'lucide-react';

interface Props {
  data: ShoppingListData;
}

export const ShoppingListCard: React.FC<Props> = ({ data }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = Array.from(new Set(data.ingredients.map(i => i.category)));

  // Plaintext-Format als Checkliste — funktioniert in Apple Notes, Samsung
  // Notes, Google Keep, OneNote etc. "[ ]" laesst sich in den meisten
  // Apps per Lang-Druck zur echten abhakbaren Liste konvertieren.
  const buildNoteText = () => {
    const lines: string[] = [
      `GUSTO Einkaufsliste — ${data.dishName} (${data.servings} Personen)`,
      '',
    ];
    for (const cat of categories) {
      lines.push(cat.toUpperCase());
      for (const i of data.ingredients.filter(x => x.category === cat)) {
        lines.push(`[ ] ${i.quantity} ${i.unit} ${i.name}`.replace(/\s+/g, ' '));
      }
      lines.push('');
    }
    if (data.notes) {
      lines.push(`Tipp: ${data.notes}`);
    }
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildNoteText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Oeffnet das System-Share-Sheet — der Nutzer waehlt dort selbst die
   * Notizen-App seines Geraets:
   *   iOS    → Notizen (Apple Notes)
   *   Samsung→ Samsung Notes
   *   Android→ Google Keep / Keep Notes / OneNote / ...
   * Wenn Web Share nicht verfuegbar ist (Desktop), faellt es auf
   * Zwischenablage zurueck und am Ende auf .txt-Download.
   */
  const handleSaveToNotes = async () => {
    const text = buildNoteText();
    const title = `Einkaufsliste: ${data.dishName}`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    } catch {
      /* fall through */
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.dishName.replace(/[^a-z0-9äöüß ]+/gi, '').trim() || 'Einkaufsliste'}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-gusto space-y-8 print-reset">
      <div className="print-card bg-white rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-2xl shadow-neutral-100 border border-neutral-100 relative overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none print:hidden">
          <ShoppingBasket size={240} />
        </div>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-neutral-50 pb-8">
          <div>
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2 print:hidden">
              <ShieldCheck size={14} className="text-emerald-500" />
              Sicher generierte Liste
            </div>
            <h2 className="print-title text-4xl md:text-5xl font-serif text-neutral-900 leading-tight">{data.dishName}</h2>
            <p className="print-subtitle text-neutral-500 mt-2 font-light">Zutaten für {data.servings} Personen – perfekt skaliert.</p>
          </div>

          <div className="flex gap-2 print:hidden">
            <button
              onClick={handleSaveToNotes}
              aria-label="Liste in Notizen-App speichern"
              title="In Notizen-App speichern (Apple Notes, Samsung Notes, Google Keep …)"
              className="p-4 hover:bg-neutral-900 rounded-2xl transition-all text-neutral-400 hover:text-white border border-neutral-100 bg-white hover:border-neutral-900 flex items-center gap-2 font-medium"
            >
              {saved ? <Check size={20} /> : <NotebookPen size={20} />}
              <span className="text-sm">{saved ? 'Gespeichert' : 'Notizen'}</span>
            </button>
            <button
              onClick={handleCopy}
              aria-label="Liste in die Zwischenablage kopieren"
              className="p-4 hover:bg-neutral-50 rounded-2xl transition-all text-neutral-400 hover:text-neutral-900 border border-neutral-100"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </header>

        <div className="print-grid grid grid-cols-1 lg:grid-cols-2 gap-12">
          {categories.map(category => (
            <div key={category} className="print-category space-y-6">
              <h3 className="print-category-title text-sm font-bold uppercase tracking-[0.2em] text-neutral-300 border-l-2 border-neutral-900 pl-4">
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
                        className={`print-item group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-neutral-50 ${isChecked ? 'bg-neutral-50/50' : ''}`}
                      >
                        <div className="flex items-center gap-4 print:contents">
                          <span className="print-checkbox hidden print:inline-block" aria-hidden="true"></span>
                          <div className={`transition-transform duration-300 print:hidden ${isChecked ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {isChecked ? (
                              <CheckCircle2 size={22} className="text-neutral-900" />
                            ) : (
                              <Circle size={22} className="text-neutral-200 group-hover:text-neutral-400" />
                            )}
                          </div>
                          <span className={`print-item-name text-neutral-800 transition-all font-medium ${isChecked ? 'line-through text-neutral-300' : ''}`}>
                            {ingredient.name}
                          </span>
                        </div>
                        <span className={`print-item-qty text-sm font-mono tracking-tighter transition-all ${isChecked ? 'text-neutral-300' : 'text-neutral-400 group-hover:text-neutral-900'}`}>
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
          <div className="print-note mt-16 p-8 bg-neutral-900 rounded-[1.5rem] text-white overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="print-note-label text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2">
                <ShieldCheck size={14} className="text-neutral-500 print:hidden" />
                GUSTO Empfehlung
              </h4>
              <p className="text-lg font-serif italic leading-relaxed opacity-90">"{data.notes}"</p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10 transform rotate-12 print:hidden">
              <Check size={120} />
            </div>
          </div>
        )}
      </div>

      <div className="text-center px-4 print:hidden">
        <p className="text-neutral-300 text-[10px] uppercase tracking-[0.3em] font-bold">
          Verarbeitet über GUSTO Secure-API Bridge
        </p>
      </div>
    </div>
  );
};
