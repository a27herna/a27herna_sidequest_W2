// Y-position of the floor (ground level)
let floorY3;
let gridSize = 30;

let gridWidth = 25;
let gridHeight = 13;

let holdMove = false;
let moveX = 0;
let moveY = 0;

// Player character (soft, animated blob)
let blob3 = {
  // Position (centre of the blob)
  x: 0,
  y: 0,

  // Visual properties
  r: gridSize / 2, // Base radius
  points: 48, // Number of points used to draw the blob
  basePoints: 48, // Base number of points used to draw the blob
  panicPoints: 48 * 4, //Number of points used when 'panicking'
  wobble: 7, // Edge deformation amount
  baseWobble: 7,
  panicWobble: 7 * 2,
  wobbleFreq: 0.9,

  // Time values for breathing animation
  t: 0,
  tSpeed: 0.01,

  // Physics: velocity
  vx: 0, // Horizontal velocity
  vy: 0, // Vertical velocity

  // Movement tuning
  accel: 0.025, // Horizontal acceleration
  maxRun: 10.0, // Maximum horizontal speed
  gravity: 5, // Downward force
  jumpV: -11.0, // Initial jump impulse

  // State
  onGround: false, // True when standing on a platform

  // Friction
  frictionAir: 0.995, // Light friction in air
  frictionGround: 0.88, // Stronger friction on ground
};

// List of solid platforms the blob can stand on
// Each platform is an axis-aligned rectangle (AABB)
let platforms = [];

function setup() {
  createCanvas(gridSize * gridWidth, gridSize * gridHeight);

  // Define the floor height
  floorY3 = height - gridSize;

  noStroke();
  textFont("sans-serif");
  textSize(14);

  // Create platforms (floor + steps)
  platforms = [
    // // { x: 0, y: floorY3, w: width, h: height - floorY3 }, // floor
    // { x: 120, y: floorY3 - 70, w: 120, h: 12 }, // low step
    // { x: 300, y: floorY3 - 120, w: 90, h: 12 }, // mid step
    // { x: 440, y: floorY3 - 180, w: 130, h: 12 }, // high step
    // { x: 520, y: floorY3 - 70, w: 90, h: 12 }, // return ramp
  ];

  // ---Left/Right Walls + Exit ---
  for (let c = 0; c < width / gridSize; c++) {
    platforms.push({
      x: 0,
      y: c * gridSize,
      w: gridSize,
      h: gridSize,
    });

    platforms.push({
      x: c * gridSize,
      y: 0,
      w: gridSize,
      h: gridSize,
    });

    platforms.push({
      x: c * gridSize,
      y: height - gridSize,
      w: gridSize,
      h: gridSize,
    });

    if (c === 6) continue;

    platforms.push({
      x: width - gridSize,
      y: c * gridSize,
      w: gridSize,
      h: gridSize,
    });
  }

  // Starting box 4x4 (3x3)
  for (let c = 0; c < 5; c++) {
    platforms.push({
      x: gridSize * 4,
      y: height - gridSize * 2 - gridSize * c,
      w: gridSize,
      h: gridSize,
    });
    if (c > 1) continue;
    platforms.push({
      x: gridSize + gridSize * c,
      y: height - gridSize * 6,
      w: gridSize,
      h: gridSize,
    });
  }

  for (let i = 0; i < 3; i++) {
    for (let c = 0; c < gridHeight - 2; c++) {
      if (c === 5) {
        platforms.push({
          x: gridSize * (10 + i * 3),
          y: height - gridSize * 2 - gridSize * c,
          w: gridSize,
          h: gridSize,
          glass: true,
          onGround: true,
          broken: false,
        });
        continue;
      }

      platforms.push({
        x: gridSize * (10 + i * 3),
        y: height - gridSize * 2 - gridSize * c,
        w: gridSize,
        h: gridSize,
      });
    }
  }
  // Set the blob starting position
  blob3.x = gridSize * 2 - blob3.r;
  blob3.y = height - gridSize * 2 + blob3.r;
}

function draw() {
  background(240);
  backgroundGradient();

  // --- Draw all platforms ---
  for (const p of platforms) {
    if (p.glass) {
      stroke(120, 220, 255);
      fill(190, 220, 255);
      if (!p.broken) {
        rect(p.x, p.y, p.w, p.h);
      } else {
        beginShape();

        vertex(p.x, p.y + p.h);

        vertex(p.x + p.w * 0.125, p.y + p.h * 0.75);
        vertex(p.x + p.w * 0.25, p.y + p.h * 0.825);
        vertex(p.x + p.w * 0.5, p.y + p.h * 0.5);
        vertex(p.x + p.w * 0.75, p.y + p.h * 0.825);
        vertex(p.x + p.w * 0.825, p.y + p.h * 0.75);

        vertex(p.x + p.w, p.y + p.h);

        endShape();
      }
    } else {
      stroke(0);
      fill(200);
      rect(p.x, p.y, p.w, p.h);
    }
  }
  noStroke();

  // --- Input: left/right movement ---
  // if (!keyIsPressed) holdMove = null;

  // if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) move -= 1; // A or ←
  // if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) move += 1; // D or →

  if (blob3.vy < 0) {
    moveY--;
  }

  if (blob3.vy > 0) {
    moveY++;
  }

  if (blob3.vx < 0) {
    moveX--;
  }

  if (blob3.vx > 0) {
    moveX++;
  }

  blob3.vx += (blob3.accel * moveX) ** 3;
  blob3.vy += (blob3.accel * moveY) ** 3;

  // There's a math reason for this I swear
  // blob3.vx **= 3;

  // --- Apply friction and clamp speed ---
  blob3.vx *= blob3.onGround ? blob3.frictionGround : blob3.frictionAir;
  blob3.vx = constrain(blob3.vx, -blob3.maxRun, blob3.maxRun);
  blob3.vy *= blob3.onGround ? blob3.frictionGround : blob3.frictionAir;
  blob3.vy = constrain(blob3.vy, -blob3.maxRun, blob3.maxRun);

  // --- Apply gravity ---
  // blob3.vy += blob3.gravity;

  // --- Collision representation ---
  // We collide using a rectangle (AABB),
  // even though the blob is drawn as a circle
  let box = {
    x: blob3.x - blob3.r,
    y: blob3.y - blob3.r,
    w: blob3.r * 2,
    h: blob3.r * 2,
  };

  // --- STEP 1: Move horizontally, then resolve X collisions ---
  box.x += blob3.vx;
  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vx > 0) {
        // Moving right → hit the left side of a platform
        box.x = s.x - box.w;
        if (s.glass) {
          s.x += gridSize;
          s.onGround = false;
        }
      } else if (blob3.vx < 0) {
        // Moving left → hit the right side of a platform
        box.x = s.x + s.w;
      }
      blob3.vx = 0;
      moveX = 0;
    }
  }

  // --- STEP 2: Move vertically, then resolve Y collisions ---
  box.y += blob3.vy;
  blob3.onGround = false;

  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vy > 0) {
        // Falling → land on top of a platform
        box.y = s.y - box.h;
        blob3.vy = 0;
        blob3.onGround = true;
      } else if (blob3.vy < 0) {
        // Rising → hit the underside of a platform
        box.y = s.y + s.h;
        blob3.vy = 0;
      }
      moveY = 0;
    }
  }

  // --- Convert collision box back to blob centre ---
  blob3.x = box.x + box.w / 2;
  blob3.y = box.y + box.h / 2;

  for (const s of platforms) {
    if (s.glass & !s.onGround) {
      if (s.y >= floorY3 - gridSize) {
        s.y = floorY3 - gridSize;
        s.onGround = true;
        s.broken = true;
        continue;
      }

      s.y += blob3.gravity;
    }
  }

  // Keep blob inside the canvas horizontally
  blob3.x = constrain(blob3.x, blob3.r, width - blob3.r);

  // --- Draw the animated blob ---
  blob3.t += blob3.tSpeed;

  // --- Panic form when moving ---
  if (round(blob3.vx) !== 0 || round(blob3.vy) !== 0) {
    blob3.points = blob3.panicPoints;
    blob3.wobble = blob3.panicWobble;

    blob3.t += blob3.tSpeed * 10;
  } else {
    blob3.points = blob3.basePoints;
    blob3.wobble = blob3.baseWobble;
  }

  drawBlobCircle(blob3);

  // --- HUD ---
  fill(255);
  rect(7, 5, 328, 18);
  fill(0);
  text("Move: WASD or ←/↑/↓/→ •  Slide around to escape! ", 10, 18);
  // text(
  //   "Move: WASD or ←/↑/↓/→ •  Slide around to escape! " +
  //     key +
  //     " / " +
  //     blob3.x +
  //     " / " +
  //     blob3.y +
  //     " / " +
  //     moveX +
  //     " / " +
  //     moveY,
  //   10,
  //   18,
  // );
}

// Axis-Aligned Bounding Box (AABB) overlap test
// Returns true if rectangles a and b intersect
function overlap(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

// Draws the background gradient to the left of the screen
function backgroundGradient() {
  const endX = width / 5;

  for (let x = 0; x < endX; x++) {
    stroke(255, 0, 0, map(x, 0, endX, 100, 0));
    line(x, 0, x, height);
  }
  noStroke();
}

// Draws the blob using Perlin noise for a soft, breathing effect
function drawBlobCircle(b) {
  if (!((blob3.vx === 0) & (blob3.vy === 0))) {
    fill(255, 20, 120);
  } else {
    fill(20, 120, 255);
  }
  beginShape();

  for (let i = 0; i < b.points; i++) {
    const a = (i / b.points) * TAU;

    // Noise-based radius offset
    const n = noise(
      cos(a) * b.wobbleFreq + 100,
      sin(a) * b.wobbleFreq + 100,
      b.t,
    );

    const r = b.r + map(n, 0, 1, -b.wobble, b.wobble);

    vertex(b.x + cos(a) * r, b.y + sin(a) * r);
  }

  endShape(CLOSE);
}

// Jump input (only allowed when grounded)
function keyPressed() {
  if ((blob3.vx === 0) & (blob3.vy === 0)) {
    moveY = 0;
    moveX = 0;
    if (keyCode === UP_ARROW || key === "W" || key === "w") {
      moveY--;
    }

    if (keyCode === LEFT_ARROW || key === "A" || key === "a") {
      moveX--;
    }

    if (keyCode === DOWN_ARROW || key === "S" || key === "s") {
      moveY++;
    }

    if (keyCode === RIGHT_ARROW || key === "D" || key === "d") {
      moveX++;
    }
  }

  if (
    (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) &&
    blob3.onGround
  ) {
    blob3.vy = blob3.jumpV;
    blob3.onGround = false;
  }
}

/* In-class tweaks for experimentation:
   • Add a new platform:
     platforms.push({ x: 220, y: floorY3 - 150, w: 80, h: 12 });

   • “Ice” feel → frictionGround = 0.95
   • “Sand” feel → frictionGround = 0.80
*/
