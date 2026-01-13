// using BFS to find the shortest path between two airports, more efficient than DFS in this case

type Neighbor = { id: number; distance: number };

export const findShortestPathAsync = async (
  startId: number,
  endId: number,
  maxDistance: number,
  getNeighbors: (id: number) => Promise<Neighbor[]>,
  maxNodes = 10_000
): Promise<number[]> => {
  if (startId === endId) return [startId];

  const queue: number[] = [startId];
  let head = 0;

  const visited = new Set<number>([startId]);
  const parent = new Map<number, number>();

  while (head < queue.length) {
    if (visited.size > maxNodes) return [];

    const current = queue[head++];

    if (current === endId) {
      const path: number[] = [];
      let node: number | undefined = endId;
      while (node !== undefined) {
        path.push(node);
        node = parent.get(node);
      }
      path.reverse();
      return path;
    }

    const neighbors = await getNeighbors(current);
    for (let i = 0; i < neighbors.length; i++) {
      const n = neighbors[i];
      if (n.distance > maxDistance) continue;
      if (visited.has(n.id)) continue;

      visited.add(n.id);
      parent.set(n.id, current);
      queue.push(n.id);
    }
  }

  return [];
};


