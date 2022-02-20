import { BaseModel } from "types/graphql";
import DatabaseInterface from "../interface";

export type ChatMessage = {
  message: string;
  from: string;
  id: number;
};

type System = BaseModel & {
  chat: ChatMessage[];
  currentOffset: number;
};

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
// type PartialSystem = Optional<System, "chatIdNumber">;

const systemSettingsKey = "system";

export default class SystemModel extends DatabaseInterface<System> {
  constructor() {
    super("system");
  }

  async getSystemSettings(): Promise<System> {
    try {
      return await this.get(systemSettingsKey);
    } catch (e) {
      const newSettings: System = {
        id: systemSettingsKey,
        chat: [],
        currentOffset: 0,
      };
      await this.put(newSettings);
      return newSettings;
    }
  }

  // upgrade(data: PartialSystem): System {
  //   data.chatIdNumber = data.chatIdNumber ?? 0;

  //   return data as System;
  // }
}
