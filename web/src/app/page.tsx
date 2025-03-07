"use client";

import { useState, useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function HomeAI() {
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    if (savedChats.length) {
      setMessages(savedChats);
      setChatId(savedChats[0].chatId);
    } else {
      setChatId(uuidv4());
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { id: uuidv4(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: uuidv4(), role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-fit ${msg.role === "user" ? "bg-blue-600 text-white ml-auto max-w-[75%] text-right rounded-xl px-4 py-2" : "bg-transparent text-gray-300 w-full"}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              ul: ({ node, ...props }) => <ul className="list-disc pl-5" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5" {...props} />,
              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
              p: ({ node, ...props }) => <p className="mb-2" {...props} />
            }}>{msg.content}</ReactMarkdown>
          </div>
        ))}
      </div>
      <div className="p-4 flex justify-center bg-gray-800 border-t border-gray-700">
        <div className="w-[60%] flex items-center bg-gray-700 p-2 rounded-lg">
          <textarea
            ref={inputRef}
            className="w-full bg-transparent text-white p-2 focus:outline-none resize-none max-h-40 overflow-y-auto rounded-md"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button className="p-2 bg-blue-600 rounded-lg ml-2" onClick={sendMessage}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
}
