export interface RouteLeg {
  fromId: number;
  toId: number;
  distance: number;
}

export const buildRoute = (path: number[], calculateDistance: (from: number, to: number) => number): RouteLeg[] => {
  return [];
};

