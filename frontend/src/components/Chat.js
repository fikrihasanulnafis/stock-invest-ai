import React, { useState } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState([
    { text: "Halo! Saya StockInvest AI. Ada yang bisa saya bantu terkait simulasi portofolio atau aturan OJK?", sender: "ai" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { text: userMsg, sender: "user" }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { text: data.reply, sender: "ai" }]);
      } else {
        setMessages(prev => [...prev, { text: "Maaf, terjadi kesalahan: " + data.detail, sender: "ai" }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { text: "Gagal terhubung ke server AI.", sender: "ai" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm h-[500px] flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
          🤖 StockInvest AI Assistant
        </h3>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">RAG + Gemini Active</span>
      </div>
      
      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-emerald-500 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 text-slate-500 p-3 rounded-lg rounded-bl-none shadow-sm animate-pulse">
              AI sedang berpikir...
            </div>
          </div>
        )}
      </div>

      {/* Area Input Box */}
      <div className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Tanyakan sesuatu tentang investasi..." 
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-slate-400"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}