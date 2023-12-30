import { Pathfinder } from "./pathfinding";

type Node = {
  x: number;
  y: number;
};

function distance(start: Node, end: Node): number {
  return Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
}

function cost(start: Node, end: Node): number {
  return 1;
}

function neighbors(node: Node): Node[] {
  const results = [];

  if (node.x > 0) {
    results.push({
      x: node.x - 1,
      y: node.y,
    });
  }
  if (node.y > 0) {
    results.push({
      y: node.y - 1,
      x: node.x,
    });
  }

  results.push({
    y: node.y + 1,
    x: node.x,
  });
  results.push({
    x: node.x + 1,
    y: node.y,
  });

  return results;
}
function hash(node: Node): string {
  return `${node.x}/${node.y}`;
}

describe("pathfinding", () => {
  it("can find paths", async () => {
    const pf = new Pathfinder<Node>({
      distance,
      cost,
      neighbors,
      hash,
    });

    expect(
      (await pf.findPath({ x: 1, y: 1 }, { x: 10, y: 1 })).path.length,
    ).toBe(10);
  });
  it("can find long paths", async () => {
    const pf = new Pathfinder<Node>({
      distance,
      cost,
      neighbors,
      hash,
    });

    expect(
      (await pf.findPath({ x: 1, y: 50 }, { x: 22, y: 13 })).path.length,
    ).toBe(71);
  });
  it("can find paths around walls", async () => {
    const pf = new Pathfinder<Node>({
      distance,
      cost,
      neighbors: (node: Node) =>
        neighbors(node).filter((n) => !(n.x < 12 && n.y < 5 && n.y > 3)),
      hash,
    });

    expect(
      (await pf.findPath({ x: 1, y: 1 }, { x: 5, y: 5 })).path.length,
    ).toBe(23);
  });
});
