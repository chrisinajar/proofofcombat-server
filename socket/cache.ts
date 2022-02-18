const chatCache = [];
const chatCacheSize = 50;

while (chatCache.length < chatCacheSize) {
  chatCache.push("");
}

type ChatMessage = {
  message: string;
  from: string
}

export function getChatCache() {

})
