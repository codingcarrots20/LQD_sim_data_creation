let fluid;
const Fluid = require('./fluid')
const noise = require('./noise')
const width = 300,height = 300
var t = 3.06;

function setup(dt,diffusion,viscocity) {
  fluid = new Fluid(dt,diffusion,viscocity);
}

function draw() {
  let cx = Math.floor((0.5 * width) );
  let cy = Math.floor((0.5 * height) );
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      fluid.addDensity(cx + i, cy + j, random(150, 250));
    }
  }

  for (let i = -1; i < 1; i++) {
    let angle = noise(t) *  6.28318530718* 2; // 2*pi
    let x = 0.2*Math.cos(angle);
    let y = 0.2*Math.sin(angle);
    t += 0.01;
    fluid.addVelocity(cx+i, cy+i, x, y);
  }

  fluid.step(0); // 0 prints just densities 1 prints everything
}

function random(min, max) {  
    return Math.floor(
      Math.random() * (max - min) + min
    )
  }



setup(0.1, 0, 0.00000001)

setInterval(draw,1000)