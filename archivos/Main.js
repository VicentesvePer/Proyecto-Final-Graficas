// 1. Enable shadow mapping in the renderer.
// 2. Enable shadows and set shadow parameters for the lights that cast shadows.
// Both the THREE.DirectionalLight type and the THREE.SpotLight type support shadows.
// 3. Indicate which geometry objects cast and receive shadows.

"use strict";

import * as THREE from "../libs/three.js/three.module.js";
import { OBJLoader } from "../libs/three.js/loaders/OBJLoader.js";
import { MTLLoader } from "../libs/three.js/loaders/MTLLoader.js";

const blocker = document.getElementById("blocker");
const btnInstructions = document.getElementById("instructions");

let renderer = null,
  scene = null,
  camera = null,
  group = null,
  objectList = [];
let mouse = new THREE.Vector2();
let duration = 20000; // ms
let currentTime = Date.now();

let spotLight = null,
  ambientLight = null;

let mapUrl = "../assets/Space.jpg";

let SHADOW_MAP_WIDTH = 1024,
  SHADOW_MAP_HEIGHT = 1024;

let objMtlModelUrl = {
  obj: "../assets/Gold_Star.obj",
  mtl: "../assets/Gold_Star.mtl",
  map: "../assets/Texture_gold.jpg",
};
let objModelSpaceship = {
  obj: "../assets/X-WING.obj",
  mtl: "../assets/X-WING.mtl",
};
let objModelEarth = { obj: "../assets/earth.obj", mtl: "../assets/earth.mtl" };
let objModelLightning = {
  obj: "../assets/Lightning.obj",
  mtl: "../assets/blank.mtl",
};
let objModelBull = { obj: "../assets/bull.obj", mtl: "../assets/blank.mtl" };

let R1 = { obj: "../assets/rock1.obj", mtl: "../assets/rock1.mtl" };
let R2 = { obj: "../assets/rock2.obj", mtl: "../assets/rock2.mtl" };
let R3 = { obj: "../assets/rock3.obj", mtl: "../assets/rock3.mtl" };
let R4 = { obj: "../assets/rock4.obj", mtl: "../assets/rock4.mtl" };
let R5 = { obj: "../assets/rock5.obj", mtl: "../assets/rock5.mtl" };

function main() {
  const canvas = document.getElementById("webglcanvas");
  createScene(canvas);
  update();
}

function onError(err) {
  console.error(err);
}

function onProgress(xhr) {
  if (xhr.lengthComputable) {
    const percentComplete = (xhr.loaded / xhr.total) * 100;
    //console.log( xhr.target.responseURL, Math.round( percentComplete, 2 ) + '% downloaded' );
  }
}

async function loadObjMtl(objModelUrl, objectList, position, scale, rotation) {
  try {
    const mtlLoader = new MTLLoader();

    const materials = await mtlLoader.loadAsync(
      objModelUrl.mtl,
      onProgress,
      onError
    );

    materials.preload();

    const objLoader = new OBJLoader();

    objLoader.setMaterials(materials);

    const object = await objLoader.loadAsync(
      objModelUrl.obj,
      onProgress,
      onError
    );

    object.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    //console.log(object);

    object.position.y += position[1];
    object.position.x += position[0];
    object.position.z += position[2];
    object.scale.set(scale[0], scale[1], scale[2]);

    object.rotation.z = rotation[1];
    object.rotation.x = rotation[0];
    object.rotation.y = rotation[2];

    objectList.push(object);
    scene.add(object);
  } catch (err) {
    onError(err);
  }
}

let flag = 1;
function animate() {
  let now = Date.now();
  let deltat = now - currentTime;
  currentTime = now;
  let fract = deltat / duration;

  try {
    objectList[1].rotation.z += 0.005;
    objectList[2].rotation.x += fract * flag * 2;
    objectList[2].position.y = mouse.y * 6 + 8;
    objectList[2].rotation.z = mouse.y * 0.15;
    if (objectList[2].rotation.x > 0.25) {
      flag = -1;
    }
    if (objectList[2].rotation.x < -0.25) {
      flag = 1;
    }
  } catch (e) {
    console.log("IGNORE", e);
  }
}

function update() {
  requestAnimationFrame(function () {
    update();
  });

  // Render the scene
  renderer.render(scene, camera);

  // Spin the cube for next frame
  animate();

  // Update the camera controller
}

function onDocumentPointerMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  //console.log(mouse.y);
}

function createScene(canvas) {
  // Create the Three.js renderer and attach it to our canvas
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

  // Set the viewport size
  renderer.setSize(canvas.width, canvas.height);

  // Turn on shadows
  renderer.shadowMap.enabled = true;

  // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // Create a new Three.js scene
  scene = new THREE.Scene();

  // Add  a camera so we can view the scene
  camera = new THREE.PerspectiveCamera(
    45,
    canvas.width / canvas.height,
    1,
    4000
  );
  camera.position.set(0, 5, 30);

  spotLight = new THREE.SpotLight(0xaaaaaa);
  spotLight.position.set(0, 10, 30);
  spotLight.target.position.set(0, 5, 0);
  scene.add(spotLight);

  spotLight.castShadow = true;

  spotLight.shadow.camera.near = 1;
  spotLight.shadow.camera.far = 200;
  spotLight.shadow.camera.fov = 45;

  spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
  spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

  ambientLight = new THREE.AmbientLight(0x444444, 0.8);
  scene.add(ambientLight);

  // Create the objects
  loadObjMtl(
    objModelSpaceship,
    objectList,
    [-8, 4, 0],
    [0.5, 0.5, 0.5],
    [0, 0, 0]
  );
  loadObjMtl(objModelEarth, objectList, [0, -2, 20], [10, 5, 5], [0, 0, 0]);

  loadObjMtl(
    objModelLightning,
    objectList,
    [-3, 5, 0],
    [0.5, 0.1, 0.3],
    [-Math.PI / 2, 0, 0]
  );
  loadObjMtl(
    objModelBull,
    objectList,
    [-3, 8, 0],
    [0.3, 0.3, 0.3],
    [-Math.PI / 2, 0, 0]
  );
  loadObjMtl(
    objMtlModelUrl,
    objectList,
    [1, 5, 0],
    [0.05, 0.05, 0.05],
    [0, 0, Math.PI / 2]
  );

  loadObjMtl(R1, objectList, [1, 0, 0], [1, 1, 1], [0, 0, 0]);
  loadObjMtl(R2, objectList, [1, 1, 0], [1, 1, 1], [0, 0, 0]);
  loadObjMtl(R3, objectList, [1, 2, 0], [1, 1, 1], [0, 0, 0]);
  loadObjMtl(R4, objectList, [1, -1, 0], [1, 1, 1], [0, 0, 0]);
  loadObjMtl(R5, objectList, [1, 0.5, 0], [1, 1, 1], [0, 0, 0]);

  // Create a group to hold the objects
  group = new THREE.Object3D();
  scene.add(group);

  // Create a texture map
  const map = new THREE.TextureLoader().load(mapUrl);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);

  // Put in a ground plane to show off the lighting
  let geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
  let mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshPhongMaterial({ map: map, side: THREE.DoubleSide })
  );

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -4.02;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  group.add(mesh);

  document.addEventListener("pointermove", onDocumentPointerMove);

  //initPointerLock();
}

/**
 * * Function to resize the scene
 */
function resize() {
  const canvas = document.getElementById("webglcanvas");

  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;

  camera.aspect = canvas.width / canvas.height;

  camera.updateProjectionMatrix();
  renderer.setSize(canvas.width, canvas.height);
}

/**
 * Function to start the game
 */

window.onload = () => {
  main();
  resize();
};

window.addEventListener("resize", resize, false);

btnInstructions.addEventListener("click", function handleClick() {
  if (blocker.style.display !== "none") {
    blocker.style.display = "none";
  }
});
