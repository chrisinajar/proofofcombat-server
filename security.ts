import jwt from "jsonwebtoken";
import { BaseAccount } from "./types";
import { hash } from "./hash";

const secretKey = hash("secret");

export type WebTokenData = {
  id: string;
};

export type ChatTokenData = {
  chat: true;
  id: string;
  name: string;
};

export type SignaleData = WebTokenData | ChatTokenData;

export function tokenForAccount(account: BaseAccount): string {
  return sign({
    id: account.id,
  });
}

export function sign(data: SignaleData): string {
  return jwt.sign(data, secretKey);
}

export function confirm<Type extends SignaleData>(token: string): Type | false {
  try {
    return jwt.verify(token, secretKey) as Type;
  } catch (e) {
    return false;
  }
}
