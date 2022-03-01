import { v4 as uuidv4 } from "uuid";

import {
  Hero,
  BaseModel,
  TradeOffer,
  TradeOfferInput,
  InventoryItem,
} from "types/graphql";

import DatabaseInterface from "../interface";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

// type PartialChatMessage = Optional<ChatMessage, "type">;
// type PartialTradeOffer = Optional<TradeOffer>;

export default class TradeOfferModel extends DatabaseInterface<TradeOffer> {
  constructor() {
    super("trades");
  }

  async offersForHero(heroId: string): Promise<TradeOffer[]> {
    return this.db.iterateFilter((value, key) => {
      return value.toId === heroId;
    });
  }
  async offersFromHero(heroId: string): Promise<TradeOffer[]> {
    return this.db.iterateFilter((value, key) => {
      return value.fromId === heroId;
    });
  }
  async offersForItem(itemId: string): Promise<TradeOffer[]> {
    return this.db.iterateFilter((value, key) => {
      return value.item.id === itemId;
    });
  }

  async create(
    from: Hero,
    to: Hero,
    item: InventoryItem,
    gold: number
  ): Promise<TradeOffer> {
    const id = uuidv4();

    const duplicateTrades = await this.db.iterateFilter((value, key) => {
      if (
        value.fromId === from.id &&
        value.toId === to.id &&
        value.item.id === item.id
      ) {
        return true;
      }
      return false;
    });

    await Promise.all(duplicateTrades.map((dup) => this.del(dup)));

    return this.put({
      id,
      gold,
      fromId: from.id,
      fromName: from.name,
      toId: to.id,
      toName: to.name,
      item,
    });
  }

  // upgrade(data: PartialTradeOffer): TradeOffer {
  //   data.chat = data.chat.map((entry) => {
  //     if (!entry.type) {
  //       entry.type = "chat";
  //     }
  //     return entry;
  //   });

  //   return data as TradeOffer;
  // }
}
