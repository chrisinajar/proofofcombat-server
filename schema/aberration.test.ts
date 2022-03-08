import { getCurrentOdds, setNextMinTime, resetTimer } from "./aberration";

const nowMock = jest.fn(() => 1646716961676);
Date.now = nowMock;
const fakeStartTime = 1646716961676;

describe("aberration spawning system", () => {
  it("cant spawn right after one", () => {
    resetTimer();
    expect(getCurrentOdds()).toBe(0);
  });
  it("can spawn after an hour", () => {
    resetTimer();
    nowMock.mockReturnValueOnce(fakeStartTime + 1000 * 60 * 60 * 4);
    expect(getCurrentOdds()).toBeGreaterThan(0);
  });
  it("can gets more and more likely over time", () => {
    resetTimer();
    nowMock.mockReturnValueOnce(fakeStartTime + 1000 * 60 * 60 * 4);
    const firstTime = getCurrentOdds();
    nowMock.mockReturnValueOnce(fakeStartTime + 1000 * 60 * 60 * 5);
    expect(getCurrentOdds()).toBeGreaterThan(firstTime);
  });
  it("gets really likely after a while", () => {
    resetTimer();
    nowMock.mockReturnValueOnce(fakeStartTime + 1000 * 60 * 60 * 13);
    expect(getCurrentOdds()).toBeGreaterThan(0.5);
  });
});
