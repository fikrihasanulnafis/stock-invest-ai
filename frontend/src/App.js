import React, { useState } from 'react';
import Portfolio from './components/Portfolio';
import Market from './components/Market';

function App() {
  const [activeTab, setActiveTab] = useState('portfolio');

  return (
    <div className="min-h-screen bg-[#0b1121] text-white font-sans selection:bg-emerald-500 selection:text-white">

      <header className="border-b border-slate-800 bg-[#0b1121] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-white">
              S
            </div>
            <h1 className="text-xl font-bold tracking-wide text-emerald-400">
              StockInvest <span className="text-white">AI</span>
            </h1>
          </div>

          <nav className="flex space-x-1">
            <button
              className={`px-5 py-5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'portfolio'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('portfolio')}
            >
              Dashboard
            </button>

            <button
              className={`px-5 py-5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'market'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('market')}
            >
              Market Movers
            </button>

            <button
              className={`px-5 py-5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'chat'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              AI Chatbot
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400">
                Total Portfolio
              </div>
              <div className="text-sm font-bold text-emerald-400">
                Rp 15.2M
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border border-slate-600">
              TK
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 py-8">
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'market' && <Market />}

        {activeTab === 'chat' && (
          <div className="flex items-center justify-center h-96 bg-[#131b2f] rounded-xl border border-slate-800">
            <div className="text-center">
              <div className="text-5xl mb-4">🚧</div>

              <h2 className="text-xl font-bold text-white mb-2">
                AI Chatbot Offline
              </h2>

              <p className="text-slate-400 text-sm">
                Integrasi LLM sedang dalam tahap penundaan.
              </p>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;