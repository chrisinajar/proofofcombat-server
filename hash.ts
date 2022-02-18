import shajs from "sha.js";

const salt = "hash";

// just hash a value with our normal salt
export function hash(value: string): string {
  return shajs("sha512")
    .update(value + "proofofcombat" + salt)
    .digest("hex");
}
