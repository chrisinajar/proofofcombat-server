import { Hero, InventoryItem, Quest } from "types/graphql";
import { checkHeroPurchase } from "./taste-for-business";
import { questEvents } from "./text/taste-for-business";

describe("Taste for Business Quest", () => {
  let mockHero: Hero;
  let mockItem: InventoryItem;
  let mockContext: any;

  beforeEach(() => {
    mockHero = {
      id: "test-hero-1",
      questLog: {},
    } as Hero;

    mockItem = {
      id: "test-item-1",
    } as InventoryItem;

    mockContext = {};
  });

  it("should initialize quest log on first purchase", () => {
    const result = checkHeroPurchase(mockContext, mockHero, mockItem, 100);
    
    expect(result.questLog.tasteForBusiness).toEqual({
      id: "TasteForBusiness-test-hero-1",
      started: false,
      finished: false,
      progress: 100,
      lastEvent: null,
    });
  });

  it("should accumulate progress without triggering events under 1000", () => {
    let hero = checkHeroPurchase(mockContext, mockHero, mockItem, 500);
    hero = checkHeroPurchase(mockContext, hero, mockItem, 400);

    expect(hero.questLog.tasteForBusiness?.progress).toBe(900);
    expect(hero.questLog.tasteForBusiness?.lastEvent).toBeNull();
  });

  it("should trigger first event at exactly 1000", () => {
    let hero = checkHeroPurchase(mockContext, mockHero, mockItem, 1000);

    expect(hero.questLog.tasteForBusiness?.progress).toBe(1001);
    expect(hero.questLog.tasteForBusiness?.lastEvent?.id).toBe("TasteForBusiness-test-hero-1-aFineCustomer");
    expect(hero.questLog.tasteForBusiness?.lastEvent?.message).toBe(questEvents.aFineCustomer);
  });

  it("should trigger first event when crossing 1000 with multiple purchases", () => {
    let hero = checkHeroPurchase(mockContext, mockHero, mockItem, 600);
    hero = checkHeroPurchase(mockContext, hero, mockItem, 500);

    expect(hero.questLog.tasteForBusiness?.progress).toBe(1001);
    expect(hero.questLog.tasteForBusiness?.lastEvent?.id).toBe("TasteForBusiness-test-hero-1-aFineCustomer");
  });

  it("should not trigger second event between 1000 and 2000", () => {
    let hero = checkHeroPurchase(mockContext, mockHero, mockItem, 1000); // First event
    hero = checkHeroPurchase(mockContext, hero, mockItem, 500);

    expect(hero.questLog.tasteForBusiness?.progress).toBe(1501);
    expect(hero.questLog.tasteForBusiness?.lastEvent?.id).toBe("TasteForBusiness-test-hero-1-aFineCustomer");
  });

  it("should trigger second event at 2000", () => {
    let hero = checkHeroPurchase(mockContext, mockHero, mockItem, 1000); // First event
    hero = checkHeroPurchase(mockContext, hero, mockItem, 1000); // Second event

    expect(hero.questLog.tasteForBusiness?.progress).toBe(2001);
    expect(hero.questLog.tasteForBusiness?.lastEvent?.id).toBe("TasteForBusiness-test-hero-1-aLittleOpportunity");
    expect(hero.questLog.tasteForBusiness?.lastEvent?.message).toBe(questEvents.aLittleOpportunity);
  });

  it("should not modify finished quest", () => {
    mockHero.questLog.tasteForBusiness = {
      id: "TasteForBusiness-test-hero-1",
      started: true,
      finished: true,
      progress: 2001,
      lastEvent: null,
    };

    const hero = checkHeroPurchase(mockContext, mockHero, mockItem, 500);

    expect(hero.questLog.tasteForBusiness?.progress).toBe(2001);
    expect(hero.questLog.tasteForBusiness?.finished).toBe(true);
  });
}); 