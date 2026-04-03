// @ts-nocheck
const HISTORY_KEY = "echat_ai_history";
const MAX_HISTORY = 20;

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function getHistory(): AIMessage[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveHistory(messages: AIMessage[]): void {
  const trimmed = messages.slice(-MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

function detectLanguage(text: string): string {
  if (/[\u1200-\u137F]/.test(text)) return "Amharic";
  if (/[\u0600-\u06FF]/.test(text)) return "Arabic";
  return "English";
}

const AMHARIC_TRANSLATIONS: Record<string, string> = {
  hello: "ሰላም",
  "how are you": "እንዴት ነህ",
  "good morning": "እንደምን አደርክ",
  "good night": "እንደምን አደርክ",
  "thank you": "አመሰግናለሁ",
  "you're welcome": "እንኳን ደህና መጣህ",
  yes: "አዎ",
  no: "አይ",
  "i love you": "እወድሃለሁ",
  "what is your name": "ስምህ ማን ነው",
  "my name is": "ስሜ ነው",
  "where are you": "የት ነህ",
};

function mockTranslate(text: string, targetLang: string): string {
  const lower = text.toLowerCase().trim();
  if (targetLang === "Amharic" || targetLang === "am") {
    const exact = AMHARIC_TRANSLATIONS[lower];
    if (exact) return exact;
    return `[${text}] — ትርጉሙ: (ይህ ጽሑፍ ወደ አማርኛ ተተርጉሟል)`;
  }
  return `[${text}] — translated to ${targetLang}`;
}

export function getTypingDelay(response: string): number {
  const words = response.split(" ").length;
  return Math.min(400 + words * 40, 1800);
}

const RESPONSE_TEMPLATES: Array<{
  patterns: RegExp[];
  response: (match: RegExpMatchArray, input: string) => string;
}> = [
  {
    patterns: [/\b(hi|hello|hey|selam|ሰላም)\b/i],
    response: () =>
      "Hello! I'm Echat AI, your personal assistant 🤖✨\n\nI can help you:\n• Translate messages to any language\n• Write messages for you\n• Answer questions\n• Give suggestions\n\nWhat can I do for you today?",
  },
  {
    patterns: [/translate (.+) to (.+)/i, /(.+) ወደ (.+) ተርጉምልኝ/i],
    response: (match) => {
      const text = match[1]?.trim() || "";
      const lang = match[2]?.trim() || "Amharic";
      const translated = mockTranslate(text, lang);
      return `Translation to **${lang}**:\n\n"${translated}"\n\n_Need another translation? Just ask!_`;
    },
  },
  {
    patterns: [/translate/i, /ተርጉም/i, /translation/i],
    response: () =>
      "Sure! To translate something, just say:\n\n_\"Translate [your text] to [language]\"_\n\nFor example: _\"Translate hello to Amharic\"_\n\nI support: English, Amharic, Arabic, French, Spanish, German, Chinese, and more!",
  },
  {
    patterns: [/write (a )?message (for|to) (.+)/i, /ለ(.+) መልእክት ጻፍልኝ/i],
    response: (match) => {
      const recipient = match[3]?.trim() || match[1]?.trim() || "someone";
      return `Here's a message for **${recipient}**:\n\n---\n*"Hi ${recipient}! I hope you're doing well. I wanted to reach out and connect with you. Looking forward to hearing from you soon!"*\n---\n\nWant me to make it more formal, casual, or in a different language?`;
    },
  },
  {
    patterns: [/\bwhat time is it in (.+)/i],
    response: (match) => {
      const city = match[1]?.trim() || "that city";
      const now = new Date();
      return `The current UTC time is **${now.toUTCString().slice(17, 22)}**. For the exact time in **${city}**, I'd recommend checking a world clock app since I don't have real-time data. ⏰`;
    },
  },
  {
    patterns: [/\bweather\b/i, /\btemperature\b/i, /ፀሐይ|ዝናብ/i],
    response: () =>
      "I don't have access to live weather data, but you can check:\n• **Weather apps** on your phone\n• Search \"weather in [your city]\" on Google\n\nIs there something else I can help with? ☀️",
  },
  {
    patterns: [/\b(what can you do|help|commands|ምን ማድረግ ትችላለህ)\b/i],
    response: () =>
      "Here's what I can help you with:\n\n**💬 Communication**\n• Write messages for any occasion\n• Suggest reply ideas\n\n**🌍 Translation**\n• Translate text to 15+ languages\n• Amharic, English, Arabic & more\n\n**📝 Writing**\n• Draft formal/casual messages\n• Write captions, greetings, apologies\n\n**🧠 Q&A**\n• Answer general knowledge questions\n• Explain concepts simply\n\nJust ask me anything! ✨",
  },
  {
    patterns: [/\b(how are you|how r u|ሰላም ነህ)\b/i],
    response: () =>
      "I'm doing great, thank you for asking! 😊 I'm always here and ready to help you. How can I assist you today?",
  },
  {
    patterns: [/\b(joke|funny|laugh|make me laugh)\b/i],
    response: () => {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything! 😄",
        "I told my computer I needed a break. Now it won't stop sending me Kit-Kat ads. 🍫",
        "Why did the programmer quit his job? Because he didn't get arrays! 💻",
        "What do you call a fake noodle? An impasta! 🍝",
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    },
  },
  {
    patterns: [/\b(summarize|summary|brief)\b/i],
    response: () =>
      "Sure! Please share the text you'd like me to summarize and I'll give you a concise version. 📋",
  },
  {
    patterns: [/\b(calculate|math|compute|\d+\s*[\+\-\*\/]\s*\d+)\b/i],
    response: (match, input) => {
      const mathMatch = input.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)/);
      if (mathMatch) {
        const a = parseFloat(mathMatch[1]);
        const op = mathMatch[2];
        const b = parseFloat(mathMatch[3]);
        let result: number;
        if (op === "+") result = a + b;
        else if (op === "-") result = a - b;
        else if (op === "*") result = a * b;
        else result = b !== 0 ? a / b : NaN;
        if (!isNaN(result)) {
          return `**${a} ${op} ${b} = ${result}** 🧮\n\nNeed more calculations?`;
        }
      }
      return "I can do basic math! Try typing something like **\"5 + 3\"** or **\"10 * 4\"** 🧮";
    },
  },
  {
    patterns: [/\b(goodbye|bye|see you|cya|ቻው|ሰናይት)\b/i],
    response: () =>
      "Goodbye! 👋 Feel free to come back anytime you need help. Have a wonderful day! 🌟",
  },
  {
    patterns: [/\b(thank|thanks|thx|አመሰግናለሁ)\b/i],
    response: () =>
      "You're very welcome! 😊 It's my pleasure to help. Is there anything else you need?",
  },
  {
    patterns: [/\b(who (are|r) you|what are you|what is echat ai)\b/i],
    response: () =>
      "I'm **Echat AI** 🤖, a smart assistant built into the Echat app!\n\nI'm here to help you communicate better, translate messages, write content, and answer your questions — all within your chat app.\n\nPowered by intelligent algorithms to make your messaging experience smarter! ✨",
  },
];

export async function getAIResponse(
  userMessage: string,
  history: AIMessage[]
): Promise<string> {
  const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;

  if (apiKey) {
    try {
      const messages = [
        {
          role: "system" as const,
          content:
            "You are Echat AI, a helpful assistant built into the Echat messaging app. You help users with translation (especially Amharic/English), writing messages, and answering questions. Keep responses concise and friendly. Use markdown formatting where appropriate.",
        },
        ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userMessage },
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || getFallbackResponse(userMessage);
      }
    } catch {
      // fall through to rule-based
    }
  }

  return getFallbackResponse(userMessage);
}

function getFallbackResponse(input: string): string {
  for (const template of RESPONSE_TEMPLATES) {
    for (const pattern of template.patterns) {
      const match = input.match(pattern);
      if (match) {
        return template.response(match, input);
      }
    }
  }

  const lower = input.toLowerCase();
  if (detectLanguage(input) === "Amharic") {
    return "ሰላም! 😊 አማርኛ ጽሑፍዎን ተቀብያለሁ። ወደ እንግሊዝኛ ለመተርጎም \"translate [ጽሑፍ] to English\" ብሎ ይጠይቁ።";
  }

  if (lower.length < 5) {
    return "Could you elaborate a bit? I want to make sure I help you correctly! 😊";
  }

  const generic = [
    "That's interesting! Let me help you with that. Could you give me a bit more context?",
    "Great question! I'm still learning, but I'll do my best to help you. 🤔",
    "I understand you're asking about that. Here's what I know: it depends on the specific situation. Want me to elaborate? 💡",
    "Thanks for asking! I'd love to help. Can you provide more details so I can give you the best answer? ✨",
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}

export const STARTER_SUGGESTIONS = [
  "What can you do?",
  "Translate hello to Amharic",
  "Write a message for my friend",
  "Tell me a joke 😄",
];
