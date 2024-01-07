import { Item } from "./item";

describe("item base class", () => {
  it("does things", () => {
    const item = new Item({
      level: 3,
    });
    expect(item).toBeTruthy();
  });
});
