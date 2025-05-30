import * as Engine from '/system/main.js';

(async () => {

  // Create a scene manager
  const gameScene = new Engine.Scene();

  // Initialize both 2D and 3D
  const app = await gameScene.initPixi({ layer: '2' });
  const { scene, camera, renderer } = gameScene.initThree({
    layer: '1'
  });

  // Create game containers
  const uiContainer = Engine.createPixiContainer(app);
  const gameWorldContainer = Engine.createPixiContainer(app);

  // Load assets
  const bunnyTexture = await Engine.Pixi.Assets.load('/disk/assets/bunny.png');

  // Game constants
  const GROUND_Y = app.screen.height - 120;
  const GRAVITY = 0.8;
  const JUMP_POWER = -15;
  const GAME_SPEED_INITIAL = 3;
  const OBSTACLE_SPAWN_RATE = 0.01;

  // Create ground
  const ground = new Engine.Pixi.Graphics();
  ground.beginFill(0x8B4513);
  ground.drawRect(0, GROUND_Y + 40, app.screen.width, 80);
  ground.endFill();
  gameWorldContainer.addChild(ground);

  // Create ground line
  const groundLine = new Engine.Pixi.Graphics();
  groundLine.lineStyle(4, 0x654321);
  groundLine.moveTo(0, GROUND_Y + 40);
  groundLine.lineTo(app.screen.width, GROUND_Y + 40);
  gameWorldContainer.addChild(groundLine);

  // Create player (bunny)
  const player = new Engine.Pixi.Sprite(bunnyTexture);
  player.anchor.set(0.5);
  player.x = 120;
  player.y = GROUND_Y;
  player.scale.set(0.8);
  gameWorldContainer.addChild(player);

  // Game state
  const gameState = {
    isPlaying: true,
    isGameOver: false,
    score: 0,
    gameSpeed: GAME_SPEED_INITIAL,
    time: 0,
    playerVelocityY: 0,
    isJumping: false,
    obstacles: [],
    backgroundShapes: []
  };

  // Create 3D background elements
  const createBackgroundShapes = () => {
    const shapes = [];
    const geometries = ['box', 'sphere', 'cylinder'];
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3];

    for (let i = 0; i < 15; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      let shape;
      if (geometry === 'box') {
        shape = Engine.createThreeMesh('box', [1, 1, 1], 'standard', { color });
      } else if (geometry === 'sphere') {
        shape = Engine.createThreeMesh('sphere', [0.5, 16, 16], 'standard', { color });
      } else {
        shape = Engine.createThreeMesh('cylinder', [0.5, 0.5, 1, 8], 'standard', { color });
      }

      shape.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        -10 - Math.random() * 10
      );

      shape.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        },
        floatSpeed: Math.random() * 0.005 + 0.002,
        floatOffset: Math.random() * Math.PI * 2
      };

      shapes.push(shape);
      scene.add(shape);
    }
    return shapes;
  };

  gameState.backgroundShapes = createBackgroundShapes();

  // Create obstacles
  const createObstacle = () => {
    const obstacle = new Engine.Pixi.Graphics();
    obstacle.beginFill(0x2C5530);
    obstacle.drawRect(0, 0, 25, 80);
    obstacle.endFill();
    obstacle.x = app.screen.width + 50;
    obstacle.y = GROUND_Y - 40;
    gameWorldContainer.addChild(obstacle);
    return obstacle;
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      if (gameState.isGameOver) {
        restartGame();
      } else if (!gameState.isJumping && gameState.isPlaying) {
        gameState.playerVelocityY = JUMP_POWER;
        gameState.isJumping = true;
      }
    }
  });
  window.addEventListener('keyup', (e) => keys[e.code] = false);

  // Collision detection
  const checkCollision = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y;
  };

  // Game over function
  const gameOver = () => {
    gameState.isGameOver = true;
    gameState.isPlaying = false;
  };

  // Restart game function
  const restartGame = () => {
    gameState.isPlaying = true;
    gameState.isGameOver = false;
    gameState.score = 0;
    gameState.gameSpeed = GAME_SPEED_INITIAL;
    gameState.playerVelocityY = 0;
    gameState.isJumping = false;
    player.y = GROUND_Y;

    // Clear obstacles
    gameState.obstacles.forEach(obstacle => gameWorldContainer.removeChild(obstacle));
    gameState.obstacles = [];
  };

  // Game logic animations
  const playerAnimation = () => {
    if (!gameState.isPlaying) return;

    // Apply gravity
    if (gameState.isJumping) {
      gameState.playerVelocityY += GRAVITY;
      player.y += gameState.playerVelocityY;

      // Check if landed
      if (player.y >= GROUND_Y) {
        player.y = GROUND_Y;
        gameState.isJumping = false;
        gameState.playerVelocityY = 0;
      }
    }

    // Simple running animation
    player.rotation = Math.sin(gameState.time * 0.3) * 0.1;
  };

  const obstacleAnimation = () => {
    if (!gameState.isPlaying) return;

    // Spawn obstacles
    if (Math.random() < OBSTACLE_SPAWN_RATE) {
      gameState.obstacles.push(createObstacle());
    }

    // Move obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
      const obstacle = gameState.obstacles[i];
      obstacle.x -= gameState.gameSpeed;

      // Check collision with player
      const playerBounds = {
        x: player.x - player.width / 3,
        y: player.y - player.height / 3,
        width: player.width / 1.5,
        height: player.height / 1.5
      };
      const obstacleBounds = {
        x: obstacle.x,
        y: obstacle.y,
        width: 25,
        height: 80
      };

      if (checkCollision(playerBounds, obstacleBounds)) {
        gameOver();
        return;
      }

      // Remove obstacles that are off screen
      if (obstacle.x < -50) {
        gameWorldContainer.removeChild(obstacle);
        gameState.obstacles.splice(i, 1);
        gameState.score += 10;
      }
    }
  };

  const backgroundAnimation = () => {
    gameState.time += 0.016;

    // Animate 3D background shapes
    gameState.backgroundShapes.forEach((shape, index) => {
      // Rotation
      shape.rotation.x += shape.userData.rotationSpeed.x;
      shape.rotation.y += shape.userData.rotationSpeed.y;
      shape.rotation.z += shape.userData.rotationSpeed.z;

      // Floating motion
      shape.position.y += Math.sin(gameState.time * shape.userData.floatSpeed + shape.userData.floatOffset) * 0.01;

      // Slowly drift to create depth
      shape.position.z += 0.005;
      if (shape.position.z > 5) {
        shape.position.z = -15;
        shape.position.x = (Math.random() - 0.5) * 20;
        shape.position.y = (Math.random() - 0.5) * 10;
      }
    });
  };

  const gameLogicAnimation = () => {
    if (!gameState.isPlaying) return;

    // Increase score over time
    gameState.score += 1;

    // Gradually increase game speed
    gameState.gameSpeed = GAME_SPEED_INITIAL + (gameState.score * 0.0001);
  };

  const cameraAnimation = () => {
    // Gentle camera movement for 3D background
    camera.position.x = Math.sin(gameState.time * 0.001) * 2;
    camera.position.y = Math.cos(gameState.time * 0.0015) * 1;
    camera.lookAt(0, 0, -5);
  };

  const renderAnimation = () => {
    renderer.render(scene, camera);
  };

  // Add all animations to the scene
  gameScene.addAnimation(playerAnimation);
  gameScene.addAnimation(obstacleAnimation);
  gameScene.addAnimation(backgroundAnimation);
  gameScene.addAnimation(gameLogicAnimation);
  gameScene.addAnimation(cameraAnimation);
  gameScene.addAnimation(renderAnimation);

  // Start the game
  gameScene.startAnimation();

  // Setup responsive design
  Engine.setupResponsiveResize(app, renderer, camera);

  // UI Elements
  const scoreText = new Engine.Pixi.Text('Score: 0', {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 0x333333,
    fontWeight: 'bold'
  });
  scoreText.x = 10;
  scoreText.y = 10;
  uiContainer.addChild(scoreText);

  const instructionText = new Engine.Pixi.Text('Press SPACE to jump', {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: 0x666666
  });
  instructionText.x = 10;
  instructionText.y = 40;
  uiContainer.addChild(instructionText);

  const gameOverText = new Engine.Pixi.Text('GAME OVER\nPress SPACE to restart', {
    fontFamily: 'Arial',
    fontSize: 32,
    fill: 0xff0000,
    fontWeight: 'bold',
    align: 'center'
  });
  gameOverText.anchor.set(0.5);
  gameOverText.x = app.screen.width / 2;
  gameOverText.y = app.screen.height / 2;
  gameOverText.visible = false;
  uiContainer.addChild(gameOverText);

  // Update UI
  const updateUI = () => {
    scoreText.text = `Score: ${gameState.score}`;
    gameOverText.visible = gameState.isGameOver;
    instructionText.visible = !gameState.isGameOver;
  };

  gameScene.addAnimation(updateUI);

})();