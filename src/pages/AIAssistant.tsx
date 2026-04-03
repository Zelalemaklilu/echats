import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getHistory,
  saveHistory,
  clearHistory,
  getAIResponse,
  getTypingDelay,
  STARTER_SUGGESTIONS,
  type AIMessage,
} from "@/lib/aiAssistantService";

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const idxRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      idxRef.current += 1;
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const parts: React.ReactNode[] = [];
    let rest = line;
    let key = 0;

    while (rest.length > 0) {
      const boldMatch = rest.match(/^\*\*(.+?)\*\*/);
      const italicMatch = rest.match(/^_(.+?)_/);
      const codeMatch = rest.match(/^`(.+?)`/);

      if (boldMatch) {
        parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
        rest = rest.slice(boldMatch[0].length);
      } else if (italicMatch) {
        parts.push(<em key={key++}>{italicMatch[1]}</em>);
        rest = rest.slice(italicMatch[0].length);
      } else if (codeMatch) {
        parts.push(
          <code
            key={key++}
            className="px-1 py-0.5 rounded text-xs bg-white/10 font-mono"
          >
            {codeMatch[1]}
          </code>
        );
        rest = rest.slice(codeMatch[0].length);
      } else {
        const nextSpecial = rest.search(/\*\*|_[^_]|`/);
        if (nextSpecial > 0) {
          parts.push(rest.slice(0, nextSpecial));
          rest = rest.slice(nextSpecial);
        } else {
          parts.push(rest);
          rest = "";
        }
      }
    }

    if (line.startsWith("• ") || line.startsWith("- ")) {
      result.push(
        <div key={i} className="flex gap-1.5">
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60" />
          <span>{parts.slice(1)}</span>
        </div>
      );
    } else {
      result.push(<span key={i}>{parts}</span>);
    }

    if (i < lines.length - 1) result.push(<br key={`br_${i}`} />);
  });

  return result;
}

const AIAssistant = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastAiId, setLastAiId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getHistory());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || isTyping) return;
      setInput("");

      const userMsg: AIMessage = {
        id: `u_${Date.now()}`,
        role: "user",
        content: msg,
        timestamp: Date.now(),
      };

      const updated = [...messages, userMsg];
      setMessages(updated);
      saveHistory(updated);

      setIsTyping(true);
      const delay = getTypingDelay(msg);

      setTimeout(async () => {
        const response = await getAIResponse(msg, updated);
        const aiMsg: AIMessage = {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: response,
          timestamp: Date.now(),
        };
        const final = [...updated, aiMsg];
        setMessages(final);
        saveHistory(final);
        setLastAiId(aiMsg.id);
        setIsTyping(false);
      }, delay);
    },
    [input, messages, isTyping]
  );

  const handleClear = () => {
    clearHistory();
    setMessages([]);
    setLastAiId(null);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe-top pt-4 pb-3 border-b border-border/50 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors flex-shrink-0"
          data-testid="button-ai-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-primary"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <p className="font-bold text-[15px]">Echat AI</p>
            <p className="text-xs text-emerald-500 font-medium">Always online</p>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={handleClear}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors"
            data-testid="button-ai-clear"
          >
            <Trash2 className="h-4.5 w-4.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-20">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-primary"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-9 w-9" />
            </motion.div>
            <div className="text-center">
              <p className="text-xl font-bold mb-1">Echat AI</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your intelligent assistant for translation, writing, and more.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {STARTER_SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleSend(s)}
                  className="px-4 py-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/50 transition-colors text-sm text-left font-medium"
                  data-testid={`ai-suggestion-${i}`}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 mr-2 mt-1"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "text-white rounded-br-sm"
                        : "bg-card border border-border/50 text-foreground rounded-bl-sm"
                    )}
                    style={
                      msg.role === "user"
                        ? { background: "var(--gradient-primary)" }
                        : undefined
                    }
                    data-testid={`ai-message-${msg.id}`}
                  >
                    {msg.role === "assistant" && msg.id === lastAiId ? (
                      <TypewriterText text={msg.content} />
                    ) : (
                      renderMarkdown(msg.content)
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: i * 0.15,
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border/50 pb-safe-bottom">
        {!isEmpty && (
          <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-hide pb-1">
            {STARTER_SUGGESTIONS.slice(0, 3).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 rounded-full border border-border/60 bg-card text-xs font-medium whitespace-nowrap hover:bg-muted/50 transition-colors flex-shrink-0"
                data-testid={`ai-chip-${i}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything…"
            className="flex-1 rounded-full bg-muted border-0"
            disabled={isTyping}
            data-testid="input-ai-message"
          />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="rounded-full text-white"
              style={{ background: "var(--gradient-primary)" }}
              data-testid="button-ai-send"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
