type ChatMessage = {
  message: string;
  from: string;
  id: number;
};

const chatCache: ChatMessage[] = [];
const chatCacheSize = 50;
let currentOffset = 0;

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
