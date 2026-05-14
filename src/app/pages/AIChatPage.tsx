import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Loader2, Sparkles } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";

interface Message {
  role: "user" | "ai";
  content: string;
}

export function AIChatPage() {
  const { language, currentUser } = useApp();
  const t = useT(language);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        t("aiWelcomeMessage") ||
        "Привет! Я твой личный финансовый ИИ-ассистент. Чем могу помочь сегодня?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автоскролл вниз при новом сообщении
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("access");
      const res = await fetch("https://finance.lxv.uz/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMsg, language }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "Произошла ошибка при обращении к серверу." },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Нет связи с сервером." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 2xl:p-10 h-[calc(100vh-60px)] lg:h-screen flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <Sparkles className="text-purple-500" size={20} />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-bold">
            {t("aiChatTitle") || "AI Ассистент"}
          </h1>
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            {t("aiChatSubtitle") || "Умный финансовый советник"}
          </p>
        </div>
      </div>

      {/* Окно чата */}
      <div className="flex-1 liquid-glass rounded-3xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden shadow-2xl relative z-10">
        {/* Список сообщений */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 sm:gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Аватарка */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                  msg.role === "user"
                    ? "bg-purple-600 border-purple-500"
                    : "bg-black/5 dark:bg-white/10 border-gray-200 dark:border-white/20"
                }`}
              >
                {msg.role === "user" ? (
                  <UserIcon size={16} className="text-white" />
                ) : (
                  <Bot size={18} className="text-foreground" />
                )}
              </div>

              {/* Пузырь сообщения */}
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 text-sm sm:text-base shadow-md ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-tr-sm"
                    : "bg-white/80 dark:bg-black/40 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-tl-sm backdrop-blur-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 flex-row">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/20">
                <Loader2 size={18} className="text-foreground animate-spin" />
              </div>
              <div className="bg-white/80 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-sm p-4 backdrop-blur-md flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 bg-black/5 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              t("aiChatPlaceholder") || "Спроси меня о своих финансах..."
            }
            className="flex-1 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 sm:py-4 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-purple-500/20 flex-shrink-0"
          >
            <Send
              size={20}
              className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""}
            />
          </button>
        </form>
      </div>
    </div>
  );
}
