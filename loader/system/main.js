// Export Three.js and Pixi.js for direct access when needed
export * as Three from '/modules/three/build/three.module.js';
export * as Pixi from '/modules/pixi.js/dist/pixi.mjs';

// Re-export commonly used classes for convenience
import * as Three from '/modules/three/build/three.module.js';
import * as Pixi from '/modules/pixi.js/dist/pixi.mjs';

// Utility function for setting element layers
export function setLayer(element, layer = '2') {
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.left = '0';
  element.style.zIndex = layer;
  document.body.appendChild(element);
}

// Pixi.js wrapper functions
export async function createPixiApp(options = {}) {
  const defaultOptions = {
    backgroundAlpha: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    layer: '2'
  };
  
  const config = { ...defaultOptions, ...options };
  const app = new Pixi.Application();
  
  await app.init({
    backgroundAlpha: config.backgroundAlpha,
    width: config.width,
    height: config.height
  });
  
  setLayer(app.canvas, config.layer);
  
  return app;
}

export function createPixiContainer(app, centered = false) {
  const container = new Pixi.Container();
  app.stage.addChild(container);
  
  if (centered) {
    container.x = app.screen.width / 2;
    container.y = app.screen.height / 2;
    container.pivot.x = container.width / 2;
    container.pivot.y = container.height / 2;
  }
  
  return container;
}

export async function createPixiSprite(texturePath, options = {}) {
  const texture = await Pixi.Assets.load(texturePath);
  const sprite = new Pixi.Sprite(texture);
  
  if (options.x !== undefined) sprite.x = options.x;
  if (options.y !== undefined) sprite.y = options.y;
  if (options.scale !== undefined) sprite.scale.set(options.scale);
  
  return sprite;
}

export function createSpriteGrid(texture, rows, cols, spacing = 40) {
  const sprites = [];
  
  for (let i = 0; i < rows * cols; i++) {
    const sprite = new Pixi.Sprite(texture);
    sprite.x = (i % cols) * spacing;
    sprite.y = Math.floor(i / cols) * spacing;
    sprites.push(sprite);
  }
  
  return sprites;
}

// Three.js wrapper functions
export function createThreeScene(options = {}) {
  const defaultOptions = {
    cameraFov: 75,
    cameraNear: 0.1,
    cameraFar: 1000,
    cameraZ: 5,
    rendererAntialias: true,
    clearColor: 0x330066,
    width: window.innerWidth,
    height: window.innerHeight,
    layer: '1',
    lighting: true
  };
  
  const config = { ...defaultOptions, ...options };
  
  const scene = new Three.Scene();
  const camera = new Three.PerspectiveCamera(
    config.cameraFov,
    config.width / config.height,
    config.cameraNear,
    config.cameraFar
  );
  const renderer = new Three.WebGLRenderer({ antialias: config.rendererAntialias });
  
  renderer.setSize(config.width, config.height);
  renderer.setClearColor(config.clearColor);
  setLayer(renderer.domElement, config.layer);
  
  camera.position.z = config.cameraZ;
  
  // Add basic lighting if requested
  if (config.lighting) {
    const ambientLight = new Three.AmbientLight(0x404040, 0.6);
    const directionalLight = new Three.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(ambientLight);
    scene.add(directionalLight);
  }
  
  return { scene, camera, renderer };
}

export function createThreeMesh(geometryType, geometryParams, materialType, materialParams) {
  let geometry;
  
  switch (geometryType) {
    case 'box':
      geometry = new Three.BoxGeometry(...geometryParams);
      break;
    case 'sphere':
      geometry = new Three.SphereGeometry(...geometryParams);
      break;
    case 'plane':
      geometry = new Three.PlaneGeometry(...geometryParams);
      break;
    case 'cylinder':
      geometry = new Three.CylinderGeometry(...geometryParams);
      break;
    default:
      geometry = new Three.BoxGeometry(1, 1, 1);
  }
  
  let material;
  
  switch (materialType) {
    case 'basic':
      material = new Three.MeshBasicMaterial(materialParams);
      break;
    case 'phong':
      material = new Three.MeshPhongMaterial(materialParams);
      break;
    case 'standard':
      material = new Three.MeshStandardMaterial(materialParams);
      break;
    default:
      material = new Three.MeshPhongMaterial(materialParams);
  }
  
  return new Three.Mesh(geometry, material);
}

// Animation system
export class AnimationManager {
  constructor() {
    this.animations = [];
    this.isRunning = false;
  }
  
  add(animationFn) {
    this.animations.push(animationFn);
  }
  
  remove(animationFn) {
    const index = this.animations.indexOf(animationFn);
    if (index > -1) {
      this.animations.splice(index, 1);
    }
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }
  
  stop() {
    this.isRunning = false;
  }
  
  animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());
    
    this.animations.forEach(animation => {
      try {
        animation();
      } catch (error) {
        console.error('Animation error:', error);
      }
    });
  }
}

// Scene management
export class Scene {
  constructor() {
    this.pixiApp = null;
    this.threeScene = null;
    this.animationManager = new AnimationManager();
  }
  
  async initPixi(options = {}) {
    this.pixiApp = await createPixiApp(options);
    return this.pixiApp;
  }
  
  initThree(options = {}) {
    this.threeScene = createThreeScene(options);
    return this.threeScene;
  }
  
  startAnimation() {
    this.animationManager.start();
  }
  
  stopAnimation() {
    this.animationManager.stop();
  }
  
  addAnimation(animationFn) {
    this.animationManager.add(animationFn);
  }
  
  removeAnimation(animationFn) {
    this.animationManager.remove(animationFn);
  }
}

// Utility functions
export function centerContainer(container, app) {
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;
}

export function handleResize(pixiApp, threeRenderer, threeCamera) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  if (pixiApp) {
    pixiApp.renderer.resize(width, height);
  }
  
  if (threeRenderer && threeCamera) {
    threeCamera.aspect = width / height;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(width, height);
  }
}

// Setup window resize handler
export function setupResponsiveResize(pixiApp, threeRenderer, threeCamera) {
  window.addEventListener('resize', () => {
    handleResize(pixiApp, threeRenderer, threeCamera);
  });
}