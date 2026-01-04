// using BFS to find the shortest path between two airports, more efficient than DFS in this case

export const findShortestPath = (
  startId: number,
  endId: number,
  maxDistance: number,
  getNeighbors: (id: number) => Array<{ id: number; distance: number }>
): number[] => {
  if (startId === endId) {
    return [startId];
  }

  const queue: number[] = [startId];
  const visited = new Set<number>([startId]);
  const parent = new Map<number, number>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === endId) {
      const path: number[] = [];
      let node: number | undefined = endId;
      while (node !== undefined) {
        path.unshift(node);
        node = parent.get(node);
      }
      return path;
    }

    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      if (neighbor.distance > maxDistance) {
        continue;
      }

      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        parent.set(neighbor.id, current);
        queue.push(neighbor.id);
      }
    }
  }

  return [];
};

export const findShortestPathAsync = async (
  startId: number,
  endId: number,
  maxDistance: number,
  getNeighbors: (id: number) => Promise<Array<{ id: number; distance: number }>>,
  maxNodes: number = 10000
): Promise<number[]> => {
  if (startId === endId) {
    return [startId];
  }

  const queue: number[] = [startId];
  const visited = new Set<number>([startId]);
  const parent = new Map<number, number>();

  while (queue.length > 0) {
    if (visited.size > maxNodes) {
      return [];
    }

    const current = queue.shift()!;

    if (current === endId) {
      const path: number[] = [];
      let node: number | undefined = endId;
      while (node !== undefined) {
        path.unshift(node);
        node = parent.get(node);
      }
      return path;
    }

    const neighbors = await getNeighbors(current);
    for (const neighbor of neighbors) {
      if (neighbor.distance > maxDistance) {
        continue;
      }

      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        parent.set(neighbor.id, current);
        queue.push(neighbor.id);
      }
    }
  }

  return [];
};

