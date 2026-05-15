import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  Sparkles,
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  Menu,
  X,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { toast } from "sonner";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export function AIChatPage() {
  const { language, currentUser } = useApp();
  const t = useT(language);

  const chatStorageKey = `sf_chats_v2_${currentUser?.email || "default"}`;

  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(chatStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Ошибка чтения истории чатов");
      }
    }
    return [];
  });

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find((c) => c.id === currentChatId) || null;
  const messages = currentChat?.messages || [
    {
      role: "ai",
      content:
        t("aiWelcomeMessage") ||
        "Привет! Я твой личный финансовый ИИ-ассистент. Я проанализировал твои транзакции. Чем могу помочь?",
    },
  ];

  useEffect(() => {
    localStorage.setItem(chatStorageKey, JSON.stringify(chats));
  }, [chats, chatStorageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setInput("");
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedChats = chats.filter((c) => c.id !== id);
    setChats(updatedChats);
    if (currentChatId === id) setCurrentChatId(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setIsLoading(true);

    let activeId = currentChatId;
    let newChats = [...chats];

    if (!activeId) {
      activeId = Date.now().toString();
      const newSession: ChatSession = {
        id: activeId,
        title: userMsg.slice(0, 30) + (userMsg.length > 30 ? "..." : ""),
        messages: [
          {
            role: "ai",
            content:
              t("aiWelcomeMessage") ||
              "Привет! Я твой личный финансовый ИИ-ассистент. Я проанализировал твои транзакции. Чем могу помочь?",
          },
          { role: "user", content: userMsg },
        ],
        updatedAt: Date.now(),
      };
      newChats = [newSession, ...newChats];
      setChats(newChats);
      setCurrentChatId(activeId);
    } else {
      newChats = newChats.map((c) => {
        if (c.id === activeId) {
          const title =
            c.messages.length <= 1 ? userMsg.slice(0, 30) + "..." : c.title;
          return {
            ...c,
            title,
            messages: [...c.messages, { role: "user", content: userMsg }],
            updatedAt: Date.now(),
          };
        }
        return c;
      });
      newChats.sort((a, b) => b.updatedAt - a.updatedAt);
      setChats(newChats);
    }

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
      const aiReply = res.ok
        ? data.reply
        : "Произошла ошибка при обращении к серверу.";

      setChats((prevChats) =>
        prevChats.map((c) => {
          if (c.id === activeId)
            return {
              ...c,
              messages: [...c.messages, { role: "ai", content: aiReply }],
              updatedAt: Date.now(),
            };
          return c;
        }),
      );
    } catch (error) {
      toast.error("Нет связи с сервером");
      setChats((prevChats) =>
        prevChats.map((c) => {
          if (c.id === activeId)
            return {
              ...c,
              messages: [
                ...c.messages,
                { role: "ai", content: "Ошибка сети. Попробуйте позже." },
              ],
              updatedAt: Date.now(),
            };
          return c;
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (text: string, role: string) => {
    return text.split("\n").map((line, i) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={i} className="h-3 sm:h-4"></div>;

      const renderText = (str: string) => {
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong
                key={j}
                className={`font-semibold ${role === "ai" ? "text-white dark:text-white" : "text-white"}`}
              >
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
      };

      if (
        /^\d+\.\s+\*\*/.test(trimmedLine) ||
        /^\d+\.\s+[A-ZА-Я]/.test(trimmedLine)
      ) {
        return (
          <div
            key={i}
            className={`mt-4 mb-2 font-bold text-base sm:text-lg ${role === "ai" ? "text-white" : "text-white"}`}
          >
            {renderText(trimmedLine)}
          </div>
        );
      }

      if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
        const cleanLine = trimmedLine.replace(/^[-*]\s+/, "");
        return (
          <div key={i} className="flex gap-3 my-2.5 ml-2 sm:ml-4">
            <span className="mt-[0.45rem] w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
            <div
              className={`leading-relaxed ${role === "ai" ? "text-gray-200" : "text-white"}`}
            >
              {renderText(cleanLine)}
            </div>
          </div>
        );
      }

      return (
        <div
          key={i}
          className={`leading-relaxed mb-2 ${role === "ai" ? "text-gray-300" : "text-white"}`}
        >
          {renderText(trimmedLine)}
        </div>
      );
    });
  };

  return (
    <div className="p-0 lg:p-6 2xl:p-10 h-[calc(100vh-116px)] lg:h-[calc(100vh-40px)] flex gap-0 lg:gap-6 max-w-7xl mx-auto relative overflow-hidden">
      {/* ── Затемнение фона на мобилках ── */}
      {/* ИСПРАВЛЕНИЕ 1: fixed z-[55] чтобы перекрыть всё, кроме самого меню */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[55] lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Боковое меню с историей ── */}
      {/* ИСПРАВЛЕНИЕ 2: fixed z-[60] и bg-background на мобилках, чтобы перекрыть глобальную шапку */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-[60] lg:z-auto w-[85%] sm:w-72 lg:w-1/4 xl:w-1/5 flex flex-col liquid-glass bg-background lg:bg-transparent border-r lg:border lg:rounded-3xl border-gray-200 dark:border-white/10 shadow-2xl transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* ИСПРАВЛЕНИЕ 3: Добавили pt-10 для мобилок, чтобы отодвинуть кнопку от статус-бара iOS/Android */}
        <div className="p-4 pt-10 lg:pt-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white transition-all text-sm font-bold shadow-lg shadow-purple-500/20"
          >
            <MessageSquarePlus size={18} />
            {t("newChat") || "Новый чат"}
          </button>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="ml-3 p-2 rounded-xl bg-black/5 dark:bg-white/5 text-gray-500 lg:hidden hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {chats.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm mt-10">
              {t("noChats") || "Нет истории чатов"}
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                  currentChatId === chat.id
                    ? "bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400"
                    : "bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {chat.title}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Окно чата (Main) ── */}
      <div className="flex-1 flex flex-col liquid-glass lg:rounded-3xl border-0 lg:border border-gray-200 dark:border-white/10 overflow-hidden shadow-none lg:shadow-2xl relative z-10 w-full">
        {/* Шапка чата */}
        <div className="p-3 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center gap-3 bg-white/50 dark:bg-black/20 backdrop-blur-md">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-gray-500 hover:text-foreground lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Sparkles className="text-purple-500" size={20} />
          </div>
          <div>
            <h1 className="text-foreground text-base sm:text-xl font-bold">
              {t("aiChatTitle") || "AI Бухгалтер"}
            </h1>
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider hidden sm:block">
              {t("aiChatSubtitle") || "Профессиональный финансовый анализ"}
            </p>
          </div>
        </div>

        {/* Список сообщений */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 sm:gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm mt-1 ${
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

              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm sm:text-base shadow-md ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-tr-sm"
                    : "bg-white/80 dark:bg-black/40 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-tl-sm backdrop-blur-md"
                }`}
              >
                {formatMessage(msg.content, msg.role)}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 flex-row">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/20 mt-1">
                <Loader2 size={18} className="text-foreground animate-spin" />
              </div>
              <div className="bg-white/80 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-sm p-5 backdrop-blur-md flex items-center gap-1.5 h-[52px]">
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
          className="p-3 sm:p-4 bg-black/5 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex gap-2 pb-safe"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              t("aiChatPlaceholder") || "Спросите меня о ваших финансах..."
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
