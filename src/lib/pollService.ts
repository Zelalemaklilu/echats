// @ts-nocheck
export interface PollVote {
  userId: string;
  votedAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
  voteTimestamps: PollVote[];
}

export interface Poll {
  id: string;
  chatId: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
  isAnonymous: boolean;
  allowMultiple: boolean;
  closed: boolean;
  showVoteTimestamps: boolean;
}

const STORAGE_KEY = "echat_polls";

function loadPolls(): Poll[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return data.map((p: Poll) => ({
      ...p,
      options: p.options.map(o => ({
        ...o,
        voteTimestamps: o.voteTimestamps || o.votes.map(v => ({ userId: v, votedAt: new Date().toISOString() })),
      })),
      showVoteTimestamps: p.showVoteTimestamps ?? false,
    }));
  } catch {
    return [];
  }
}

function savePolls(polls: Poll[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
}

export function createPoll(
  chatId: string,
  question: string,
  options: string[],
  createdBy: string,
  isAnonymous = false,
  allowMultiple = false,
  showVoteTimestamps = false,
): Poll {
  const polls = loadPolls();
  const newPoll: Poll = {
    id: Date.now().toString(),
    chatId,
    question,
    options: options.map((text, i) => ({
      id: `${Date.now()}_opt_${i}`,
      text,
      votes: [],
      voteTimestamps: [],
    })),
    createdBy,
    createdAt: new Date().toISOString(),
    isAnonymous,
    allowMultiple,
    closed: false,
    showVoteTimestamps,
  };
  polls.push(newPoll);
  savePolls(polls);
  return newPoll;
}

export function votePoll(
  pollId: string,
  optionId: string,
  userId: string,
): Poll | null {
  const polls = loadPolls();
  const poll = polls.find((p) => p.id === pollId);
  if (!poll || poll.closed) return null;

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return null;

  if (!poll.allowMultiple) {
    poll.options.forEach((o) => {
      o.votes = o.votes.filter((v) => v !== userId);
      o.voteTimestamps = o.voteTimestamps.filter(v => v.userId !== userId);
    });
  }

  if (option.votes.includes(userId)) {
    option.votes = option.votes.filter((v) => v !== userId);
    option.voteTimestamps = option.voteTimestamps.filter(v => v.userId !== userId);
  } else {
    option.votes.push(userId);
    option.voteTimestamps.push({ userId, votedAt: new Date().toISOString() });
  }

  savePolls(polls);
  return poll;
}

export function closePoll(pollId: string): Poll | null {
  const polls = loadPolls();
  const poll = polls.find((p) => p.id === pollId);
  if (!poll) return null;
  poll.closed = true;
  savePolls(polls);
  return poll;
}

export function getPollsForChat(chatId: string): Poll[] {
  return loadPolls().filter((p) => p.chatId === chatId);
}

export function getPoll(pollId: string): Poll | null {
  return loadPolls().find((p) => p.id === pollId) || null;
}

export function deletePoll(pollId: string): void {
  const polls = loadPolls();
  savePolls(polls.filter((p) => p.id !== pollId));
}
