import React, { useState, useEffect, useRef } from "react";

export default function Chat() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("stockinvest_chat_sessions");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "session_default",
            title: "Obrolan Baru",
            messages: [
              {
                text: "Halo! Saya StockInvest AI. Ada yang bisa saya bantu terkait simulasi portofolio atau aturan OJK?",
                sender: "ai",
              },
            ],
          },
        ];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    const saved = localStorage.getItem("stockinvest_active_session");
    return saved || "session_default";
  });

  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = currentSession.messages;

  const setMessages = (updateFn) => {
    setSessions((prevSessions) =>
      prevSessions.map((s) => {
        if (s.id === activeSessionId) {
          const nextMessages =
            typeof updateFn === "function" ? updateFn(s.messages) : updateFn;

          let nextTitle = s.title;
          if (s.messages.length === 1 && nextMessages.length > 1) {
            const firstUserMsg =
              nextMessages.find((m) => m.sender === "user")?.text ||
              "Obrolan Baru";
            nextTitle =
              firstUserMsg.length > 18
                ? firstUserMsg.substring(0, 18) + "..."
                : firstUserMsg;
          }

          return { ...s, title: nextTitle, messages: nextMessages };
        }
        return s;
      }),
    );
  };

  useEffect(() => {
    localStorage.setItem("stockinvest_chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("stockinvest_active_session", activeSessionId);
  }, [activeSessionId]);

  const handleNewChat = () => {
    const newId = `session_${Date.now()}`;
    const newSession = {
      id: newId,
      title: "Obrolan Baru",
      messages: [
        {
          text: "Halo! Saya StockInvest AI. Ada yang bisa saya bantu terkait simulasi portofolio atau aturan OJK?",
          sender: "ai",
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
  };

  const handleDeleteSession = (idToDelete, e) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== idToDelete);

    if (filtered.length === 0) {
      const defaultSession = {
        id: "session_default",
        title: "Obrolan Baru",
        messages: [
          {
            text: "Halo! Saya StockInvest AI. Ada yang bisa saya bantu terkait simulasi portofolio atau aturan OJK?",
            sender: "ai",
          },
        ],
      };
      setSessions([defaultSession]);
      setActiveSessionId("session_default");
      return;
    }

    setSessions(filtered);
    if (activeSessionId === idToDelete) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const quickPrompts = [
    "Bagaimana cara menggunakan fitur simulasi portofolio untuk memilih alokasi saham yang optimal?",
    "Apa saja indikator penting yang harus diperhatikan ketika melihat saham di StockInvestAI?",
    "Bagaimana aturan OJK mempengaruhi pilihan investasi saham di aplikasi ini?",
    "Bagaimana saya dapat menganalisis risiko portofolio dengan data saham yang tersedia?",
  ];

  const handleQuickPrompt = (text) => {
    handleSend(text);
  };

  const handleSend = async (messageText) => {
    const trimmedMessage = (messageText ?? input).trim();
    if (!trimmedMessage) return;

    const userMsg = trimmedMessage;
    setMessages((prev) => [...prev, { text: userMsg, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { text: data.reply, sender: "ai" }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: `Maaf, terjadi kesalahan: ${data.detail}`, sender: "ai" },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "Gagal terhubung ke server AI.", sender: "ai" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr] w-full">
      <aside className="flex flex-col rounded-[32px] border border-slate-700 bg-slate-950/95 p-5 shadow-2xl shadow-slate-950/30 h-[710px]">
        <div className="mb-5 rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-800 border border-slate-700 p-5 shadow-lg shadow-slate-950/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/20 text-2xl text-emerald-300 ring-1 ring-emerald-400/20">
              💬
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Obrolan AI</h2>
              <p className="text-sm text-slate-400">
                Kelola sesi chat dan riwayat obrolanmu.
              </p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 text-slate-950 font-semibold text-sm transition hover:bg-emerald-400">
            + Obrolan Baru
          </button>
        </div>

        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mb-3">
          Riwayat Chat
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`group flex items-center justify-between gap-3 rounded-3xl px-4 py-3 text-sm cursor-pointer transition ${
                session.id === activeSessionId
                  ? "bg-slate-900 border border-emerald-500/20 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]"
                  : "border border-slate-800 bg-slate-950 hover:bg-slate-900/70 text-slate-300"
              }`}>
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`inline-flex h-3.5 w-3.5 rounded-full ${session.id === activeSessionId ? "bg-emerald-400" : "bg-slate-600"}`}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{session.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {session.messages.length - 1} pesan
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteSession(session.id, e)}
                className="text-slate-500 hover:text-rose-400 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition"
                title="Hapus riwayat obrolan">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex flex-col h-[710px] rounded-[32px] border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-2xl shadow-slate-950/40 overflow-hidden">
        <div className="border-b border-slate-700 bg-slate-950/90 px-6 py-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Asisten Investasi
              </p>
              <h1 className="mt-2 text-2xl font-bold text-white">
                Chat dengan StockInvest AI
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Ajukan pertanyaan seputar saham, OJK, alokasi portofolio, atau
                pasar modal secara cepat dan intuitif.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
              Live AI Chat
            </div>
          </div>
        </div>

        <div
          ref={chatBodyRef}
          className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-slate-950">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-[28px] p-5 shadow-xl ${msg.sender === "user" ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-br-none" : "bg-slate-900 border border-slate-700 text-slate-100 rounded-bl-none"}`}>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {msg.text}
                </p>
                <span
                  className={`mt-3 block text-[11px] font-semibold uppercase tracking-[0.2em] ${msg.sender === "user" ? "text-slate-950/70" : "text-slate-400"}`}>
                  {msg.sender === "user" ? "Anda" : "StockInvest AI"}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-3 rounded-[28px] border border-slate-700 bg-slate-900/95 px-4 py-3 text-slate-400 shadow-lg shadow-slate-950/20">
                <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                AI sedang berpikir...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 bg-slate-950/95 px-6 py-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowQuickPrompts((prev) => !prev)}
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full border transition ${
                  showQuickPrompts
                    ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400 hover:bg-slate-950"
                }`}
                aria-label="Tampilkan pertanyaan cepat">
                <span className="text-2xl font-bold">+</span>
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tanyakan sesuatu tentang investasi, OJK, atau portofolio..."
                className="h-14 flex-1 rounded-full border border-slate-700 bg-slate-900/95 px-5 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />

              <button
                onClick={handleSend}
                disabled={isLoading}
                className="inline-flex h-14 items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700">
                {isLoading ? "Mengirim..." : "Kirim"}
              </button>
            </div>

            {showQuickPrompts && (
              <div className="rounded-3xl border border-slate-700 bg-slate-900/95 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-0">
                    Pertanyaan cepat
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQuickPrompts(false)}
                    className="text-slate-500 hover:text-slate-200 text-xs">
                    Tutup
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleQuickPrompt(prompt);
                        setShowQuickPrompts(false);
                      }}
                      className="rounded-2xl border border-slate-700 bg-slate-950/95 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-emerald-400 hover:bg-slate-800">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
