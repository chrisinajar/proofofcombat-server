import shajs from "sha.js";

const salt = "asdf"; // replace this with config var later

// just hash a value with our normal salt
export function hash(value: string): string {
  return shajs("sha512")
    .update(value + "proofofcombar" + salt)
    .digest("hex");
}
