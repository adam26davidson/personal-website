class SpringLattice {
  positions: number[][];
  velocities: number[][];
  k: number = 1500; // spring constant
  a: number = 100; // lattice spacing
  b: number = 0.9; // equilibrium spring length as a fraction of a
  m: number = 0.8; // mass
  num_particles: number = 3000; // target number of particles (actual number may be different)
  num_rows: number = 60; // number of particles per row
  num_columns: number = 100; // number of particles per column
  damping: number = 0.5; // damping coefficient
  max_force: number = 1000; // maximum force
  attractor_force: number = 100; // force applied by the attractor
  attractor_position: number[] = [0, 0]; // position of the attractor (x, y) scaled to between 0 and 1
  attractor_on: boolean = false; // whether the attractor is on
  attractor_radius: number = 2; // radius of the attractor
  private isInitialized: boolean = false;

  constructor() {
    this.positions = new Array(this.num_rows)
      .fill(0)
      .map(() => new Array(this.num_columns).fill(0));
    this.velocities = new Array(this.num_rows)
      .fill(0)
      .map(() => new Array(this.num_columns).fill(0));
  }

  public initialize(width: number, height: number, numParticles: number) {
    if (this.isInitialized) {
      return;
    }
    this.num_particles = numParticles;
    this.num_columns = Math.floor(
      Math.sqrt(this.num_particles * (width / height))
    );
    this.num_rows = Math.floor(this.num_particles / this.num_columns);
    // initialize positions and velocities to 0
    this.positions = new Array(this.num_rows)
      .fill(0)
      .map(() => new Array(this.num_columns).fill(0));
    this.velocities = new Array(this.num_rows)
      .fill(0)
      .map(() => new Array(this.num_columns).fill(0));

    // set an initial attractor position
    this.attractor_position = [0.5, 0.5];
    this.attractor_on = true;
    setTimeout(() => {
      this.attractor_on = false;
    }, 300);
  }

  public resize(width: number, height: number, num_particles: number) {
    this.num_particles = num_particles;
    this.num_columns = Math.floor(
      Math.sqrt(this.num_particles * (width / height))
    );
    this.num_rows = Math.floor(this.num_particles / this.num_columns);
    // initialize positions and velocities to 0
    this.positions = new Array(this.num_rows)
      .fill(0)
      .map(() => new Array(this.num_columns).fill(0));
    this.velocities = new Array(this.num_rows)
      .fill(0)
      .map(() => new Array(this.num_columns).fill(0));
  }

  public sample(x: number, y: number) {
    const i = Math.floor(y * this.num_rows);
    const j = Math.floor(x * this.num_columns);
    if (i < 0 || i >= this.num_rows || j < 0 || j >= this.num_columns) {
      return 0;
    }
    return this.positions[i][j];
  }

  // private getForceComponent(d: number) {
  //   return (
  //     this.k * d * (1 - (this.b * this.a) / Math.sqrt(d * d + this.a * this.a))
  //   );
  // }

  private getForceComponentApproximate(d: number) {
    return this.k * d * (1 - this.b);
  }

  private getAttractorForce(i: number, j: number) {
    const aj = this.attractor_position[0] * this.num_columns;
    const ai = this.attractor_position[1] * this.num_rows;
    const distance = Math.max(Math.abs(j - aj), Math.abs(i - ai));

    if (distance <= this.attractor_radius) {
      return Math.max(
        this.attractor_force * (1 - distance / this.attractor_radius),
        0
      );
    }
    return 0;
  }

  setPosition(i: number, j: number, value: number) {
    if (i < 1 || i >= this.num_rows - 1 || j < 1 || j >= this.num_columns - 1) {
      return;
    }
    this.positions[i][j] = value;
  }

  clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  setAttractorPosition(x: number, y: number) {
    this.attractor_position = [x, y];
  }

  setAttractorOn() {
    this.attractor_on = true;
  }

  setAttractorOff() {
    this.attractor_on = false;
  }

  async update() {
    const time_delta = 1.0 / 20;
    // update positions and velocities
    for (let i = 0; i < this.num_rows; i++) {
      for (let j = 0; j < this.num_columns; j++) {
        let force = 0;
        if (i > 0) {
          force += this.getForceComponentApproximate(
            this.positions[i - 1][j] - this.positions[i][j]
          );
        } else {
          force += this.getForceComponentApproximate(0 - this.positions[i][j]);
        }
        if (i < this.num_rows - 1) {
          force += this.getForceComponentApproximate(
            this.positions[i + 1][j] - this.positions[i][j]
          );
        } else {
          force += this.getForceComponentApproximate(0 - this.positions[i][j]);
        }
        if (j > 0) {
          force += this.getForceComponentApproximate(
            this.positions[i][j - 1] - this.positions[i][j]
          );
        } else {
          force += this.getForceComponentApproximate(0 - this.positions[i][j]);
        }
        if (j < this.num_columns - 1) {
          force += this.getForceComponentApproximate(
            this.positions[i][j + 1] - this.positions[i][j]
          );
        } else {
          force += this.getForceComponentApproximate(0 - this.positions[i][j]);
        }
        const damping_force = -this.damping * this.velocities[i][j];
        if (Math.sign(damping_force) !== Math.abs(force)) {
          force += damping_force;
        }
        if (this.attractor_on) {
          force += this.getAttractorForce(i, j);
        }
        force = this.clamp(force, -this.max_force, this.max_force);
        this.velocities[i][j] += (force / this.m) * time_delta;
      }
    }
    for (let i = 0; i < this.num_rows; i++) {
      for (let j = 0; j < this.num_columns; j++) {
        this.positions[i][j] += this.velocities[i][j] * time_delta;
      }
    }
  }
}

export { SpringLattice };
