import type { Path, Shape } from "three";

type Three = typeof import("three");

function roundedOutline<T extends Path>(
  path: T,
  width: number,
  height: number,
  radius: number,
) {
  const x = width / 2;
  const y = height / 2;
  path.moveTo(-x + radius, -y);
  path.lineTo(x - radius, -y);
  path.quadraticCurveTo(x, -y, x, -y + radius);
  path.lineTo(x, y - radius);
  path.quadraticCurveTo(x, y, x - radius, y);
  path.lineTo(-x + radius, y);
  path.quadraticCurveTo(-x, y, -x, y - radius);
  path.lineTo(-x, -y + radius);
  path.quadraticCurveTo(-x, -y, -x + radius, -y);
  path.closePath();
  return path;
}

/** Original tray, shallow sifted-powder relief, and procedural microtexture. */
export function createPrecisionTray(three: Three) {
  const outline = (width: number, height: number, radius: number) =>
    roundedOutline(new three.Shape(), width, height, radius);
  const ring = (
    width: number,
    height: number,
    radius: number,
    innerWidth: number,
    innerHeight: number,
    innerRadius: number,
  ) => {
    const shape = outline(width, height, radius);
    const hole = roundedOutline(
      new three.Path(),
      innerWidth,
      innerHeight,
      innerRadius,
    );
    shape.holes.push(new three.Path(hole.getPoints(24).reverse()));
    return shape;
  };
  const extrude = (shape: Shape, depth: number, bevel: number) =>
    new three.ExtrudeGeometry(shape, {
      depth,
      steps: 1,
      curveSegments: 24,
      bevelEnabled: true,
      bevelSegments: 5,
      bevelSize: bevel,
      bevelThickness: bevel,
    });

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = 1024;
  colorCanvas.height = 640;
  const colorContext = colorCanvas.getContext("2d");
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = colorCanvas.width;
  grainCanvas.height = colorCanvas.height;
  const grainContext = grainCanvas.getContext("2d");
  if (!colorContext || !grainContext) {
    throw new Error("The matcha texture canvas is unavailable.");
  }

  const colorPixels = colorContext.createImageData(1024, 640);
  const grainPixels = grainContext.createImageData(1024, 640);
  const hash = (x: number, y: number) => {
    let value = Math.imul(x + 70429, 374761393) + Math.imul(y, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  };
  const softNoise = (x: number, y: number, scale: number) => {
    const cellX = Math.floor(x / scale);
    const cellY = Math.floor(y / scale);
    let u = x / scale - cellX;
    let v = y / scale - cellY;
    u = u * u * (3 - 2 * u);
    v = v * v * (3 - 2 * v);
    const upper = hash(cellX, cellY) * (1 - u) + hash(cellX + 1, cellY) * u;
    const lower =
      hash(cellX, cellY + 1) * (1 - u) + hash(cellX + 1, cellY + 1) * u;
    return upper * (1 - v) + lower * v;
  };
  for (let y = 0; y < 640; y += 1) {
    for (let x = 0; x < 1024; x += 1) {
      const index = (y * 1024 + x) * 4;
      const fine = hash(x, y);
      const sift = softNoise(x, y, 5);
      const broad = softNoise(x, y, 57);
      const value = 0.85 + fine * 0.22 + sift * 0.055 + broad * 0.035;
      colorPixels.data[index] = Math.round(60 * value);
      colorPixels.data[index + 1] = Math.round(83 * value);
      colorPixels.data[index + 2] = Math.round(22 * value);
      colorPixels.data[index + 3] = 255;
      const grain = Math.round(95 + fine * 40 + sift * 30);
      grainPixels.data[index] = grain;
      grainPixels.data[index + 1] = grain;
      grainPixels.data[index + 2] = grain;
      grainPixels.data[index + 3] = 255;
    }
  }
  colorContext.putImageData(colorPixels, 0, 0);
  grainContext.putImageData(grainPixels, 0, 0);
  const colorTexture = new three.CanvasTexture(colorCanvas);
  colorTexture.colorSpace = three.SRGBColorSpace;
  const grainTexture = new three.CanvasTexture(grainCanvas);
  const metal = new three.MeshStandardMaterial({
    color: "#bbc0c3",
    metalness: 1,
    roughness: 0.27,
    envMapIntensity: 1.1,
  });
  const lipMetal = new three.MeshStandardMaterial({
    color: "#d2d5d7",
    metalness: 1,
    roughness: 0.21,
    envMapIntensity: 1.15,
  });
  const powder = new three.MeshStandardMaterial({
    map: colorTexture,
    bumpMap: grainTexture,
    bumpScale: 0.009,
    metalness: 0,
    roughness: 0.98,
    envMapIntensity: 0.12,
  });

  const baseGeometry = extrude(outline(6.3, 3.8, 0.28), 0.055, 0.025);
  const wallGeometry = extrude(
    ring(6.3, 3.8, 0.28, 6.06, 3.56, 0.2),
    0.17,
    0.025,
  );
  const lipGeometry = extrude(
    ring(6.32, 3.82, 0.3, 6.08, 3.58, 0.2),
    0.04,
    0.025,
  );
  const powderPoint = (angle: number, radius = 1) => {
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const edge =
      1 + Math.sin(angle * 7 + 0.4) * 0.018 + Math.sin(angle * 13) * 0.008;
    return new three.Vector2(
      -0.14 +
        Math.sign(cosine) * Math.abs(cosine) ** 0.55 * 2.85 * radius * edge,
      0.12 + Math.sign(sine) * Math.abs(sine) ** 0.65 * 1.51 * radius * edge,
    );
  };
  const footprint = new three.Shape(
    Array.from({ length: 224 }, (_, index) =>
      powderPoint((index / 224) * Math.PI * 2),
    ),
  );
  const powderGeometry = extrude(footprint, 0.002, 0.0005);
  const positions = powderGeometry.getAttribute("position");
  const uv = powderGeometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    uv.setXY(
      index,
      (positions.getX(index) + 3.0525) / 6.105,
      (positions.getY(index) + 1.8025) / 3.605,
    );
  }

  // One contiguous soft bank. Its irregular feathered perimeter and swept
  // depression provide powder volume without adding clumps or coarse granules.
  const angularSteps = 224;
  const radialSteps = 72;
  const bankPositions: number[] = [];
  const bankUVs: number[] = [];
  const bankIndices: number[] = [];
  for (let radial = 0; radial <= radialSteps; radial += 1) {
    const radius = radial / radialSteps;
    for (let angular = 0; angular <= angularSteps; angular += 1) {
      const angle = (angular / angularSteps) * Math.PI * 2;
      const { x, y } = powderPoint(angle, radius);
      const envelope = Math.max(0, 1 - radius ** 2) ** 1.4;
      const sweep = -0.15 + 0.23 * Math.sin(x * 0.7) + x * 0.07;
      const ridge = Math.exp(-(((y - sweep + 0.13) / 0.28) ** 2));
      const depression = Math.exp(-(((y - sweep - 0.18) / 0.18) ** 2));
      const alongSweep = Math.exp(-((x / 2.4) ** 6));
      const height =
        0.002 +
        envelope *
          (0.27 + ridge * alongSweep * 0.09 - depression * alongSweep * 0.18);
      bankPositions.push(x, y, height);
      bankUVs.push((x + 3.0525) / 6.105, (y + 1.8025) / 3.605);
      if (radial < radialSteps && angular < angularSteps) {
        const a = radial * (angularSteps + 1) + angular;
        const b = a + angularSteps + 1;
        bankIndices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const bankGeometry = new three.BufferGeometry();
  bankGeometry.setAttribute(
    "position",
    new three.Float32BufferAttribute(bankPositions, 3),
  );
  bankGeometry.setAttribute("uv", new three.Float32BufferAttribute(bankUVs, 2));
  bankGeometry.setIndex(bankIndices);
  bankGeometry.computeVertexNormals();

  const group = new three.Group();
  group.rotation.x = -Math.PI / 2;
  const base = new three.Mesh(baseGeometry, metal);
  base.position.z = -0.08;
  const wall = new three.Mesh(wallGeometry, metal);
  wall.position.z = -0.015;
  const lip = new three.Mesh(lipGeometry, lipMetal);
  lip.position.z = 0.155;
  const surface = new three.Mesh(powderGeometry, powder);
  surface.position.z = 0.004;
  const bank = new three.Mesh(bankGeometry, powder);
  bank.position.z = 0.0065;
  base.receiveShadow = true;
  wall.receiveShadow = true;
  surface.receiveShadow = true;
  bank.receiveShadow = true;
  bank.castShadow = true;
  surface.castShadow = true;
  const fleckGeometry = new three.SphereGeometry(0.006, 5, 3);
  const flecks = new three.InstancedMesh(fleckGeometry, powder, 96);
  const grainTransform = new three.Object3D();
  for (let index = 0; index < 96; index += 1) {
    const angle = Math.PI * (1.02 + hash(index, 19) * 0.93);
    const point = powderPoint(angle, 1.015 + hash(index, 23) * 0.045);
    grainTransform.position.set(
      three.MathUtils.clamp(point.x, -2.98, 2.98),
      three.MathUtils.clamp(point.y, -1.7, 1.7),
      0.006,
    );
    grainTransform.scale.setScalar(0.4 + hash(index, 31) * 0.65);
    grainTransform.updateMatrix();
    flecks.setMatrixAt(index, grainTransform.matrix);
  }
  group.add(base, wall, lip, surface, bank, flecks);

  return {
    group,
    dispose() {
      flecks.dispose();
      for (const geometry of [
        baseGeometry,
        wallGeometry,
        lipGeometry,
        powderGeometry,
        bankGeometry,
        fleckGeometry,
      ]) {
        geometry.dispose();
      }
      metal.dispose();
      lipMetal.dispose();
      powder.dispose();
      colorTexture.dispose();
      grainTexture.dispose();
    },
  };
}
