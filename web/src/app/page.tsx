"use client";

import { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";

export default function HomeAI() {
  const [messages, setMessages] = useState<
    { id: string; role: string; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);

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
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 p-2 rounded-lg ${
              msg.role === "user" ? "bg-blue-600 ml-auto" : "bg-gray-700"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <div className="p-4 flex bg-gray-800">
        <input
          className="flex-1 p-2 bg-gray-700 text-white rounded-l-lg focus:outline-none"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="p-2 bg-blue-600 rounded-r-lg" onClick={sendMessage}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}
