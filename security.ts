import jwt from "jsonwebtoken";
import { hash } from "./hash";

const secretKey = hash("secret");

type WebTokenData = {
  id: string;
};

export function sign(data: WebTokenData): string {
  return jwt.sign(data, secretKey);
}

export function confirm(token: string): WebTokenData | false {
  try {
    return jwt.verify(token, secretKey) as WebTokenData;
  } catch (e) {
    return false;
  }
}
