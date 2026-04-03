// @ts-nocheck
export interface SmartReply {
  id: string;
  text: string;
  emoji?: string;
}

const GREETING_REPLIES: SmartReply[] = [
  { id: "gr1", text: "Hey! How are you? 👋", emoji: "👋" },
  { id: "gr2", text: "Hi there! 😊" },
  { id: "gr3", text: "Hello! What's up?" },
];

const QUESTION_REPLIES: SmartReply[] = [
  { id: "q1", text: "Yes, of course! ✅" },
  { id: "q2", text: "No, sorry 🙏" },
  { id: "q3", text: "Let me check and get back to you" },
  { id: "q4", text: "I'm not sure, will find out" },
];

const THANKS_REPLIES: SmartReply[] = [
  { id: "t1", text: "You're welcome! 😊" },
  { id: "t2", text: "No problem at all!" },
  { id: "t3", text: "Happy to help! 🙌" },
];

const OK_REPLIES: SmartReply[] = [
  { id: "ok1", text: "Great! 👍" },
  { id: "ok2", text: "Sounds good!" },
  { id: "ok3", text: "Perfect! ✨" },
  { id: "ok4", text: "Got it 👌" },
];

const HOW_ARE_YOU_REPLIES: SmartReply[] = [
  { id: "h1", text: "I'm doing great, thanks! 😄" },
  { id: "h2", text: "Good, how about you?" },
  { id: "h3", text: "Pretty good! 🙂" },
];

const EMOJI_REPLIES: SmartReply[] = [
  { id: "e1", text: "❤️" },
  { id: "e2", text: "😂" },
  { id: "e3", text: "🔥" },
  { id: "e4", text: "👍 Agreed!" },
];

const LOCATION_REPLIES: SmartReply[] = [
  { id: "l1", text: "On my way! 🚶" },
  { id: "l2", text: "I'll be there soon" },
  { id: "l3", text: "Can you send the exact address?" },
];

const CALL_REPLIES: SmartReply[] = [
  { id: "c1", text: "I'll call you in a moment" },
  { id: "c2", text: "Can't talk right now, will text" },
  { id: "c3", text: "Sure, call me!" },
];

const MEETING_REPLIES: SmartReply[] = [
  { id: "m1", text: "That works for me! 📅" },
  { id: "m2", text: "Can we reschedule?" },
  { id: "m3", text: "I'll be there on time" },
];

const FALLBACK_REPLIES: SmartReply[] = [
  { id: "f1", text: "👍" },
  { id: "f2", text: "Ok!" },
  { id: "f3", text: "Got it" },
  { id: "f4", text: "Sure!" },
];

function pick(arr: SmartReply[], count = 3): SmartReply[] {
  return arr.slice(0, count);
}

export function getSmartReplies(message: string): SmartReply[] {
  if (!message || !message.trim()) return pick(FALLBACK_REPLIES);

  const lower = message.toLowerCase().trim();

  if (/\b(hi|hello|hey|howdy|yo|sup|hiya|selam|ሰላም)\b/.test(lower)) {
    return pick(GREETING_REPLIES);
  }

  if (/\b(how are you|how r u|how's it going|how do you do|what's up|wassup)\b/.test(lower)) {
    return pick(HOW_ARE_YOU_REPLIES);
  }

  if (/\b(thank|thanks|thx|ty|thank you|tnx|appreciate)\b/.test(lower)) {
    return pick(THANKS_REPLIES);
  }

  if (/\?/.test(lower)) {
    return pick(QUESTION_REPLIES, 4);
  }

  if (/\b(ok|okay|sure|alright|fine|great|cool|nice|good|wonderful|perfect|awesome)\b/.test(lower)) {
    return pick(OK_REPLIES);
  }

  if (/\b(meet|meeting|schedule|appointment|time|when|where|location|address|come|visit)\b/.test(lower)) {
    return pick(MEETING_REPLIES);
  }

  if (/\b(call|ring|phone|dial|talk|voice)\b/.test(lower)) {
    return pick(CALL_REPLIES);
  }

  if (/📍|location|map|direction/.test(lower)) {
    return pick(LOCATION_REPLIES);
  }

  if (/[😂❤️🔥💯👍🙏😍🥰]/.test(message)) {
    return pick(EMOJI_REPLIES);
  }

  return pick(FALLBACK_REPLIES);
}
