const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


canvas.width = 800;
canvas.height = 500;

let score = 0;
let health = 100;
let zombies = [];
let bullets = [];
let gameTime = 75;
let bonusGiven = false;
let gameRunning = false;
let isMusicMuted = false;
let isSoundsMuted = false;


let spaceshipX = canvas.width / 2;
const spaceshipY = canvas.height - 100;
const spaceshipSpeed = 0.7; // Increased speed for smoother tracking
let mouseX = spaceshipX;

let powerUpActive = false;
let powerUpTimeout;
let scoreMultiplier = 1;
let killStreak = 0;
const killsPerMultiplierIncrease = 5;
let lastBulletTime = 0;
const bulletCooldown = 200;
let bulletInterval;

let spawnZombieTimer; // ✅ Declare this at the top of your script


const zombieBaseSpeeds = { 0: 1.2, 1: 1.5, 2: 1.0, 3: 1.8 };
const zombieHealth = { 
    0: Math.floor(16 * 0.8),  // Reduce by 20%
    1: Math.floor(26 * 0.8),
    2: Math.floor(37 * 0.8),
    3: Math.floor(38 * 0.8)
};
const zombieScores = { 0: 10, 1: 15, 2: 20, 3: 50 };
let maxZombies = 3; // Max zombies that can exist on screen at a time
const maxZombiesCap = 7; // Hard limit for total zombies
let zombiesPerSpawn = 1; // Start by spawning 1 zombie at a time


let imagesLoaded = 0;


// ✅ Fix #1: Correct image loading count (Change 5 to 4)
function checkAllImagesLoaded() {
    imagesLoaded++;
    console.log(`🟢 Image ${imagesLoaded}/5 loaded`);

    if (imagesLoaded >= 4) { // ✅ Ensure the button is enabled even if an image fails
        console.log("✅ All necessary images loaded. Enabling start button.");
    }
}

let shakeAmount = 0;
let shakeDuration = 0;

// 🛠️ Function to apply screen shake
function shakeScreen(intensity, duration) {
    shakeAmount = intensity;
    shakeDuration = Date.now() + duration;

    // ✅ Ensure the canvas resets properly after the shake ends
    setTimeout(() => {
        if (Date.now() >= shakeDuration) {
            shakeAmount = 0; // Reset shake effect only after the duration ends
        }
    }, duration + 10); // Small buffer to ensure reset
}



function startTimer() {
    gameTime = 75; // Reset the timer
    document.getElementById("timer").textContent = `Time: ${gameTime}s`;

    let timerInterval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(timerInterval);
            return;
        }

        gameTime--;
        document.getElementById("timer").textContent = `Time: ${gameTime}s`;

        if (gameTime <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}


// ✅ Always listen for title screen clicks



// ✅ Fix #2: Ensure the spaceship and all zombie images trigger the load check
// ✅ Fix #1: Declare spaceshipImg before using it
const spaceshipImg = new Image();
spaceshipImg.onload = checkAllImagesLoaded;
spaceshipImg.src = "spaceship.png";

const zombieImages = [new Image(), new Image(), new Image()]; // Only 3 images for zombies
const specialZombieImg = new Image();

zombieImages.forEach((img, index) => {
    img.onload = checkAllImagesLoaded;
    img.src = `zombie${index + 1}.png`; // Loads regular zombies correctly (only 3 zombies)
});


specialZombieImg.onload = checkAllImagesLoaded;
specialZombieImg.src = "specialzombie.png"; // Load the correctly named image

// ✅ Fix #2: Ensure countdownBeep and bgMusic are declared before use
const countdownBeep = new Audio("countdown.wav");
countdownBeep.volume = 0.7;  // Adjust volume

let bgMusic = new Audio();
bgMusic.volume = isMusicMuted ? 0 : 0.2;
bgMusic.loop = true;
bgMusic.preload = "auto";
bgMusic.autoplay = false;

const musicTracks = {
    "background-music.wav": "assets/music/background-music.wav",
    "background-music2.wav": "assets/music/background-music2.wav",
    "background-music3.wav": "assets/music/background-music3.wav",
    "background-music4.wav": "assets/music/background-music4.wav",
    "background-music5.wav": "assets/music/background-music5.wav"
};

const videoTracks = {
    "background-music.wav": "assets/videos/background.mp4",
    "background-music2.wav": "assets/videos/background2.mp4",
    "background-music3.wav": "assets/videos/background3.mp4",
    "background-music4.wav": "assets/videos/background4.mp4",
    "background-music5.wav": "assets/videos/background5.mp4"
};



bgMusic.volume = isMusicMuted ? 0 : 0.2;
bgMusic.loop = true;  
bgMusic.preload = "auto";  
bgMusic.autoplay = false;

const bulletSound = new Audio("bullet-fire.wav"); // ✅ Ensure the correct sound file path
bulletSound.volume = 0.1;

const powerUpSound = new Audio("powerup-activate.wav"); 
powerUpSound.volume = 0.5;

document.getElementById("musicSelector").addEventListener("change", function(event) {
    let selectedTrack = event.target.value.trim();
    
    if (!musicTracks.hasOwnProperty(selectedTrack)) {
        console.warn(`⚠️ Invalid track selected: "${selectedTrack}". Keeping current music.`);
        return;
    }

    // ✅ Stop current music before switching
    if (!bgMusic.paused) {
        console.log("⏸️ Pausing current track before switching...");
        bgMusic.pause();
    }

    // ✅ Set new track source
    bgMusic.src = musicTracks[selectedTrack];
    bgMusic.currentTime = 0;
    bgMusic.load();

    console.log(`🎵 Selected track: ${bgMusic.src} (will play on game start).`);

    // ✅ Change background video
    let bgVideo = document.getElementById("bgVideo");
    if (bgVideo && videoTracks[selectedTrack]) {
        bgVideo.src = videoTracks[selectedTrack];
        bgVideo.load();
        console.log(`🎥 Background video updated: ${bgVideo.src}`);
    } else {
        console.error("❌ ERROR: Background video element not found or invalid track.");
    }
});



// ✅ Ensure music starts only after user interaction
document.addEventListener("click", () => {
    if (bgMusic.paused) { 
        bgMusic.play().then(() => {
            console.log("🎵 Background music started after user interaction.");
        }).catch(error => console.error("❌ ERROR: Background music failed:", error));
    }    
}, { once: true }); // ✅ Runs only once, avoids multiple calls


canvas.addEventListener("mousemove", (event) => {
    console.log("Mouse Moved");
    const rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    mouseX = (event.clientX - rect.left) * scaleX;
    mouseX = Math.max(50, Math.min(canvas.width - 50, mouseX));
});


function Bullet(x, y, color = "yellow") {
    this.x = x;
    this.y = y;
    this.speed = 5;
    this.radius = 5;
    this.color = color;
}

function Zombie(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.health = zombieHealth[type]; 
    this.hitEffectTime = 0; // ✅ Tracks when the zombie was last hit

    // ✅ Reduce zombie speed by **40% instead of 20%** to make movement slower
    let baseSpeed = zombieBaseSpeeds[type] * 0.6;
    this.speed = baseSpeed * (0.9 + Math.random() * 0.2); // ✅ Small speed variation
}


function spawnZombie() {
    if (zombies.length >= 6) return; // ✅ Hard limit of 6 zombies on screen

    for (let i = 0; i < zombiesPerSpawn; i++) {
        if (zombies.length >= 6) break; 

        const x = Math.random() * (canvas.width - 60);
        let type = Math.random() < 0.2 ? 3 : Math.floor(Math.random() * 3);

        let zombieImg = type === 3 ? specialZombieImg : zombieImages[type];

        if (!zombieImg || !zombieImg.complete) {
            console.error(`Skipping spawn: Zombie image for type ${type} not loaded`);
            continue; // ✅ Skip adding zombies if their image is missing
        }

        let newZombie = new Zombie(x, -50, type);
        zombies.push(newZombie);
    }
}

let nextSpawnIncrease = 1500;

function increaseZombieSpawnRate() {
    if (score >= nextSpawnIncrease) {
        // ✅ Slower progression of zombies per spawn
        if (score >= 1500 && zombiesPerSpawn < 2) {
            zombiesPerSpawn = 2;
        }
        if (score >= 3500 && zombiesPerSpawn < 3) {
            zombiesPerSpawn = 3;
        }
        if (score >= 6000 && zombiesPerSpawn < 4) {
            zombiesPerSpawn = 4;
        }

        // ✅ Increase difficulty every **1500 points instead of 1000**
        nextSpawnIncrease += 1500; 
    }
}


function updateZombies() {
    for (let i = zombies.length - 1; i >= 0; i--) {
        let zombie = zombies[i];
        zombie.y += zombie.speed;

        if (zombie.y > canvas.height) {
            zombies.splice(i, 1); 
            killStreak = 0;
            scoreMultiplier = 1;
            updateUI();
            continue;
        }

        // 🛠️ Trigger screen shake when zombie reaches spaceship
        if (zombie.y > spaceshipY - 50 && Math.abs(zombie.x - spaceshipX) < 50) {
            health -= 10;
            scoreMultiplier = 1;  // 🔄 Reset multiplier when taking damage
            shakeScreen(10, 200); // 🔥 Shake screen when damaged (10px shake for 200ms)
            zombies.splice(i, 1);
            updateUI();
        }        
    }
}

function updateBullets() {
    bullets = bullets.filter(bullet => bullet.y > 0); // ✅ Remove off-screen bullets efficiently

    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        bullet.y -= bullet.speed;

        for (let j = zombies.length - 1; j >= 0; j--) {
            let zombie = zombies[j];

            if (bullet.x > zombie.x && bullet.x < zombie.x + 60 &&
                bullet.y > zombie.y && bullet.y < zombie.y + 60) {

                zombie.health -= 10;
                zombie.hitEffectTime = Date.now(); // ✅ Set hit effect timestamp
                bullets.splice(i, 1); // ✅ Remove bullet efficiently

                if (zombie.health <= 0) {
                    score += zombieScores[zombie.type] * scoreMultiplier;
                    zombies.splice(j, 1);
                
                    if (zombie.type === 3) activatePowerUp(); // Ensure power-up is triggered for special zombies
                    killStreak++;
                
                    if (killStreak % killsPerMultiplierIncrease === 0) {
                        scoreMultiplier++;
                    }
                
                    updateUI();
                } 
                break;
            }
        }
    }
}



function shootBullet() {
    if (!isSoundsMuted) {
        bulletSound.currentTime = 0;  // Reset sound to start
        bulletSound.play().catch(err => console.log("Bullet sound failed:", err));
    }

    if (powerUpActive) {
        let bulletOffsets = [-30, -10, 10, 30]; 
        bulletOffsets.forEach(offset => {
            bullets.push(new Bullet(spaceshipX + offset, spaceshipY, "cyan"));
        });
    } else {
        bullets.push(new Bullet(spaceshipX, spaceshipY, "yellow"));
    }    
}



function updateUI() {
    document.getElementById("score").textContent = score;
    document.getElementById("health").textContent = health;
    document.getElementById("timer").textContent = `Time: ${gameTime}s`;


    // Update health bar width & color
    let healthBar = document.getElementById("healthBar");
    let healthPercentage = Math.max(0, health) + "%"; // Ensure it never goes negative
    healthBar.style.width = healthPercentage;

    // Change color based on health level
    if (health > 50) {
        healthBar.style.backgroundColor = "limegreen";
    } else if (health > 25) {
        healthBar.style.backgroundColor = "yellow";
    } else {
        healthBar.style.backgroundColor = "red";
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    let offsetX = 0, offsetY = 0;
    if (Date.now() < shakeDuration) {
        offsetX = (Math.random() * shakeAmount * 2) - shakeAmount;
        offsetY = (Math.random() * shakeAmount * 2) - shakeAmount;
    }

    ctx.save(); // ✅ Save canvas state before applying transformations
    ctx.translate(offsetX, offsetY); // ✅ Move the canvas based on shake effect

    // ✅ Smooth spaceship movement
    spaceshipX += (mouseX - spaceshipX) * 0.5; 
    spaceshipX = Math.max(50, Math.min(canvas.width - 50, spaceshipX));

    // ✅ Apply glow effect when power-up is active
    if (powerUpActive) {
        ctx.shadowColor = "cyan";
        ctx.shadowBlur = 20;
    } else {
        ctx.shadowBlur = 0;
    }

    // ✅ Ensure spaceship image is not null
    if (spaceshipImg.complete) {
        ctx.drawImage(spaceshipImg, spaceshipX - 50, spaceshipY, 100, 100);
    } else {
        console.error("Spaceship image not loaded");
    }
    ctx.shadowBlur = 0; // Reset shadow after drawing spaceship

    // ✅ Draw zombies
    zombies.forEach(zombie => {
        let timeSinceHit = Date.now() - zombie.hitEffectTime;
        let isPhasing = timeSinceHit < 200; 
    
        if (!isPhasing || Math.floor(timeSinceHit / 50) % 2 === 0) {
            let zombieImg = zombie.type === 3 ? specialZombieImg : zombieImages[zombie.type];
            
            if (zombieImg && zombieImg.complete) {
                ctx.drawImage(zombieImg, zombie.x, zombie.y, 60, 60);
            } else {
                console.error(`Zombie image for type ${zombie.type} not loaded`);
            }
        }
    });

    // ✅ Draw bullets
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = bullet.color;
        ctx.fill();
    });

    // 🔥 **FLAMING EFFECT for Score Multiplier**
    if (scoreMultiplier > 1) {
        let flameColor = ["red", "orange", "yellow"][(Math.floor(Math.random() * 3))]; // Flicker effect
        let glowSize = 10 + Math.random() * 10; // Flickering glow effect

        ctx.font = "bold 26px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        ctx.shadowColor = flameColor;
        ctx.shadowBlur = glowSize;

        ctx.fillText(`Multiplier: x${scoreMultiplier}`, canvas.width / 2, 40);

        ctx.shadowBlur = 0; // Reset glow after drawing
    }

    ctx.restore(); // ✅ Restore original canvas position at the very end
}



// Keep spaceship within bounds
spaceshipX = Math.max(50, Math.min(canvas.width - 50, spaceshipX));

// Apply glow effect when power-up is active
if (powerUpActive) {
    ctx.shadowColor = "cyan";  // Glowing cyan effect
    ctx.shadowBlur = 20;        // Glow intensity
} else {
    ctx.shadowBlur = 0;         // No glow when power-up is inactive
}

       
function gameLoop() {
    if (!gameRunning) {
        console.log("Game loop stopped because gameRunning is false.");
        return;
    }

    console.log("Game loop running..."); // ✅ Add debug log

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    spaceshipX += (mouseX - spaceshipX) * 0.3; // Adjust tracking speed
    spaceshipX = Math.max(50, Math.min(canvas.width - 50, spaceshipX)); 

    updateZombies();
    updateBullets();
    draw();

    requestAnimationFrame(gameLoop); // ✅ Ensure the loop keeps running
}
   

function activatePowerUp() {
    powerUpActive = true;
    console.log("Power-Up Activated: Barrage Mode!");

    // ✅ Play the power-up sound effect
    powerUpSound.currentTime = 0;
    powerUpSound.play().catch(error => console.log("Power-Up sound failed:", error));    

    // Clear any existing power-up timer to avoid stacking
    clearTimeout(powerUpTimeout);

    // Deactivate power-up after 7 seconds
    powerUpTimeout = setTimeout(() => {
        powerUpActive = false;
        console.log("Power-Up Expired: Normal Mode");
    }, 7000);
}

document.getElementById("muteMusic").addEventListener("click", () => {
    isMusicMuted = !isMusicMuted; // Toggle state
    bgMusic.volume = isMusicMuted ? 0 : 0.2;
    document.getElementById("muteMusic").textContent = isMusicMuted ? "Unmute Music" : "Mute Music";
});

document.getElementById("muteSounds").addEventListener("click", () => {
    isSoundsMuted = !isSoundsMuted; // Toggle state
    bulletSound.volume = isSoundsMuted ? 0 : 0.2;
    powerUpSound.volume = isSoundsMuted ? 0 : 0.5;
    document.getElementById("muteSounds").textContent = isSoundsMuted ? "Unmute Sounds" : "Mute Sounds";
});

let baseSpawnRate = 1800; // Start at 1.8s instead of 2.5s
let spawnRate = baseSpawnRate; 
let minSpawnRate = 1000; // ✅ Set a **minimum spawn rate** to avoid overwhelming the player

let spawnZombieTimeout;
let bulletTimeout;

function spawnZombieLoop() {
    if (!gameRunning) return;

    spawnZombie();
    adjustSpawnRate();

    clearTimeout(spawnZombieTimeout);  // Prevent multiple overlapping spawns
    spawnZombieTimeout = setTimeout(spawnZombieLoop, Math.max(spawnRate, minSpawnRate));
}



function adjustSpawnRate() {
    // ✅ Gradually decrease spawn rate but ensure it never stops
    spawnRate = Math.max(baseSpawnRate - Math.floor(score / 10) * 50, minSpawnRate);
}



let bulletTimer;
function shootBulletLoop() {
    if (!gameRunning) return;

    shootBullet();

    clearTimeout(bulletTimeout);  // Prevent bullet firing stack
    bulletTimeout = setTimeout(shootBulletLoop, 300); // Keep it controlled
}

function startCountdown() {
    console.log("🟢 Countdown started...");

    let countdownElement = document.getElementById("countdown");
    if (!countdownElement) {
        console.log("🔹 Creating countdown element...");
        countdownElement = document.createElement("div");
        countdownElement.id = "countdown";
        countdownElement.style.position = "absolute";
        countdownElement.style.top = "50%";
        countdownElement.style.left = "50%";
        countdownElement.style.transform = "translate(-50%, -50%)";
        countdownElement.style.fontSize = "80px";
        countdownElement.style.color = "white";
        countdownElement.style.fontWeight = "bold";
        countdownElement.style.zIndex = "20";
        document.getElementById("gameContainer").appendChild(countdownElement);
    }

    let countdown = 3;
    countdownElement.innerHTML = countdown;
    console.log(`🔹 Countdown: ${countdown}`);

    countdownBeep.play().catch(error => console.log("❌ ERROR: Beep sound failed:", error));

    let countdownInterval = setInterval(() => {
        countdown--;
        console.log(`🔹 Countdown: ${countdown}`);

        if (countdown > 0) {
            countdownElement.innerHTML = countdown;
            countdownBeep.play().catch(error => console.log("❌ ERROR: Beep sound failed:", error));
        } else {
            clearInterval(countdownInterval);
            countdownElement.innerHTML = "GO!";
            setTimeout(() => {
                countdownElement.remove();
                console.log("🟢 Countdown finished, starting game...");
                gameRunning = true;  // ✅ Enable gameRunning BEFORE calling initGame()

                // ✅ Play selected background music ONLY after countdown ends
                if (!isMusicMuted) {
                    console.log(`🎵 Playing selected track: ${bgMusic.src}`);
                    bgMusic.play().catch(error => console.error("❌ ERROR: Background music failed:", error));
                }

                initGame();  
            }, 500);            
        }
    }, 1000);
}



// ✅ Fix #4: Make sure the game starts only once
document.addEventListener("DOMContentLoaded", () => {
    let startButton = document.getElementById("startButton");

    if (startButton) {
        console.log("✅ Start button found, waiting for click...");
        startButton.addEventListener("click", () => {
            console.log("🟢 Start button clicked!");
            startGame();
        });
    } else {
        console.error("❌ ERROR: Start button not found in the DOM!");
    }

    // ✅ Adjust Music Selector Position (Ensures it's not too close to Start Button)
    let musicSelector = document.getElementById("musicSelector");
    if (musicSelector) {
        console.log("🎵 Adjusting music selector position...");
        musicSelector.style.marginTop = "20px";  // Moves it further down
    } else {
        console.error("❌ ERROR: Music selector element not found!");
    }
});


function startGame() {
    console.log("🟢 `startGame()` function is executing...");

    startCountdown(); // ✅ Start the countdown first

     let titleScreen = document.getElementById("titleScreen");
     let titleImage = document.getElementById("titleImage"); 

    if (titleScreen) {
    console.log("🔹 Hiding title screen...");
    titleScreen.style.opacity = "0";
    titleScreen.style.pointerEvents = "none"; 
    setTimeout(() => titleScreen.style.display = "none", 500);
    }

    if (titleImage) {
    console.log("🔹 Fading out title image...");
    titleImage.style.transition = "opacity 0.5s ease-out";
    titleImage.style.opacity = "0"; 
    }


    let musicSelector = document.getElementById("musicSelector");
    let selectedTrack = musicSelector ? musicSelector.value.trim() : "background-music.wav";

    if (!musicTracks.hasOwnProperty(selectedTrack)) {
        selectedTrack = Object.keys(musicTracks)[0];  // ✅ Fallback to first track
    }
    
    bgMusic.src = musicTracks[selectedTrack];
    console.log(`🎵 Loading track: ${bgMusic.src}`);

    // ✅ Play background video
    let bgVideo = document.getElementById("bgVideo");
    if (bgVideo && videoTracks[selectedTrack]) {
        bgVideo.src = videoTracks[selectedTrack];
        bgVideo.load();
        bgVideo.play();
        console.log(`🎥 Playing background video: ${bgVideo.src}`);
    } else {
        console.error("❌ ERROR: Background video element not found or invalid track.");
    }

    // ✅ Start music only when the game starts
    bgMusic.oncanplaythrough = () => {
        console.log(`🎵 Loaded: ${selectedTrack}, playing now.`);
        if (!isMusicMuted && gameRunning) {  
            bgMusic.play().catch(error => console.error("❌ ERROR: Background music failed:", error));
        }
    };
}


function initGame() {  


    console.log("🟢 Initializing game...");
    gameRunning = true; 

    score = 0;
    health = 100;
    zombies = [];
    bullets = [];
    gameTime = 75;
    bonusGiven = false;

    updateUI();
    console.log("🔹 UI Updated");

    spawnZombieLoop();  
    console.log("🔹 Zombie spawn loop started");

    shootBulletLoop();  
    console.log("🔹 Bullet loop started");

    startTimer();  
    console.log("🔹 Game timer started");

    console.log("🟢 Starting game loop...");
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    alert("Game Over! Time's Up!");
    location.reload(); // Reload the page to restart the game
}


// ✅ This function starts the actual game AFTER the countdown
function startActualGame() {
    console.log("Game Starting Now!");

    let titleScreen = document.getElementById("titleScreen");
    if (titleScreen) titleScreen.style.display = "none";

    let bgVideo = document.getElementById("bgVideo");
    if (bgVideo) {
        bgVideo.pause(); // Stop animation once the game starts
        bgVideo.style.display = "none";
    }

    // Start the actual game functions
    spawnZombieLoop();
    shootBulletLoop();
    gameLoop();
}


document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        console.log("Game Paused");
        gameRunning = false; // Pause game logic
        clearTimeout(spawnZombieTimeout);
        clearTimeout(bulletTimeout);
    } else {
        console.log("Resuming Game...");
        gameRunning = true;
        spawnZombieLoop();
        shootBulletLoop();
        gameLoop();
    }
});