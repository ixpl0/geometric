import Matter from 'matter-js'

export interface ElementOptions {
  friction?: number
  frictionStatic?: number
  frictionAir?: number
  restitution?: number
  density?: number
  render?: {
    fillStyle?: string
    strokeStyle?: string
    lineWidth?: number
  }
}

export class ElementFactory {
  static createBall(
    x: number,
    y: number,
    radius: number,
    options: ElementOptions = {}
  ): Matter.Body {
    return Matter.Bodies.circle(x, y, radius, {
      density: options.density || 1,
      restitution: options.restitution || 1.1,
      friction: options.friction || 0,
      frictionAir: options.frictionAir || 0.005,
      render: options.render || { fillStyle: '#ff0000' }
    })
  }
  
  static createBox(
    x: number,
    y: number,
    width: number,
    height: number,
    options: ElementOptions = {}
  ): Matter.Body {
    return Matter.Bodies.rectangle(x, y, width, height, {
      friction: options.friction || 0,
      frictionStatic: options.frictionStatic || 0,
      frictionAir: options.frictionAir || 0,
      restitution: options.restitution || 1,
      density: options.density || 1,
      render: options.render || { fillStyle: '#3498db' }
    })
  }
  
  static createBoundaryBox(
    x: number,
    y: number,
    width: number,
    height: number,
    thickness: number = 10,
    options: ElementOptions = {}
  ): Matter.Body {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    const parts = [
      Matter.Bodies.rectangle(
        -halfWidth + thickness / 2,
        0,
        thickness,
        height,
        options
      ),
      Matter.Bodies.rectangle(
        0,
        -halfHeight + thickness / 2,
        width,
        thickness,
        options
      ),
      Matter.Bodies.rectangle(
        halfWidth - thickness / 2,
        0,
        thickness,
        height,
        options
      ),
      Matter.Bodies.rectangle(
        0,
        halfHeight - thickness / 2,
        width,
        thickness,
        options
      ),
    ]
    
    const compound = Matter.Body.create({
      parts,
      isStatic: true,
      render: options.render || { fillStyle: '#e74c3c' }
    })
    
    Matter.Body.setPosition(compound, { x, y })
    
    return compound
  }
  
  static createPolygon(
    x: number,
    y: number,
    sides: number,
    radius: number,
    options: ElementOptions = {}
  ): Matter.Body {
    return Matter.Bodies.polygon(x, y, sides, radius, {
      friction: options.friction || 0,
      frictionStatic: options.frictionStatic || 0,
      frictionAir: options.frictionAir || 0.01,
      restitution: options.restitution || 0.8,
      density: options.density || 1,
      render: options.render || { fillStyle: '#9b59b6' }
    })
  }
  
  static createChain(
    x: number,
    y: number,
    length: number,
    elementSize: number = 20,
    linkStiffness: number = 0.8
  ): Matter.Composite {
    const group = Matter.Body.nextGroup(true)
    
    const chain = Matter.Composites.stack(
      x,
      y,
      length,
      1,
      10,
      10,
      (x: number, y: number) => {
        return Matter.Bodies.rectangle(x, y, elementSize, elementSize / 2, {
          collisionFilter: { group },
          render: { fillStyle: '#f39c12' }
        })
      }
    )
    
    Matter.Composites.chain(chain, 0.5, 0, -0.5, 0, {
      stiffness: linkStiffness,
      length: 2,
      render: { type: 'line', visible: false }
    })
    
    return chain
  }
  
  static setVelocity(body: Matter.Body, vx: number, vy: number): void {
    Matter.Body.setVelocity(body, { x: vx, y: vy })
  }
  
  static applyForce(
    body: Matter.Body,
    force: { x: number; y: number }
  ): void {
    Matter.Body.applyForce(body, body.position, force)
  }
}