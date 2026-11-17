import type { CollisionRect } from "./MapDefinition";

export interface MovementVector {
  x: number;
  y: number;
}

export interface MovementStep {
  position: MovementVector;
  delta: MovementVector;
}

export class MovementController {
  constructor(
    private readonly worldWidth: number,
    private readonly worldHeight: number,
    private readonly collisionRects: readonly CollisionRect[],
    private readonly speed = 190,
    private readonly halfWidth = 12,
    private readonly halfHeight = 9
  ) {
    if (worldWidth <= 0 || worldHeight <= 0 || speed <= 0) {
      throw new Error("MovementController requires positive world dimensions and speed.");
    }
  }

  step(position: MovementVector, input: MovementVector, deltaSeconds: number): MovementStep {
    const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
    let vx = input.x;
    let vy = input.y;
    const magnitude = Math.hypot(vx, vy);
    if (magnitude > 1) {
      vx /= magnitude;
      vy /= magnitude;
    }

    const candidateX = position.x + vx * this.speed * dt;
    const candidateY = position.y + vy * this.speed * dt;
    const resolvedX = this.resolveAxis(position.x, candidateX, position.y, true);
    const resolvedY = this.resolveAxis(position.y, candidateY, resolvedX, false);
    const next = {
      x: Math.min(Math.max(resolvedX, this.halfWidth), this.worldWidth - this.halfWidth),
      y: Math.min(Math.max(resolvedY, this.halfHeight), this.worldHeight - this.halfHeight)
    };
    return {
      position: next,
      delta: { x: next.x - position.x, y: next.y - position.y }
    };
  }

  private resolveAxis(current: number, candidate: number, otherAxis: number, horizontal: boolean): number {
    for (const obstacle of this.collisionRects) {
      const overlapsOther = horizontal
        ? otherAxis + this.halfHeight > obstacle.y && otherAxis - this.halfHeight < obstacle.y + obstacle.height
        : otherAxis + this.halfWidth > obstacle.x && otherAxis - this.halfWidth < obstacle.x + obstacle.width;
      if (!overlapsOther) continue;

      const overlapsCandidate = horizontal
        ? candidate + this.halfWidth > obstacle.x && candidate - this.halfWidth < obstacle.x + obstacle.width
        : candidate + this.halfHeight > obstacle.y && candidate - this.halfHeight < obstacle.y + obstacle.height;
      if (!overlapsCandidate) continue;

      if (horizontal) {
        return candidate > current
          ? obstacle.x - this.halfWidth
          : obstacle.x + obstacle.width + this.halfWidth;
      }
      return candidate > current
        ? obstacle.y - this.halfHeight
        : obstacle.y + obstacle.height + this.halfHeight;
    }
    return candidate;
  }
}
