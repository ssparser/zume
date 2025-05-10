"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useProject } from "@/hooks/use-projects";
import { askQuestion } from "./actions";
import { readStreamableValue } from "ai/rsc";
import MDEditor from "@uiw/react-md-editor";
import { useTheme } from "next-themes";
import {
  getSessionMessages,
  saveSessionMessages,
} from "@/lib/session";
import { useUser } from "@clerk/nextjs";

const ChatUI = () => {
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [input, setInput] = useState("");
  const { user, isLoaded } = useUser();
  const userId = user ? user.id : '';
  const [ans, setAns] = useState("");
  const [filesRef, setFilesRef] = useState<
    { filename: string; sourceCode: string; summary: string }[]
  >([]);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();
  const { project, projectId } = useProject();

  useEffect(() => {
    const saved = getSessionMessages(userId);
    if (saved.length > 0) {
      setMessages(saved);
    }
  }, []);

    useEffect(() => {
    saveSessionMessages(userId, messages);
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const scrollToBottom = () => {
    chatAreaRef.current?.scrollTo({
      top: chatAreaRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleSendMessage = async () => {
    setAns("");
    setFilesRef([]);
    if (input.trim() !== "") {
      const userMessage = { text: input, sender: "user" };
      setMessages((prev) => [...prev, userMessage]);

      const { output, files } = await askQuestion(input, projectId);
     
      setFilesRef(files);

      let aiResponse = "";
      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          aiResponse += delta;
          setAns((prev) => prev + delta);
        }
      }

      const aiMessage = { text: aiResponse, sender: "ai" };
      setMessages((prev) => [...prev, aiMessage]);
      console.log("output", aiResponse, "project name", project?.projectName);
      setInput("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }

      setTimeout(scrollToBottom, 50);
    }
  };

  return (
    <div className="text-foreground flex h-full w-full flex-col">
      <div
        className="relative flex flex-1 flex-col items-start overflow-y-auto p-4"
        ref={chatAreaRef}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="relative flex items-center gap-5">
              <h1 className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-5xl font-semibold text-transparent">
                Ask AI about your codebase.
              </h1>
              <div className="relative size-8">
                <Sparkles className="relative z-10 h-full w-full animate-pulse text-purple-400" />
                <div className="absolute inset-0 z-0 rounded-full bg-gradient-to-r from-purple-400 via-blue-500 to-pink-500 opacity-70 blur-md" />
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="w-full">
              {message.sender === "user" ? (
                <div className="mb-2 ml-auto w-fit max-w-[80%] rounded-xl bg-muted p-3 text-foreground">
                  {message.text}
                </div>
              ) : (
                <div
                  data-color-mode={theme}
                >
                  
                  <MDEditor.Markdown
                    source={message.text}
                    className="!h-full whitespace-pre-wrap items-start max-w-[80%]"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex w-full flex-col items-center justify-center px-2 py-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask Gemini about your codebase... (Press Enter to send, Shift+Enter for a new line)"
          className="placeholder:font-xl max-h-40 flex-1 resize-none overflow-y-auto whitespace-pre-wrap px-2 py-2"
        />
        <Button onClick={handleSendMessage} className="mt-2 bg-muted">
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatUI;
