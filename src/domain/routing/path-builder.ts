export type RouteLeg = {
  fromId: number;
  toId: number;
  distance: number;
}

export const buildRoute = (path: number[], calculateDistance: (from: number, to: number) => number): RouteLeg[] => {
  if (path.length < 2) {
    return [];
  }

  const legs: RouteLeg[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const fromId = path[i];
    const toId = path[i + 1];
    const distance = calculateDistance(fromId, toId);

    legs.push({
      fromId,
      toId,
      distance,
    });
  }

  return legs;
};

