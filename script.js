const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameScreen = document.getElementById("gameScreen");
const letterCard = document.getElementById("letterCard");
const scoreDisplay = document.getElementById("score");
const gameMessage = document.getElementById("gameMessage");
const letterEnvelope = document.getElementById("letterEnvelope");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const responseButtons = document.getElementById("responseButtons");
const thanksMessage = document.getElementById("thanksMessage");

const targetScore = 10;
let score = 0;
let letterUnlocked = false;
let unlockHandled = false;
let hearts = [];
let basket;
let heartSpawnCounter = 0;
const keys = {};
let noClickCount = 0;
let unlockTimer = null;

function resizeCanvas() {
  const maxWidth = Math.min(420, window.innerWidth - 40);
  const maxHeight = Math.min(520, window.innerHeight * 0.62);
  const ratio = 4 / 5;

  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  if (basket) {
    basket.x = canvas.width / 2 - basket.width / 2;
    basket.y = canvas.height - 68;
  }
}

class Heart {
  constructor() {
    this.size = 24 + Math.random() * 8;
    this.width = this.size;
    this.height = this.size;
    this.x = Math.random() * (canvas.width - this.size) + this.size / 2;
    this.y = -this.size;
    this.velocityY = 1.1 + Math.random() * 1.9;
    this.velocityX = (Math.random() - 0.5) * 1.8;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.08;
  }

  update() {
    this.y += this.velocityY;
    this.x += this.velocityX;
    this.rotation += this.rotationSpeed;

    if (this.x < this.size / 2 || this.x > canvas.width - this.size / 2) {
      this.velocityX *= -1;
      this.x = Math.max(
        this.size / 2,
        Math.min(canvas.width - this.size / 2, this.x),
      );
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    drawHeart(0, 0, this.size);
    ctx.restore();
  }

  isOffScreen() {
    return this.y > canvas.height + this.size;
  }
}

class Basket {
  constructor() {
    this.width = 60;
    this.height = 40;
    this.speed = 6;
    this.x = 0;
    this.y = 0;
    this.shakeFrames = 0;
  }

  draw() {
    const shakeOffset =
      this.shakeFrames > 0 ? Math.sin(this.shakeFrames * 1.45) * 4 : 0;

    ctx.save();
    ctx.translate(shakeOffset, 0);

    ctx.fillStyle = "#7fd8e8";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = "#5ec8d8";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.beginPath();
    ctx.arc(
      this.x + this.width / 2,
      this.y - 4,
      this.width / 2 - 6,
      Math.PI,
      0,
    );
    ctx.stroke();

    ctx.restore();

    if (this.shakeFrames > 0) {
      this.shakeFrames -= 1;
    }
  }

  triggerShake() {
    this.shakeFrames = 12;
  }

  moveLeft() {
    this.x = Math.max(0, this.x - this.speed);
  }

  moveRight() {
    this.x = Math.min(canvas.width - this.width, this.x + this.speed);
  }

  checkCollision(heart) {
    return (
      heart.x > this.x &&
      heart.x < this.x + this.width &&
      heart.y + heart.height / 2 > this.y &&
      heart.y + heart.height / 2 < this.y + this.height
    );
  }
}

function drawHeart(x, y, size) {
  ctx.fillStyle = "#ff6b9d";
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.34);
  ctx.bezierCurveTo(
    x - size * 0.58,
    y - size * 0.06,
    x - size * 0.54,
    y - size * 0.62,
    x,
    y - size * 0.28,
  );
  ctx.bezierCurveTo(
    x + size * 0.54,
    y - size * 0.62,
    x + size * 0.58,
    y - size * 0.06,
    x,
    y + size * 0.34,
  );
  ctx.closePath();
  ctx.fill();
}

function updateScore(nextScore) {
  score = nextScore;
  scoreDisplay.textContent = String(score);
}

function showUnlockMessage() {
  gameMessage.textContent = "Bạn giỏi quá hứng đủ rồi, mở thư ở dưới nhé";
  gameMessage.classList.add("show", "celebrate");
  letterEnvelope.classList.add("ready");
  letterEnvelope.style.cursor = "pointer";

  if (!unlockTimer) {
    unlockTimer = window.setTimeout(() => {
      const targetOffset = Math.max(
        0,
        letterEnvelope.getBoundingClientRect().top + window.scrollY - 40,
      );
      window.scrollTo({
        top: targetOffset,
        behavior: "smooth",
      });
    }, 900);
  }
}

function openLetter() {
  gameScreen.classList.add("hidden");
  letterCard.classList.add("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function celebrateBasketHit() {
  basket.triggerShake();
}

function handleNoClick() {
  noClickCount += 1;

  const yesScale = 1 + noClickCount * 0.14;
  const noScale = Math.max(0.18, 1 - noClickCount * 0.16);

  yesBtn.style.transform = `scale(${yesScale})`;
  noBtn.style.transform = `scale(${noScale})`;
  noBtn.style.opacity = String(Math.max(0, 1 - noClickCount * 0.18));

  if (noClickCount >= 5) {
    noBtn.classList.add("hidden");
    yesBtn.style.transform = "scale(1.7)";
  }
}

function handleYesClick() {
  thanksMessage.textContent = "Cảm ơn embee, ảnh biết ẻm sẽ đồng í, hìiii";
  thanksMessage.classList.add("show");
  responseButtons.classList.add("locked");
  yesBtn.disabled = true;
  noBtn.disabled = true;
  yesBtn.style.cursor = "default";
  noBtn.style.cursor = "default";
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(240, 249, 255, 0.34)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  heartSpawnCounter += 1;
  if (heartSpawnCounter > 18) {
    hearts.push(new Heart());
    heartSpawnCounter = 0;
  }

  for (let i = hearts.length - 1; i >= 0; i -= 1) {
    const heart = hearts[i];
    heart.update();
    heart.draw();

    if (basket.checkCollision(heart)) {
      hearts.splice(i, 1);
      celebrateBasketHit();

      if (!letterUnlocked) {
        updateScore(score + 1);
        if (score >= targetScore && !unlockHandled) {
          letterUnlocked = true;
          unlockHandled = true;
          showUnlockMessage();
        }
      }
    } else if (heart.isOffScreen()) {
      hearts.splice(i, 1);
    }
  }

  if (keys.ArrowLeft || keys.a || keys.A) {
    basket.moveLeft();
  }
  if (keys.ArrowRight || keys.d || keys.D) {
    basket.moveRight();
  }

  basket.draw();

  ctx.fillStyle = "#7fd8e8";
  ctx.font = "18px Poppins";
  ctx.fillText(`Trái tim: ${score}/${targetScore}`, 12, 26);

  requestAnimationFrame(gameLoop);
}

function bindEvents() {
  window.addEventListener("keydown", (event) => {
    keys[event.key] = true;
  });

  window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
  });

  let touchStartX = 0;

  canvas.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.touches[0].clientX;
    },
    { passive: true },
  );

  canvas.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      const touchX = event.touches[0].clientX;
      const diff = touchX - touchStartX;

      if (diff > 10) {
        basket.moveRight();
        touchStartX = touchX;
      } else if (diff < -10) {
        basket.moveLeft();
        touchStartX = touchX;
      }
    },
    { passive: false },
  );

  letterEnvelope.addEventListener("click", () => {
    if (!letterUnlocked) {
      return;
    }
    openLetter();
  });

  letterEnvelope.addEventListener("keydown", (event) => {
    if (!letterUnlocked) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLetter();
    }
  });

  yesBtn.addEventListener("click", handleYesClick);
  noBtn.addEventListener("click", handleNoClick);
}

function init() {
  resizeCanvas();
  basket = new Basket();
  basket.x = canvas.width / 2 - basket.width / 2;
  basket.y = canvas.height - 68;
  bindEvents();
  window.addEventListener("resize", () => {
    const beforeWidth = canvas.width;
    resizeCanvas();
    if (beforeWidth !== canvas.width) {
      basket.x = Math.min(basket.x, canvas.width - basket.width);
    }
  });
  gameLoop();
}

init();
