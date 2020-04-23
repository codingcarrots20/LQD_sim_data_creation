let N = 300;
let iter = 16;
let SCALE = 1;
let t = 0;

const fs = require('fs') 

function write(data){
    fs.appendFile('output.txt',data,(err)=>{
        if(err)
        throw err;
    })
    }

// function to use 1D array and fake the extra two dimensions --> 3D
function IX(x, y) {
  return x + y * N;
}

// Fluid cube class
module.exports= class Fluid {
  constructor(dt, diffusion, viscosity) {
    this.size = N;
    this.dt = dt;
    this.diff = diffusion;
    this.visc = viscosity;

    this.s = new Array(N * N).fill(0);
    this.density = new Array(N * N).fill(0);

    this.Vx = new Array(N * N).fill(0);
    this.Vy = new Array(N * N).fill(0);

    this.Vx0 = new Array(N * N).fill(0);
    this.Vy0 = new Array(N * N).fill(0);
  }

  // step method
  step(choice) {
    let N = this.size;
    let visc = this.visc;
    let diff = this.diff;
    let dt = this.dt;

    let Vx = this.Vx;
    let Vy = this.Vy;
    let Vx0 = this.Vx0;
    let Vy0 = this.Vy0;
    let s = this.s;
    let density = this.density;

    diffuse(1, Vx0, Vx, visc, dt);
    diffuse(2, Vy0, Vy, visc, dt);

    project(Vx0, Vy0, Vx, Vy);

    advect(1, Vx, Vx0, Vx0, Vy0, dt);
    advect(2, Vy, Vy0, Vx0, Vy0, dt);

    project(Vx, Vy, Vx0, Vy0);
    diffuse(0, s, density, diff, dt);
    advect(0, density, s, Vx, Vy, dt);

    if (choice === 0){
        write("d \n"+this.density+"\n")
    }else if (choice === 1){
        write("VX \n"+this.Vx+"\n")
        write("Vy \n"+this.Vy+"\n")
        write("VX0 \n"+this.Vx0+"\n")
        write("Vy0 \n"+this.Vy0+"\n")
        write("s \n"+this.s+"\n")
        write("d \n"+this.density+"\n")
    }

  }

  // method to add density
  addDensity(x, y, amount) {
    let index = IX(x, y);
    this.density[index] += amount;
  }

  // method to add velocity
  addVelocity(x, y, amountX, amountY) {
    let index = IX(x, y);
    this.Vx[index] += amountX;
    this.Vy[index] += amountY;
  }




}





//============================================================================================




/*
    Function of diffuse
    - b : int
    - x : float[]
    - x0 : float[]
    - diff : float
    - dt : flaot
*/
function diffuse(b, x, x0, diff, dt) {
    let a = dt * diff * (N - 2) * (N - 2);
    lin_solve(b, x, x0, a, 1 + 6 * a);
  }
  
  /*
      Function of solving linear differential equation
      - b : int
      - x : float[]
      - x0 : float[]
      - a : float
      - c : float
  */
  function lin_solve(b, x, x0, a, c) {
    let cRecip = 1.0 / c;
    for (let t = 0; t < iter; t++) {
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          x[IX(i, j)] =
            (x0[IX(i, j)] +
              a *
                (x[IX(i + 1, j)] +
                  x[IX(i - 1, j)] +
                  x[IX(i, j + 1)] +
                  x[IX(i, j - 1)])) *
            cRecip;
        }
      }
      set_bnd(b, x);
    }
  }
  
  /*
      Function of project : This operation runs through all the cells and fixes them up so everything is in equilibrium.
      - velocX : float[]
      - velocY : float[]
      = p : float[]
      - div : float[]
  */
  function project(velocX, velocY, p, div) {
    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        div[IX(i, j)] =
          (-0.5 *
            (velocX[IX(i + 1, j)] -
              velocX[IX(i - 1, j)] +
              velocY[IX(i, j + 1)] -
              velocY[IX(i, j - 1)])) /
          N;
        p[IX(i, j)] = 0;
      }
    }
  
    set_bnd(0, div);
    set_bnd(0, p);
    lin_solve(0, p, div, 1, 6);
  
    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        velocX[IX(i, j)] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]) * N;
        velocY[IX(i, j)] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]) * N;
      }
    }
  
    set_bnd(1, velocX);
    set_bnd(2, velocY);
  }
  
  /*
      Function of advect: responsible for actually moving things around
      - b : int
      - d : float[]
      - d0 : float[]
      - velocX : float[]
      - velocY : float[]
      - velocZ : float[]
      - dt : float[]
  */
  function advect(b, d, d0, velocX, velocY, dt) {
    let i0, i1, j0, j1;
  
    let dtx = dt * (N - 2);
    let dty = dt * (N - 2);
  
    let s0, s1, t0, t1;
    let tmp1, tmp2, tmp3, x, y;
  
    let Nfloat = N;
    let ifloat, jfloat;
    let i, j, k;
  
    for (j = 1, jfloat = 1; j < N - 1; j++, jfloat++) {
      for (i = 1, ifloat = 1; i < N - 1; i++, ifloat++) {
        tmp1 = dtx * velocX[IX(i, j)];
        tmp2 = dty * velocY[IX(i, j)];
        x = ifloat - tmp1;
        y = jfloat - tmp2;
  
        if (x < 0.5) x = 0.5;
        if (x > Nfloat + 0.5) x = Nfloat + 0.5;
        i0 = Math.floor(x);
        i1 = i0 + 1.0;
        if (y < 0.5) y = 0.5;
        if (y > Nfloat + 0.5) y = Nfloat + 0.5;
        j0 = Math.floor(y);
        j1 = j0 + 1.0;
  
        s1 = x - i0;
        s0 = 1.0 - s1;
        t1 = y - j0;
        t0 = 1.0 - t1;
  
        let i0i = parseInt(i0);
        let i1i = parseInt(i1);
        let j0i = parseInt(j0);
        let j1i = parseInt(j1);
  
        d[IX(i, j)] =
          s0 * (t0 * d0[IX(i0i, j0i)] + t1 * d0[IX(i0i, j1i)]) +
          s1 * (t0 * d0[IX(i1i, j0i)] + t1 * d0[IX(i1i, j1i)]);
      }
    }
  
    set_bnd(b, d);
  }
  
  /*
      Function of dealing with situation with boundary cells.
      - b : int
      - x : float[]
  */
  function set_bnd(b, x) {
    for (let i = 1; i < N - 1; i++) {
      x[IX(i, 0)] = b == 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
      x[IX(i, N - 1)] = b == 2 ? -x[IX(i, N - 2)] : x[IX(i, N - 2)];
    }
    for (let j = 1; j < N - 1; j++) {
      x[IX(0, j)] = b == 1 ? -x[IX(1, j)] : x[IX(1, j)];
      x[IX(N - 1, j)] = b == 1 ? -x[IX(N - 2, j)] : x[IX(N - 2, j)];
    }
  
    x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
    x[IX(0, N - 1)] = 0.5 * (x[IX(1, N - 1)] + x[IX(0, N - 2)]);
    x[IX(N - 1, 0)] = 0.5 * (x[IX(N - 2, 0)] + x[IX(N - 1, 1)]);
    x[IX(N - 1, N - 1)] = 0.5 * (x[IX(N - 2, N - 1)] + x[IX(N - 1, N - 2)]);
  }

