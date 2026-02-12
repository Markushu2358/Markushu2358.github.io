// ===================== 1. 全局DOM元素获取 =====================
const orangeFill = document.getElementById('orangeFill');
const particleContainer = document.getElementById('particleContainer');
const fishSplashContainer = document.getElementById('fishSplashContainer');
const targetZone = document.getElementById('targetZone');
const fishHealthFill = document.getElementById('fishHealthFill');
const fishHealthText = document.getElementById('fishHealthText');
const fishIcon = document.getElementById('fishIcon');
const greenFills = [
  document.getElementById('greenFill1'),
  document.getElementById('greenFill2'),
  document.getElementById('greenFill3')
];
const greenBarTexts = [
  document.getElementById('greenBarText1'),
  document.getElementById('greenBarText2'),
  document.getElementById('greenBarText3')
];
const greenEffects = [
  document.getElementById('greenEffect1'),
  document.getElementById('greenEffect2'),
  document.getElementById('greenEffect3')
];
const reelButton = document.getElementById('reelButton');
const resetButton = document.getElementById('resetButton');
const skill1Button = document.getElementById('skill1Button');
const skill2Button = document.getElementById('skill2Button');
const skill3Button = document.getElementById('skill3Button');
const status = document.getElementById('status');
const playerStaminaFill = document.getElementById('playerStaminaFill');
const playerStaminaText = document.getElementById('playerStaminaText');
const normalFishBtn = document.getElementById('normalFishBtn');
const bossFishBtn = document.getElementById('bossFishBtn');
const bulletTimeNotice = document.getElementById('bulletTimeNotice');
const directionText = document.getElementById('directionText');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverText = document.getElementById('gameOverText');
const gameOverResetBtn = document.getElementById('gameOverResetBtn');
const waterSection = document.querySelector('.water-section');
const skillTooltip = document.getElementById('skillTooltip');

// ===================== 2. 游戏核心配置 =====================
const DEFAULT_CONFIG = {
  playerStamina: 1500,
  normalFishHealth: 10000,
  bossFishHealth: 20000,
  playerDamage: 10,
  fullHpMultiplier: 2,
  orangeMin: 2,
  orangeMax: 8,
  orangeSlowMin: 1,
  orangeSlowMax: 4,
  bulletTimeDec: 0.01,
  greenSlow: 0.03,
  greenFast: 1.5,
  barCapacity: 100,
  maxEnergy: 300,
  fishSlow: 4,
  fishFast: 25,

  // 新技能消耗
  skill1Cost: 100,
  skill2Cost: 200,
  skill3Cost: 300,

  moveSpeedMin: 0.03,
  moveSpeedMax: 0.08,
  sizeSpeedMin: 0.01,
  sizeSpeedMax: 0.05,
  dirChangeMin: 600,
  dirChangeMax: 1200,
  bossPhase2Hp: 50,
  phase2MoveMulti: 1.8,
  phase2SizeMulti: 1.8,
  phase2MinLeft: 20,
  phase2MaxLeft: 95,
  phase2MinWidth: 5,
  phase2MaxWidth: 50,
  bulletTimeDur: 2000,
  fishDirChangeMin: 2500,
  fishDirChangeMax: 4500,
  correctDirectionBonus: 0.4,
  wrongDirectionPenalty: 0.4,
  centerPullStrength: 2.5,
  correctEnergyMultiplier: 2.5,
  playerSlowDownRate: 0.5,
  playerNormalDownRate: 1.0,
  splashParticleCount: 5,
  splashInterval: 300,
};

// ===================== 3. 全局状态 =====================
let currentConfig = { ...DEFAULT_CONFIG };
let orangeProgress = 0;
let totalGreenEnergy = 0;
let fishHealth = currentConfig.normalFishHealth;
let fishHealthMax = currentConfig.normalFishHealth;
let playerStamina = currentConfig.playerStamina;
let playerStaminaMax = currentConfig.playerStamina;
let PLAYER_DAMAGE = currentConfig.playerDamage;
let isHolding = false;
let intervalId = null;
let gameOver = false;
let isBossMode = false;
let isBossPhase2 = false;
let targetZoneLeft = 60;
let targetZoneWidth = 25;
let targetMoveDirection = 1;
let targetMoveSpeed = 0;
let targetSizeDirection = 1;
let targetSizeSpeed = 0;
let directionChangeTimer = null;
let sizeChangeTimer = null;
let isBulletTime = false;
let bulletTimeTimer = null;
let lastFullBars = 0;
let fishDirection = 1;
let fishDirectionTimer = null;
let isDragging = false;
let dragStartX = 0;
let dragDirection = 0;
let playerDirection = 1;
let splashTimer = null;

let bulletTimeBeforeTarget = { left: 60, width: 25 };

// 新技能状态
let skill1Active = false;
let skill1EndTime = 0;

let skill2Active = false;
let skill2EndTime = 0;
let skill2StoredDamage = 0;

const BASE_TARGET_START = 60;
const BASE_TARGET_END = 85;
const BASE_TARGET_CENTER = (BASE_TARGET_START + BASE_TARGET_END) / 2;

let BOSS_TARGET_MIN_LEFT = 40;
let BOSS_TARGET_MAX_LEFT = 90;
let BOSS_TARGET_MIN_WIDTH = 10;
let BOSS_TARGET_MAX_WIDTH = 25;

// ===================== 技能描述 =====================
const skillInfos = {
  skill1: {
    name: "稳流定钩",
    cost: 1,
    desc: `【消耗1格能量】
判定区变大并固定，鱼挣扎减弱
持续4秒，完美配合蓄力钓`
  },
  skill2: {
    name: "聚能猛钓",
    cost: 2,
    desc: `【消耗2格能量】
5秒内记录所有掉血
结束时造成等量额外爆发
先开稳流定钩收益最大`
  },
  skill3: {
    name: "海韵共鸣",
    cost: 3,
    desc: `【消耗3格能量】
召唤海韵光球从天而降
清空拉力条，3秒全安全区
巨量伤害，绝杀神技`
  }
};

// ===================== 长按提示工具 =====================
function showSkillTooltip(button, info) {
  skillTooltip.textContent = `${info.name} (消耗${info.cost}格)\n${info.desc}`;
  skillTooltip.style.display = 'block';
  const rect = button.getBoundingClientRect();
  skillTooltip.style.left = rect.left + 'px';
  skillTooltip.style.top = (rect.top - 70) + 'px';
}
function hideSkillTooltip() {
  skillTooltip.style.display = 'none';
}

function bindSkillLongPress() {
  function makeLongPress(btn, info) {
    let timer;
    btn.addEventListener('touchstart', () => {
      timer = setTimeout(() => showSkillTooltip(btn, info), 500);
    }, { passive: true });
    btn.addEventListener('touchend', hideSkillTooltip);
    btn.addEventListener('touchcancel', hideSkillTooltip);

    btn.addEventListener('mousedown', () => {
      timer = setTimeout(() => showSkillTooltip(btn, info), 500);
    });
    btn.addEventListener('mouseup', hideSkillTooltip);
    btn.addEventListener('mouseleave', hideSkillTooltip);
  }
  makeLongPress(skill1Button, skillInfos.skill1);
  makeLongPress(skill2Button, skillInfos.skill2);
  makeLongPress(skill3Button, skillInfos.skill3);
}

// ===================== 4. 基础逻辑 =====================
function updatePlayerDirectionDisplay() {
  directionText.textContent = playerDirection === 1 ? '朝右' : '朝左';
}
function setPlayerDirection(direction) {
  if (direction === 1 || direction === -1) {
    playerDirection = direction;
    updatePlayerDirectionDisplay();
  }
}

function getRandomFishDirChangeTime() {
  return Math.random() * (currentConfig.fishDirChangeMax - currentConfig.fishDirChangeMin) + currentConfig.fishDirChangeMin;
}
function switchFishDirection() {
  if (gameOver) return;
  fishDirection = fishDirection === 1 ? -1 : 1;
  fishIcon.classList.toggle('left', fishDirection === -1);
  clearTimeout(fishDirectionTimer);
  fishDirectionTimer = setTimeout(switchFishDirection, getRandomFishDirChangeTime());
}
function initFishDirectionTimer() {
  clearTimeout(fishDirectionTimer);
  fishDirectionTimer = setTimeout(switchFishDirection, getRandomFishDirChangeTime());
}

function handleDragStart(e) {
  e.preventDefault();
  if (gameOver) return;
  isDragging = true;
  isHolding = true;
  reelButton.classList.add('dragging');
  dragStartX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
}
function handleDragMove(e) {
  e.preventDefault();
  if (!isDragging || gameOver) return;
  const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
  const deltaX = currentX - dragStartX;
  if (deltaX > 20) {
    dragDirection = 1;
    setPlayerDirection(1);
  } else if (deltaX < -20) {
    dragDirection = -1;
    setPlayerDirection(-1);
  } else {
    dragDirection = 0;
  }
  const isCorrect = isDragDirectionCorrect();
  reelButton.classList.toggle('correct-direction', isCorrect);
  status.classList.toggle('correct', isCorrect);
  status.classList.toggle('wrong', !isCorrect && dragDirection !== 0);
}
function handleDragEnd(e) {
  e.preventDefault();
  if (!isDragging) return;
  isDragging = false;
  isHolding = false;
  reelButton.classList.remove('dragging', 'correct-direction');
  dragDirection = 0;
  status.classList.remove('correct', 'wrong');
}
function isDragDirectionCorrect() {
  return dragDirection === -fishDirection && dragDirection !== 0;
}

function getTargetCenter() {
  return isBossMode ? (targetZoneLeft + targetZoneWidth / 2) : BASE_TARGET_CENTER;
}
function pullToCenter() {
  if (!isDragDirectionCorrect() || gameOver) return;
  const center = getTargetCenter();
  const distance = orangeProgress - center;
  if (Math.abs(distance) > 0.5) {
    const pullAmount = (distance > 0 ? -1 : 1) * currentConfig.centerPullStrength * 0.1;
    orangeProgress = Math.max(0, Math.min(100, orangeProgress + pullAmount));
  }
}

function createParticle() {
  if (!isInTargetZone() || gameOver) return;
  const topBarRect = document.querySelector('.top-bar').getBoundingClientRect();
  const startX = topBarRect.left + (orangeProgress / 100) * topBarRect.width;
  const startY = topBarRect.top + topBarRect.height / 2;
  const barIndex = Math.min(Math.floor(totalGreenEnergy / currentConfig.barCapacity), greenFills.length - 1);
  const barRect = greenFills[barIndex].parentElement.getBoundingClientRect();
  const targetX = barRect.left + (parseFloat(greenFills[barIndex].style.width) || 0) / 100 * barRect.width;
  const targetY = barRect.top + barRect.height / 2;

  const p = document.createElement('div');
  p.classList.add('particle');
  p.style.left = startX + 'px';
  p.style.top = startY + 'px';
  p.style.width = p.style.height = (Math.random() * 7 + 4) + 'px';
  p.style.background = isDragDirectionCorrect() ? 'rgba(76,175,80,0.9)' : '#00bfa5';
  const dur = Math.random() * 1.2 + 0.4;
  p.style.animationDuration = dur + 's';
  p.style.setProperty('--target-x', targetX - startX);
  p.style.setProperty('--target-y', targetY - startY);
  p.style.animationName = 'particle-to-energy';
  particleContainer.appendChild(p);
  setTimeout(() => p.remove(), dur * 1000);
}
function particleLoop() {
  if (isInTargetZone() && !gameOver) {
    const c = Math.floor(Math.random() * 1) + 1;
    for (let i = 0; i < c; i++) createParticle();
  }
}

function createFishSplashParticle() {
  if (gameOver) return;
  const r = fishIcon.getBoundingClientRect();
  const x = fishDirection === 1 ? r.left - 10 : r.right + 10;
  const y = r.top + r.height / 2;
  const p = document.createElement('div');
  p.classList.add('fish-splash-particle');
  p.style.left = x + 'px';
  p.style.top = y + 'px';
  p.style.width = p.style.height = (Math.random() * 4 + 4) + 'px';
  const dur = Math.random() * 0.7 + 0.8;
  p.style.animationDuration = dur + 's';
  p.style.animationName = fishDirection === 1 ? 'fishSplashLeft' : 'fishSplashRight';
  fishSplashContainer.appendChild(p);
  setTimeout(() => p.remove(), dur * 1000);
}
function startFishSplashLoop() {
  clearInterval(splashTimer);
  splashTimer = setInterval(() => {
    for (let i = 0; i < currentConfig.splashParticleCount; i++) createFishSplashParticle();
  }, currentConfig.splashInterval);
}
function stopFishSplashLoop() {
  clearInterval(splashTimer);
  fishSplashContainer.innerHTML = '';
}

function getRandomOrangeValue() {
  let v = Math.random() * (currentConfig.orangeMax - currentConfig.orangeMin) + currentConfig.orangeMin;
  if (isHolding && dragDirection !== 0 && !isDragDirectionCorrect()) v *= 1.4;
  return v;
}
function getSlowOrangeDecValue() {
  let v = Math.random() * (currentConfig.orangeSlowMax - currentConfig.orangeSlowMin) + currentConfig.orangeSlowMin;
  if (isHolding && dragDirection !== 0 && isDragDirectionCorrect()) v *= 0.6;
  return v;
}
function getOrangeDownRate() {
  return playerDirection === -fishDirection ? 0.5 : 1.0;
}
function getRandomMoveSpeed() {
  const s = Math.random() * (currentConfig.moveSpeedMax - currentConfig.moveSpeedMin) + currentConfig.moveSpeedMin;
  return isBossPhase2 ? s * 1.8 : s;
}
function getRandomSizeSpeed() {
  const s = Math.random() * (currentConfig.sizeSpeedMax - currentConfig.sizeSpeedMin) + currentConfig.sizeSpeedMin;
  return isBossPhase2 ? s * 1.8 : s;
}
function getRandomChangeTime() {
  return Math.random() * (currentConfig.dirChangeMax - currentConfig.dirChangeMin) + currentConfig.dirChangeMin;
}

function checkBossPhase2() {
  if (!isBossMode) {
    waterSection.classList.remove('boss-phase2');
    return false;
  }
  const pct = (fishHealth / fishHealthMax) * 100;
  const ph2 = pct <= 50;
  waterSection.classList.toggle('boss-phase2', ph2);
  if (ph2 && !isBossPhase2) {
    BOSS_TARGET_MIN_LEFT = 20;
    BOSS_TARGET_MAX_LEFT = 95;
    BOSS_TARGET_MIN_WIDTH = 5;
    BOSS_TARGET_MAX_WIDTH = 50;
    randomizeMoveDirection();
    randomizeSizeDirection();
    status.textContent = "BOSS进入第二阶段！";
  }
  isBossPhase2 = ph2;
  return ph2;
}

function startBulletTime() {
  if (isBulletTime) return;
  isBulletTime = true;
  bulletTimeBeforeTarget = { left: targetZoneLeft, width: targetZoneWidth };
  targetZone.classList.add('bullet-time-full');
  targetZone.style.left = '0%';
  targetZone.style.width = '100%';
  orangeFill.classList.add('bullet-time');
  bulletTimeNotice.textContent = `子弹时间！`;
  bulletTimeNotice.classList.add('show');
  clearTimeout(bulletTimeTimer);
  bulletTimeTimer = setTimeout(endBulletTime, 2000);
}
function endBulletTime() {
  isBulletTime = false;
  targetZone.classList.remove('bullet-time-full');
  targetZoneLeft = bulletTimeBeforeTarget.left;
  targetZoneWidth = bulletTimeBeforeTarget.width;
  targetZone.style.left = targetZoneLeft + '%';
  targetZone.style.width = targetZoneWidth + '%';
  orangeFill.classList.remove('bullet-time');
  bulletTimeNotice.classList.remove('show');
}

function updateTargetZone() {
  if (!isBossMode) return;
  checkBossPhase2();
  targetZoneLeft += targetMoveSpeed * targetMoveDirection;
  const right = targetZoneLeft + targetZoneWidth;
  if (targetZoneLeft <= BOSS_TARGET_MIN_LEFT) {
    targetZoneLeft = BOSS_TARGET_MIN_LEFT;
    targetMoveDirection = 1;
  }
  if (right >= BOSS_TARGET_MAX_LEFT) {
    targetZoneLeft = BOSS_TARGET_MAX_LEFT - targetZoneWidth;
    targetMoveDirection = -1;
  }
  targetZoneWidth += targetSizeSpeed * targetSizeDirection;
  if (targetZoneWidth <= BOSS_TARGET_MIN_WIDTH) {
    targetZoneWidth = BOSS_TARGET_MIN_WIDTH;
    targetSizeDirection = 1;
  }
  if (targetZoneWidth >= BOSS_TARGET_MAX_WIDTH) {
    targetZoneWidth = BOSS_TARGET_MAX_WIDTH;
    targetSizeDirection = -1;
  }
  targetZone.style.left = targetZoneLeft + '%';
  targetZone.style.width = targetZoneWidth + '%';
}
function randomizeMoveDirection() {
  if (!isBossMode) return;
  targetMoveDirection = Math.random() > 0.5 ? 1 : -1;
  targetMoveSpeed = getRandomMoveSpeed();
  clearTimeout(directionChangeTimer);
  directionChangeTimer = setTimeout(randomizeMoveDirection, getRandomChangeTime());
}
function randomizeSizeDirection() {
  if (!isBossMode) return;
  targetSizeDirection = Math.random() > 0.5 ? 1 : -1;
  targetSizeSpeed = getRandomSizeSpeed();
  clearTimeout(sizeChangeTimer);
  sizeChangeTimer = setTimeout(randomizeSizeDirection, getRandomChangeTime());
}

function isInTargetZone() {
  const L = isBossMode ? targetZoneLeft : 60;
  const R = isBossMode ? targetZoneLeft + targetZoneWidth : 85;
  return orangeProgress >= L && orangeProgress < R;
}

// ===================== 新技能核心实现 =====================

// 技能1：稳流定钩
function useSkill1() {
  const cost = currentConfig.skill1Cost;
  if (gameOver || totalGreenEnergy < cost) return;
  totalGreenEnergy -= cost;

  skill1Active = true;
  skill1EndTime = Date.now() + 4000;

  // 判定区变大固定
  if (!isBossMode) {
    targetZoneLeft = 50;
    targetZoneWidth = 40;
  } else {
    targetZoneWidth = Math.min(targetZoneWidth * 1.5, 60);
  }
  targetZone.style.left = targetZoneLeft + '%';
  targetZone.style.width = targetZoneWidth + '%';

  status.textContent = "✅ 稳流定钩：判定区扩大固定4秒";
  updateGreenBarsDisplay();
  updateSkillButtons();
}

// 技能2：聚能猛钓
function useSkill2() {
  const cost = currentConfig.skill2Cost;
  if (gameOver || totalGreenEnergy < cost) return;
  totalGreenEnergy -= cost;

  skill2Active = true;
  skill2EndTime = Date.now() + 5000;
  skill2StoredDamage = 0;

  status.textContent = "⚡ 聚能猛钓：5秒蓄力开始！";
  updateGreenBarsDisplay();
  updateSkillButtons();
}
function skill2Burst() {
  if (!skill2StoredDamage || skill2StoredDamage <= 0) return;
  const dmg = skill2StoredDamage;
  fishHealth -= dmg;
  skill2StoredDamage = 0;
  status.textContent = `💥 聚能爆发：额外造成 ${Math.round(dmg)} 伤害！`;
  updateFishHealthUI();
  checkGameOver();
}

// 技能3：海韵共鸣
function useSkill3() {
  const cost = currentConfig.skill3Cost;
  if (gameOver || totalGreenEnergy < cost) return;
  totalGreenEnergy -= cost;

  // 巨量伤害
  fishHealth -= 5000;
  // 清空拉力
  orangeProgress = 0;
  // 3秒全安全区
  startBulletTime();

  status.textContent = "🌊 海韵共鸣：绝杀！3秒全安全区！";
  updateGreenBarsDisplay();
  updateFishHealthUI();
  checkGameOver();
}

// ===================== 技能结束恢复 =====================
function updateSkillStates() {
  const now = Date.now();

  if (skill1Active && now >= skill1EndTime) {
    skill1Active = false;
    if (!isBossMode) {
      targetZoneLeft = 60;
      targetZoneWidth = 25;
      targetZone.style.left = '60%';
      targetZone.style.width = '25%';
    }
    status.textContent = "稳流定钩效果结束";
  }

  if (skill2Active && now >= skill2EndTime) {
    skill2Active = false;
    skill2Burst();
  }
}

// ===================== UI =====================
function updateGreenBarsDisplay() {
  let e = totalGreenEnergy;
  const full = Math.floor(e / currentConfig.barCapacity);
  if (full > lastFullBars) startBulletTime();
  lastFullBars = full;

  for (let i = 0; i < greenFills.length; i++) {
    const val = Math.min(currentConfig.barCapacity, e);
    const pct = (val / currentConfig.barCapacity) * 100;
    greenFills[i].style.width = pct + '%';
    greenBarTexts[i].textContent = Math.round(val) + '/100';
    greenFills[i].classList.toggle('full', pct >= 100);
    greenEffects[i].classList.toggle('active', pct > 0 && pct < 100);
    e -= currentConfig.barCapacity;
    if (e <= 0) break;
  }
  for (let i = Math.ceil(totalGreenEnergy / currentConfig.barCapacity); i < greenFills.length; i++) {
    greenFills[i].style.width = '0%';
    greenBarTexts[i].textContent = '0/100';
    greenFills[i].classList.remove('full');
    greenEffects[i].classList.remove('active');
  }
}

function updateSkillButtons() {
  const enough1 = totalGreenEnergy >= currentConfig.skill1Cost;
  const enough2 = totalGreenEnergy >= currentConfig.skill2Cost;
  const enough3 = totalGreenEnergy >= currentConfig.skill3Cost;

  skill1Button.disabled = !enough1 || gameOver;
  skill2Button.disabled = !enough2 || gameOver;
  skill3Button.disabled = !enough3 || gameOver;

  skill1Button.textContent = `${skillInfos.skill1.name}\n${skillInfos.skill1.cost}格`;
  skill2Button.textContent = `${skillInfos.skill2.name}\n${skillInfos.skill2.cost}格`;
  skill3Button.textContent = `${skillInfos.skill3.name}\n${skillInfos.skill3.cost}格`;
}

function updateFishHealthUI() {
  fishHealth = Math.max(0, Math.min(fishHealthMax, fishHealth));
  const deg = (fishHealth / fishHealthMax) * 360;
  fishHealthFill.style.setProperty('--health-deg', deg + 'deg');
  fishHealthText.textContent = Math.round(fishHealth) + '/' + fishHealthMax;
}
function updatePlayerStaminaUI() {
  playerStamina = Math.max(0, Math.min(playerStaminaMax, playerStamina));
  const pct = (playerStamina / playerStaminaMax) * 100;
  playerStaminaFill.style.width = pct + '%';
  playerStaminaText.textContent = `耐力：${Math.round(playerStamina)}/${playerStaminaMax}`;
}

function checkGameOver() {
  if (fishHealth <= 0) {
    gameOver = true;
    gameOverText.textContent = "捕获成功！";
    gameOverScreen.style.display = "block";
  } else if (playerStamina <= 0) {
    gameOver = true;
    gameOverText.textContent = "耐力耗尽！";
    gameOverScreen.style.display = "block";
  }
  if (gameOver) {
    endBulletTime();
    stopFishSplashLoop();
    updateSkillButtons();
  }
}

function updateUI() {
  if (gameOver) return;
  orangeProgress = Math.max(0, Math.min(100, orangeProgress));
  totalGreenEnergy = Math.max(0, Math.min(currentConfig.maxEnergy, totalGreenEnergy));
  orangeFill.style.width = orangeProgress + '%';
  orangeFill.classList.toggle('full-warning', orangeProgress >= 100);

  if (isBossMode) updateTargetZone();
  pullToCenter();
  updateFishHealthUI();
  updatePlayerStaminaUI();

  let add = isInTargetZone() ? currentConfig.greenFast : currentConfig.greenSlow;
  if (isDragDirectionCorrect()) add *= 2.5;
  totalGreenEnergy += add;

  updateGreenBarsDisplay();
  particleLoop();
  updateSkillStates();
  updateSkillButtons();
  checkGameOver();
}

// ===================== 游戏循环 =====================
function loop() {
  if (gameOver) return;

  // 拉力条
  if (isHolding) {
    orangeProgress += getRandomOrangeValue();
  } else {
    let dec;
    if (isBulletTime) {
      dec = 0.01;
    } else {
      dec = isInTargetZone() ? getSlowOrangeDecValue() : getRandomOrangeValue();
      dec *= getOrangeDownRate();
    }
    orangeProgress -= dec;
  }

  // 掉血 & 蓄力钓记录
  let dmg = 0;
  if (isBulletTime) {
    dmg = currentConfig.fishFast * 1.5;
  } else if (isInTargetZone()) {
    dmg = currentConfig.fishFast;
  } else if (isHolding) {
    dmg = currentConfig.fishSlow;
  }
  if (dmg > 0) {
    fishHealth -= dmg;
    if (skill2Active) skill2StoredDamage += dmg;
  }

  // 耐力消耗
  if (isHolding && !isInTargetZone()) {
    let mul = orangeProgress >= 100 ? 2 : 1;
    if (dragDirection !== 0 && !isDragDirectionCorrect()) mul *= 1.5;
    playerStamina -= currentConfig.playerDamage * mul;
  }

  updateUI();
}

// ===================== 模式 & 重置 =====================
function switchFishMode(isBoss) {
  isBossMode = isBoss;
  isBossPhase2 = false;
  waterSection.classList.remove('boss-phase2');
  normalFishBtn.classList.toggle('active', !isBoss);
  bossFishBtn.classList.toggle('active', isBoss);
  fishHealthMax = isBoss ? currentConfig.bossFishHealth : currentConfig.normalFishHealth;
  fishHealth = fishHealthMax;
  resetGame();
}
function resetGame() {
  orangeProgress = 0;
  totalGreenEnergy = 0;
  fishHealth = fishHealthMax;
  playerStamina = currentConfig.playerStamina;
  gameOver = false;
  isBulletTime = false;
  skill1Active = false;
  skill2Active = false;
  skill2StoredDamage = 0;

  clearTimeout(bulletTimeTimer);
  clearTimeout(fishDirectionTimer);
  clearTimeout(directionChangeTimer);
  clearTimeout(sizeChangeTimer);
  stopFishSplashLoop();

  orangeFill.classList.remove('bullet-time', 'full-warning');
  bulletTimeNotice.classList.remove('show');
  orangeFill.style.width = '0%';
  if (!isBossMode) {
    targetZoneLeft = 60;
    targetZoneWidth = 25;
    targetZone.style.left = '60%';
    targetZone.style.width = '25%';
  }
  initFishDirectionTimer();
  startFishSplashLoop();
  gameOverScreen.style.display = 'none';
  updateUI();
}

// ===================== 事件 =====================
function bindEvents() {
  reelButton.addEventListener('mousedown', handleDragStart);
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('mouseleave', handleDragEnd);

  reelButton.addEventListener('touchstart', handleDragStart, { passive: false });
  document.addEventListener('touchmove', handleDragMove, { passive: false });
  document.addEventListener('touchend', handleDragEnd);
  document.addEventListener('touchcancel', handleDragEnd);

  resetButton.addEventListener('click', resetGame);
  gameOverResetBtn.addEventListener('click', resetGame);
  skill1Button.addEventListener('click', useSkill1);
  skill2Button.addEventListener('click', useSkill2);
  skill3Button.addEventListener('click', useSkill3);
  normalFishBtn.addEventListener('click', () => switchFishMode(false));
  bossFishBtn.addEventListener('click', () => switchFishMode(true));

  bindSkillLongPress();
}

function initGame() {
  initFishDirectionTimer();
  bindEvents();
  startFishSplashLoop();
  intervalId = setInterval(loop, 60);
  updateUI();
}

document.addEventListener('DOMContentLoaded', initGame);