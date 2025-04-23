(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { DrawHandler, SoundManager } = require("./javascript/ClientClasses");

// Configure socket.io with more permissive settings
const socket = io({
    transports: ['websocket', 'polling'],
    reconnectionAttempts: Infinity,
    timeout: 45000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
    forceNew: false
});

let playerName = '';
let gameStarted = false;
let isDead = false;

// DOM Elements
const canvas = document.getElementById('canvas');
const drawHandler = new DrawHandler(canvas);
const soundManager = new SoundManager(); // Initialize sound manager
const homePage = document.getElementById('homePage');
const gamePage = document.getElementById('gamePage');
const lobbyStatus = document.getElementById('lobbyStatus');
const gameResult = document.getElementById('gameResult');

// Socket event handlers
socket.on("message", function(data) {
    console.log(data);
    updateLobbyStatus(data);
});

socket.on("nameRejected", (message) => {
    const nameInput = document.getElementById('playerName');
    nameInput.style.borderColor = '#ff4444';
    showErrorMessage(message);
});

socket.on("nameAccepted", () => {
    switchToGamePage();
});

// Game control key mappings
const keyMap = {
    87: 'up',    // W
    83: 'down',  // S
    65: 'left',  // A
    68: 'right', // D
    32: 'attack' // Space
};

var inputs = {};

// Event handlers
document.addEventListener("keydown", function(e) {
    let button = keyMap[e.keyCode];
    setButton(button, true);
});

document.addEventListener("keyup", function(e) {
    let button = keyMap[e.keyCode];
    setButton(button, false);
});

// Game control functions
window.startGame = function() {
    const nameInput = document.getElementById('playerName');
    playerName = nameInput.value.trim();
    
    if (!playerName) {
        showErrorMessage('Please enter a name');
        nameInput.style.borderColor = '#ff4444';
        return;
    }
    
    socket.emit('setName', playerName);
};

function setButton(button, value) {
    if (button !== undefined && inputs[button] !== value && gameStarted && !isDead) {
        inputs[button] = value;
        socket.emit("setButton", {button: button, value: value});
    }
}

// UI Functions
function switchToGamePage() {
    homePage.style.display = 'none';
    gamePage.style.display = 'flex';
    // Start playing BGM when switching to game page
    soundManager.playBGM();
}

function showErrorMessage(message) {
    const errorMsg = document.createElement('div');
    errorMsg.style.color = '#ff4444';
    errorMsg.style.marginTop = '10px';
    errorMsg.textContent = message;
    
    const startSection = document.querySelector('.start-section');
    const existingError = startSection.querySelector('.error-message');
    
    if (existingError) {
        existingError.remove();
    }
    
    errorMsg.className = 'error-message';
    startSection.appendChild(errorMsg);
}

function updateLobbyStatus(message) {
    if (message.includes('waiting')) {
        lobbyStatus.textContent = message;
    }
}

// Game state event handlers
socket.on('gameStart', () => {
    gameStarted = true;
    lobbyStatus.textContent = 'Game Started!';
    // Play game start sound
    soundManager.playSound('gameStart');
    setTimeout(() => {
        lobbyStatus.textContent = '';
    }, 2000);
});

socket.on('playerDied', (data) => {
    if (data.playerId === socket.id) {
        isDead = true;
        const waitingMessage = document.getElementById('waitingMessage');
        waitingMessage.style.display = 'block';
        
        gameResult.textContent = 'You Lost!';
        gameResult.style.display = 'block';
        
        setTimeout(() => {
            gameResult.style.display = 'none';
        }, 2000);
    }
});

socket.on('gameOver', (data) => {
    gameStarted = false;
    const waitingMessage = document.getElementById('waitingMessage');
    waitingMessage.style.display = 'none';
    
    gameResult.textContent = data.won ? 'You Won!' : 'Game Over!';
    gameResult.style.display = 'block';
    // Play game over sound
    soundManager.playSound('gameOver');
    setTimeout(() => {
        gameResult.style.display = 'none';
        isDead = false;
    }, 3000);
});

// Sound event handler
socket.on('playPunchSound', () => {
    soundManager.playSound('punch');
});

// Game state updates
var currentLatency = 0;

socket.on("sendState", function(state) {
    state.latency = currentLatency;
    drawHandler.draw(state);
});

socket.on('pong', function(latency) {
    currentLatency = latency;
});
},{"./javascript/ClientClasses":2}],2:[function(require,module,exports){
// Merged client classes
class Sprite {
  constructor(image, cellSize, offset) {
    this.image = image;
    this.cellSize = cellSize;
    this.offset = offset;
  }

  draw(context, x, y) {
    this.drawIndex(context, 0, x, y);
  }

  drawIndex(context, index, x, y) {
    context.drawImage(
      this.image,
      this.cellSize.x * index,
      0,
      this.cellSize.x,
      this.cellSize.y,
      x + this.offset.x,
      y + this.offset.y,
      this.cellSize.x,
      this.cellSize.y,
    );
  }
}

class SpriteLoader {
  constructor() {
    this.sprites = {};
    
    const spriteData = [
      {
        spriteKey: 'stickman',
        filename: 'stickman.png',
        cellSize: {x: 64, y: 64},
        offset: {x: -32, y: -62}
      },
      {
        spriteKey: 'stickmanR',
        filename: 'stickmanR.png',
        cellSize: {x: 64, y: 64},
        offset: {x: -32, y: -62}
      },
      {
        spriteKey: 'stickmanAttacks',
        filename: 'stickmanAttacks.png',
        cellSize: {x: 128, y: 64},
        offset: {x: -96, y: -62}
      },
      {
        spriteKey: 'stickmanAttacksR',
        filename: 'stickmanAttacksR.png',
        cellSize: {x: 128, y: 64},
        offset: {x: -32, y: -62}
      },
      {
        spriteKey: 'stickmanShadow',
        filename: 'stickmanShadow.png',
        cellSize: {x: 64, y: 32},
        offset: {x: -32, y: -16}
      }
    ];
    
    spriteData.forEach(({spriteKey, filename, cellSize, offset}) => {
      let image = new Image();
      image.src = '/Assets/img/' + filename;
      let sprite = new Sprite(image, cellSize, offset);
      this.sprites[spriteKey] = sprite;
    });
  }
}

class DrawHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    let spriteLoader = new SpriteLoader();
    this.sprites = spriteLoader.sprites;
    
    this.playerColors = [
      '#FF4D4D', // Light Red
      '#8A2BE2', // Blue Violet
      '#1E90FF', // Dodger Blue
      '#FFD700', // Gold
      '#FF69B4', // Hot Pink
      '#FF5733', // Orange-Red
      '#9370DB', // Medium Purple
      '#FF8C00', // Dark Orange
      '#FF00FF', // Magenta
      '#BA55D3', // Medium Orchid
      '#000000', // Black
      '#FF6347'  // Tomato
    ];
  }

  draw(state) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (state.players) {
      const alivePlayers = state.players.filter(player => !player.isDead);
      
      alivePlayers.sort((a, b) => {
        return a.position.y - b.position.y;
      });

      alivePlayers.forEach((player) => {
        this.context.save();
        
        this.sprites['stickmanShadow'].draw(this.context, player.position.x, player.position.y);
        
        let {spriteKey, index} = player.animation;
        
        this.sprites[spriteKey].drawIndex(this.context, index, player.position.x, player.position.y);
        
        this.context.globalCompositeOperation = 'source-atop';
        this.context.globalAlpha = 0.5;
        this.context.fillStyle = this.playerColors[player.colorIndex % this.playerColors.length];
        
        const bounds = {
          x: player.position.x - 32,
          y: player.position.y - 62,
          width: 64,
          height: 64
        };
        
        this.context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        this.context.restore();
        
        this.context.fillStyle = '#ffffff';
        this.context.font = "14px Arial";
        this.context.textAlign = "center";
        this.context.fillText(player.name, player.position.x, player.position.y + 10);
        
        this.context.fillStyle = 'red';
        this.context.fillRect(player.position.x - 25, player.position.y - 70, 50, 8);
        
        this.context.fillStyle = 'green';
        const healthWidth = (player.health / 100) * 50;
        this.context.fillRect(player.position.x - 25, player.position.y - 70, healthWidth, 8);
        
        this.context.fillStyle = 'white';
        this.context.font = "12px Arial";
        this.context.fillText(player.health, player.position.x, player.position.y - 75);
      });
    }

    if (state.latency) {
      this.context.fillStyle = 'blue';
      this.context.font = "12px Arial";
      this.context.fillText(`Ping: ${state.latency}`, 10, 20);
    }
  }
}

class SoundManager {
  constructor() {
    this.sounds = {};
    this.bgmA = null;
    this.bgmB = null;
    this.currentBgm = 'A';
    this.soundsLoaded = false;
    this.soundPool = {}; // Sound pool for reusing audio objects
    this.poolSize = 3; // Number of sound instances per sound
    
    // Lazy loading - only load sounds when needed
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.loadSounds();
  }

  loadSounds() {
    // Create dual BGM instances for truly seamless looping
    this.bgmA = new Audio('/Assets/sounds/BGM.mp3');
    this.bgmA.volume = 0.5;
    
    this.bgmB = new Audio('/Assets/sounds/BGM.mp3');
    this.bgmB.volume = 0.5;
    
    // Set up event listener for seamless transition
    this.bgmA.addEventListener('timeupdate', () => {
      // Start the second audio 0.1 seconds before the end
      if (this.currentBgm === 'A' && this.bgmA.duration > 0 && 
          this.bgmA.currentTime > this.bgmA.duration - 0.1) {
        this.bgmB.currentTime = 0;
        const playPromise = this.bgmB.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn('BGM B autoplay prevented:', e));
        }
        this.currentBgm = 'B';
      }
    });
    
    this.bgmB.addEventListener('timeupdate', () => {
      // Start the first audio 0.1 seconds before the end
      if (this.currentBgm === 'B' && this.bgmB.duration > 0 && 
          this.bgmB.currentTime > this.bgmB.duration - 0.5) {
        this.bgmA.currentTime = 0;
        const playPromise = this.bgmA.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn('BGM A autoplay prevented:', e));
        }
        this.currentBgm = 'A';
      }
    });
    
    // Define sound effects
    const soundEffects = [
      { key: 'gameStart', src: '/Assets/sounds/GameStart.mp3' },
      { key: 'gameOver', src: '/Assets/sounds/GameOver.mp3' },
      { key: 'punch', src: '/Assets/sounds/PunchSound.mp3' }
    ];
    
    // Initialize sound pools
    soundEffects.forEach(({ key, src }) => {
      this.sounds[key] = new Audio();
      this.sounds[key].src = src;
      this.sounds[key].preload = 'none'; // Don't preload until needed
      this.sounds[key].volume = 0.7;
      
      // Create sound pool for sound effects
      this.soundPool[key] = [];
      for (let i = 0; i < this.poolSize; i++) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = 0.7;
        audio.load(); // Force preload
        this.soundPool[key].push({
          audio: audio,
          inUse: false
        });
      }
    });
    
    // Mark sounds as loaded after a short delay to allow preloading
    setTimeout(() => {
      this.soundsLoaded = true;
    }, 1000);
  }

  playBGM() {
    if (!this.initialized) this.init();
    
    // Start with bgmA
    if (this.bgmA.paused) {
      this.bgmA.currentTime = 0;
      this.currentBgm = 'A';
      
      // Use a promise with catch to handle autoplay restrictions
      const playPromise = this.bgmA.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Autoplay prevented, BGM will play after user interaction');
          // Add a one-time click handler to start BGM after user interaction
          const startAudio = () => {
            this.bgmA.play().catch(e => console.warn('BGM A play error:', e));
            document.removeEventListener('click', startAudio);
          };
          document.addEventListener('click', startAudio);
        });
      }
    }
  }

  stopBGM() {
    if (this.bgmA) {
      this.bgmA.pause();
      this.bgmA.currentTime = 0;
    }
    if (this.bgmB) {
      this.bgmB.pause();
      this.bgmB.currentTime = 0;
    }
    // Reset current BGM tracker
    this.currentBgm = 'A';
  }

  pauseBGM() {
    if (this.bgmA) {
      this.bgmA.pause();
    }
    if (this.bgmB) {
      this.bgmB.pause();
    }
  }

  playSound(soundKey) {
    if (!this.initialized) this.init();
    
    // Throttle sounds if they're coming in too quickly
    if (!this.soundsLoaded) return;
    
    // Use sound from pool
    if (this.soundPool[soundKey]) {
      // Find an available sound in the pool
      let sound = this.soundPool[soundKey].find(s => !s.inUse);
      
      // If all sounds are in use, find the oldest one
      if (!sound) {
        sound = this.soundPool[soundKey][0];
      }
      
      // Mark as in use
      sound.inUse = true;
      
      // Reset sound to beginning
      sound.audio.currentTime = 0;
      
      // Play the sound
      const playPromise = sound.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Sound started playing
            setTimeout(() => {
              sound.inUse = false; // Release back to pool after sound duration
            }, 1000); // Assume 1s is enough for most sound effects
          })
          .catch(error => {
            console.warn(`Error playing ${soundKey} sound:`, error);
            sound.inUse = false; // Release back to pool on error
          });
      }
    }
  }
}

module.exports = { Sprite, SpriteLoader, DrawHandler, SoundManager };
},{}]},{},[1]);
