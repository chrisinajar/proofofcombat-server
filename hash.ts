import shajs from "sha.js";

// WHAT
const salt = "hash";

// this isn't the "secret key" used for hasing passwords, etc
// this is the "hidden key" used to generate quest events and other hidden deterministic values
const secretKey = hash(`hidden ${hash(process.env.SECRET ?? "")}`);

// just hash a value with our normal salt
export function hash(value: string): string {
  return shajs("sha512")
    .update(value + "proofofcombat" + salt)
    .digest("hex");
}

// a "hidden" hash, with a salt that isn't known to anyone
export function hiddenHash(value: string): string {
  return hash(`${value}proofofcombat${secretKey}`);
}
