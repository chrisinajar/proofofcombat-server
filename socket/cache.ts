type ChatMessage = {
  message: string;
  from: string;
  id: number;
};

const serverStartTime = new Date();

const chatCache: ChatMessage[] = [
  {
    from: `${serverStartTime.toLocaleDateString("en-US", {
      timeZone: "America/Los_Angeles",
    })}`,
    message: `Server booted up at ${serverStartTime.toLocaleTimeString(
      "en-US",
      { timeZone: "America/Los_Angeles" }
    )} PST 🚀`,
    id: -1,
  },
];

const chatCacheSize = 50;
let currentOffset = 1;

export function addChatMessage(message: ChatMessage) {
  if (!chatCache[currentOffset]) {
    chatCache.push(message);
  } else {
    chatCache[currentOffset] = message;
  }
  currentOffset = (currentOffset + 1) % chatCacheSize;
}

export function getChatCache(): ChatMessage[] {
  const result: ChatMessage[] = [];
  for (let i = 0, l = Math.min(chatCache.length, chatCacheSize); i < l; ++i) {
    const index = (i + currentOffset) % chatCache.length;
    result.push(chatCache[(i + currentOffset) % chatCache.length]);
  }

  return result.reverse();
}
