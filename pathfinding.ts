import Heap from "heap";

type TravelCost<Node> = (a: Node, b: Node) => number;
type DistanceEstimate<Node> = (a: Node, b: Node) => number;
type HashMethod<Node> = (node: Node) => string;
type Neighbors<Node> = (node: Node) => Node[];

type NodeData<Node> = {
  data: Node;
  // distance from this node to the goal
  distance: number;
  // total travel cost from start till here
  cost: number;
  // cost + distance
  score: number;
  parent?: NodeData<Node>;
};

export class Pathfinder<Node> {
  cost: TravelCost<Node>;
  distance: DistanceEstimate<Node>;
  hash: HashMethod<Node>;
  neighbors: Neighbors<Node>;
  maxIterations: number = 10000;
  maxLength: number = Infinity;

  constructor({
    distance,
    cost,
    hash,
    neighbors,
  }: {
    distance: DistanceEstimate<Node>;
    cost: TravelCost<Node>;
    hash: HashMethod<Node>;
    neighbors: Neighbors<Node>;
  }) {
    this.distance = distance;
    this.cost = cost;
    this.hash = hash;
    this.neighbors = neighbors;
  }

  findPath(start: Node, end: Node): { success: boolean; path: Node[] } {
    const openNodes = new Map<string, NodeData<Node>>();
    const heap = new Heap<NodeData<Node>>((a, b) => a.score - b.score);
    const startData: NodeData<Node> = {
      data: start,
      distance: this.distance(start, end),
      cost: 0,
      score: 0,
    };
    startData.score = startData.distance;

    let bestGuess = startData;
    heap.push(startData);
    openNodes.set(this.hash(start), startData);
    let iteration = 0;

    while (heap.size() && ++iteration < this.maxIterations) {
      const node = heap.pop();

      if (this.distance(node.data, end) === 0) {
        return {
          success: true,
          path: this.createPath(node),
        };
      }

      let didUpdate = false;
      // openNodes.delete(this.hash(node.data));
      this.neighbors(node.data).forEach((neighbor) => {
        const neighborHash = this.hash(neighbor);
        const costFromHere = node.cost + this.cost(node.data, neighbor);
        let existingItem = openNodes.get(neighborHash);
        if (!existingItem) {
          existingItem = {
            parent: node,
            data: neighbor,
            distance: Infinity,
            cost: Infinity,
            score: Infinity,
          };
          openNodes.set(neighborHash, existingItem);
        }
        if (existingItem.cost > costFromHere) {
          existingItem.cost = costFromHere;
          existingItem.distance = this.distance(neighbor, end);
          existingItem.score = existingItem.cost + existingItem.distance;
          if (existingItem.score < bestGuess.score) {
            bestGuess = existingItem;
          }
          didUpdate = true;
          heap.push(existingItem);
        }
      });
      if (didUpdate) {
        heap.heapify();
      }
    }
    return {
      success: false,
      path: this.createPath(bestGuess),
    };
  }

  createPath(end: NodeData<Node>): Node[] {
    const result: Node[] = [end.data];
    let current = end;
    while (current.parent) {
      current = current.parent;
      result.push(current.data);
    }

    return result;
  }
}
