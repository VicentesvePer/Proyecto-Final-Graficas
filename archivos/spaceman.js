"use strict";

import * as THREE from "../libs/three.js/three.module.js";
import { OBJLoader } from "../libs/three.js/loaders/OBJLoader.js";
import { MTLLoader } from "../libs/three.js/loaders/MTLLoader.js";
import {
  Particle,
  ParticleSystem,
} from "../assets/particles/particleSystem.js";

const { System } = window.Nebula;

//General variables
let game_status = false;

// THREE JS RENDER VARIABLES
let renderer = null,
  scene = null,
  camera = null,
  earthGroup = null,
  asteroidsGroup = null,
  objEarth = null,
  objShip = null,
  objAsteroid = null,
  objStar = null,
  objShield = null,
  listAsteroid = [],
  listPowerUp = [],
  listShield = [],
  listSmoke = [],
  aspectRatio = null,
  fieldOfView = null,
  nearPlane = null,
  farShip = null,
  shipBoxHelper = null,
  shipBox = null,
  asteroidBoxHelper = null,
  powerupBoxHelper = null,
  smoke = null,
  lstBoxHelpers = [],
  shipGroup = [],
  currentTime = Date.now();

// Movement variables
let WIDTH,
  HEIGHT,
  mousePos = { x: 0, y: 0 },
  isCollision = false;

// Lights variables
let spotLight = null,
  ambientLight = null,
  SHADOW_MAP_WIDTH = 1024,
  SHADOW_MAP_HEIGHT = 1024;

// Objects variables
let objModelEarth = {
    obj: "../assets/objects/Earth/earth.obj",
    mtl: "../assets/objects/Earth/earth.mtl",
  },
  objModelShip = {
    obj: "../assets/objects/Cartoon_Rocket/cartoon_rocket.obj",
    mtl: "../assets/objects/Cartoon_Rocket/cartoon_rocket.mtl",
  },
  objModelAsteroid = {
    obj: "../assets/objects/Asteroid/asteroid.obj",
    mtl: "../assets/objects/Asteroid/asteroid.mtl",
  },
  objModelStar = {
    obj: "../assets/objects/PowerUp/Star/power_up.obj",
    mtl: "../assets/objects/PowerUp/Star/power_up.mtl",
  },
  objModelShield = {
    obj: "../assets/objects/PowerUp/Shield/shield.obj",
    mtl: "../assets/objects/PowerUp/Shield/shield.mtl",
  };

//Score variables
let div_score = null,
  score = 0,
  shielded = false,
  lifes = 3;

function main() {
  const canvas = document.getElementById("webglcanvas");
  div_score = document.getElementById("score");
  initPointerLock();

  createScene(canvas);
  createLights();
  createEarth();
  createShip();
  update();
}

//Function to init the lights
function createLights() {
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
}

//Function to create the earth
async function createEarth() {
  // Create a group to hold object earth
  earthGroup = new THREE.Object3D();
  earthGroup.position.set(0, -7, 20);
  objEarth = await loadObjMtl(
    objModelEarth,
    [0, 0, 0],
    [10, 10, 10],
    [0, 0, 0]
  );
  //Add earth to its group
  earthGroup.add(objEarth);

  //Add the groud to the scene
  scene.add(earthGroup);
}

// Function to create the ship
async function createShip() {
  shipGroup = new THREE.Object3D();

  shipGroup.position.set(0, 0, 20);
  objShip = await loadObjMtl(
    objModelShip,
    [0, 0, 0],
    [0.1, 0.1, 0.1],
    [0, -1.5, 0]
  );

  shipBoxHelper = new THREE.BoxHelper(objShip, 0x00FFFF);
  shipBoxHelper.visible = false;
  shipBoxHelper.update();
  scene.add(shipBoxHelper);

  //Add the ship to the group and the group to the scene
  shipGroup.add(objShip);
  scene.add(shipGroup);
}

// Function to create PowerUp
async function createStar() {
  let x = 0,
    y = 0;

  let radius = genRand(11, 14.5, 2);
  let angle = Math.random() * Math.PI * 2;
  x = Math.cos(angle) * radius;
  y = Math.sin(angle) * radius;

  objStar = await loadObjMtl(
    objModelStar,
    [x, y, 0],
    [0.2, 0.2, 0.2],
    [0, 0, 0]
  );

  //Save the angle to change the position later
  objStar.angle = angle;

  listPowerUp.push(objStar);

  powerupBoxHelper = new THREE.BoxHelper(objStar, 0x00ff00);
  powerupBoxHelper.visible = false;
  powerupBoxHelper.update();

  scene.add(powerupBoxHelper);

  //Add Box helpers to the list
  lstBoxHelpers.push(powerupBoxHelper);

  //Add Asteroids to its group
  asteroidsGroup.add(objStar);
}

async function createShield() {
  let x = 0,
    y = 0;

  let radius = genRand(11, 14.5, 2);
  let angle = Math.random() * Math.PI * 2;
  x = Math.cos(angle) * radius;
  y = Math.sin(angle) * radius;

  objShield = await loadObjMtl(
    objModelShield,
    [x, y, 0],
    [0.1, 0.1, 0.1],
    [0, 0, 0]
  );

  //Save the angle to change the position later
  objShield.angle = angle;

  listShield.push(objShield);

  powerupBoxHelper = new THREE.BoxHelper(objShield, 0x00ff00);
  powerupBoxHelper.visible = false;
  powerupBoxHelper.update();

  scene.add(powerupBoxHelper);

  //Add Box helpers to the list
  lstBoxHelpers.push(powerupBoxHelper);

  //Add Asteroids to its group
  asteroidsGroup.add(objShield);
}

// Function to create the Asteroid
async function createAsteroid(noAsteroids, firstTime) {
  if (firstTime) {
    asteroidsGroup = new THREE.Object3D();
    asteroidsGroup.position.set(0, -7, 20);
  }

  // radius: Entre 11 y 14.5
  let x = 0,
    y = 0;

  for (let i = 0; i < noAsteroids; i++) {
    let radius = genRand(11, 14.5, 2);
    let angle = Math.random() * Math.PI * 2;
    x = Math.cos(angle) * radius;
    y = Math.sin(angle) * radius;

    objAsteroid = await loadObjMtl(
      objModelAsteroid,
      [x, y, 0],
      [5, 5, 5],
      [Math.random(), Math.random(), Math.random()]
    );

    //Save the angle to change the position later
    objAsteroid.angle = angle;

    listAsteroid.push(objAsteroid);

    asteroidBoxHelper = new THREE.BoxHelper(objAsteroid, 0x00ff00);
    asteroidBoxHelper.visible = false;
    asteroidBoxHelper.update();
    // asteroidBoxHelper
    //asteroidBoxHelper.checkCollisions();

    scene.add(asteroidBoxHelper);

    //Add Box helpers to the list
    lstBoxHelpers.push(asteroidBoxHelper);

    //Add Asteroids to its group
    asteroidsGroup.add(objAsteroid);
  }

  //Add the Asteroid to the scene
  if (firstTime) scene.add(asteroidsGroup);
}

//Function to rotate the earth
function rotateEarth(angle) {
  earthGroup.rotation.z += angle;
}

//Function to rotate the asteroids
function rotateAsteroids(angle) {
  if (game_status) {
    let PX = 0;
    let PY = -7;
    if (asteroidsGroup !== null) {
      asteroidsGroup.rotation.z += angle * 5;
      const coneWorldPosition = new THREE.Vector3();
      asteroidsGroup.updateMatrixWorld();

      for (let i = 0; i < listAsteroid.length; i++) {
        //Get the global position of each asteorid in the group
        listAsteroid[i].getWorldPosition(coneWorldPosition);

        //If the asteorid position is in the 1st quadrant, the postion change
        if (PX > coneWorldPosition.x && PY >= coneWorldPosition.y) {
          let radius = genRand(11, 14.5, 2);
          let x = Math.cos(listAsteroid[i].angle) * radius;
          let y = Math.sin(listAsteroid[i].angle) * radius;
          listAsteroid[i].position.set(x, y);
        }
      }
    }
  }
}

//Function to load the object
async function loadObjMtl(objModelUrl, position, scale, rotation) {
  try {
    const mtlLoader = new MTLLoader();

    const materials = await mtlLoader.loadAsync(objModelUrl.mtl);

    materials.preload();

    const objLoader = new OBJLoader();

    objLoader.setMaterials(materials);

    const object = await objLoader.loadAsync(objModelUrl.obj);

    object.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    object.position.x += position[0];
    object.position.y += position[1];
    object.position.z += position[2];
    object.scale.set(scale[0], scale[1], scale[2]);

    object.rotation.x = rotation[0];
    object.rotation.z = rotation[1];
    object.rotation.y = rotation[2];

    return object;
  } catch (err) {
    console.log(err);
  }
}

//Function to move the ship
function moveShip(angleShip) {
  if (game_status) {
    if (shipGroup !== null) {
      let moveInY = normalize(mousePos.y, -0.5, 0.5, 4, 7.5);
      let moveInX = normalize(mousePos.x, -2, 1, -10, 3);
      shipGroup.position.y += (moveInY - shipGroup.position.y) * 0.2;
      shipGroup.position.x += (moveInX - shipGroup.position.x) * 0.2;

      if (objShip !== null) {
        if (isCollision == true) {
          shipGroup.position.x = shipGroup.position.x - 0.2;
          objShip.rotation.z += angleShip * 4;
          setTimeout(() => {
            isCollision = false;
          }, 1000);
        } else {
          objShip.rotation.z = -1.5;
          objShip.rotation.x += angleShip;
        }
      }
    }
  }
}

//Function tu update the lifes
function updateLifes() {
  let life3 = document.getElementById("life3");
  let life2 = document.getElementById("life2");
  let life1 = document.getElementById("life1");
  if (lifes === 3) {
    life1.src = "../assets/images/sun_full_life.png";
    life2.src = "../assets/images/sun_full_life.png";
    life3.src = "../assets/images/sun_full_life.png";
  } else if (lifes === 2) {
    life1.src = "../assets/images/sun_full_life.png";
    life2.src = "../assets/images/sun_full_life.png";
    life3.src = "../assets/images/sun_empty_life.png";
  } else if (lifes == 1) {
    life1.src = "../assets/images/sun_full_life.png";
    life2.src = "../assets/images/sun_empty_life.png";
    life3.src = "../assets/images/sun_empty_life.png";
  } else {
    life1.src = "../assets/images/sun_empty_life.png";
    game_status = false;
    document.getElementById("page").style.cursor = "default";
    document.getElementById("container-instructions").style.display = "block";
    document.getElementById("id-game-over").style.display = "block";
  }
}

//Function to normalize the posisition from the mouse to the object
function normalize(v, vmin, vmax, tmin, tmax) {
  var nv = Math.max(Math.min(v, vmax), vmin);
  var dv = vmax - vmin;
  var pc = (nv - vmin) / dv;
  var dt = tmax - tmin;
  var tv = tmin + pc * dt;
  return tv;
}

//Funtion to check collisions
function checkCollisions() {
  shipBox = new THREE.Box3().setFromObject(objShip);

  if (listAsteroid.length > 0) {
    for (let i = 0; i < listAsteroid.length; i++) {
      let asteroidBox = new THREE.Box3().setFromObject(listAsteroid[i]);

      if (asteroidBox.intersectsBox(shipBox) && !shielded) {
        lstBoxHelpers[i].material.color = new THREE.Color("red");
        asteroidsGroup.remove(listAsteroid[i]);
        // lstBoxHelpers[i].visible = false;
        lifes--;
        isCollision = true;
        updateLifes();
        smokeParticles();
      } else {
        lstBoxHelpers[i].material.color = new THREE.Color("green");
      }
    }
  }
  if (listPowerUp.length > 0) {
    for (let i = 0; i < listPowerUp.length; i++) {
      let powerUpBox = new THREE.Box3().setFromObject(listPowerUp[i]);

      if (powerUpBox.intersectsBox(shipBox)) {
        console.log(powerUpBox);
        if (lifes < 3) {
          lifes++;
          asteroidsGroup.remove(listPowerUp[i]);
          updateLifes();
        }
      }
    }
  }
  if (listShield.length > 0) {
    for (let i = 0; i < listShield.length; i++) {
      let powerUpBox = new THREE.Box3().setFromObject(listShield[i]);
      if (powerUpBox.intersectsBox(shipBox)) {
          shipBoxHelper.visible = true;
          shielded = true;
          setTimeout(() => {
            shipBoxHelper.visible = false;
            shielded = false;
          }, 5000);
          asteroidsGroup.remove(listShield[i]);
      }
    }
  }
}

//Click to start the game
function initPointerLock() {
  let container_instructions = document.getElementById(
    "container-instructions"
  );
  let id_start = document.getElementById("id-start");

  id_start.addEventListener(
    "click",
    function () {
      //Hide the div of the instruction
      container_instructions.style.display = "none";
      //Give the control to move the ship
      document.addEventListener("mousemove", handleMouseMove, false);

      document.getElementById("page").style.cursor = "none";

      //Clear the scene (if the user restart the game)
      resetGame();

      //Create asteroids
      createAsteroid(10, true);
      //Check collisions
      checkCollisions();
    },
    false
  );
}

function updateScore(deltat) {
  if (game_status) {
    div_score.innerHTML = `Score: ${Math.floor(score)}`;
    if (Math.floor(score) % 50 === 0 && Math.floor(score) !== 0) {
      createAsteroid(1, false);
      createStar();
      createShield();
      score++;
    } else {
      score += 0.01 * deltat;
    }
  }
}

//function to remove all asteorid from scene
function resetGame() {
  //Change the game status to true
  game_status = true;

  //Reset score to 0
  score = 0;

  //Update lifes
  lifes = 3;
  updateLifes();

  //Clear all asteroids from scene
  if (listAsteroid.length > 0) {
    for (let i = 0; i < listAsteroid.length; i++) {
      asteroidsGroup.remove(listAsteroid[i]);
    }
  }

  //Clear all power ups from scene
  if (listPowerUp.length > 0) {
    for (let i = 0; i < listPowerUp.length; i++) {
      asteroidsGroup.remove(listPowerUp[i]);
    }
  }
  if (listShield.length > 0) {
    for (let i = 0; i < listShield.length; i++) {
      asteroidsGroup.remove(listShield[i]);
    }
  }
}

function animate() {
  //Animate variables
  let now = Date.now();
  let deltat = now - currentTime;
  currentTime = now;

  //Rotate Earth
  rotateEarth(Math.PI * 2 * (deltat / 50000));

  //Rotate Asteroids
  rotateAsteroids(Math.PI * 2 * (deltat / 50000));

  //Move ship
  moveShip(Math.PI * 2 * (deltat / 3000));

  //Update score
  updateScore(deltat);

  //Update shipBoxHelper
  shipBoxHelper.update();

  //Update lstBoxHelpers
  for (let i = 0; i < lstBoxHelpers.length; i++) {
    lstBoxHelpers[i].update();
  }
  //Function to check if the ship had a colission with an asteroid
  checkCollisions();

  //Verify if first instance of smoke exists before trying to update
  if (listSmoke.length > 0) {
    for (let i = 0; i < listSmoke.length; i++) {
      listSmoke[i].update(deltat);
    }
  }
}

function update() {
  requestAnimationFrame(function () {
    update();
  });

  renderer.render(scene, camera);

  animate();
}

async function createScene(canvas) {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  // Create the Three.js renderer and attach it to our canvas
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

  // Set the viewport size
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Turn on shadows
  renderer.shadowMap.enabled = true;
  // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // Create a new Three.js scene
  scene = new THREE.Scene();

  //Set background
  //scene.background = new THREE.Color("rgb(65, 61, 68)");
  const loader = new THREE.TextureLoader();
  loader.load("../assets/textures/cartoon_space3.jpg", function (texture) {
    scene.background = texture;
  });

  // Add  a camera so we can view the scene
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 45;
  nearPlane = 1;
  farShip = 4000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farShip
  );

  // Add  a camera so we can view the scene
  camera.position.set(0, 5, 30);

  //Resize the page
  window.addEventListener("resize", resize, false);
}

function resize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  camera.aspect = WIDTH / HEIGHT;

  camera.updateProjectionMatrix();
  renderer.setSize(WIDTH, HEIGHT);
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH) * 2;
  var ty = 1 - (event.clientY / HEIGHT) * 2;
  mousePos = { x: tx, y: ty };
}

window.onload = () => {
  main();
  resize();
};

function genRand(min, max, decimalPlaces) {
  var rand = Math.random() * (max - min) + min;
  var power = Math.pow(10, decimalPlaces);
  return Math.floor(rand * power) / power;
}

function smokeParticles() {
  let vertices = [],
    velocities = [],
    accelerations = [];
  const factor = 0.01;
  const shipPosition = new THREE.Vector3();
  objShip.getWorldPosition(shipPosition);
  for (let i = 0; i < 20; i++) {
    vertices.push(shipPosition.x, shipPosition.y, shipPosition.z);
    velocities.push(
      (Math.random() * 1 - 1) * factor,
      (Math.random() * 2 - 1) * factor,
      0 * factor
    );
    accelerations.push(
      (Math.random() * 2 - 1) * factor,
      (Math.random() * 2 - 1) * factor,
      (Math.random() * 2 - 1) * factor
    );
  }
  smoke = new ParticleSystem(
    vertices,
    velocities,
    accelerations,
    5,
    1,
    "../assets/images/cloud_1_512.png"
  );
  listSmoke.push(smoke);
  scene.add(smoke.particleObjects);
}
