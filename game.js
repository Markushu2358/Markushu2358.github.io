// ===================== 全局DOM元素获取（只获取一次，避免重复） =====================
const orangeFill = document.getElementById('orangeFill');
const particleContainer = document.getElementById('particleContainer');
const fishSplashContainer = document.getElementById('fishSplashContainer'); // 新增水花容器
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
const directionText = document.getElementById('directionText'); // 移除playerIcon后只保留方向文字
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverText = document.getElementById('gameOverText');
const gameOverResetBtn = document.getElementById('gameOverResetBtn');
// 关键新增：获取水域区域DOM元素
const waterSection = document.querySelector('.water-section');

// ===================== 游戏配置（统一管理，避免硬编码） =====================
const DEFAULT_CONFIG = {
    playerStamina: 1500,
    normalFishHealth: 10000,
    bossFishHealth: 20000,
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
    fishSlow: 4,           // 鱼掉血速度（非判定区）
    fishFast: 25,          // 鱼掉血速度（判定区）
    skill1Cost: 100,
    skill1Damage: 1000,
    skill2Cost: 100,
    skill2Heal: 200,
    skill3Cost: 300,
    skill3Damage: 4000,
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
    playerNormalDownRate: 1.0,
    fishPullSpeedNormal: 2,// 普通鱼拉力速度
    fishPullSpeedBoss: 3,  // BOSS鱼拉力速度
    // 新增水花特效配置
    splashParticleCount: 5, // 每次生成的水花粒子数量
    splashInterval: 300     // 水花生成间隔（ms）
};

// ===================== 全局状态变量（统一初始化，避免重复定义） =====================
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
let fishDirection = 1; // 1=右，-1=左（统一用数字，避免字符串/数字混用）
let fishDirectionTimer = null;
let isDragging = false;
let dragStartX = 0;
let dragDirection = 0;
let playerDirection = 1; // 1=右，-1=左
let currentFishType = 'normal'; // normal/boss
let splashTimer = null; // 水花特效定时器

// ===================== 基础常量（统一定义） =====================
const BASE_TARGET_START = 60;
const BASE_TARGET_END = 85;
const BASE_TARGET_CENTER = (BASE_TARGET_START + BASE_TARGET_END) / 2;
let BOSS_TARGET_MIN_LEFT = 40;
let BOSS_TARGET_MAX_LEFT = 90;
let BOSS_TARGET_MIN_WIDTH = 10;
let BOSS_TARGET_MAX_WIDTH = 25;

// ===================== 玩家朝向核心功能 =====================
function updatePlayerDirectionDisplay() {
    directionText.textContent = playerDirection === 1 ? '朝右' : '朝左';
}

function setPlayerDirection(direction) {
    if (direction === 1 || direction === -1) {
        playerDirection = direction;
        updatePlayerDirectionDisplay();
    }
}

// ===================== 鱼方向切换功能 =====================
function getRandomFishDirChangeTime() {
    return Math.random() * (currentConfig.fishDirChangeMax - currentConfig.fishDirChangeMin) + currentConfig.fishDirChangeMin;
}

function switchFishDirection() {
    if (gameOver) return;
    fishDirection = fishDirection === 1 ? -1 : 1;
    if (fishDirection === 1) {
        fishIcon.classList.remove('left');
        fishDirectionText.textContent = '鱼游动方向：右';
    } else {
        fishIcon.classList.add('left');
        fishDirectionText.textContent = '鱼游动方向：左';
    }
    clearTimeout(fishDirectionTimer);
    fishDirectionTimer = setTimeout(switchFishDirection, getRandomFishDirChangeTime());
}

function initFishDirectionTimer() {
    clearTimeout(fishDirectionTimer);
    fishDirectionTimer = setTimeout(switchFishDirection, getRandomFishDirChangeTime());
}

// ===================== 拖动交互功能（移动端优化） =====================
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

// ===================== 拉力条居中逻辑 =====================
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

// ===================== 能量粒子特效 =====================
/**
 * 获取粒子起点：橙色拉力条当前进度的末端位置（绝对坐标）
 */
function getParticleStartPosition() {
    const topBarRect = document.querySelector('.top-bar').getBoundingClientRect();
    // 橙色条末端X坐标 = 拉力条左侧 + 橙色条进度百分比 * 拉力条宽度
    const startX = topBarRect.left + (orangeProgress / 100) * topBarRect.width;
    const startY = topBarRect.top + topBarRect.height / 2; // 拉力条垂直居中
    return { x: startX, y: startY };
}

/**
 * 获取粒子终点：对应能量条的当前进度末端位置（绝对坐标）
 * - 不到1格：第一个能量条当前进度的末端
 * - 1-2格：第二个能量条当前进度的末端
 * - 2格以上：第三个能量条当前进度的末端
 */
function getParticleTargetPosition() {
    // 计算当前能量分布在第几个格子
    const barIndex = Math.min(Math.floor(totalGreenEnergy / currentConfig.barCapacity), greenFills.length - 1);
    const bar = greenFills[barIndex];
    const barRect = bar.parentElement.getBoundingClientRect();
    
    // 计算当前格子的填充百分比（0-100）
    const fillPercent = parseFloat(bar.style.width) || 0;
    // 粒子终点X = 能量条左侧 + 填充百分比 * 能量条宽度
    const targetX = barRect.left + (fillPercent / 100) * barRect.width;
    const targetY = barRect.top + barRect.height / 2; // 能量条垂直居中
    return { x: targetX, y: targetY };
}

function createParticle() {
    if (!isInTargetZone() || gameOver) return;
    
    // 获取起点和终点
    const startPos = getParticleStartPosition();
    const targetPos = getParticleTargetPosition();
    
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // 设置粒子起始位置（绝对坐标）
    particle.style.left = `${startPos.x}px`;
    particle.style.top = `${startPos.y}px`;
    
    // 粒子尺寸
    const size = Math.random() * 5 + 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    const duration = Math.random() * 1.2 + 0.4;
    particle.style.animationDuration = `${duration}s`;
    
    // 计算粒子目标偏移量（终点 - 起点）
    particle.style.setProperty('--target-x', targetPos.x - startPos.x);
    particle.style.setProperty('--target-y', targetPos.y - startPos.y);
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

function particleLoop() {
    if (isInTargetZone() && !gameOver) {
        const baseCount = Math.floor(Math.random() * 1) + 1;
        const particleCount = isDragDirectionCorrect() ? Math.floor(baseCount * 1.5) : baseCount;
        for (let i = 0; i < particleCount; i++) {
            createParticle();
        }
    }
}

// ===================== 鱼水花特效（新增核心功能） =====================
/**
 * 获取鱼尾巴的位置（绝对坐标）
 */
function getFishTailPosition() {
    const fishIconRect = fishIcon.getBoundingClientRect();
    let tailX, tailY;
    
    if (fishDirection === 1) { // 鱼朝右，尾巴在左侧
        tailX = fishIconRect.left - 10; // 尾巴在鱼图标左侧10px
        tailY = fishIconRect.top + fishIconRect.height / 2;
    } else { // 鱼朝左，尾巴在右侧
        tailX = fishIconRect.right + 10; // 尾巴在鱼图标右侧10px
        tailY = fishIconRect.top + fishIconRect.height / 2;
    }
    
    return { x: tailX, y: tailY };
}

/**
 * 创建鱼水花粒子
 */
function createFishSplashParticle() {
    if (gameOver) return;
    
    const tailPos = getFishTailPosition();
    const particle = document.createElement('div');
    particle.classList.add('fish-splash-particle');
    
    // 设置粒子起始位置（鱼尾巴位置）
    particle.style.left = `${tailPos.x}px`;
    particle.style.top = `${tailPos.y}px`;
    
    // 随机粒子尺寸（4-8px）
    const size = Math.random() * 4 + 4;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // 随机动画时长（0.8-1.5s）
    const duration = Math.random() * 0.7 + 0.8;
    particle.style.animationDuration = `${duration}s`;
    
    // 根据鱼方向设置动画
	if (fishDirection === 1) {
    // 鱼朝右 → 尾巴在左 → 粒子向左飘（绑定left动画）
    particle.style.animationName = 'fishSplashLeft';
	} else {
    // 鱼朝左 → 尾巴在右 → 粒子向右飘（绑定right动画）
    particle.style.animationName = 'fishSplashRight';
	}
    
    // 随机偏移，让粒子更自然
    particle.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px) scale(0)`;
    
    fishSplashContainer.appendChild(particle);
    
    // 动画结束后移除粒子
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}

/**
 * 启动鱼水花特效循环
 */
function startFishSplashLoop() {
    clearInterval(splashTimer);
    if (gameOver) return;
    
    splashTimer = setInterval(() => {
        // 核心修改：移除 isInTargetZone() 限制 → 一直生成水花粒子
        // 仅保留 gameOver 判断，避免游戏结束后还生成
        for (let i = 0; i < currentConfig.splashParticleCount; i++) {
            createFishSplashParticle();
        }
    }, currentConfig.splashInterval);
}

/**
 * 停止鱼水花特效
 */
function stopFishSplashLoop() {
    clearInterval(splashTimer);
    // 清空剩余的水花粒子
    fishSplashContainer.innerHTML = '';
}

// ===================== 核心数值计算 =====================
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

// ===================== BOSS阶段判断（新增背景切换逻辑） =====================
function checkBossPhase2() {
    if (!isBossMode) {
        // 非BOSS模式，移除第二阶段样式
        if (waterSection) waterSection.classList.remove('boss-phase2');
        return false;
    }
    
    const currentHpPercent = (fishHealth / fishHealthMax) * 100;
    const isPhase2 = currentHpPercent <= currentConfig.bossPhase2Hp;
    
    // 核心新增：切换水域背景样式
    if (waterSection) {
        if (isPhase2) {
            waterSection.classList.add('boss-phase2');
        } else {
            waterSection.classList.remove('boss-phase2');
        }
    }
    
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

// ===================== 子弹时间功能 =====================
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

// ===================== BOSS判定区动态更新 =====================
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

// ===================== 能量条更新 =====================
function updateGreenBarsDisplay() {
    let remainingEnergy = totalGreenEnergy;
    const currentFullBars = getAvailableFullBars();
    if (currentFullBars > lastFullBars && !gameOver) {
        startBulletTime();
    }
    lastFullBars = currentFullBars;
    
    // 横向能量条：使用width（修正之前的height错误）
    for (let i = 0; i < greenFills.length; i++) {
        const barCapacity = currentConfig.barCapacity;
        const fillValue = Math.min(barCapacity, remainingEnergy);
        const fillPercent = (fillValue / barCapacity) * 100;
        
        // 更新能量条填充宽度
        greenFills[i].style.width = `${fillPercent}%`;
        
        // 更新能量条文字
        if (greenBarTexts[i]) {
            greenBarTexts[i].textContent = `${Math.round(fillValue)}/${barCapacity}`;
        }
        
        // 高亮满格能量条
        if (fillPercent >= 100) {
            greenFills[i].classList.add('full');
        } else {
            greenFills[i].classList.remove('full');
        }
        
        // 能量条流动特效
        if (fillPercent > 0 && fillPercent < 100 && remainingEnergy > 0) {
            greenEffects[i].classList.add('active');
        } else {
            greenEffects[i].classList.remove('active');
        }
        
        remainingEnergy -= barCapacity;
        if (remainingEnergy <= 0) break;
    }
    
    // 清空剩余能量条
    for (let i = Math.ceil(totalGreenEnergy / currentConfig.barCapacity); i < greenFills.length; i++) {
        greenFills[i].style.width = '0%';
        if (greenBarTexts[i]) {
            greenBarTexts[i].textContent = '0/100';
        }
        greenFills[i].classList.remove('full');
        greenEffects[i].classList.remove('active');
    }
}

function getAvailableFullBars() {
    return Math.floor(totalGreenEnergy / currentConfig.barCapacity);
}

// ===================== 技能按钮状态更新 =====================
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

// ===================== UI更新 =====================
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

// ===================== 游戏结束判断 =====================
function checkGameOver() {
    if (fishHealth <= 0) {
        gameOver = true;
        endBulletTime();
        stopFishSplashLoop(); // 停止水花特效
        // 游戏结束时恢复水域默认背景
        if (waterSection) waterSection.classList.remove('boss-phase2');
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
        stopFishSplashLoop(); // 停止水花特效
        // 游戏结束时恢复水域默认背景
        if (waterSection) waterSection.classList.remove('boss-phase2');
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

// ===================== 主UI更新循环 =====================
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
    let greenIncrement = inTargetZone ? currentConfig.greenFast : currentConfig.greenSlow;
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
        // 放大状态文字内容的字号（通过CSS实现，这里保证内容完整）
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

// ===================== 主游戏循环（核心机制修改：鱼掉血逻辑） =====================
function loop() {
    if (gameOver) return;
    
    // 1. 处理橙色条增减
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

    // 2. 鱼掉血逻辑修改：只要在黄色判定区，鱼就掉血（无论是否收线）
    const inTargetZone = isInTargetZone();
    if (inTargetZone) {
        // 在判定区，鱼持续掉血（fast速度）
        fishHealth -= currentConfig.fishFast * (isBulletTime ? 1.5 : 1); // 子弹时间掉血翻倍
    } else if (isHolding && !inTargetZone) {
        // 不在判定区但收线，鱼少量掉血（slow速度）
        fishHealth -= currentConfig.fishSlow;
    }

    // 3. 玩家耐力消耗逻辑（保持不变）
    if (isHolding && !inTargetZone) {
        const damageMultiplier = orangeProgress >= 100 ? currentConfig.fullHpMultiplier : 1;
        const directionPenalty = (dragDirection !== 0 && !isDragDirectionCorrect()) ? 1.5 : 1;
        playerStamina -= PLAYER_DAMAGE * damageMultiplier * directionPenalty;
    }

    // 4. 更新UI和特效
    updateUI();
}

// ===================== 鱼模式切换（整合逻辑，避免冲突） =====================
function switchFishMode(isBoss) {
    isBossMode = isBoss;
    currentFishType = isBoss ? 'boss' : 'normal';
    isBossPhase2 = false;
    // 切换鱼模式时恢复水域默认背景
    if (waterSection) waterSection.classList.remove('boss-phase2');
    normalFishBtn.classList.toggle('active', !isBoss);
    bossFishBtn.classList.toggle('active', isBoss);
    
    // 重置鱼参数
    fishHealthMax = isBoss ? currentConfig.bossFishHealth : currentConfig.normalFishHealth;
    fishHealth = fishHealthMax;
    fishDirection = isBoss ? -1 : 1; // BOSS初始向左，普通鱼初始向右
    fishIcon.classList.toggle('left', isBoss);
    fishDirectionText.textContent = `鱼游动方向：${fishDirection === 1 ? '右' : '左'}`;
    
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
        targetZoneWidth = BASE_TARGET_END - BASE_TARGET_START;
        targetZone.style.left = `${BASE_TARGET_START}%`;
        targetZone.style.width = `${25}%`;
        clearTimeout(directionChangeTimer);
        clearTimeout(sizeChangeTimer);
    }
    
    // 重置游戏状态
    resetGame();
}

// ===================== 游戏重置（统一逻辑，移除重复定义） =====================
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
    
    // 重置时恢复水域默认背景
    if (waterSection) waterSection.classList.remove('boss-phase2');
    
    // 计时器清空
    clearTimeout(bulletTimeTimer);
    clearTimeout(fishDirectionTimer);
    clearTimeout(directionChangeTimer);
    clearTimeout(sizeChangeTimer);
    stopFishSplashLoop(); // 停止旧的水花循环
    
    // UI重置
    orangeFill.classList.remove('bullet-time', 'full-warning');
    bulletTimeNotice.classList.remove('show');
    orangeFill.style.width = '0%';
    reelButton.classList.remove('dragging', 'correct-direction');
    fishIcon.classList.toggle('left', fishDirection === -1);
    updatePlayerDirectionDisplay();
    particleContainer.innerHTML = '';
    fishSplashContainer.innerHTML = ''; // 清空水花粒子
    
    // 能量条重置（包含文字）
    greenFills.forEach((fill, index) => {
        fill.style.width = '0%';
        fill.classList.remove('full');
        if (greenBarTexts[index]) {
            greenBarTexts[index].textContent = '0/100';
        }
    });
    greenEffects.forEach(effect => effect.classList.remove('active'));
    
    // 状态文本重置（放大适配）
    const defaultStatus = isBossMode 
        ? `[BOSS模式] 按住并拖动收线按钮 | 黄色判定区：动态变化 | 总能量：0/${currentConfig.maxEnergy}`
        : `按住并拖动收线按钮 | 黄色判定区：60%（含）-85%（不含） | 总能量：0/${currentConfig.maxEnergy}`;
    status.textContent = defaultStatus;
    status.style.color = '#ffffff'; // 适配水域背景的白色
    status.classList.remove('correct', 'wrong');
    
    // 隐藏游戏结束弹窗
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    
    // 重新初始化定时器
    initFishDirectionTimer();
    startFishSplashLoop(); // 启动水花特效循环
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(loop, 60);
    
    // 更新UI
    updateUI();
}

// ===================== 技能功能 =====================
function useSkill1() {
    if (gameOver || getAvailableFullBars() < (currentConfig.skill1Cost / currentConfig.barCapacity)) return;
    totalGreenEnergy -= currentConfig.skill1Cost;
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
    fishHealth -= currentConfig.skill3Damage;
    updateGreenBarsDisplay();
    updateFishHealthUI();
    updateSkillButtons();
    checkGameOver();
    status.textContent = `${status.textContent.split('|')[0]} | 技能3！造成${currentConfig.skill3Damage}高额伤害`;
}

// ===================== 事件绑定（优化移动端点击） =====================
function bindEvents() {
    // 鼠标/触摸拖动事件（收线按钮）
    reelButton.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('mouseleave', handleDragEnd);
    // 收线按钮的touch事件设置passive: false（需要阻止默认行为）
    reelButton.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    document.addEventListener('touchcancel', handleDragEnd);
    
    // 其他按钮的点击事件（优化移动端响应）
    resetButton.addEventListener('click', resetGame);
    if (gameOverResetBtn) gameOverResetBtn.addEventListener('click', resetGame);
    
    skill1Button.addEventListener('click', useSkill1);
    skill2Button.addEventListener('click', useSkill2);
    skill3Button.addEventListener('click', useSkill3);
    
    normalFishBtn.addEventListener('click', () => switchFishMode(false));
    bossFishBtn.addEventListener('click', () => switchFishMode(true));
    
    // 额外：给移动端按钮添加touchstart事件（增强点击响应）
    skill1Button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        useSkill1();
    }, { passive: false });
    skill2Button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        useSkill2();
    }, { passive: false });
    skill3Button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        useSkill3();
    }, { passive: false });
    resetButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        resetGame();
    }, { passive: false });
    normalFishBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        switchFishMode(false);
    }, { passive: false });
    bossFishBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        switchFishMode(true);
    }, { passive: false });
    if (gameOverResetBtn) {
        gameOverResetBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            resetGame();
        }, { passive: false });
    }
}

// ===================== 初始化游戏 =====================
function initGame() {
    // 初始化鱼方向
    fishIcon.classList.remove('left');
    fishDirectionText.textContent = '鱼游动方向：右';
    initFishDirectionTimer();
    
    // 绑定事件
    bindEvents();
    
    // 初始化判定区
    targetZone.style.left = `${BASE_TARGET_START}%`;
    targetZone.style.width = `${25}%`;
    
    // 启动水花特效循环
    startFishSplashLoop();
    
    // 启动游戏循环
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(loop, 60);
    
    // 初始UI更新
    updateUI();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initGame);