// ===================== 1. 全局DOM元素获取（仅保留核心使用的元素） =====================
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

// ===================== 2. 游戏核心配置（精简无用配置，保留核心参数） =====================
const DEFAULT_CONFIG = {
    playerStamina: 1500,
    normalFishHealth: 10000,
    bossFishHealth: 20000,
    playerDamage: 10,
    fullHpMultiplier: 2,
    orangeMin: 2,          // 橙色条增长速度（移动端适配）
    orangeMax: 8,
    orangeSlowMin: 1,
    orangeSlowMax: 4,
    bulletTimeDec: 0.01,
    greenSlow: 0.03,       // 能量增长速度
    greenFast: 1.5,
    barCapacity: 100,
    maxEnergy: 300,
    fishSlow: 4,           // 鱼掉血速度（非判定区）
    fishFast: 25,          // 鱼掉血速度（判定区）
    skill1Cost: 100,
    skill1Damage: 1000,
    skill2Cost: 100,
    skill2Heal: 200,
    skill3Cost: 300,
    skill3Damage: 4000,
    moveSpeedMin: 0.03,    // BOSS判定区移动速度
    moveSpeedMax: 0.08,
    sizeSpeedMin: 0.01,
    sizeSpeedMax: 0.05,
    dirChangeMin: 600,     // 判定区变换间隔
    dirChangeMax: 1200,
    bossPhase2Hp: 50,
    phase2MoveMulti: 1.8,  // 二阶段判定区速度倍率
    phase2SizeMulti: 1.8,
    phase2MinLeft: 20,
    phase2MaxLeft: 95,
    phase2MinWidth: 5,
    phase2MaxWidth: 50,
    bulletTimeDur: 2000,   // 子弹时间时长（ms）
    fishDirChangeMin: 2500,// 鱼方向切换间隔
    fishDirChangeMax: 4500,
    correctDirectionBonus: 0.4,
    wrongDirectionPenalty: 0.4,
    centerPullStrength: 2.5,
    correctEnergyMultiplier: 2.5,
    playerSlowDownRate: 0.5,
    playerNormalDownRate: 1.0,
    // 水花特效配置
    splashParticleCount: 5,
    splashInterval: 300
};

// ===================== 3. 全局状态变量（精简初始化） =====================
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
let fishDirection = 1; // 1=右，-1=左
let fishDirectionTimer = null;
let isDragging = false;
let dragStartX = 0;
let dragDirection = 0;
let playerDirection = 1; // 1=右，-1=左
let splashTimer = null;
let bulletTimeBeforeTarget = {
    left: 60,
    width: 25
};

// ===================== 4. 基础常量 =====================
const BASE_TARGET_START = 60;
const BASE_TARGET_END = 85;
const BASE_TARGET_CENTER = (BASE_TARGET_START + BASE_TARGET_END) / 2;
let BOSS_TARGET_MIN_LEFT = 40;
let BOSS_TARGET_MAX_LEFT = 90;
let BOSS_TARGET_MIN_WIDTH = 10;
let BOSS_TARGET_MAX_WIDTH = 25;

// ===================== 5. 核心功能模块 =====================

/**
 * 玩家朝向更新
 */
function updatePlayerDirectionDisplay() {
    directionText.textContent = playerDirection === 1 ? '朝右' : '朝左';
}

function setPlayerDirection(direction) {
    if (direction === 1 || direction === -1) {
        playerDirection = direction;
        updatePlayerDirectionDisplay();
    }
}

/**
 * 鱼方向切换逻辑
 */
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

/**
 * 拖动交互（移动端优化）
 */
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
    
    // 降低拖动阈值，适配移动端
    if (deltaX > 20) {
        dragDirection = 1;
        setPlayerDirection(1);
    } else if (deltaX < -20) {
        dragDirection = -1;
        setPlayerDirection(-1);
    } else {
        dragDirection = 0;
    }
    
    // 更新按钮和状态样式
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

/**
 * 拉力条居中逻辑
 */
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

/**
 * 能量粒子特效
 */
function getParticleStartPosition() {
    const topBarRect = document.querySelector('.top-bar').getBoundingClientRect();
    const startX = topBarRect.left + (orangeProgress / 100) * topBarRect.width;
    const startY = topBarRect.top + topBarRect.height / 2;
    return { x: startX, y: startY };
}

function getParticleTargetPosition() {
    const barIndex = Math.min(Math.floor(totalGreenEnergy / currentConfig.barCapacity), greenFills.length - 1);
    const bar = greenFills[barIndex];
    const barRect = bar.parentElement.getBoundingClientRect();
    const fillPercent = parseFloat(bar.style.width) || 0;
    const targetX = barRect.left + (fillPercent / 100) * barRect.width;
    const targetY = barRect.top + barRect.height / 2;
    return { x: targetX, y: targetY };
}

function createParticle() {
    if (!isInTargetZone() || gameOver) return;
    
    const startPos = getParticleStartPosition();
    const targetPos = getParticleTargetPosition();
    
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = `${startPos.x}px`;
    particle.style.top = `${startPos.y}px`;
    
    // 粒子样式
    const size = isDragDirectionCorrect() ? (Math.random() * 7 + 4) : (Math.random() * 5 + 3);
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = isDragDirectionCorrect() ? 'rgba(76, 175, 80, 0.9)' : '#00bfa5';
    
    const duration = Math.random() * 1.2 + 0.4;
    particle.style.animationDuration = `${duration}s`;
    particle.style.setProperty('--target-x', targetPos.x - startPos.x);
    particle.style.setProperty('--target-y', targetPos.y - startPos.y);
    particle.style.animationName = 'particle-to-energy';
    
    particleContainer.appendChild(particle);
    setTimeout(() => particle.remove(), duration * 1000);
}

function particleLoop() {
    if (isInTargetZone() && !gameOver) {
        const baseCount = Math.floor(Math.random() * 1) + 1;
        const particleCount = isDragDirectionCorrect() ? Math.floor(baseCount * 1.5) : baseCount;
        for (let i = 0; i < particleCount; i++) {
            createParticle();
        }
    }
}

/**
 * 鱼水花特效
 */
function getFishTailPosition() {
    const fishIconRect = fishIcon.getBoundingClientRect();
    let tailX, tailY;
    
    if (fishDirection === 1) {
        tailX = fishIconRect.left - 10;
        tailY = fishIconRect.top + fishIconRect.height / 2;
    } else {
        tailX = fishIconRect.right + 10;
        tailY = fishIconRect.top + fishIconRect.height / 2;
    }
    
    return { x: tailX, y: tailY };
}

function createFishSplashParticle() {
    if (gameOver) return;
    
    const tailPos = getFishTailPosition();
    const particle = document.createElement('div');
    particle.classList.add('fish-splash-particle');
    particle.style.left = `${tailPos.x}px`;
    particle.style.top = `${tailPos.y}px`;
    
    // 粒子样式
    const size = Math.random() * 4 + 4;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    const duration = Math.random() * 0.7 + 0.8;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationName = fishDirection === 1 ? 'fishSplashLeft' : 'fishSplashRight';
    particle.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px) scale(0)`;
    
    fishSplashContainer.appendChild(particle);
    setTimeout(() => particle.remove(), duration * 1000);
}

function startFishSplashLoop() {
    clearInterval(splashTimer);
    if (gameOver) return;
    
    splashTimer = setInterval(() => {
        for (let i = 0; i < currentConfig.splashParticleCount; i++) {
            createFishSplashParticle();
        }
    }, currentConfig.splashInterval);
}

function stopFishSplashLoop() {
    clearInterval(splashTimer);
    fishSplashContainer.innerHTML = '';
}

/**
 * 数值计算工具函数
 */
function getRandomOrangeValue() {
    let baseValue = Math.random() * (currentConfig.orangeMax - currentConfig.orangeMin) + currentConfig.orangeMin;
    if (isHolding && dragDirection !== 0 && !isDragDirectionCorrect()) {
        baseValue *= (1 + currentConfig.wrongDirectionPenalty);
    }
    return baseValue;
}

function getSlowOrangeDecValue() {
    let baseValue = Math.random() * (currentConfig.orangeSlowMax - currentConfig.orangeSlowMin) + currentConfig.orangeSlowMin;
    if (isHolding && dragDirection !== 0 && isDragDirectionCorrect()) {
        baseValue *= (1 - currentConfig.correctDirectionBonus);
    }
    return baseValue;
}

function getOrangeDownRate() {
    return playerDirection === -fishDirection ? currentConfig.playerSlowDownRate : currentConfig.playerNormalDownRate;
}

function getRandomMoveSpeed() {
    const baseSpeed = Math.random() * (currentConfig.moveSpeedMax - currentConfig.moveSpeedMin) + currentConfig.moveSpeedMin;
    return isBossPhase2 ? baseSpeed * currentConfig.phase2MoveMulti : baseSpeed;
}

function getRandomSizeSpeed() {
    const baseSpeed = Math.random() * (currentConfig.sizeSpeedMax - currentConfig.sizeSpeedMin) + currentConfig.sizeSpeedMin;
    return isBossPhase2 ? baseSpeed * currentConfig.phase2SizeMulti : baseSpeed;
}

function getRandomChangeTime() {
    return Math.random() * (currentConfig.dirChangeMax - currentConfig.dirChangeMin) + currentConfig.dirChangeMin;
}

/**
 * BOSS阶段判断（含背景切换）
 */
function checkBossPhase2() {
    if (!isBossMode) {
        waterSection?.classList.remove('boss-phase2');
        return false;
    }
    
    const currentHpPercent = (fishHealth / fishHealthMax) * 100;
    const isPhase2 = currentHpPercent <= currentConfig.bossPhase2Hp;
    
    // 切换水域背景
    waterSection?.classList.toggle('boss-phase2', isPhase2);
    
    if (isPhase2 && !isBossPhase2) {
        BOSS_TARGET_MIN_LEFT = currentConfig.phase2MinLeft;
        BOSS_TARGET_MAX_LEFT = currentConfig.phase2MaxLeft;
        BOSS_TARGET_MIN_WIDTH = currentConfig.phase2MinWidth;
        BOSS_TARGET_MAX_WIDTH = currentConfig.phase2MaxWidth;
        randomizeMoveDirection();
        randomizeSizeDirection();
        status.textContent = '[BOSS模式-第二阶段] BOSS进入狂暴状态！判定区变化更快、范围更大！';
        status.style.color = '#d81b60';
    }
    
    isBossPhase2 = isPhase2;
    return isPhase2;
}

/**
 * 子弹时间核心逻辑
 */
function startBulletTime() {
    if (isBulletTime) return;
    isBulletTime = true;
    
    // 记录判定区状态
    bulletTimeBeforeTarget.left = targetZoneLeft;
    bulletTimeBeforeTarget.width = targetZoneWidth;
    
    // 更新样式
    targetZone.classList.add('bullet-time-full');
    targetZone.style.left = '0%';
    targetZone.style.width = '100%';
    orangeFill.classList.add('bullet-time');
    bulletTimeNotice.textContent = `子弹时间！${currentConfig.bulletTimeDur/1000}秒内判定区全满，鱼1.5倍掉血！`;
    bulletTimeNotice.classList.add('show');
    
    // 状态提示
    const statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}[子弹时间🔥] 判定区全满！鱼1.5倍持续掉血 | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy}`;
    status.textContent = statusText;
    status.style.color = '#ffd700';
    
    // 定时器结束子弹时间
    clearTimeout(bulletTimeTimer);
    bulletTimeTimer = setTimeout(endBulletTime, currentConfig.bulletTimeDur);
}

function endBulletTime() {
    isBulletTime = false;
    
    // 恢复判定区
    targetZone.classList.remove('bullet-time-full');
    targetZoneLeft = bulletTimeBeforeTarget.left;
    targetZoneWidth = bulletTimeBeforeTarget.width;
    targetZone.style.left = `${targetZoneLeft}%`;
    targetZone.style.width = `${targetZoneWidth}%`;
    
    // 恢复样式
    orangeFill.classList.remove('bullet-time');
    bulletTimeNotice.classList.remove('show');
    
    // 恢复状态文字颜色
    status.style.color = isInTargetZone() ? '#ffffff' : '#f44336';
}

/**
 * BOSS判定区动态更新
 */
function updateTargetZone() {
    if (!isBossMode) return;
    checkBossPhase2();
    
    // 更新位置
    targetZoneLeft += targetMoveSpeed * targetMoveDirection;
    const targetRight = targetZoneLeft + targetZoneWidth;
    if (targetZoneLeft <= BOSS_TARGET_MIN_LEFT) {
        targetZoneLeft = BOSS_TARGET_MIN_LEFT;
        targetMoveDirection = 1;
    } else if (targetRight >= BOSS_TARGET_MAX_LEFT) {
        targetZoneLeft = BOSS_TARGET_MAX_LEFT - targetZoneWidth;
        targetMoveDirection = -1;
    }
    
    // 更新宽度
    targetZoneWidth += targetSizeSpeed * targetSizeDirection;
    if (targetZoneWidth <= BOSS_TARGET_MIN_WIDTH) {
        targetZoneWidth = BOSS_TARGET_MIN_WIDTH;
        targetSizeDirection = 1;
    } else if (targetZoneWidth >= BOSS_TARGET_MAX_WIDTH) {
        targetZoneWidth = BOSS_TARGET_MAX_WIDTH;
        targetSizeDirection = -1;
    }
    
    // 应用样式
    targetZone.style.left = `${targetZoneLeft}%`;
    targetZone.style.width = `${targetZoneWidth}%`;
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
    const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
    const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
    return orangeProgress >= targetStart && orangeProgress < targetEnd;
}

/**
 * 能量条更新
 */
function updateGreenBarsDisplay() {
    let remainingEnergy = totalGreenEnergy;
    const currentFullBars = Math.floor(totalGreenEnergy / currentConfig.barCapacity);
    
    // 满格触发子弹时间
    if (currentFullBars > lastFullBars && !gameOver) {
        startBulletTime();
    }
    lastFullBars = currentFullBars;
    
    // 更新能量条
    for (let i = 0; i < greenFills.length; i++) {
        const barCapacity = currentConfig.barCapacity;
        const fillValue = Math.min(barCapacity, remainingEnergy);
        const fillPercent = (fillValue / barCapacity) * 100;
        
        greenFills[i].style.width = `${fillPercent}%`;
        greenBarTexts[i].textContent = `${Math.round(fillValue)}/${barCapacity}`;
        greenFills[i].classList.toggle('full', fillPercent >= 100);
        greenEffects[i].classList.toggle('active', fillPercent > 0 && fillPercent < 100);
        
        remainingEnergy -= barCapacity;
        if (remainingEnergy <= 0) break;
    }
    
    // 清空剩余能量条
    for (let i = Math.ceil(totalGreenEnergy / currentConfig.barCapacity); i < greenFills.length; i++) {
        greenFills[i].style.width = '0%';
        greenBarTexts[i].textContent = '0/100';
        greenFills[i].classList.remove('full');
        greenEffects[i].classList.remove('active');
    }
}

/**
 * 技能按钮状态更新
 */
function updateSkillButtons() {
    const availableFullBars = Math.floor(totalGreenEnergy / currentConfig.barCapacity);
    skill1Button.disabled = availableFullBars < (currentConfig.skill1Cost / currentConfig.barCapacity) || gameOver;
    skill2Button.disabled = availableFullBars < (currentConfig.skill2Cost / currentConfig.barCapacity) || gameOver;
    skill3Button.disabled = availableFullBars < (currentConfig.skill3Cost / currentConfig.barCapacity) || gameOver;
    reelButton.disabled = gameOver;
    
    // 更新按钮文字
    skill1Button.textContent = `技能1 (${currentConfig.skill1Cost/100}能量)`;
    skill2Button.textContent = `技能2 (恢复${currentConfig.skill2Heal}耐力，${currentConfig.skill2Cost/100}能量)`;
    skill3Button.textContent = `技能3 (${currentConfig.skill3Cost/100}能量)`;
}

/**
 * UI更新
 */
function updateFishHealthUI() {
    fishHealth = Math.max(0, Math.min(fishHealthMax, fishHealth));
    const healthPercent = fishHealth / fishHealthMax;
    const healthDeg = healthPercent * 360;
    fishHealthFill.style.setProperty('--health-deg', `${healthDeg}deg`);
    fishHealthText.textContent = `${Math.round(fishHealth)}/${fishHealthMax}`;
}

function updatePlayerStaminaUI() {
    playerStamina = Math.max(0, Math.min(playerStaminaMax, playerStamina));
    const staminaPercent = (playerStamina / playerStaminaMax) * 100;
    playerStaminaFill.style.width = `${staminaPercent}%`;
    playerStaminaText.textContent = `耐力：${Math.round(playerStamina)}/${playerStaminaMax}`;
}

function checkGameOver() {
    if (fishHealth <= 0) {
        gameOver = true;
        endBulletTime();
        stopFishSplashLoop();
        waterSection?.classList.remove('boss-phase2');
        clearTimeout(fishDirectionTimer);
        reelButton.classList.remove('correct-direction');
        status.classList.remove('correct', 'wrong');
        gameOverText.textContent = `恭喜！鱼已被捕获！剩余耐力: ${Math.round(playerStamina)}`;
        gameOverScreen.style.display = 'block';
        status.textContent = `恭喜！鱼已被捕获！点击重置按钮重新开始 | 剩余耐力: ${Math.round(playerStamina)}`;
        status.style.color = '#4caf50';
        updateSkillButtons();
    } else if (playerStamina <= 0) {
        gameOver = true;
        endBulletTime();
        stopFishSplashLoop();
        waterSection?.classList.remove('boss-phase2');
        clearTimeout(fishDirectionTimer);
        reelButton.classList.remove('correct-direction');
        status.classList.remove('correct', 'wrong');
        gameOverText.textContent = `游戏失败！你的耐力已耗尽！`;
        gameOverScreen.style.display = 'block';
        status.textContent = `游戏失败！你的耐力已耗尽！点击重置按钮重新开始`;
        status.style.color = '#f44336';
        updateSkillButtons();
    }
}

function updateUI() {
    if (gameOver) return;
    
    // 边界限制
    orangeProgress = Math.max(0, Math.min(100, orangeProgress));
    totalGreenEnergy = Math.max(0, Math.min(currentConfig.maxEnergy, totalGreenEnergy));
    
    // 更新拉力条样式
    orangeFill.style.width = `${orangeProgress}%`;
    orangeFill.style.display = 'block';
    orangeFill.classList.toggle('full-warning', orangeProgress >= 100);
    
    // BOSS判定区更新
    if (isBossMode) updateTargetZone();
    
    // 核心逻辑更新
    pullToCenter();
    updateFishHealthUI();
    updatePlayerStaminaUI();
    
    // 能量增长
    let greenIncrement = isInTargetZone() ? currentConfig.greenFast : currentConfig.greenSlow;
    if (isHolding && dragDirection !== 0 && isDragDirectionCorrect()) {
        greenIncrement *= currentConfig.correctEnergyMultiplier;
    }
    totalGreenEnergy += greenIncrement;
    
    // 更新能量条和粒子
    updateGreenBarsDisplay();
    particleLoop();
    
    // 状态文本更新
    if (!isBulletTime) {
        const inTargetZone = isInTargetZone();
        const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
        const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
        let statusText, statusColor;
        
        if (orangeProgress >= 100) {
            statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}[警告！] 橙色条已满！耐力掉血翻倍 | 黄色区: ${Math.round(targetStart)}%-${Math.round(targetEnd)}% | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy}`;
            statusColor = '#dc3545';
        } else if (inTargetZone) {
            statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}在黄色区！橙色: ${Math.round(orangeProgress)}% | 黄色区: ${Math.round(targetStart)}%-${Math.round(targetEnd)}% | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy} ${isDragDirectionCorrect() ? '| ✅ 摆杆方向正确！' : ''}`;
            statusColor = '#ffffff';
        } else {
            statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}不在黄色区！橙色: ${Math.round(orangeProgress)}% | 黄色区: ${Math.round(targetStart)}%-${Math.round(targetEnd)}% | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy} ${isHolding && dragDirection !== 0 && !isDragDirectionCorrect() ? '| ❌ 摆杆方向错误！' : ''}`;
            statusColor = '#f44336';
        }
        
        status.textContent = statusText;
        status.style.color = statusColor;
    }
    
    // 最终更新
    updateSkillButtons();
    checkGameOver();
}

/**
 * 主游戏循环
 */
function loop() {
    if (gameOver) return;
    
    // 1. 橙色条增减逻辑
    if (isHolding) {
        const randomInc = getRandomOrangeValue();
        orangeProgress += randomInc;
    } else {
        let randomDec;
        if (isBulletTime) {
            randomDec = currentConfig.bulletTimeDec;
        } else {
            const inTargetZone = isInTargetZone();
            randomDec = inTargetZone ? getSlowOrangeDecValue() : getRandomOrangeValue();
            randomDec *= getOrangeDownRate();
        }
        orangeProgress -= randomDec;
    }

    // 2. 鱼掉血逻辑（子弹时间1.5倍掉血）
    const inTargetZone = isInTargetZone();
    if (isBulletTime) {
        fishHealth -= currentConfig.fishFast * 1.5;
    } else if (inTargetZone) {
        fishHealth -= currentConfig.fishFast;
    } else if (isHolding && !inTargetZone) {
        fishHealth -= currentConfig.fishSlow;
    }

    // 3. 玩家耐力消耗
    if (isHolding && !inTargetZone) {
        const damageMultiplier = orangeProgress >= 100 ? currentConfig.fullHpMultiplier : 1;
        const directionPenalty = (dragDirection !== 0 && !isDragDirectionCorrect()) ? 1.5 : 1;
        playerStamina -= PLAYER_DAMAGE * damageMultiplier * directionPenalty;
    }

    // 4. 更新UI
    updateUI();
}

/**
 * 鱼模式切换
 */
function switchFishMode(isBoss) {
    isBossMode = isBoss;
    isBossPhase2 = false;
    waterSection?.classList.remove('boss-phase2');
    normalFishBtn.classList.toggle('active', !isBoss);
    bossFishBtn.classList.toggle('active', isBoss);
    
    // 重置鱼参数
    fishHealthMax = isBoss ? currentConfig.bossFishHealth : currentConfig.normalFishHealth;
    fishHealth = fishHealthMax;
    fishDirection = isBoss ? -1 : 1;
    fishIcon.classList.toggle('left', isBoss);
    
    // 重置判定区
    BOSS_TARGET_MIN_LEFT = 40;
    BOSS_TARGET_MAX_LEFT = 90;
    BOSS_TARGET_MIN_WIDTH = 10;
    BOSS_TARGET_MAX_WIDTH = 25;
    
    if (isBossMode) {
        targetZoneLeft = 60;
        targetZoneWidth = 25;
        targetZone.style.left = `${targetZoneLeft}%`;
        targetZone.style.width = `${targetZoneWidth}%`;
        randomizeMoveDirection();
        randomizeSizeDirection();
    } else {
        targetZoneLeft = BASE_TARGET_START;
        targetZoneWidth = 25;
        targetZone.style.left = `${BASE_TARGET_START}%`;
        targetZone.style.width = `${25}%`;
        clearTimeout(directionChangeTimer);
        clearTimeout(sizeChangeTimer);
    }
    
    // 重置游戏
    resetGame();
}

/**
 * 游戏重置
 */
function resetGame() {
    // 核心状态重置
    orangeProgress = 0;
    totalGreenEnergy = 0;
    fishHealth = fishHealthMax;
    playerStamina = playerStaminaMax;
    isHolding = false;
    isDragging = false;
    gameOver = false;
    isBulletTime = false;
    isBossPhase2 = false;
    lastFullBars = 0;
    dragDirection = 0;
    playerDirection = 1;
    
    // 清空定时器
    clearTimeout(bulletTimeTimer);
    clearTimeout(fishDirectionTimer);
    clearTimeout(directionChangeTimer);
    clearTimeout(sizeChangeTimer);
    stopFishSplashLoop();
    
    // UI重置
    orangeFill.classList.remove('bullet-time', 'full-warning');
    bulletTimeNotice.classList.remove('show');
    orangeFill.style.width = '0%';
    reelButton.classList.remove('dragging', 'correct-direction');
    fishIcon.classList.toggle('left', fishDirection === -1);
    updatePlayerDirectionDisplay();
    particleContainer.innerHTML = '';
    fishSplashContainer.innerHTML = '';
    
    // 能量条重置
    greenFills.forEach((fill, index) => {
        fill.style.width = '0%';
        fill.classList.remove('full');
        greenBarTexts[index].textContent = '0/100';
    });
    greenEffects.forEach(effect => effect.classList.remove('active'));
    
    // 状态文本重置
    const defaultStatus = isBossMode 
        ? `[BOSS模式] 按住并拖动收线按钮 | 黄色判定区：动态变化 | 总能量：0/${currentConfig.maxEnergy}`
        : `按住并拖动收线按钮 | 黄色判定区：60%（含）-85%（不含） | 总能量：0/${currentConfig.maxEnergy}`;
    status.textContent = defaultStatus;
    status.style.color = '#ffffff';
    status.classList.remove('correct', 'wrong');
    
    // 隐藏游戏结束弹窗
    gameOverScreen.style.display = 'none';
    
    // 重新初始化
    initFishDirectionTimer();
    startFishSplashLoop();
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(loop, 60);
    
    // 更新UI
    updateUI();
}

/**
 * 技能功能
 */
function useSkill1() {
    if (gameOver || Math.floor(totalGreenEnergy / currentConfig.barCapacity) < (currentConfig.skill1Cost / currentConfig.barCapacity)) return;
    totalGreenEnergy -= currentConfig.skill1Cost;
    fishHealth -= currentConfig.skill1Damage;
    updateGreenBarsDisplay();
    updateFishHealthUI();
    updateSkillButtons();
    checkGameOver();
    status.textContent = `${status.textContent.split('|')[0]} | 技能1！造成${currentConfig.skill1Damage}伤害`;
}

function useSkill2() {
    if (gameOver || Math.floor(totalGreenEnergy / currentConfig.barCapacity) < (currentConfig.skill2Cost / currentConfig.barCapacity)) return;
    totalGreenEnergy -= currentConfig.skill2Cost;
    playerStamina = Math.min(playerStaminaMax, playerStamina + currentConfig.skill2Heal);
    updateGreenBarsDisplay();
    updatePlayerStaminaUI();
    updateSkillButtons();
    status.textContent = `${status.textContent.split('|')[0]} | 技能2！恢复${currentConfig.skill2Heal}耐力`;
}

function useSkill3() {
    if (gameOver || Math.floor(totalGreenEnergy / currentConfig.barCapacity) < (currentConfig.skill3Cost / currentConfig.barCapacity)) return;
    totalGreenEnergy -= currentConfig.skill3Cost;
    fishHealth -= currentConfig.skill3Damage;
    updateGreenBarsDisplay();
    updateFishHealthUI();
    updateSkillButtons();
    checkGameOver();
    status.textContent = `${status.textContent.split('|')[0]} | 技能3！造成${currentConfig.skill3Damage}高额伤害`;
}

/**
 * 事件绑定（移动端优化）
 */
function bindEvents() {
    // 拖动事件（鼠标+触摸）
    reelButton.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('mouseleave', handleDragEnd);
    
    reelButton.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('touchcancel', handleDragEnd);
    
    // 按钮点击事件
    resetButton.addEventListener('click', resetGame);
    gameOverResetBtn.addEventListener('click', resetGame);
    skill1Button.addEventListener('click', useSkill1);
    skill2Button.addEventListener('click', useSkill2);
    skill3Button.addEventListener('click', useSkill3);
    normalFishBtn.addEventListener('click', () => switchFishMode(false));
    bossFishBtn.addEventListener('click', () => switchFishMode(true));
    
    // 移动端触摸优化
    skill1Button.addEventListener('touchstart', (e) => { e.preventDefault(); useSkill1(); }, { passive: false });
    skill2Button.addEventListener('touchstart', (e) => { e.preventDefault(); useSkill2(); }, { passive: false });
    skill3Button.addEventListener('touchstart', (e) => { e.preventDefault(); useSkill3(); }, { passive: false });
    resetButton.addEventListener('touchstart', (e) => { e.preventDefault(); resetGame(); }, { passive: false });
    normalFishBtn.addEventListener('touchstart', (e) => { e.preventDefault(); switchFishMode(false); }, { passive: false });
    bossFishBtn.addEventListener('touchstart', (e) => { e.preventDefault(); switchFishMode(true); }, { passive: false });
    gameOverResetBtn.addEventListener('touchstart', (e) => { e.preventDefault(); resetGame(); }, { passive: false });
}

/**
 * 游戏初始化
 */
function initGame() {
    // 初始化鱼方向
    fishIcon.classList.remove('left');
    initFishDirectionTimer();
    
    // 绑定事件
    bindEvents();
    
    // 初始化判定区
    targetZone.style.left = `${BASE_TARGET_START}%`;
    targetZone.style.width = `${25}%`;
    
    // 启动水花特效
    startFishSplashLoop();
    
    // 启动游戏循环
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(loop, 60);
    
    // 初始UI更新
    updateUI();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initGame);