export function adaptSpeed(speed, correct) {
  return Math.round(Math.min(3, Math.max(0.2, speed * (correct ? 1.12 : 0.88))) * 100) / 100;
}
export function scoreSelection(targets, selected) {
  return targets.filter(id => selected.includes(id)).length;
}
export function advanceBall(ball, dt, limit = 2.75) {
  for (const axis of ['x', 'y', 'z']) {
    ball.position[axis] += ball.velocity[axis] * dt;
    if (Math.abs(ball.position[axis]) > limit) {
      ball.position[axis] = Math.sign(ball.position[axis]) * limit;
      ball.velocity[axis] *= -1;
    }
  }
}
