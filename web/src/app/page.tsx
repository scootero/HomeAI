"use client";

import { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaBars, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function HomeAI() {
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<{ chatId: string; name: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem("chatConversations") || "[]");
    setChats(savedChats);
    setChatId(null); // Ensures a fresh chat on reload
    setMessages([]);
  }, []);

  useEffect(() => {
    if (chatId) {
      const savedMessages = JSON.parse(localStorage.getItem(chatId) || "[]");
      setMessages(savedMessages);
    }
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      localStorage.setItem(chatId, JSON.stringify(messages));
    }
  }, [messages, chatId]);

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  const deleteChat = (deleteChatId: string) => {
    const updatedChats = chats.filter(chat => chat.chatId !== deleteChatId);
    setChats(updatedChats);
    localStorage.setItem("chatConversations", JSON.stringify(updatedChats));
    localStorage.removeItem(deleteChatId);
    if (chatId === deleteChatId) {
      setChatId(null);
      setMessages([]);
    }
  };

  const startNewChat = () => {
    setChatId(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    let currentChatId = chatId;
    let newChats = chats;

    if (!chatId) {
      currentChatId = uuidv4();
      const newChat = { chatId: currentChatId, name: "New Chat" };
      newChats = [...chats, newChat];
      setChats(newChats);
      localStorage.setItem("chatConversations", JSON.stringify(newChats));
      setChatId(currentChatId);
    }

    const userMessage = { id: uuidv4(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    localStorage.setItem(currentChatId, JSON.stringify([...messages, userMessage]));
    setInput("");
    adjustTextareaHeight();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: currentChatId, message: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: uuidv4(), role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Error fetching response:", error);
    }

    adjustTextareaHeight();
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white relative" onClick={() => setSidebarOpen(false)}>
      {/* Sidebar */}
      <div
        className={`absolute top-0 left-0 h-full bg-gray-800 w-64 p-4 transition-transform z-50 ${sidebarOpen ? "translate-x-0" : "-translate-x-64"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="text-white mb-4" onClick={() => setSidebarOpen(false)}>
          <FaTimes />
        </button>
        <button className="w-full bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center" onClick={startNewChat}>
          <FaPlus className="mr-2" /> New Chat
        </button>
        <div className="mt-4 space-y-2">
          {chats.map((chat) => (
            <div key={chat.chatId} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
              <button
                className={`text-left flex-1 ${chat.chatId === chatId ? "text-blue-300" : "text-white"}`}
                onClick={() => setChatId(chat.chatId)}
              >
                {chat.name}
              </button>
              <button className="text-red-500 hover:text-red-700" onClick={() => deleteChat(chat.chatId)}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-screen relative" onClick={(e) => e.stopPropagation()}>
        {/* Top Bar */}
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <button className="text-white" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
          <h1 className="text-lg font-semibold">HomeAI Chat</h1>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl mx-auto w-full flex flex-col items-center justify-center">
          {messages.length === 0 && (
            <div className="text-gray-400 text-xl">What can I help you with?</div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg max-w-fit ${msg.role === "user" ? "bg-blue-600 text-white ml-auto max-w-[75%] text-right rounded-xl px-4 py-2" : "bg-transparent text-gray-300 w-full"}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="p-4 flex justify-center bg-gray-800 border-t border-gray-700">
          <textarea
            ref={inputRef}
            className="custom-scrollbar w-[60%] bg-transparent text-white p-2 focus:outline-none resize-none overflow-y-auto max-h-52 rounded-md"
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            placeholder="Type a message..."
          />
          <button className="p-2 bg-blue-600 rounded-lg ml-2" onClick={sendMessage}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
}
