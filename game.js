// 获取DOM元素
const orangeFill = document.getElementById('orangeFill');
const particleContainer = document.getElementById('particleContainer');
const targetZone = document.getElementById('targetZone');
const fishHealthFill = document.getElementById('fishHealthFill');
const fishHealthText = document.getElementById('fishHealthText');
const fishIcon = document.getElementById('fishIcon');
const fishDirectionText = document.getElementById('fishDirectionText');
const greenFills = [
    document.getElementById('greenFill1'),
    document.getElementById('greenFill2'),
    document.getElementById('greenFill3')
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
const playerIcon = document.getElementById('playerIcon');
const directionText = document.getElementById('directionText');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverText = document.getElementById('gameOverText');
const gameOverResetBtn = document.getElementById('gameOverResetBtn');

// 游戏配置（保留原始数值，优化移动端参数）
const DEFAULT_CONFIG = {
    playerStamina: 2000,
    normalFishHealth: 3000,
    bossFishHealth: 5000,
    playerDamage: 10,
    fullHpMultiplier: 2,
    orangeMin: 2,          // 降低橙色条增长速度，适配移动端操作
    orangeMax: 8,
    orangeSlowMin: 1,
    orangeSlowMax: 4,
    bulletTimeDec: 1,
    greenSlow: 0.03,       // 降低能量增长，减少粒子数量
    greenFast: 1.5,
    barCapacity: 100,
    maxEnergy: 300,
    fishSlow: 4,
    fishFast: 25,
    skill1Cost: 100,
    skill1Damage: 50,
    skill2Cost: 100,
    skill2Heal: 200,
    skill3Cost: 300,
    skill3Damage: 300,
    moveSpeedMin: 0.03,    // 降低BOSS判定区移动速度，适配移动端反应
    moveSpeedMax: 0.08,
    sizeSpeedMin: 0.01,
    sizeSpeedMax: 0.05,
    dirChangeMin: 600,     // 延长判定区变换时间，适配移动端
    dirChangeMax: 1200,
    bossPhase2Hp: 50,
    phase2MoveMulti: 1.8,  // 降低二阶段倍率，减少难度
    phase2SizeMulti: 1.8,
    phase2MinLeft: 20,
    phase2MaxLeft: 95,
    phase2MinWidth: 5,
    phase2MaxWidth: 50,
    bulletTimeDur: 1000,
    fishDirChangeMin: 2500,// 延长鱼方向切换时间，适配移动端操作
    fishDirChangeMax: 4500,
    correctDirectionBonus: 0.4,
    wrongDirectionPenalty: 0.4,
    centerPullStrength: 2.5,
    correctEnergyMultiplier: 2.5,
    playerSlowDownRate: 0.5,
    playerNormalDownRate: 1.0
};

// 当前配置
const currentConfig = { ...DEFAULT_CONFIG };

// 核心状态
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

// 基础判定区域范围
const BASE_TARGET_START = 60;
const BASE_TARGET_END = 85;
const BASE_TARGET_CENTER = (BASE_TARGET_START + BASE_TARGET_END) / 2;
let BOSS_TARGET_MIN_LEFT = 40;
let BOSS_TARGET_MAX_LEFT = 90;
let BOSS_TARGET_MIN_WIDTH = 10;
let BOSS_TARGET_MAX_WIDTH = 25;

// 数值配置
const GREEN_SLOW = currentConfig.greenSlow;
const GREEN_FAST = currentConfig.greenFast;
const FISH_HEALTH_SLOW = currentConfig.fishSlow;
const FISH_HEALTH_FAST = currentConfig.fishFast;
const BULLET_TIME_DECREASE = currentConfig.bulletTimeDec;
const BULLET_TIME_DURATION = currentConfig.bulletTimeDur;

// ===================== 玩家朝向核心功能 =====================
function updatePlayerDirectionDisplay() {
    if (playerDirection === 1) {
        playerIcon.classList.remove('left');
        directionText.textContent = '朝右';
    } else {
        playerIcon.classList.add('left');
        directionText.textContent = '朝左';
    }
}

function setPlayerDirection(direction) {
    if (direction === 1 || direction === -1) {
        playerDirection = direction;
        updatePlayerDirectionDisplay();
    }
}

// ===================== 摆杆玩法核心功能 =====================
function getRandomFishDirChangeTime() {
    return Math.random() * (currentConfig.fishDirChangeMax - currentConfig.fishDirChangeMin) + currentConfig.fishDirChangeMin;
}

function switchFishDirection() {
    if (gameOver) return;
    fishDirection = fishDirection === 1 ? -1 : 1;
    if (fishDirection === 1) {
        fishIcon.classList.remove('left');
    } else {
        fishIcon.classList.add('left');
    }
    clearTimeout(fishDirectionTimer);
    fishDirectionTimer = setTimeout(switchFishDirection, getRandomFishDirChangeTime());
}

function initFishDirectionTimer() {
    clearTimeout(fishDirectionTimer);
    fishDirectionTimer = setTimeout(switchFishDirection, getRandomFishDirChangeTime());
}

// 优化移动端拖动阈值（从30px降到20px，更灵敏）
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
    
    if (isDragDirectionCorrect()) {
        reelButton.classList.add('correct-direction');
        status.classList.add('correct');
        status.classList.remove('wrong');
    } else if (dragDirection !== 0) {
        reelButton.classList.remove('correct-direction');
        status.classList.add('wrong');
        status.classList.remove('correct');
    } else {
        reelButton.classList.remove('correct-direction');
        status.classList.remove('correct', 'wrong');
    }
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
    if (isBossMode) {
        return targetZoneLeft + (targetZoneWidth / 2);
    }
    return BASE_TARGET_CENTER;
}

function pullToCenter() {
    if (!isDragDirectionCorrect() || gameOver) return;
    const center = getTargetCenter();
    const distance = orangeProgress - center;
    if (Math.abs(distance) > 0.5) {
        const pullAmount = (distance > 0 ? -1 : 1) * currentConfig.centerPullStrength * 0.1;
        orangeProgress += pullAmount;
        orangeProgress = Math.max(0, Math.min(100, orangeProgress));
    }
}

// ===================== 粒子特效核心功能（移动端优化） =====================
function getEnergyBarPosition(barIndex) {
    const bar = greenFills[barIndex];
    const rect = bar.getBoundingClientRect();
    const particleRect = particleContainer.getBoundingClientRect();
    const targetX = rect.left + rect.width/2 - particleRect.left;
    const targetY = rect.top + rect.height/2 - particleRect.top;
    return { x: targetX, y: targetY };
}

// 减少粒子数量，优化移动端性能
function createParticle() {
    if (!isInTargetZone() || gameOver) return;
    const targetBarIndex = Math.floor(Math.random() * greenFills.length);
    const targetPos = getEnergyBarPosition(targetBarIndex);
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
    const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
    const randomX = Math.random() * (targetEnd - targetStart) + targetStart;
    
    const particleContainerRect = particleContainer.getBoundingClientRect();
    const startX = (randomX / 100) * particleContainerRect.width;
    const startY = Math.random() * particleContainerRect.height;
    
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    
    // 缩小粒子尺寸，减少渲染压力
    const size = Math.random() * 5 + 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    const duration = Math.random() * 1.2 + 0.4;
    particle.style.animationDuration = `${duration}s`;
    
    particle.style.setProperty('--target-x', targetPos.x - startX);
    particle.style.setProperty('--target-y', targetPos.y - startY);
    particle.style.animationName = 'particle-to-energy';
    
    if (isDragDirectionCorrect()) {
        const boostSize = Math.random() * 7 + 4;
        particle.style.width = `${boostSize}px`;
        particle.style.height = `${boostSize}px`;
        particle.style.background = 'rgba(76, 175, 80, 0.9)';
    }
    
    particleContainer.appendChild(particle);
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}

// 减少每帧粒子生成数量，优化移动端性能
function particleLoop() {
    if (isInTargetZone() && !gameOver) {
        const baseCount = Math.floor(Math.random() * 1) + 1; // 从1-2个降到1个
        const particleCount = isDragDirectionCorrect() ? baseCount * 1.5 : baseCount;
        for (let i = 0; i < particleCount; i++) {
            createParticle();
        }
    }
}

// ===================== 核心逻辑 =====================
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
    if (playerDirection === -fishDirection) {
        return currentConfig.playerSlowDownRate;
    }
    return currentConfig.playerNormalDownRate;
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

function checkBossPhase2() {
    if (!isBossMode) return false;
    const currentHpPercent = (fishHealth / fishHealthMax) * 100;
    const isPhase2 = currentHpPercent <= currentConfig.bossPhase2Hp;
    if (isPhase2 && !isBossPhase2) {
        BOSS_TARGET_MIN_LEFT = currentConfig.phase2MinLeft;
        BOSS_TARGET_MAX_LEFT = currentConfig.phase2MaxLeft;
        BOSS_TARGET_MIN_WIDTH = currentConfig.phase2MinWidth;
        BOSS_TARGET_MAX_WIDTH = currentConfig.phase2MaxWidth;
        randomizeMoveDirection();
        randomizeSizeDirection();
        status.textContent = `${isBossMode ? '[BOSS模式-第二阶段] ' : ''}BOSS进入狂暴状态！判定区变化更快、范围更大！`;
        status.style.color = '#d81b60';
    }
    isBossPhase2 = isPhase2;
    return isPhase2;
}

function startBulletTime() {
    if (isBulletTime) return;
    isBulletTime = true;
    orangeFill.classList.add('bullet-time');
    bulletTimeNotice.textContent = `子弹时间！${currentConfig.bulletTimeDur/1000}秒内橙色条减速，鱼持续掉血`;
    bulletTimeNotice.classList.add('show');
    const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
    const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
    status.textContent = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}[子弹时间！] 橙色条减速，鱼持续掉血 | 黄色区: ${Math.round(targetStart)}%-${Math.round(targetEnd)}% | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy}`;
    status.style.color = '#ffdd00';
    clearTimeout(bulletTimeTimer);
    bulletTimeTimer = setTimeout(() => {
        endBulletTime();
    }, currentConfig.bulletTimeDur);
}

function endBulletTime() {
    isBulletTime = false;
    orangeFill.classList.remove('bullet-time');
    bulletTimeNotice.classList.remove('show');
    const inTargetZone = isInTargetZone();
    status.style.color = inTargetZone ? '#ffffff' : '#f44336';
}

function updateTargetZone() {
    if (!isBossMode) return;
    checkBossPhase2();
    targetZoneLeft += targetMoveSpeed * targetMoveDirection;
    const targetRight = targetZoneLeft + targetZoneWidth;
    if (targetZoneLeft <= BOSS_TARGET_MIN_LEFT) {
        targetZoneLeft = BOSS_TARGET_MIN_LEFT;
        targetMoveDirection = 1;
    } else if (targetRight >= BOSS_TARGET_MAX_LEFT) {
        targetZoneLeft = BOSS_TARGET_MAX_LEFT - targetZoneWidth;
        targetMoveDirection = -1;
    }
    targetZoneWidth += targetSizeSpeed * targetSizeDirection;
    if (targetZoneWidth <= BOSS_TARGET_MIN_WIDTH) {
        targetZoneWidth = BOSS_TARGET_MIN_WIDTH;
        targetSizeDirection = 1;
    } else if (targetZoneWidth >= BOSS_TARGET_MAX_WIDTH) {
        targetZoneWidth = BOSS_TARGET_MAX_WIDTH;
        targetSizeDirection = -1;
    }
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

function updateGreenBarsDisplay() {
    let remainingEnergy = totalGreenEnergy;
    const currentFullBars = getAvailableFullBars();
    if (currentFullBars > lastFullBars && !gameOver) {
        startBulletTime();
    }
    lastFullBars = currentFullBars;
    for (let i = 0; i < greenFills.length; i++) {
        const fillPercent = Math.min(100, (remainingEnergy / currentConfig.barCapacity) * 100);
        greenFills[i].style.width = `${fillPercent}%`;
        if (fillPercent >= 100) {
            greenFills[i].classList.add('full');
        } else {
            greenFills[i].classList.remove('full');
        }
        if (fillPercent > 0 && fillPercent < 100 && remainingEnergy > 0) {
            greenEffects[i].classList.add('active');
        } else {
            greenEffects[i].classList.remove('active');
        }
        remainingEnergy -= currentConfig.barCapacity;
        if (remainingEnergy <= 0) break;
    }
    for (let i = Math.ceil(totalGreenEnergy / currentConfig.barCapacity); i < greenFills.length; i++) {
        greenFills[i].style.width = '0%';
        greenFills[i].classList.remove('full');
        greenEffects[i].classList.remove('active');
    }
}

function getAvailableFullBars() {
    return Math.floor(totalGreenEnergy / currentConfig.barCapacity);
}

function updateSkillButtons() {
    const availableFullBars = getAvailableFullBars();
    skill1Button.disabled = availableFullBars < (currentConfig.skill1Cost / currentConfig.barCapacity) || gameOver;
    skill2Button.disabled = availableFullBars < (currentConfig.skill2Cost / currentConfig.barCapacity) || gameOver;
    skill3Button.disabled = availableFullBars < (currentConfig.skill3Cost / currentConfig.barCapacity) || gameOver;
    reelButton.disabled = gameOver;
    skill1Button.textContent = `技能1 (${currentConfig.skill1Cost/100}能量)`;
    skill2Button.textContent = `技能2 (恢复${currentConfig.skill2Heal}耐力，${currentConfig.skill2Cost/100}能量)`;
    skill3Button.textContent = `技能3 (${currentConfig.skill3Cost/100}能量)`;
}

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

// 优化游戏结束逻辑，显示弹窗
function checkGameOver() {
    if (fishHealth <= 0) {
        gameOver = true;
        endBulletTime();
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
    orangeProgress = Math.max(0, Math.min(100, orangeProgress));
    totalGreenEnergy = Math.max(0, Math.min(currentConfig.maxEnergy, totalGreenEnergy));
    orangeFill.style.width = `${orangeProgress}%`;
    orangeFill.style.display = 'block';
    
    if (orangeProgress >= 100) {
        orangeFill.classList.add('full-warning');
    } else {
        orangeFill.classList.remove('full-warning');
    }

    if (isBossMode) {
        updateTargetZone();
    }

    pullToCenter();
    updateFishHealthUI();
    updatePlayerStaminaUI();

    const inTargetZone = isInTargetZone();
    let greenIncrement = inTargetZone ? GREEN_FAST : GREEN_SLOW;
    if (isHolding && dragDirection !== 0 && isDragDirectionCorrect()) {
        greenIncrement *= currentConfig.correctEnergyMultiplier;
    }
    totalGreenEnergy += greenIncrement;

    updateGreenBarsDisplay();
    particleLoop();

    if (!isBulletTime) {
        let statusText, statusColor;
        const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
        const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
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

    updateSkillButtons();
    checkGameOver();
}

function loop() {
    if (gameOver) return;
    if (isHolding) {
        const randomInc = getRandomOrangeValue();
        orangeProgress += randomInc;
        const inTargetZone = isInTargetZone();
        fishHealth -= inTargetZone ? FISH_HEALTH_FAST : FISH_HEALTH_SLOW;
        if (!inTargetZone) {
            const damageMultiplier = orangeProgress >= 100 ? currentConfig.fullHpMultiplier : 1;
            const directionPenalty = (dragDirection !== 0 && !isDragDirectionCorrect()) ? 1.5 : 1;
            playerStamina -= PLAYER_DAMAGE * damageMultiplier * directionPenalty;
        }
    } else {
        let randomDec;
        if (isBulletTime) {
            randomDec = currentConfig.bulletTimeDec;
            const inTargetZone = isInTargetZone();
            fishHealth -= inTargetZone ? FISH_HEALTH_FAST : FISH_HEALTH_SLOW;
        } else {
            const inTargetZone = isInTargetZone();
            randomDec = inTargetZone ? getSlowOrangeDecValue() : getRandomOrangeValue();
            randomDec *= getOrangeDownRate();
        }
        orangeProgress -= randomDec;
    }
    updateUI();
}

function switchFishMode(isBoss) {
    isBossMode = isBoss;
    isBossPhase2 = false;
    normalFishBtn.classList.toggle('active', !isBoss);
    bossFishBtn.classList.toggle('active', isBoss);
    fishHealthMax = isBoss ? currentConfig.bossFishHealth : currentConfig.normalFishHealth;
    fishHealth = fishHealthMax;
    BOSS_TARGET_MIN_LEFT = 40;
    BOSS_TARGET_MAX_LEFT = 90;
    BOSS_TARGET_MIN_WIDTH = 10;
    BOSS_TARGET_MAX_WIDTH = 25;
    resetGame();
    if (isBossMode) {
        targetZoneLeft = 60;
        targetZoneWidth = 25;
        randomizeMoveDirection();
        randomizeSizeDirection();
    } else {
        targetZoneLeft = BASE_TARGET_START;
        targetZoneWidth = BASE_TARGET_END - BASE_TARGET_START;
        targetZone.style.left = `${BASE_TARGET_START}%`;
        targetZone.style.width = `${25}%`;
        clearTimeout(directionChangeTimer);
        clearTimeout(sizeChangeTimer);
    }
}

// 重置游戏时隐藏结束弹窗
function resetGame() {
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
    fishDirection = 1;
    dragDirection = 0;
    playerDirection = 1;
    
    clearTimeout(bulletTimeTimer);
    clearTimeout(fishDirectionTimer);
    orangeFill.classList.remove('bullet-time', 'full-warning');
    bulletTimeNotice.classList.remove('show');
    orangeFill.style.width = '0%';
    orangeFill.style.display = 'block';
    reelButton.classList.remove('dragging', 'correct-direction');
    fishIcon.classList.remove('left');
    updatePlayerDirectionDisplay();
    particleContainer.innerHTML = '';
    
    if (isBossMode) {
        targetZoneLeft = 60;
        targetZoneWidth = 25;
        targetZone.style.left = `${targetZoneLeft}%`;
        targetZone.style.width = `${targetZoneWidth}%`;
    } else {
        targetZone.style.left = `${BASE_TARGET_START}%`;
        targetZone.style.width = `${25}%`;
    }
    
    greenFills.forEach(fill => fill.classList.remove('full'));
    const defaultStatus = isBossMode 
        ? `[BOSS模式] 按住并拖动收线按钮 | 黄色判定区：动态变化 | 总能量：0/${currentConfig.maxEnergy}`
        : `按住并拖动收线按钮 | 黄色判定区：60%（含）-85%（不含） | 总能量：0/${currentConfig.maxEnergy}`;
    status.textContent = defaultStatus;
    status.style.color = '#666';
    status.classList.remove('correct', 'wrong');
    
    // 隐藏游戏结束弹窗
    gameOverScreen.style.display = 'none';
    
    initFishDirectionTimer();
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(loop, 60); // 降低帧率到60ms/帧，减少移动端耗电
    
    updateUI();
}

function useSkill1() {
    if (gameOver || getAvailableFullBars() < (currentConfig.skill1Cost / currentConfig.barCapacity)) return;
    totalGreenEnergy -= currentConfig.skill1Cost;
    totalGreenEnergy = Math.max(0, totalGreenEnergy);
    fishHealth -= currentConfig.skill1Damage;
    updateGreenBarsDisplay();
    updateFishHealthUI();
    updateSkillButtons();
    checkGameOver();
    status.textContent = `${status.textContent.split('|')[0]} | 技能1！造成${currentConfig.skill1Damage}伤害`;
}

function useSkill2() {
    if (gameOver || getAvailableFullBars() < (currentConfig.skill2Cost / currentConfig.barCapacity)) return;
    totalGreenEnergy -= currentConfig.skill2Cost;
    totalGreenEnergy = Math.max(0, totalGreenEnergy);
    playerStamina += currentConfig.skill2Heal;
    playerStamina = Math.min(playerStaminaMax, playerStamina);
    updateGreenBarsDisplay();
    updatePlayerStaminaUI();
    updateSkillButtons();
    status.textContent = `${status.textContent.split('|')[0]} | 技能2！恢复${currentConfig.skill2Heal}耐力`;
}

function useSkill3() {
    if (gameOver || getAvailableFullBars() < (currentConfig.skill3Cost / currentConfig.barCapacity)) return;
    totalGreenEnergy -= currentConfig.skill3Cost;
    totalGreenEnergy = Math.max(0, totalGreenEnergy);
    fishHealth -= currentConfig.skill3Damage;
    updateGreenBarsDisplay();
    updateFishHealthUI();
    updateSkillButtons();
    checkGameOver();
    status.textContent = `${status.textContent.split('|')[0]} | 技能3！造成${currentConfig.skill3Damage}高额伤害`;
}

// 优化移动端触摸事件，添加passive: false确保preventDefault生效
function bindEvents() {
    // 鼠标事件
    reelButton.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('mouseleave', handleDragEnd);
    
    // 触摸事件（优化移动端响应）
    reelButton.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('touchcancel', handleDragEnd);
    
    // 重置按钮
    resetButton.addEventListener('click', resetGame);
    gameOverResetBtn.addEventListener('click', resetGame); // 绑定结束弹窗的重置按钮
    
    // 技能按钮
skill1Button.addEventListener('click', useSkill1);
skill2Button.addEventListener('click', useSkill2);
skill3Button.addEventListener('click', useSkill3);

// 鱼模式切换 - 普通鱼
normalFishBtn.addEventListener('click', () => {
    // 切换按钮激活样式
    normalFishBtn.classList.add('active');
    bossFishBtn.classList.remove('active');
    
    // 切换鱼类型并重置对应参数
    currentFishType = 'normal'; // 全局变量：标记当前鱼类型
    resetFishStats('normal');   // 重置普通鱼的血量、拉力等参数
    updateFishUI();            // 更新鱼血量UI、图标等
    resetPullBar();            // 重置拉力条状态
    updateStatusText();        // 更新底部状态提示
    console.log('切换为普通鱼模式');
});

// 鱼模式切换 - BOSS鱼
bossFishBtn.addEventListener('click', () => {
    // 切换按钮激活样式
    bossFishBtn.classList.add('active');
    normalFishBtn.classList.remove('active');
    
    // 切换鱼类型并重置对应参数
    currentFishType = 'boss';
    resetFishStats('boss');     // 重置BOSS鱼的血量、拉力等参数
    updateFishUI();            // 更新鱼血量UI、图标等
    resetPullBar();            // 重置拉力条状态
    updateStatusText();        // 更新底部状态提示
    console.log('切换为BOSS鱼模式');
});

// 重置按钮事件监听
resetButton.addEventListener('click', resetGame);

// -------------------------- 核心辅助函数 --------------------------
// 1. 重置鱼的基础属性（区分普通鱼/BOSS鱼）
function resetFishStats(fishType) {
    if (fishType === 'normal') {
        // 普通鱼参数
        fishHealth = 3000;      // 鱼血量
        maxFishHealth = 3000;
        fishPullSpeed = 2;      // 鱼拉动拉力条的速度
        fishDirection = 'right';// 鱼初始游动方向
    } else if (fishType === 'boss') {
        // BOSS鱼参数（难度提升）
        fishHealth = 5000;      // 更高血量
        maxFishHealth = 5000;
        fishPullSpeed = 3;      // 更快拉力条速度
        fishDirection = 'left'; // 初始方向相反
    }
    
    // 重置鱼游动方向显示
    fishDirectionText.textContent = `鱼游动方向：${fishDirection === 'right' ? '右' : '左'}`;
}

// 2. 更新鱼血量UI（环形血条+文字）
function updateFishUI() {
    // 更新环形血条百分比
    const healthPercent = (fishHealth / maxFishHealth) * 100;
    fishHealthFill.style.background = `conic-gradient(#ff4d4d ${healthPercent}%, #333 ${healthPercent}%)`;
    // 更新血量文字
    fishHealthText.textContent = `${fishHealth}/${maxFishHealth}`;
    // 更新鱼图标（可根据需求替换图片）
    fishIcon.innerHTML = currentFishType === 'normal' ? '🐟' : '🐋';
}

// 3. 重置拉力条状态
function resetPullBar() {
    orangeFill.style.width = '50%'; // 拉力条回到初始位置
    targetZone.style.left = '60%';  // 判定区回到默认位置
    particleContainer.innerHTML = ''; // 清空粒子特效
}

// 4. 全局游戏重置（恢复所有初始状态）
function resetGame() {
    // 重置玩家耐力
    playerStamina = 2000;
    maxPlayerStamina = 2000;
    playerStaminaFill.style.width = '100%';
    playerStaminaText.textContent = `耐力：${playerStamina}/${maxPlayerStamina}`;
    
    // 重置能量条（3个绿色条）
    greenFill1.style.height = '0%';
    greenFill2.style.height = '0%';
    greenFill3.style.height = '0%';
    totalEnergy = 0; // 总能量重置
    greenEffect1.classList.remove('active');
    greenEffect2.classList.remove('active');
    greenEffect3.classList.remove('active');
    
    // 禁用所有技能按钮
    skill1Button.disabled = true;
    skill2Button.disabled = true;
    skill3Button.disabled = true;
    
    // 重置鱼状态（根据当前选中的鱼类型）
    resetFishStats(currentFishType);
    updateFishUI();
    
    // 重置拉力条
    resetPullBar();
    
    // 重置玩家朝向
    playerDirection = 'right';
    playerIcon.innerHTML = '🎣';
    directionText.textContent = '朝右';
    
    // 重置子弹时间状态
    bulletTimeActive = false;
    bulletTimeNotice.style.display = 'none';
    
    // 更新底部状态文本
    updateStatusText();
    
    console.log('游戏已重置为初始状态');
}

// 5. 更新底部状态提示文本
function updateStatusText() {
    status.textContent = `按住并拖动收线按钮（往鱼反方向）| 黄色判定区：60%（含）-85%（不含） | 总能量：${totalEnergy}/300`;
}

// -------------------------- 全局变量初始化（需放在代码开头） --------------------------
// 建议你将这些全局变量放在JS文件最顶部，确保所有函数可访问
let currentFishType = 'normal'; // 默认普通鱼
let fishHealth = 3000;          // 鱼当前血量
let maxFishHealth = 3000;       // 鱼最大血量
let fishPullSpeed = 2;          // 鱼拉动拉力条的速度
let fishDirection = 'right';    // 鱼游动方向
let playerStamina = 2000;       // 玩家当前耐力
let maxPlayerStamina = 2000;    // 玩家最大耐力
let totalEnergy = 0;            // 总能量
let bulletTimeActive = false;   // 子弹时间是否激活

// 获取DOM元素（需放在代码开头，确保页面加载后获取）
const normalFishBtn = document.getElementById('normalFishBtn');
const bossFishBtn = document.getElementById('bossFishBtn');
const resetButton = document.getElementById('resetButton');
const skill1Button = document.getElementById('skill1Button');
const skill2Button = document.getElementById('skill2Button');
const skill3Button = document.getElementById('skill3Button');
const fishHealthFill = document.getElementById('fishHealthFill');
const fishHealthText = document.getElementById('fishHealthText');
const fishDirectionText = document.getElementById('fishDirectionText');
const fishIcon = document.getElementById('fishIcon');
const playerStaminaFill = document.getElementById('playerStaminaFill');
const playerStaminaText = document.getElementById('playerStaminaText');
const greenFill1 = document.getElementById('greenFill1');
const greenFill2 = document.getElementById('greenFill2');
const greenFill3 = document.getElementById('greenFill3');
const greenEffect1 = document.getElementById('greenEffect1');
const greenEffect2 = document.getElementById('greenEffect2');
const greenEffect3 = document.getElementById('greenEffect3');
const orangeFill = document.getElementById('orangeFill');
const targetZone = document.getElementById('targetZone');
const particleContainer = document.getElementById('particleContainer');
const playerIcon = document.getElementById('playerIcon');
const directionText = document.getElementById('directionText');
const bulletTimeNotice = document.getElementById('bulletTimeNotice');
const status = document.getElementById('status');

// 初始化游戏状态（页面加载时执行）
resetGame();