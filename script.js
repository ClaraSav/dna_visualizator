let renderer;
let scene;
let camera;
const { innerWidth, innerHeight } = window;
const { sin, cos } = Math;
const DENSITY_RADIUS = 16;
const PHASE_SHIFT = 120;
let sides = [];
let connectionPoints = [];
let ADN = []

let colors_adn = {
	'A': 0x3AFE00,
	'T': 0xFF6F0B,
	'G': 0xB200FE,
	'C': 0x006CFE,
}

const rad = deg => (deg / 180) * Math.PI;
const getRandomPoint = () => DENSITY_RADIUS * Math.random() - (DENSITY_RADIUS / 2);
const range = x => Array(x).fill(0).map((_, index) => index);
const norm = (val, min, max) => (val - min) / (max - min);
const lerp = (nrm, min, max) => (max - min) * nrm + min;
const lerpMap = (val, sMin, sMax, dMin, dMax) => lerp(norm(val, sMin, sMax), dMin, dMax);

// draw the ADN

const init = () => {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(innerWidth, innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(
    15,
    innerWidth / innerHeight,
    1,
    5000
  );
  camera.position.z = 2500;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);

};

const getCirclePoints = a => {
  const angle = rad(a);
  const r = 100;
  const x = r * sin(angle);
  const z = r * cos(angle);
  return { x, z };
};

const addCylinder = (pa, pb, color) => {
  const direction = new THREE.Vector3().subVectors(pb, pa);
  const orientation = new THREE.Matrix4();
  orientation.lookAt(pa, pb, new THREE.Object3D().up);
  orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  const edgeGeometry = new THREE.CylinderGeometry(5, 5, direction.length(), 8);
  const edge = new THREE.Mesh(edgeGeometry, new THREE.MeshBasicMaterial({ color: color }));
  edge.position.copy(pa).add(pb).divideScalar(2);
  edge.setRotationFromMatrix(orientation);
  scene.add(edge);
};

const addSideCylinders = (points, color) => {
  for (let i = 0; i < points.length - 1; i++) {
    addCylinder(points[i], points[i], color);
  }
};

const calculateDnaPoints = () => {
  let adn_data = ADN.length * 30
  range(adn_data).forEach(a => {
    const pa = { ...getCirclePoints(a), y: 1.5 * (a - 180) };
    const pb = { ...getCirclePoints(a + PHASE_SHIFT), y: 1.5 * (a - 180) };
    sides.push(pa);
    sides.push(pb);
    if (a % 30 === 0) {
      connectionPoints.push({ pa, pb });
    }
  });
};


const draw_adn = () => {
  init();
  calculateDnaPoints();
  addSideCylinders(sides, 0xFF0000);
  count = 0
  connectionPoints.forEach(({ pa, pb }) => {
    let middle_point = {x: (pb.x + pa.x) / 2, y: (pb.y + pa.y) / 2, z: (pb.z + pa.z) / 2}
    let color_a = ADN.length > count ? colors_adn[ADN[count][0]] : 0xFFFFFF;
    let color_b = ADN.length > count ? colors_adn[ADN[count][1]] : 0xFFFFFF;
    addCylinder(pa, middle_point, color_a);
    addCylinder(middle_point, pb, color_b);
    count = count + 1
  })

  const loop = () => {
    scene.rotation.y += 0.01;
    requestAnimationFrame(loop);
    renderer.render(scene, camera);
  };

  loop();
}

// get file
document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const content = e.target.result;
          //document.getElementById('fileContent').textContent = content;
          ADN = ADN.concat(processFasta(content))[0];
          if (ADN.length > 0) {draw_adn()}
      };
      reader.readAsText(file);
  }
});

function processFasta(content) {
  const lines = content.split('\n');
  let sequences = [];
  let currentSequence = { header: '', sequence: '' };

  lines.forEach(line => {
      if (line.startsWith('>')) {
          if (currentSequence.header) {
              sequences.push(currentSequence);
              currentSequence = { header: '', sequence: '' };
          }
          currentSequence.header = line.slice(1).trim();
      } else {
          currentSequence.sequence += line.trim();
      }
  });

  if (currentSequence.header) {
      sequences.push(currentSequence);
  }

  const dnaData = generateDnaData(sequences);
  return dnaData
}

function generateDnaData(sequences) {
  const dnaData = [];

  sequences.forEach(seq => {
      const pairs = [];
      for (let i = 0; i < seq.sequence.length - 1; i++) {
          const pair = [seq.sequence[i], complement(seq.sequence[i])];
          pairs.push(pair);
      }
      dnaData.push(pairs);
  });

  return dnaData;
}

function complement(base) {
  switch (base.toUpperCase()) {
      case 'A': return 'T';
      case 'T': return 'A';
      case 'G': return 'C';
      case 'C': return 'G';
      default: return base;
  }
}
