import { ChatMessage } from "../db/models/system";
import Databases from "../db";
import { serverBootMessages } from "./motd";

let chatIdNumber = 0;

async function loadCacheCache() {
  console.log("Loading chat cache...");
  const systemData = await Databases.system.getSystemSettings();

  chatCache = systemData.chat.map((chat) => {
    chat.id = chatIdNumber++;
    return chat;
  });
  currentOffset = systemData.currentOffset;

  addChatMessage({
    from: `${serverStartTime.toLocaleDateString("en-US", {
      timeZone: "America/Los_Angeles",
    })} ${serverStartTime.toLocaleTimeString("en-US", {
      timeZone: "America/Los_Angeles",
    })} PST`,
    message: `Server booted up 🚀`,
  });
  addChatMessage({
    from: randomStartupMessage.from,
    message: randomStartupMessage.message,
  });
}

const serverStartTime = new Date();

const randomStartupMessage =
  serverBootMessages[Math.floor(serverBootMessages.length * Math.random())];

let chatCache: ChatMessage[] = [];

const chatCacheSize = 50;
let currentOffset = 0;

export async function addChatMessage(
  partialMessage: Omit<ChatMessage, "id">
): Promise<ChatMessage> {
  const message: ChatMessage = {
    ...partialMessage,
    id: chatIdNumber++,
  };
  if (!chatCache[currentOffset]) {
    chatCache.push(message);
  } else {
    chatCache[currentOffset] = message;
  }
  currentOffset = (currentOffset + 1) % chatCacheSize;

  const systemData = await Databases.system.getSystemSettings();

  systemData.chat = chatCache;
  systemData.currentOffset = currentOffset;

  await Databases.system.put(systemData);

  return message;
}

export function getChatCache(): ChatMessage[] {
  const result: ChatMessage[] = [];
  for (let i = 0, l = Math.min(chatCache.length, chatCacheSize); i < l; ++i) {
    const index = (i + currentOffset) % chatCache.length;
    result.push(chatCache[(i + currentOffset) % chatCache.length]);
  }

  return result.reverse();
}

loadCacheCache();
