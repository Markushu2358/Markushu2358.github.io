// ===================== 1. 全局DOM元素获取（新增：伤害提示元素，若没有则动态创建） =====================
const orangeFill = document.getElementById('orangeFill');
const particleContainer = document.getElementById('particleContainer');
const targetZone = document.getElementById('targetZone');
const fishHealthFill = document.getElementById('fishHealthFill');
const fishHealthText = document.getElementById('fishHealthText');
const fishIcon = document.getElementById('fishIcon');
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
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverText = document.getElementById('gameOverText');
const gameOverResetBtn = document.getElementById('gameOverResetBtn');
const waterSection = document.querySelector('.water-section');
const stabBarSection = document.getElementById('stabBarSection');
const stabCursor = document.getElementById('stabCursor');
const topBar = document.querySelector('.top-bar');

// 新增：创建刺鱼伤害提示元素（若页面无此元素）
let damagePopup = document.getElementById('stabDamagePopup');
if (!damagePopup) {
    damagePopup = document.createElement('div');
    damagePopup.id = 'stabDamagePopup';
    damagePopup.style.position = 'fixed';
    damagePopup.style.top = '50%';
    damagePopup.style.left = '50%';
    damagePopup.style.transform = 'translate(-50%, -50%)';
    damagePopup.style.fontSize = '24px';
    damagePopup.style.fontWeight = 'bold';
    damagePopup.style.color = '#ff4757';
    damagePopup.style.textShadow = '0 0 10px #fff';
    damagePopup.style.zIndex = '9999';
    damagePopup.style.display = 'none';
    document.body.appendChild(damagePopup);
}

// ===================== 2. 游戏核心配置（修改：新增开局保护配置） =====================
const DEFAULT_CONFIG = {
    playerStamina: 1500,
    normalFishHealth: 10000,
    bossFishHealth: 20000,
    playerDamage: 10,
    fullHpMultiplier: 2,
    orangeMin: 1,          
    orangeMax: 5,
    // 🔥 修改：5个阶段的鱼拉力配置（按拉力条进度递增，拉力递增）
    fishPullPhase1: { min: 0.1, max: 1, progressRange: [0, 20] },    // 0-20%拉力条
    fishPullPhase2: { min: 0.2, max: 2, progressRange: [20, 40] },  // 20-40%拉力条
    fishPullPhase3: { min: 1, max: 3, progressRange: [40, 60] },    // 40-60%拉力条
    fishPullPhase4: { min: 1, max: 4, progressRange: [60, 80] },    // 60-80%拉力条
    fishPullPhase5: { min: 1, max: 5, progressRange: [80, 100] },  // 80-100%拉力条（拉力最大）
    bulletTimeDec: 0.01,
    greenSlow: 0.03,       
    greenFast: 1.5,
    barCapacity: 100,
    maxEnergy: 300,
    fishSlow: 4,           
    fishFast: 25,          
    skill1Cost: 100,
    skill1Damage: 1000,
    skill2Cost: 100,
    skill2Heal: 200,
    skill3Cost: 300,
    skill3Damage: 4000,
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
    playerNormalDownRate: 1.0,
    castDelayMin: 1000,  
    castDelayMax: 3000,  
    stabDownMaxCount: 10,        
    stabDownDuration: 500,       
    stabUpDuration: 500,         
    stabStayDuration: 500,       
    stabRange1_2: [10, 100],     
    stabRange3_5: [20, 100],     
    stabRange6_10: [50, 100],    
    // ========== 新增：开局保护配置 ==========
    startupProtectionDur: 2000, // 开局保护时长（毫秒），可自定义
    startupProtectionDec: 0.001 // 开局保护期间拉力条下降速率（比正常子弹时间更慢）
};

// ===================== 3. 全局状态变量（新增：开局保护相关状态） =====================
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
let bulletTimeBeforeTarget = {
    left: 60,
    width: 25
};
let isCastPhase = true; 
let isStabPhase = false; 
let stabCursorPosition = 0; 
let stabDownCount = 0; 
let stabInterval = null; 
// ========== 新增：开局保护状态 ==========
let isStartupProtection = false; // 是否处于开局保护阶段
let startupProtectionTimer = null; // 开局保护定时器
let startupBeforeTarget = { // 开局保护前的目标区状态
    left: 60,
    width: 25
};

// ===================== 4. 基础常量（不变） =====================
const BASE_TARGET_START = 60;
const BASE_TARGET_END = 85;
const BASE_TARGET_CENTER = (BASE_TARGET_START + BASE_TARGET_END) / 2;
let BOSS_TARGET_MIN_LEFT = 40;
let BOSS_TARGET_MAX_LEFT = 90;
let BOSS_TARGET_MIN_WIDTH = 10;
let BOSS_TARGET_MAX_WIDTH = 25;

// ===================== 5. 核心功能模块（修改：新增开局保护逻辑） =====================

/**
 * 数值计算工具函数（修改：按拉力条进度获取鱼拉力）
 */
function getRandomOrangeValue() {
    return Math.random() * (currentConfig.orangeMax - currentConfig.orangeMin) + currentConfig.orangeMin;
}

function getSlowOrangeDecValue() {
    return Math.random() * (currentConfig.orangeSlowMax - currentConfig.orangeSlowMin) + currentConfig.orangeSlowMin;
}

// 🔥 修改：根据拉力条进度获取当前阶段的拉力范围（不再关联血量）
function getCurrentFishPullRange() {
    const progressPercent = Math.min(100, Math.max(0, orangeProgress)); // 确保进度在0-100之间
    // 按拉力条进度从低到高匹配阶段（进度越高，拉力越大）
    if (progressPercent >= currentConfig.fishPullPhase5.progressRange[0] && progressPercent <= currentConfig.fishPullPhase5.progressRange[1]) {
        return currentConfig.fishPullPhase5;
    } else if (progressPercent >= currentConfig.fishPullPhase4.progressRange[0] && progressPercent < currentConfig.fishPullPhase4.progressRange[1]) {
        return currentConfig.fishPullPhase4;
    } else if (progressPercent >= currentConfig.fishPullPhase3.progressRange[0] && progressPercent < currentConfig.fishPullPhase3.progressRange[1]) {
        return currentConfig.fishPullPhase3;
    } else if (progressPercent >= currentConfig.fishPullPhase2.progressRange[0] && progressPercent < currentConfig.fishPullPhase2.progressRange[1]) {
        return currentConfig.fishPullPhase2;
    } else {
        return currentConfig.fishPullPhase1;
    }
}

// 🔥 修改：获取当前阶段的随机鱼拉力（仅关联拉力条进度，BOSS第二阶段额外加力）
function getCurrentFishPullValue() {
    const phase = getCurrentFishPullRange();
    const pullValue = Math.random() * (phase.max - phase.min) + phase.min;
    // BOSS第二阶段额外增加30%拉力（修复：提高倍率确保有明显效果）
    const bossMulti = isBossPhase2 ? 1.3 : 1;
    return pullValue * bossMulti;
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
 * BOSS阶段判断（不变）
 */
function checkBossPhase2() {
    if (!isBossMode) {
        waterSection?.classList.remove('boss-phase2');
        return false;
    }
    
    const currentHpPercent = (fishHealth / fishHealthMax) * 100;
    const isPhase2 = currentHpPercent <= currentConfig.bossPhase2Hp;
    
    waterSection?.classList.toggle('boss-phase2', isPhase2);
    
    if (isPhase2 && !isBossPhase2) {
        BOSS_TARGET_MIN_LEFT = currentConfig.phase2MinLeft;
        BOSS_TARGET_MAX_LEFT = currentConfig.phase2MaxLeft;
        BOSS_TARGET_MIN_WIDTH = currentConfig.phase2MinWidth;
        BOSS_TARGET_MAX_WIDTH = currentConfig.phase2MaxWidth;
        randomizeMoveDirection();
        randomizeSizeDirection();
        status.textContent = '[BOSS模式-第二阶段] BOSS进入狂暴状态！判定区变化更快、范围更大！拉力大幅提升！';
        status.style.color = '#d81b60';
    }
    
    isBossPhase2 = isPhase2;
    return isPhase2;
}

/**
 * 子弹时间核心逻辑（不变）
 */
function startBulletTime() {
    if (isBulletTime) return;
    isBulletTime = true;
    
    bulletTimeBeforeTarget.left = targetZoneLeft;
    bulletTimeBeforeTarget.width = targetZoneWidth;
    
    targetZone.classList.add('bullet-time-full');
    targetZone.style.left = '0%';
    targetZone.style.width = '100%';
    orangeFill.classList.add('bullet-time');
    bulletTimeNotice.textContent = `子弹时间！${currentConfig.bulletTimeDur/1000}秒内判定区全满，鱼1.5倍掉血！`;
    bulletTimeNotice.classList.add('show');
    
    const statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}[子弹时间🔥] 判定区全满！鱼1.5倍持续掉血 | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy}`;
    status.textContent = statusText;
    status.style.color = '#ffd700';
    
    clearTimeout(bulletTimeTimer);
    bulletTimeTimer = setTimeout(endBulletTime, currentConfig.bulletTimeDur);
}

function endBulletTime() {
    if (!isBulletTime) return;
    isBulletTime = false;
    
    targetZone.classList.remove('bullet-time-full');
    targetZoneLeft = bulletTimeBeforeTarget.left;
    targetZoneWidth = bulletTimeBeforeTarget.width;
    targetZone.style.left = `${targetZoneLeft}%`;
    targetZone.style.width = `${targetZoneWidth}%`;
    
    orangeFill.classList.remove('bullet-time');
    bulletTimeNotice.classList.remove('show');
    
    const inTargetZone = isInTargetZone();
    status.style.color = inTargetZone ? '#ffffff' : '#f44336';
    
    if (isBossMode) {
        randomizeMoveDirection();
        randomizeSizeDirection();
    }
}

/**
 * ========== 新增：开局保护核心逻辑 ==========
 */
function startStartupProtection() {
    if (isStartupProtection) return;
    isStartupProtection = true;
    
    // 保存保护前的目标区状态
    startupBeforeTarget.left = targetZoneLeft;
    startupBeforeTarget.width = targetZoneWidth;
    
    // 1. 安全区全满（类似子弹时间）
    targetZone.classList.add('bullet-time-full');
    targetZone.style.left = '0%';
    targetZone.style.width = '100%';
    orangeFill.classList.add('bullet-time');
    
    // 2. 拉力条初始化为100
    orangeProgress = 100;
    
    // 3. 提示信息
    bulletTimeNotice.textContent = `开局保护！${currentConfig.startupProtectionDur/1000}秒内安全区全满，拉力条从100缓慢下降！`;
    bulletTimeNotice.classList.add('show');
    
    // 4. 状态栏提示
    const statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}[开局保护🛡️] 安全区全满！拉力条100 | 保护时长: ${currentConfig.startupProtectionDur/1000}秒`;
    status.textContent = statusText;
    status.style.color = '#4CAF50';
    
    // 5. 启动保护定时器，到时间后结束保护
    clearTimeout(startupProtectionTimer);
    startupProtectionTimer = setTimeout(endStartupProtection, currentConfig.startupProtectionDur);
}

function endStartupProtection() {
    if (!isStartupProtection) return;
    isStartupProtection = false;
    
    // 1. 恢复安全区到保护前的状态
    targetZone.classList.remove('bullet-time-full');
    targetZoneLeft = startupBeforeTarget.left;
    targetZoneWidth = startupBeforeTarget.width;
    targetZone.style.left = `${targetZoneLeft}%`;
    targetZone.style.width = `${targetZoneWidth}%`;
    
    // 2. 移除子弹时间样式
    orangeFill.classList.remove('bullet-time');
    bulletTimeNotice.classList.remove('show');
    
    // 3. 提示恢复正常模式
    const statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}开局保护结束！恢复正常溜鱼模式 | 橙色: ${Math.round(orangeProgress)}% | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy}`;
    status.textContent = statusText;
    status.style.color = '#ff9800';
    
    // 4. BOSS模式恢复判定区动态变化
    if (isBossMode) {
        randomizeMoveDirection();
        randomizeSizeDirection();
    }
}

/**
 * BOSS判定区动态更新（修复：确保BOSS第二阶段判定区持续更新）
 */
function updateTargetZone() {
    // 开局保护期间不更新判定区
    if (!isBossMode || isBulletTime || gameOver || isStartupProtection) return; 
    checkBossPhase2(); // 🔥 修复：每次更新都检查阶段，确保第二阶段状态正确
    
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
    if (!isBossMode || gameOver || isStartupProtection) return; // 🔥 新增：开局保护期间不随机方向
    clearTimeout(directionChangeTimer);
    targetMoveDirection = Math.random() > 0.5 ? 1 : -1;
    targetMoveSpeed = getRandomMoveSpeed();
    directionChangeTimer = setTimeout(randomizeMoveDirection, getRandomChangeTime());
}

function randomizeSizeDirection() {
    if (!isBossMode || gameOver || isStartupProtection) return; // 🔥 新增：开局保护期间不随机大小
    clearTimeout(sizeChangeTimer);
    targetSizeDirection = Math.random() > 0.5 ? 1 : -1;
    targetSizeSpeed = getRandomSizeSpeed();
    sizeChangeTimer = setTimeout(randomizeSizeDirection, getRandomChangeTime());
}

function isInTargetZone() {
    const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
    const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
    return orangeProgress >= targetStart && orangeProgress < targetEnd;
}

/**
 * 能量粒子特效（不变）
 */
function getParticleStartPosition() {
    if (!topBar) return { x: 0, y: 0 };
    const topBarRect = topBar.getBoundingClientRect();
    const startX = topBarRect.left + (orangeProgress / 100) * topBarRect.width;
    const startY = topBarRect.top + topBarRect.height / 2;
    return { x: startX, y: startY };
}

function getParticleTargetPosition() {
    const barIndex = Math.min(Math.floor(totalGreenEnergy / currentConfig.barCapacity), greenFills.length - 1);
    const bar = greenFills[barIndex];
    if (!bar) return { x: 0, y: 0 };
    const barRect = bar.parentElement.getBoundingClientRect();
    const fillPercent = parseFloat(bar.style.width) || 0;
    const targetX = barRect.left + (fillPercent / 100) * barRect.width;
    const targetY = barRect.top + barRect.height / 2;
    return { x: targetX, y: targetY };
}

function createParticle() {
    if (!isInTargetZone() || gameOver || !topBar) return;
    
    const startPos = getParticleStartPosition();
    const targetPos = getParticleTargetPosition();
    
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = `${startPos.x}px`;
    particle.style.top = `${startPos.y}px`;
    
    const size = Math.random() * 7 + 4;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = '#00bfa5';
    
    const duration = Math.random() * 1.2 + 0.4;
    particle.style.animationDuration = `${duration}s`;
    particle.style.setProperty('--target-x', targetPos.x - startPos.x);
    particle.style.setProperty('--target-y', targetPos.y - startPos.y);
    particle.style.animationName = 'particle-to-energy';
    
    particleContainer.appendChild(particle);
    setTimeout(() => particle.remove(), duration * 1000);
}

function particleLoop() {
    if (isInTargetZone() && !gameOver && !isCastPhase && !isStabPhase) {
        const baseCount = Math.floor(Math.random() * 1) + 1;
        for (let i = 0; i < baseCount; i++) {
            createParticle();
        }
    }
}

/**
 * 能量条更新（不变）
 */
function updateGreenBarsDisplay() {
    let remainingEnergy = totalGreenEnergy;
    const currentFullBars = Math.floor(totalGreenEnergy / currentConfig.barCapacity);
    
    if (currentFullBars > lastFullBars && !gameOver && !isCastPhase && !isStabPhase) {
        startBulletTime();
    }
    lastFullBars = currentFullBars;
    
    for (let i = 0; i < greenFills.length; i++) {
        const barCapacity = currentConfig.barCapacity;
        const fillValue = Math.min(barCapacity, remainingEnergy);
        const fillPercent = (fillValue / barCapacity) * 100;
        
        greenFills[i].style.width = `${fillPercent}%`;
        greenFills[i].classList.toggle('full', fillPercent >= 100);
        greenEffects[i].classList.toggle('active', fillPercent > 0 && fillPercent < 100);
        
        remainingEnergy -= barCapacity;
        if (remainingEnergy <= 0) break;
    }
    
    for (let i = Math.ceil(totalGreenEnergy / currentConfig.barCapacity); i < greenFills.length; i++) {
        greenFills[i].style.width = '0%';
        greenFills[i].classList.remove('full');
        greenEffects[i].classList.remove('active');
    }
}

/**
 * 技能按钮状态更新（不变）
 */
function updateSkillButtons() {
    if (isCastPhase || isStabPhase) {
        skill1Button.disabled = true;
        skill2Button.disabled = true;
        skill3Button.disabled = true;
        reelButton.disabled = gameOver;
        return;
    }
    const availableFullBars = Math.floor(totalGreenEnergy / currentConfig.barCapacity);
    skill1Button.disabled = availableFullBars < (currentConfig.skill1Cost / currentConfig.barCapacity) || gameOver;
    skill2Button.disabled = availableFullBars < (currentConfig.skill2Cost / currentConfig.barCapacity) || gameOver;
    skill3Button.disabled = availableFullBars < (currentConfig.skill3Cost / currentConfig.barCapacity) || gameOver;
    reelButton.disabled = gameOver;
    
    skill1Button.textContent = `技能1 (${currentConfig.skill1Cost/100}能量)`;
    skill2Button.textContent = `技能2 (恢复${currentConfig.skill2Heal}耐力，${currentConfig.skill2Cost/100}能量)`;
    skill3Button.textContent = `技能3 (${currentConfig.skill3Cost/100}能量)`;
}

/**
 * UI更新（不变）
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
    if (gameOver) return;
    if (fishHealth <= 0) {
        gameOver = true;
        endBulletTime();
        endStartupProtection(); // 新增：游戏结束时关闭开局保护
        clearAllTimers();
        waterSection?.classList.remove('boss-phase2');
        gameOverText.textContent = `恭喜！鱼已被捕获！剩余耐力: ${Math.round(playerStamina)}`;
        gameOverScreen.style.display = 'block';
        status.textContent = `恭喜！鱼已被捕获！点击重置按钮重新开始 | 剩余耐力: ${Math.round(playerStamina)}`;
        status.style.color = '#4caf50';
        updateSkillButtons();
    } else if (playerStamina <= 0) {
        gameOver = true;
        endBulletTime();
        endStartupProtection(); // 新增：游戏结束时关闭开局保护
        clearAllTimers();
        waterSection?.classList.remove('boss-phase2');
        gameOverText.textContent = `游戏失败！你的耐力已耗尽！`;
        gameOverScreen.style.display = 'block';
        status.textContent = `游戏失败！你的耐力已耗尽！点击重置按钮重新开始`;
        status.style.color = '#f44336';
        updateSkillButtons();
    }
}

function clearAllTimers() {
    clearInterval(intervalId);
    clearInterval(stabInterval);
    clearTimeout(bulletTimeTimer);
    clearTimeout(directionChangeTimer);
    clearTimeout(sizeChangeTimer);
    clearTimeout(startupProtectionTimer); // 新增：清除开局保护定时器
    intervalId = null;
    stabInterval = null;
    bulletTimeTimer = null;
    directionChangeTimer = null;
    sizeChangeTimer = null;
    startupProtectionTimer = null;
}

function updateUI() {
    if (gameOver) {
        updateSkillButtons();
        return;
    }
    
    const displayProgress = Math.max(0, Math.min(100, orangeProgress));
    orangeFill.style.width = `${displayProgress}%`;
    orangeFill.style.display = 'block';
    orangeFill.classList.toggle('full-warning', orangeProgress >= 100);
    
    if (isBossMode) updateTargetZone(); // 🔥 修复：确保BOSS模式下判定区持续更新
    
    updateFishHealthUI();
    updatePlayerStaminaUI();
    
    if (!isCastPhase && !isStabPhase) {
        let greenIncrement = isInTargetZone() ? currentConfig.greenFast : currentConfig.greenSlow;
        totalGreenEnergy = Math.max(0, Math.min(currentConfig.maxEnergy, totalGreenEnergy + greenIncrement));
        
        updateGreenBarsDisplay();
        particleLoop();
    }
    
    if (!isBulletTime && !isStartupProtection) { // 新增：开局保护期间不更新普通状态栏
        const inTargetZone = isInTargetZone();
        const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
        const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
        let statusText, statusColor;
        
        if (isCastPhase) {
            statusText = '点击抛竿开始钓鱼！';
            statusColor = '#ffffff';
        } else if (isStabPhase) {
            statusText = '鱼上钩了！找准时机点击刺鱼！';
            statusColor = '#ffffff';
        } else if (orangeProgress >= 100) {
            statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}[警告！] 橙色条已满！耐力掉血翻倍 | 黄色区: ${Math.round(targetStart)}%-${Math.round(targetEnd)}% | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy}`;
            statusColor = '#dc3545';
        } else if (inTargetZone) {
            statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}在黄色区！橙色: ${Math.round(displayProgress)}% | 黄色区: ${Math.round(targetStart)}%-${Math.round(targetEnd)}% | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy}`;
            statusColor = '#ffffff';
        } else {
            statusText = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}不在黄色区！橙色: ${Math.round(displayProgress)}% | 黄色区: ${Math.round(targetStart)}%-${Math.round(targetEnd)}% | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy}`;
            statusColor = '#f44336';
        }
        
        status.textContent = statusText;
        status.style.color = statusColor;
    }
    
    updateSkillButtons();
    checkGameOver();
}

// ===================== 核心修复：主游戏循环（橙色条+耐力逻辑，新增开局保护处理） =====================
function loop() {
    if (isCastPhase || gameOver) return;
    
    // 1. 开局保护阶段的拉力条逻辑
    if (isStartupProtection) {
        // 保护期间：拉力条缓慢下降，按住收线时增加拉力
        orangeProgress -= currentConfig.startupProtectionDec;
        
        if (isHolding && !isStabPhase) { 
            const humanPull = getRandomOrangeValue();
            orangeProgress += humanPull * 1.5; 
        }
    }
    // 2. 普通子弹时间逻辑
    else if (isBulletTime) {
        orangeProgress -= currentConfig.bulletTimeDec; 
        if (isHolding && !isStabPhase) { 
            const humanPull = getRandomOrangeValue();
            orangeProgress += humanPull * 1.5; 
        }
    }
    // 3. 正常溜鱼阶段逻辑
    else {
        // 仅溜鱼阶段执行鱼拉力扣减（核心修改：移除血量相关计算）
        if (!isStabPhase) {
            const fishPull = getCurrentFishPullValue();
            orangeProgress -= fishPull;
        }

        // 按住收线时加人的拉力
        if (isHolding && !isStabPhase) {
            const humanPull = getRandomOrangeValue();
            orangeProgress += humanPull * 1.5; 
        }
    }

    // 🔥 修复：确保进度在0-100之间，避免数值异常导致不动
    orangeProgress = Math.max(0, Math.min(100, orangeProgress));
    
    const displayProgress = Math.max(0, Math.min(100, orangeProgress));
    orangeFill.style.width = `${displayProgress}%`; 

    // 2. 鱼掉血逻辑（仅溜鱼阶段执行）
    if (!isStabPhase && !isCastPhase) {
        const inTargetZone = isInTargetZone();
        if (isBulletTime || isStartupProtection) { // 新增：开局保护期间鱼也1.5倍掉血
            fishHealth -= currentConfig.fishFast * 1.5;
        } else if (inTargetZone) {
            fishHealth -= currentConfig.fishFast;
        } else if (isHolding && !inTargetZone) {
            fishHealth -= currentConfig.fishSlow;
        }
    }

    // 3. 玩家耐力消耗（不变）
    if (isHolding && !isStabPhase && !isCastPhase) { 
        const inTargetZone = isInTargetZone() || isStartupProtection; // 新增：开局保护期间视为在安全区
        if (!inTargetZone) {
            const damageMultiplier = orangeProgress >= 100 ? currentConfig.fullHpMultiplier : 1;
            playerStamina -= PLAYER_DAMAGE * damageMultiplier;
        }
    }

    // 强制更新UI
    updateUI();
}

/**
 * 鱼模式切换（不变）
 */
function switchFishMode(isBoss) {
    isBossMode = isBoss;
    isBossPhase2 = false;
    waterSection?.classList.remove('boss-phase2');
    normalFishBtn.classList.toggle('active', !isBoss);
    bossFishBtn.classList.toggle('active', isBoss);
    
    fishHealthMax = isBoss ? currentConfig.bossFishHealth : currentConfig.normalFishHealth;
    fishHealth = fishHealthMax;
    PLAYER_DAMAGE = currentConfig.playerDamage;
    
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
    
    resetGame();
}

/**
 * 游戏重置（新增：重置开局保护状态）
 */
function resetGame() {
    orangeProgress = 0;
    totalGreenEnergy = 0;
    fishHealth = fishHealthMax;
    playerStamina = playerStaminaMax;
    isHolding = false;
    gameOver = false;
    isBulletTime = false;
    isBossPhase2 = false;
    lastFullBars = 0;
    // 新增：重置开局保护状态
    isStartupProtection = false;
    clearTimeout(startupProtectionTimer);
    
    isStabPhase = false;          
    clearInterval(stabInterval);  
    stabDownCount = 0;            
    stabCursorPosition = 0;       
    if (stabBarSection) {
        stabBarSection.classList.remove('stab-phase-active');
    }
    
    clearAllTimers();
    
    orangeFill.classList.remove('bullet-time', 'full-warning');
    bulletTimeNotice.classList.remove('show');
    orangeFill.style.width = '0%';
    reelButton.classList.remove('holding');
    particleContainer.innerHTML = '';
    
    greenFills.forEach((fill, index) => {
        fill.style.width = '0%';
        fill.classList.remove('full');
    });
    greenEffects.forEach(effect => effect.classList.remove('active'));
    
    const defaultStatus = isBossMode 
        ? `[BOSS模式] 按住收线按钮 | 黄色判定区：动态变化 | 总能量：0/${currentConfig.maxEnergy}`
        : `按住收线按钮 | 黄色判定区：60%（含）-85%（不含） | 总能量：0/${currentConfig.maxEnergy}`;
    status.textContent = defaultStatus;
    status.style.color = '#ffffff';
    
    gameOverScreen.style.display = 'none';
    
    intervalId = setInterval(loop, 60);

    enterCastPhase();
    
    updateUI();
}

/**
 * 技能功能（不变）
 */
function useSkill1() {
    if (gameOver || isCastPhase || isStabPhase) return;
    const availableFullBars = Math.floor(totalGreenEnergy / currentConfig.barCapacity);
    if (availableFullBars < (currentConfig.skill1Cost / currentConfig.barCapacity)) return;
    
    totalGreenEnergy -= currentConfig.skill1Cost;
    fishHealth -= currentConfig.skill1Damage;
    updateGreenBarsDisplay();
    updateFishHealthUI();
    updateSkillButtons();
    checkGameOver();
    status.textContent = `${status.textContent.split('|')[0]} | 技能1！造成${currentConfig.skill1Damage}伤害`;
}

function useSkill2() {
    if (gameOver || isCastPhase || isStabPhase) return;
    const availableFullBars = Math.floor(totalGreenEnergy / currentConfig.barCapacity);
    if (availableFullBars < (currentConfig.skill2Cost / currentConfig.barCapacity)) return;
    
    totalGreenEnergy -= currentConfig.skill2Cost;
    playerStamina = Math.min(playerStaminaMax, playerStamina + currentConfig.skill2Heal);
    updateGreenBarsDisplay();
    updatePlayerStaminaUI();
    updateSkillButtons();
    status.textContent = `${status.textContent.split('|')[0]} | 技能2！恢复${currentConfig.skill2Heal}耐力`;
}

function useSkill3() {
    if (gameOver || isCastPhase || isStabPhase) return;
    const availableFullBars = Math.floor(totalGreenEnergy / currentConfig.barCapacity);
    if (availableFullBars < (currentConfig.skill3Cost / currentConfig.barCapacity)) return;
    
    totalGreenEnergy -= currentConfig.skill3Cost;
    fishHealth -= currentConfig.skill3Damage;
    updateGreenBarsDisplay();
    updateFishHealthUI();
    updateSkillButtons();
    checkGameOver();
    status.textContent = `${status.textContent.split('|')[0]} | 技能3！造成${currentConfig.skill3Damage}伤害`;
}

// ===================== 核心修复：事件监听（收线事件） =====================
const reelEvents = {
    mousedown: (e) => {
        e.preventDefault();
        if (gameOver || isCastPhase || isStabPhase) return;
        isHolding = true;
        reelButton.classList.add('holding');
    },
    mouseup: () => {
        isHolding = false;
        reelButton.classList.remove('holding');
    },
    mouseleave: () => {
        isHolding = false;
        reelButton.classList.remove('holding');
    },
    touchstart: (e) => {
        e.preventDefault();
        if (gameOver || isCastPhase || isStabPhase) return;
        isHolding = true;
        reelButton.classList.add('holding');
    },
    touchend: () => {
        isHolding = false;
        reelButton.classList.remove('holding');
    }
};

// 绑定通用事件
skill1Button.addEventListener('click', useSkill1);
skill2Button.addEventListener('click', useSkill2);
skill3Button.addEventListener('click', useSkill3);
resetButton.addEventListener('click', resetGame);
gameOverResetBtn.addEventListener('click', resetGame);
normalFishBtn.addEventListener('click', () => switchFishMode(false));
bossFishBtn.addEventListener('click', () => switchFishMode(true));

// ===================== 游戏初始化（不变） =====================
function initGame() {
    enterCastPhase();
    resetGame();
}

function enterCastPhase() {
    isCastPhase = true;
    isStabPhase = false;
    
    document.querySelector('.pull-bar-section')?.classList.add('hidden');
    document.querySelector('.fish-health-section')?.classList.add('hidden');
    skill1Button.classList.add('hidden');
    skill2Button.classList.add('hidden');
    skill3Button.classList.add('hidden');
    
    reelButton.disabled = false;
    reelButton.textContent = '抛竿';
    reelButton.removeEventListener('mousedown', reelEvents.mousedown);
    reelButton.removeEventListener('mouseup', reelEvents.mouseup);
    reelButton.removeEventListener('mouseleave', reelEvents.mouseleave);
    reelButton.removeEventListener('touchstart', reelEvents.touchstart);
    reelButton.removeEventListener('touchend', reelEvents.touchend);
    reelButton.onclick = castRod;
    
    status.textContent = '点击抛竿开始钓鱼！';
}

function castRod() {
    if (!isCastPhase || gameOver) return;
    
    reelButton.disabled = true;
    reelButton.textContent = '抛竿中...';
    
    if (waterSection) {
        const castParticle = document.createElement('div');
        castParticle.classList.add('cast-animation');
        castParticle.style.left = `${waterSection.offsetWidth / 2}px`;
        castParticle.style.top = `${waterSection.offsetHeight / 2}px`;
        waterSection.appendChild(castParticle);
        
        setTimeout(() => {
            const splashParticle = document.createElement('div');
            splashParticle.classList.add('splash-animation');
            splashParticle.style.left = `${waterSection.offsetWidth / 2}px`;
            splashParticle.style.top = `${waterSection.offsetHeight / 2}px`;
            splashParticle.style.width = '10px';
            splashParticle.style.height = '10px';
            waterSection.appendChild(splashParticle);
            
            const delay = Math.random() * (currentConfig.castDelayMax - currentConfig.castDelayMin) + currentConfig.castDelayMin;
            setTimeout(() => {
                const approachWave = document.createElement('div');
                approachWave.classList.add('fish-approach-wave');
                approachWave.style.left = `${waterSection.offsetWidth / 2}px`;
                approachWave.style.top = `${waterSection.offsetHeight / 2}px`;
                approachWave.style.width = '10px';
                approachWave.style.height = '10px';
                waterSection.appendChild(approachWave);
                
                enterStabPhase();
                castParticle.remove();
                splashParticle.remove();
                setTimeout(() => approachWave.remove(), 3000);
            }, delay);
        }, 800);
    }
}

// ===================== 核心修复：进入溜鱼阶段（新增：启动开局保护） =====================
function enterFightPhase() {
    isStabPhase = false;
    clearInterval(stabInterval);
    stabDownCount = 0;
    stabCursorPosition = 0;
    
    isCastPhase = false;
    
    document.querySelector('.pull-bar-section')?.classList.remove('hidden');
    document.querySelector('.fish-health-section')?.classList.remove('hidden');
    skill1Button.classList.remove('hidden');
    skill2Button.classList.remove('hidden');
    skill3Button.classList.remove('hidden');
    
    reelButton.disabled = false;
    reelButton.textContent = '收线';
    reelButton.onclick = null;
    
    // 彻底清除旧事件，避免冲突
    reelButton.removeEventListener('mousedown', reelEvents.mousedown);
    reelButton.removeEventListener('mouseup', reelEvents.mouseup);
    reelButton.removeEventListener('mouseleave', reelEvents.mouseleave);
    reelButton.removeEventListener('touchstart', reelEvents.touchstart);
    reelButton.removeEventListener('touchend', reelEvents.touchend);
    
    // 强制重新绑定收线事件
    setTimeout(() => {
        reelButton.addEventListener('mousedown', reelEvents.mousedown);
        reelButton.addEventListener('mouseup', reelEvents.mouseup);
        reelButton.addEventListener('mouseleave', reelEvents.mouseleave);
        reelButton.addEventListener('touchstart', reelEvents.touchstart);
        reelButton.addEventListener('touchend', reelEvents.touchend);
    }, 0);
    
    // ========== 新增：启动开局保护 ==========
    startStartupProtection();
    
    // 确保loop定时器100%运行
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(loop, 60);
    
    if (isBossMode) {
        randomizeMoveDirection();
        randomizeSizeDirection();
    }
}

// ===================== 核心修复：刺鱼阶段（游标立即停止+伤害显示） =====================
function enterStabPhase() {
    isCastPhase = false;
    isStabPhase = true;
    
    document.querySelector('.pull-bar-section')?.classList.add('hidden');
    document.querySelector('.fish-health-section')?.classList.add('hidden');
    skill1Button.classList.add('hidden');
    skill2Button.classList.add('hidden');
    skill3Button.classList.add('hidden');
    stabBarSection?.classList.add('stab-phase-active');
    
    reelButton.disabled = false;
    reelButton.textContent = '刺鱼';
    reelButton.onclick = stabFish;
    
    stabCursorPosition = 0;
    stabDownCount = 0;
    updateStabCursorPosition();
    
    const totalCycleDuration = currentConfig.stabDownDuration + currentConfig.stabStayDuration + currentConfig.stabUpDuration;
    stabInterval = setInterval(runStabCursorAnimation, totalCycleDuration);
    
    status.textContent = '鱼上钩了！找准时机点击刺鱼！';
}

function updateStabCursorPosition() {
    if (!stabBarSection || !stabCursor) return;
    const barHeight = stabBarSection.offsetHeight;
    const cursorHeight = stabCursor.offsetHeight;
    const topValue = (stabCursorPosition / 100) * (barHeight - cursorHeight);
    stabCursor.style.top = `${topValue}px`;
}

function runStabCursorAnimation() {
    if (!isStabPhase || gameOver || !stabCursor) return;
    
    if (stabDownCount >= currentConfig.stabDownMaxCount) {
        clearInterval(stabInterval);
        let minPos;
        if (stabDownCount <= 2) {
            minPos = currentConfig.stabRange1_2[0];
        } else if (stabDownCount <= 5) {
            minPos = currentConfig.stabRange3_5[0];
        } else {
            minPos = currentConfig.stabRange6_10[0];
        }
        stabCursorPosition = minPos;
        updateStabCursorPosition();
        setTimeout(() => {
            if (isStabPhase && !gameOver) {
                stabFish();
                status.textContent = '未及时刺鱼！自动刺鱼（最小力度）';
            }
        }, 200);
        return;
    }
    
    let randomMin, randomMax;
    stabDownCount++;
    if (stabDownCount <= 2) {
        [randomMin, randomMax] = currentConfig.stabRange1_2;
    } else if (stabDownCount <= 5) {
        [randomMin, randomMax] = currentConfig.stabRange3_5;
    } else {
        [randomMin, randomMax] = currentConfig.stabRange6_10;
    }
    const randomPos = Math.random() * (randomMax - randomMin) + randomMin;
    
    stabCursor.style.transition = 'none';
    setTimeout(() => {
        stabCursor.style.transition = `top ${currentConfig.stabDownDuration / 1000}s ease`;
        stabCursorPosition = randomPos;
        updateStabCursorPosition();
    }, 10);
    
    setTimeout(() => {
        if (isStabPhase && !gameOver && stabCursor) {
            stabCursor.style.transition = 'none';
            setTimeout(() => {
                stabCursor.style.transition = `top ${currentConfig.stabUpDuration / 1000}s ease`;
                stabCursorPosition = 0;
                updateStabCursorPosition();
            }, 10);
        }
    }, currentConfig.stabStayDuration);
}

// ===================== 核心修复：刺鱼函数（游标停止+伤害显示） =====================
function stabFish() {
    if (!isStabPhase || gameOver) return;
    
    // 1. 强制停止所有刺鱼定时器
    clearInterval(stabInterval);
    stabInterval = null;
    
    // 2. 立即停止游标动画（清除过渡效果，固定当前位置）
    if (stabCursor) {
        stabCursor.style.transition = 'none';
        updateStabCursorPosition();
    }
    
    // 3. 计算刺鱼伤害
    const baseDamagePercent = 5;
    const extraDamagePercent = stabCursorPosition / 10;
    const totalDamagePercent = baseDamagePercent + extraDamagePercent;
    const damage = Math.round((totalDamagePercent / 100) * fishHealthMax);
    
    // 4. 应用伤害
    fishHealth = Math.max(0, fishHealth - damage);
    updateFishHealthUI();
    
    // 5. 显示伤害数值
    damagePopup.style.display = 'block';
    damagePopup.textContent = `刺鱼伤害：${damage} (${totalDamagePercent.toFixed(1)}%)`;
    setTimeout(() => {
        damagePopup.style.display = 'none';
    }, 1000);
    
    // 6. 状态栏显示
    status.textContent = `刺鱼成功！造成${totalDamagePercent.toFixed(1)}%伤害（${damage}点），进入溜鱼阶段...`;
    status.style.color = '#ff4757';
    
    // 7. 更新按钮状态
    reelButton.disabled = true;
    reelButton.textContent = `刺鱼！伤害${damage}`;
    
    // 8. 1秒后进入溜鱼阶段
    setTimeout(() => {
        stabBarSection?.classList.remove('stab-phase-active');
        enterFightPhase();
        updateUI();
    }, 1000);
}

// 启动游戏
window.addEventListener('load', initGame);