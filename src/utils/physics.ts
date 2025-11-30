import type Matter from 'matter-js'

export const getBodySpeed = (body: Matter.Body): number => {
  if (!body.velocity) {
    return 0
  }
  return Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2)
}
