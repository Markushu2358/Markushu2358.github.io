// 获取DOM元素
const orangeFill = document.getElementById('orangeFill');
const particleContainer = document.getElementById('particleContainer');
const targetZone = document.getElementById('targetZone'); // 判定区域DOM
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
const skill2Button = document.getElementById('skill2Button'); // 新增技能2
const skill3Button = document.getElementById('skill3Button');
const status = document.getElementById('status');
const playerStaminaFill = document.getElementById('playerStaminaFill');
const playerStaminaText = document.getElementById('playerStaminaText');
const normalFishBtn = document.getElementById('normalFishBtn');
const bossFishBtn = document.getElementById('bossFishBtn');
const bulletTimeNotice = document.getElementById('bulletTimeNotice');
// 玩家朝向相关元素
const playerIcon = document.getElementById('playerIcon');
const directionText = document.getElementById('directionText');

// 游戏配置（完全保留你原始的数值，未做任何修改）
const DEFAULT_CONFIG = {
    playerStamina: 2000,     // 玩家耐力（原血量）
    normalFishHealth: 3000,
    bossFishHealth: 5000,
    playerDamage: 10,
    fullHpMultiplier: 2,
    orangeMin: 3,
    orangeMax: 10,
    orangeSlowMin: 1,
    orangeSlowMax: 5,
    bulletTimeDec: 1,
    greenSlow: 0.05,
    greenFast: 2.0,
    barCapacity: 100,
    maxEnergy: 300,
    fishSlow: 5,
    fishFast: 30,
    skill1Cost: 100,
    skill1Damage: 50,
    skill2Cost: 100,  // 技能2消耗
    skill2Heal: 200,   // 技能2恢复耐力
    skill3Cost: 300,
    skill3Damage: 300,
    moveSpeedMin: 0.04, // BOSS移动速度
    moveSpeedMax: 0.10,
    sizeSpeedMin: 0.02, // BOSS缩放速度
    sizeSpeedMax: 0.06,
    dirChangeMin: 500,  // 0.5秒最小变换时间
    dirChangeMax: 1000, // 1秒最大变换时间
    bossPhase2Hp: 50,   // BOSS二阶段血量阈值(%)
    phase2MoveMulti: 2, // 二阶段移动速度倍率
    phase2SizeMulti: 2, // 二阶段缩放速度倍率
    phase2MinLeft: 20,  // 二阶段最小左边界
    phase2MaxLeft: 95,  // 二阶段最大左边界
    phase2MinWidth: 5,  // 二阶段最小宽度
    phase2MaxWidth: 50, // 二阶段最大宽度
    bulletTimeDur: 1000, // 子弹时间时长(ms)
    fishDirChangeMin: 2000, // 鱼方向切换最小时间(ms)
    fishDirChangeMax: 4000, // 鱼方向切换最大时间(ms)
    correctDirectionBonus: 0.5, // 正确方向拖动的拉力条减速 Bonus
    wrongDirectionPenalty: 0.5, // 错误方向拖动的拉力条加速 Penalty
    centerPullStrength: 3, // 正确方向时向判定区中心靠拢的强度
    correctEnergyMultiplier: 3, // 正确方向时能量积累倍率（原1.5倍）
    // 新增：玩家朝向相关配置
    playerSlowDownRate: 0.5, // 朝向相反时拉力条下降速度倍率（缓慢）
    playerNormalDownRate: 1.0 // 朝向相同时拉力条下降速度倍率（原速）
};

// 当前配置（完全复制默认配置，不做任何修改）
const currentConfig = { ...DEFAULT_CONFIG };

// 核心状态
let orangeProgress = 0;        // 橙色条进度 0-100
let totalGreenEnergy = 0;      // 绿色条总能量（0-300）
let fishHealth = currentConfig.normalFishHealth;         // 鱼血量
let fishHealthMax = currentConfig.normalFishHealth;      // 鱼血量最大值
let playerStamina = currentConfig.playerStamina;       // 玩家耐力（原血量）
let playerStaminaMax = currentConfig.playerStamina;    // 玩家耐力最大值
let PLAYER_DAMAGE = currentConfig.playerDamage;      // 玩家每次掉耐力量
let isHolding = false;         // 是否按住收线
let intervalId = null;         // 主循环定时器
let gameOver = false;          // 游戏结束标记
let isBossMode = false;        // 是否BOSS鱼模式
let isBossPhase2 = false;      // BOSS是否进入第二阶段
// BOSS模式相关状态
let targetZoneLeft = 60;       // 判定区域左边界（百分比）
let targetZoneWidth = 25;      // 判定区域宽度（百分比）
let targetMoveDirection = 1;   // 判定区域移动方向：1=右，-1=左
let targetMoveSpeed = 0;       // 判定区域移动速度（百分比/帧）
let targetSizeDirection = 1;   // 判定区域缩放方向：1=变大，-1=变小
let targetSizeSpeed = 0;       // 判定区域缩放速度（百分比/帧）
let directionChangeTimer = null; // 方向变换定时器
let sizeChangeTimer = null;    // 大小变换定时器
// 子弹时间相关状态
let isBulletTime = false;      // 是否处于子弹时间
let bulletTimeTimer = null;    // 子弹时间定时器
let lastFullBars = 0;          // 上一次填满的能量条数量
// 摆杆玩法相关状态
let fishDirection = 1;         // 鱼游动方向：1=右，-1=左
let fishDirectionTimer = null; // 鱼方向切换定时器
let isDragging = false;        // 是否正在拖动收线按钮
let dragStartX = 0;            // 拖动起始X坐标
let dragDirection = 0;         // 拖动方向：1=右，-1=左，0=无
// 玩家朝向相关状态
let playerDirection = 1;       // 玩家朝向：1=右，-1=左

// 基础判定区域范围（普通鱼）
const BASE_TARGET_START = 60;
const BASE_TARGET_END = 85;
const BASE_TARGET_CENTER = (BASE_TARGET_START + BASE_TARGET_END) / 2; // 判定区中心值
// BOSS模式判定区域限制
let BOSS_TARGET_MIN_LEFT = 40;    // 最小左边界
let BOSS_TARGET_MAX_LEFT = 90;    // 最大左边界
let BOSS_TARGET_MIN_WIDTH = 10;   // 最小宽度
let BOSS_TARGET_MAX_WIDTH = 25;   // 最大宽度

// 数值配置（完全从currentConfig读取原始值）
const GREEN_SLOW = currentConfig.greenSlow;       // 不在判定区时绿色条增长速度
const GREEN_FAST = currentConfig.greenFast;        // 在判定区时绿色条增长速度
const FISH_HEALTH_SLOW = currentConfig.fishSlow;    // 非判定区鱼掉血速度
const FISH_HEALTH_FAST = currentConfig.fishFast;   // 判定区鱼掉血速度
const BULLET_TIME_DECREASE = currentConfig.bulletTimeDec; // 子弹时间内橙色条减少量
const BULLET_TIME_DURATION = currentConfig.bulletTimeDur;  // 子弹时间持续时间

// ===================== 玩家朝向核心功能 =====================
// 更新玩家朝向显示
function updatePlayerDirectionDisplay() {
    if (playerDirection === 1) {
        playerIcon.classList.remove('left');
        directionText.textContent = '朝右';
    } else {
        playerIcon.classList.add('left');
        directionText.textContent = '朝左';
    }
}

// 设置玩家朝向
function setPlayerDirection(direction) {
    if (direction === 1 || direction === -1) {
        playerDirection = direction;
        updatePlayerDirectionDisplay();
    }
}

// ===================== 摆杆玩法核心功能 =====================
// 生成鱼方向切换的随机时间（2-4秒）
function getRandomFishDirChangeTime() {
    return Math.random() * (currentConfig.fishDirChangeMax - currentConfig.fishDirChangeMin) + currentConfig.fishDirChangeMin;
}

// 切换鱼的游动方向
function switchFishDirection() {
    if (gameOver) return;
    
    // 切换方向：1 <-> -1
    fishDirection = fishDirection === 1 ? -1 : 1;
    
    // 更新UI显示（仅图标，不显示文字）
    if (fishDirection === 1) {
        fishIcon.classList.remove('left');
    } else {
        fishIcon.classList.add('left');
    }
    
    // 设置下一次方向切换
    clearTimeout(fishDirectionTimer);
    fishDirectionTimer = setTimeout(switchFishDirection, getRandomFishDirChangeTime());
}

// 初始化鱼方向切换定时器
function initFishDirectionTimer() {
    clearTimeout(fishDirectionTimer);
    fishDirectionTimer = setTimeout(switchFishDirection, getRandomFishDirChangeTime());
}

// 处理拖动开始
function handleDragStart(e) {
    e.preventDefault();
    if (gameOver) return;
    
    isDragging = true;
    isHolding = true;
    reelButton.classList.add('dragging');
    
    // 获取起始坐标（兼容鼠标和触摸）
    dragStartX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
}

// 处理拖动移动
function handleDragMove(e) {
    e.preventDefault();
    if (!isDragging || gameOver) return;
    
    // 获取当前坐标（兼容鼠标和触摸）
    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - dragStartX;
    
    // 确定拖动方向（增大阈值，避免手机误触）
    if (deltaX > 30) { // 手机端增大拖动阈值到30px
        dragDirection = 1;
        setPlayerDirection(1); // 设置玩家朝右
    } else if (deltaX < -30) {
        dragDirection = -1;
        setPlayerDirection(-1); // 设置玩家朝左
    } else {
        dragDirection = 0;
    }
    
    // 方向正确时添加特效
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

// 处理拖动结束
function handleDragEnd(e) {
    e.preventDefault();
    if (!isDragging) return;
    
    isDragging = false;
    isHolding = false;
    reelButton.classList.remove('dragging', 'correct-direction');
    dragDirection = 0;
    
    // 重置状态样式
    status.classList.remove('correct', 'wrong');
}

// 检查拖动方向是否正确（与鱼游动方向相反）
function isDragDirectionCorrect() {
    return dragDirection === -fishDirection && dragDirection !== 0;
}

// 计算判定区中心值
function getTargetCenter() {
    if (isBossMode) {
        return targetZoneLeft + (targetZoneWidth / 2);
    }
    return BASE_TARGET_CENTER;
}

// 拉力条向判定区中心靠拢
function pullToCenter() {
    if (!isDragDirectionCorrect() || gameOver) return;
    
    const center = getTargetCenter();
    const distance = orangeProgress - center;
    
    // 根据距离调整靠拢强度，距离越远靠拢越明显
    if (Math.abs(distance) > 0.5) {
        const pullAmount = (distance > 0 ? -1 : 1) * currentConfig.centerPullStrength * 0.1;
        orangeProgress += pullAmount;
        orangeProgress = Math.max(0, Math.min(100, orangeProgress));
    }
}

// ===================== 粒子特效核心功能（修改为飞向能量条） =====================
// 获取能量条的位置信息
function getEnergyBarPosition(barIndex) {
    const bar = greenFills[barIndex];
    const rect = bar.getBoundingClientRect();
    const particleRect = particleContainer.getBoundingClientRect();
    
    // 计算粒子目标位置（相对于粒子容器）
    const targetX = rect.left + rect.width/2 - particleRect.left;
    const targetY = rect.top + rect.height/2 - particleRect.top;
    
    return { x: targetX, y: targetY };
}

// 创建飞向能量条的粒子
function createParticle() {
    if (!isInTargetZone() || gameOver) return;
    
    // 随机选择一个能量条作为目标
    const targetBarIndex = Math.floor(Math.random() * greenFills.length);
    const targetPos = getEnergyBarPosition(targetBarIndex);
    
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // 粒子位置（在判定区内随机）
    const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
    const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
    const randomX = Math.random() * (targetEnd - targetStart) + targetStart;
    
    // 转换为像素位置
    const particleContainerRect = particleContainer.getBoundingClientRect();
    const startX = (randomX / 100) * particleContainerRect.width;
    const startY = Math.random() * particleContainerRect.height;
    
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    
    // 随机粒子大小
    const size = Math.random() * 8 + 4; // 4-12px
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // 随机动画时长
    const duration = Math.random() * 1.5 + 0.5; // 0.5-2s
    particle.style.animationDuration = `${duration}s`;
    
    // 设置粒子飞向的目标位置
    particle.style.setProperty('--target-x', targetPos.x - startX);
    particle.style.setProperty('--target-y', targetPos.y - startY);
    
    // 应用飞向能量条的动画
    particle.style.animationName = 'particle-to-energy';
    
    // 方向正确时增加粒子数量和大小
    if (isDragDirectionCorrect()) {
        const boostSize = Math.random() * 10 + 6;
        particle.style.width = `${boostSize}px`;
        particle.style.height = `${boostSize}px`;
        particle.style.background = 'rgba(76, 175, 80, 0.9)'; // 绿色粒子
    }
    
    particleContainer.appendChild(particle);
    
    // 移除粒子
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}

// 粒子生成循环
function particleLoop() {
    if (isInTargetZone() && !gameOver) {
        // 每帧生成粒子数量，方向正确时加倍（手机端减少粒子数量，提升性能）
        const baseCount = Math.floor(Math.random() * 2) + 1;
        const particleCount = isDragDirectionCorrect() ? baseCount * 2 : baseCount;
        
        for (let i = 0; i < particleCount; i++) {
            createParticle();
        }
    }
}

// 生成随机值（橙色条增长/非判定区减少幅度）- 完全保留原始逻辑
function getRandomOrangeValue() {
    let baseValue = Math.random() * (currentConfig.orangeMax - currentConfig.orangeMin) + currentConfig.orangeMin;
    
    // 如果正在拖动且方向错误，增加拉力条增长速度
    if (isHolding && dragDirection !== 0 && !isDragDirectionCorrect()) {
        baseValue *= (1 + currentConfig.wrongDirectionPenalty);
    }
    
    return baseValue;
}

// 生成随机值（判定区橙色条减少幅度）- 完全保留原始逻辑
function getSlowOrangeDecValue() {
    let baseValue = Math.random() * (currentConfig.orangeSlowMax - currentConfig.orangeSlowMin) + currentConfig.orangeSlowMin;
    
    // 如果正在拖动且方向正确，减少拉力条增长速度（奖励）
    if (isHolding && dragDirection !== 0 && isDragDirectionCorrect()) {
        baseValue *= (1 - currentConfig.correctDirectionBonus);
    }
    
    return baseValue;
}

// 获取拉力条下降速度倍率（根据玩家朝向）
function getOrangeDownRate() {
    // 玩家朝向与鱼相反：缓慢下降
    if (playerDirection === -fishDirection) {
        return currentConfig.playerSlowDownRate;
    }
    // 玩家朝向与鱼相同：原速下降
    return currentConfig.playerNormalDownRate;
}

// 生成随机移动速度（支持二阶段倍率）
function getRandomMoveSpeed() {
    const baseSpeed = Math.random() * (currentConfig.moveSpeedMax - currentConfig.moveSpeedMin) + currentConfig.moveSpeedMin;
    return isBossPhase2 ? baseSpeed * currentConfig.phase2MoveMulti : baseSpeed;
}

// 生成随机缩放速度（支持二阶段倍率）
function getRandomSizeSpeed() {
    const baseSpeed = Math.random() * (currentConfig.sizeSpeedMax - currentConfig.sizeSpeedMin) + currentConfig.sizeSpeedMin;
    return isBossPhase2 ? baseSpeed * currentConfig.phase2SizeMulti : baseSpeed;
}

// 生成随机时间（0.5~1秒）
function getRandomChangeTime() {
    return Math.random() * (currentConfig.dirChangeMax - currentConfig.dirChangeMin) + currentConfig.dirChangeMin;
}

// 检查BOSS是否进入第二阶段
function checkBossPhase2() {
    if (!isBossMode) return false;
    const currentHpPercent = (fishHealth / fishHealthMax) * 100;
    const isPhase2 = currentHpPercent <= currentConfig.bossPhase2Hp;
    
    // 如果进入二阶段，更新判定区范围限制
    if (isPhase2 && !isBossPhase2) {
        BOSS_TARGET_MIN_LEFT = currentConfig.phase2MinLeft;
        BOSS_TARGET_MAX_LEFT = currentConfig.phase2MaxLeft;
        BOSS_TARGET_MIN_WIDTH = currentConfig.phase2MinWidth;
        BOSS_TARGET_MAX_WIDTH = currentConfig.phase2MaxWidth;
        // 立即重新随机化移动和缩放参数
        randomizeMoveDirection();
        randomizeSizeDirection();
        status.textContent = `${isBossMode ? '[BOSS模式-第二阶段] ' : ''}BOSS进入狂暴状态！判定区变化更快、范围更大！`;
        status.style.color = '#d81b60';
    }
    
    isBossPhase2 = isPhase2;
    return isPhase2;
}

// 启动子弹时间
function startBulletTime() {
    if (isBulletTime) return;
    
    isBulletTime = true;
    orangeFill.classList.add('bullet-time');
    
    // 显示子弹时间提示
    bulletTimeNotice.textContent = `子弹时间！${currentConfig.bulletTimeDur/1000}秒内橙色条减速，鱼持续掉血`;
    bulletTimeNotice.classList.add('show');
    
    // 更新状态文本
    const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
    const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
    status.textContent = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}[子弹时间！] 橙色条减速，鱼持续掉血 | 黄色区: ${Math.round(targetStart)}%-${Math.round(targetEnd)}% | 总能量: ${Math.round(totalGreenEnergy)}/${currentConfig.maxEnergy}`;
    status.style.color = '#ffdd00';
    
    // 子弹时间结束
    clearTimeout(bulletTimeTimer);
    bulletTimeTimer = setTimeout(() => {
        endBulletTime();
    }, currentConfig.bulletTimeDur);
}

// 结束子弹时间
function endBulletTime() {
    isBulletTime = false;
    orangeFill.classList.remove('bullet-time');
    
    // 隐藏子弹时间提示
    bulletTimeNotice.classList.remove('show');
    
    // 恢复状态文本颜色
    const inTargetZone = isInTargetZone();
    status.style.color = inTargetZone ? '#ffffff' : '#f44336';
}

// 更新判定区域位置和宽度（BOSS模式）
function updateTargetZone() {
    if (!isBossMode) return;

    // 检查是否进入第二阶段
    checkBossPhase2();

    // 更新位置
    targetZoneLeft += targetMoveSpeed * targetMoveDirection;
    // 边界检测
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
    // 宽度边界检测
    if (targetZoneWidth <= BOSS_TARGET_MIN_WIDTH) {
        targetZoneWidth = BOSS_TARGET_MIN_WIDTH;
        targetSizeDirection = 1;
    } else if (targetZoneWidth >= BOSS_TARGET_MAX_WIDTH) {
        targetZoneWidth = BOSS_TARGET_MAX_WIDTH;
        targetSizeDirection = -1;
    }

    // 应用到DOM
    targetZone.style.left = `${targetZoneLeft}%`;
    targetZone.style.width = `${targetZoneWidth}%`;
}

// 随机变换移动方向和速度
function randomizeMoveDirection() {
    if (!isBossMode) return;
    targetMoveDirection = Math.random() > 0.5 ? 1 : -1;
    targetMoveSpeed = getRandomMoveSpeed();
    clearTimeout(directionChangeTimer);
    directionChangeTimer = setTimeout(randomizeMoveDirection, getRandomChangeTime());
}

// 随机变换缩放方向和速度
function randomizeSizeDirection() {
    if (!isBossMode) return;
    targetSizeDirection = Math.random() > 0.5 ? 1 : -1;
    targetSizeSpeed = getRandomSizeSpeed();
    clearTimeout(sizeChangeTimer);
    sizeChangeTimer = setTimeout(randomizeSizeDirection, getRandomChangeTime());
}

// 检查是否在判定区域
function isInTargetZone() {
    const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
    const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
    return orangeProgress >= targetStart && orangeProgress < targetEnd;
}

// 更新绿色条显示（适配横向）
function updateGreenBarsDisplay() {
    let remainingEnergy = totalGreenEnergy;
    const currentFullBars = getAvailableFullBars();
    
    // 检测是否有新填满的能量条
    if (currentFullBars > lastFullBars && !gameOver) {
        startBulletTime();
    }
    lastFullBars = currentFullBars;
    
    for (let i = 0; i < greenFills.length; i++) {
        const fillPercent = Math.min(100, (remainingEnergy / currentConfig.barCapacity) * 100);
        greenFills[i].style.width = `${fillPercent}%`; // 横向改为width
        
        // 添加满格特效
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
        greenFills[i].style.width = '0%'; // 横向改为width
        greenFills[i].classList.remove('full');
        greenEffects[i].classList.remove('active');
    }
}

// 计算可用完整能量条数量
function getAvailableFullBars() {
    return Math.floor(totalGreenEnergy / currentConfig.barCapacity);
}

// 更新技能按钮状态
function updateSkillButtons() {
    const availableFullBars = getAvailableFullBars();
    skill1Button.disabled = availableFullBars < (currentConfig.skill1Cost / currentConfig.barCapacity) || gameOver;
    skill2Button.disabled = availableFullBars < (currentConfig.skill2Cost / currentConfig.barCapacity) || gameOver;
    skill3Button.disabled = availableFullBars < (currentConfig.skill3Cost / currentConfig.barCapacity) || gameOver;
    reelButton.disabled = gameOver;
    
    // 更新技能按钮文本
    skill1Button.textContent = `技能1 (消耗${currentConfig.skill1Cost}能量)`;
    skill2Button.textContent = `技能2 (恢复${currentConfig.skill2Heal}耐力，消耗${currentConfig.skill2Cost}能量)`;
    skill3Button.textContent = `技能3 (消耗${currentConfig.skill3Cost}能量)`;
}

// 更新鱼血量UI
function updateFishHealthUI() {
    fishHealth = Math.max(0, Math.min(fishHealthMax, fishHealth));
    const healthPercent = fishHealth / fishHealthMax;
    const healthDeg = healthPercent * 360;
    fishHealthFill.style.setProperty('--health-deg', `${healthDeg}deg`);
    fishHealthText.textContent = `${Math.round(fishHealth)}/${fishHealthMax}`;
}

// 更新玩家耐力UI（适配横向）
function updatePlayerStaminaUI() {
    playerStamina = Math.max(0, Math.min(playerStaminaMax, playerStamina));
    const staminaPercent = (playerStamina / playerStaminaMax) * 100;
    playerStaminaFill.style.width = `${staminaPercent}%`; // 横向改为width
    playerStaminaText.textContent = `耐力：${Math.round(playerStamina)}/${playerStaminaMax}`;
}

// 更新UI与状态 - 修复橙色拉力条显示问题
function updateUI() {
    if (gameOver) return;

    orangeProgress = Math.max(0, Math.min(100, orangeProgress));
    totalGreenEnergy = Math.max(0, Math.min(currentConfig.maxEnergy, totalGreenEnergy));

    // 强制设置橙色条宽度，确保显示（修复看不见的核心问题）
    orangeFill.style.width = `${orangeProgress}%`;
    orangeFill.style.display = 'block'; // 强制显示元素
    
    // 橙色条满100%警告特效
    if (orangeProgress >= 100) {
        orangeFill.classList.add('full-warning');
    } else {
        orangeFill.classList.remove('full-warning');
    }

    // BOSS模式下更新判定区域
    if (isBossMode) {
        updateTargetZone();
    }

    // 方向正确时拉力条向中心靠拢
    pullToCenter();

    updateFishHealthUI();
    updatePlayerStaminaUI();

    const inTargetZone = isInTargetZone();
    let greenIncrement = inTargetZone ? GREEN_FAST : GREEN_SLOW;
    
    // 如果拖动方向正确，大幅增加能量获取
    if (isHolding && dragDirection !== 0 && isDragDirectionCorrect()) {
        greenIncrement *= currentConfig.correctEnergyMultiplier; // 正确方向能量倍率
    }
    
    totalGreenEnergy += greenIncrement;

    updateGreenBarsDisplay();
    
    // 生成粒子特效
    particleLoop();

    // 更新状态文本
    if (!isBulletTime) {
        let statusText, statusColor;
        const targetStart = isBossMode ? targetZoneLeft : BASE_TARGET_START;
        const targetEnd = isBossMode ? (targetZoneLeft + targetZoneWidth) : BASE_TARGET_END;
        
        // 橙色条满100%提示
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

// 检查游戏结束条件
function checkGameOver() {
    if (fishHealth <= 0) {
        gameOver = true;
        endBulletTime();
        clearTimeout(fishDirectionTimer); // 停止鱼方向切换
        reelButton.classList.remove('correct-direction');
        status.classList.remove('correct', 'wrong');
        status.textContent = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}恭喜！鱼已被捕获！点击重置按钮重新开始 | 剩余耐力: ${Math.round(playerStamina)}`;
        status.style.color = '#4caf50';
        updateSkillButtons();
    } else if (playerStamina <= 0) {
        gameOver = true;
        endBulletTime();
        clearTimeout(fishDirectionTimer); // 停止鱼方向切换
        reelButton.classList.remove('correct-direction');
        status.classList.remove('correct', 'wrong');
        status.textContent = `${isBossMode ? (isBossPhase2 ? '[BOSS模式-第二阶段] ' : '[BOSS模式] ') : ''}游戏失败！你的耐力已耗尽！点击重置按钮重新开始`;
        status.style.color = '#f44336';
        updateSkillButtons();
    }
}

// 主循环（手机端优化帧率，减少性能消耗）
function loop() {
    if (gameOver) return;

    if (isHolding) {
        // 按住：橙色条随机增长（完全保留原始数值逻辑）
        const randomInc = getRandomOrangeValue();
        orangeProgress += randomInc;
        
        const inTargetZone = isInTargetZone();
        fishHealth -= inTargetZone ? FISH_HEALTH_FAST : FISH_HEALTH_SLOW;
        
        // 不在判定区时玩家掉耐力
        if (!inTargetZone) {
            // 橙色条满100%时掉耐力翻倍
            const damageMultiplier = orangeProgress >= 100 ? currentConfig.fullHpMultiplier : 1;
            // 如果拖动方向错误，额外增加掉耐力
            const directionPenalty = (dragDirection !== 0 && !isDragDirectionCorrect()) ? 1.5 : 1;
            playerStamina -= PLAYER_DAMAGE * damageMultiplier * directionPenalty;
        }
    } else {
        // 松开：根据玩家朝向调整拉力条下降速度
        let randomDec;
        if (isBulletTime) {
            randomDec = currentConfig.bulletTimeDec;
            // 子弹时间内鱼持续掉血
            const inTargetZone = isInTargetZone();
            fishHealth -= inTargetZone ? FISH_HEALTH_FAST : FISH_HEALTH_SLOW;
        } else {
            const inTargetZone = isInTargetZone();
            randomDec = inTargetZone ? getSlowOrangeDecValue() : getRandomOrangeValue();
            
            // 根据玩家朝向调整下降速度
            randomDec *= getOrangeDownRate();
        }
        orangeProgress -= randomDec;
    }

    updateUI();
}

// 切换鱼模式（已完整，保持原有逻辑）
function switchFishMode(isBoss) {
    isBossMode = isBoss;
    isBossPhase2 = false; // 切换模式时重置二阶段状态
    // 更新按钮样式
    normalFishBtn.classList.toggle('active', !isBoss);
    bossFishBtn.classList.toggle('active', isBoss);
    
    // 更新鱼血量最大值
    fishHealthMax = isBoss ? currentConfig.bossFishHealth : currentConfig.normalFishHealth;
    fishHealth = fishHealthMax;
    
    // 重置判定区范围限制
    BOSS_TARGET_MIN_LEFT = 40;
    BOSS_TARGET_MAX_LEFT = 90;
    BOSS_TARGET_MIN_WIDTH = 10;
    BOSS_TARGET_MAX_WIDTH = 25;
    
    // 重置游戏
    resetGame();
    
    if (isBossMode) {
        // BOSS模式初始化
        targetZoneLeft = 60;
        targetZoneWidth = 25;
        randomizeMoveDirection();
        randomizeSizeDirection();
    } else {
        // 普通模式恢复
        targetZoneLeft = BASE_TARGET_START;
        targetZoneWidth = BASE_TARGET_END - BASE_TARGET_START;
        targetZone.style.left = `${BASE_TARGET_START}%`;
        targetZone.style.width = `${25}%`;
        clearTimeout(directionChangeTimer);
        clearTimeout(sizeChangeTimer);
    }
}

// 重置游戏（已完整，保持原有逻辑）
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
    fishDirection = 1; // 重置鱼方向为右
    dragDirection = 0;
    playerDirection = 1; // 重置玩家朝向为右
    
    // 清除定时器
    clearTimeout(bulletTimeTimer);
    clearTimeout(fishDirectionTimer);
    orangeFill.classList.remove('bullet-time', 'full-warning');
    bulletTimeNotice.classList.remove('show');
    
    // 强制重置橙色条显示
    orangeFill.style.width = '0%';
    orangeFill.style.display = 'block';
    reelButton.classList.remove('dragging', 'correct-direction');
    
    // 重置鱼方向UI
    fishIcon.classList.remove('left');
    
    // 重置玩家朝向显示
    updatePlayerDirectionDisplay();
    
    // 清空粒子
    particleContainer.innerHTML = '';
    
    // 重置判定区域
    if (isBossMode) {
        targetZoneLeft = 60;
        targetZoneWidth = 25;
        targetZone.style.left = `${targetZoneLeft}%`;
        targetZone.style.width = `${targetZoneWidth}%`;
    } else {
        targetZone.style.left = `${BASE_TARGET_START}%`;
        targetZone.style.width = `${25}%`;
    }
    
    // 重置绿色条特效
    greenFills.forEach(fill => fill.classList.remove('full'));
    
    // 重置状态文本和样式
    const defaultStatus = isBossMode 
        ? `[BOSS模式] 按住并拖动收线按钮 | 黄色判定区：动态变化 | 总能量：0/${currentConfig.maxEnergy}`
        : `按住并拖动收线按钮 | 黄色判定区：60%（含）-85%（不含） | 总能量：0/${currentConfig.maxEnergy}`;
    status.textContent = defaultStatus;
    status.style.color = '#666';
    status.classList.remove('correct', 'wrong');
    
    // 重新初始化鱼方向定时器
    initFishDirectionTimer();
    
    // 重启主循环
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(loop, 50); // 手机端保持帧率，确保流畅度
    
    // 更新UI
    updateUI();
}

// 技能1：消耗100能量，造成50点伤害（已完整）
function useSkill1() {
    if (gameOver || getAvailableFullBars() < (currentConfig.skill1Cost / currentConfig.barCapacity)) return;
    
    // 扣除能量
    totalGreenEnergy -= currentConfig.skill1Cost;
    totalGreenEnergy = Math.max(0, totalGreenEnergy);
    
    // 造成伤害
    fishHealth -= currentConfig.skill1Damage;
    
    // 更新UI
    updateGreenBarsDisplay();
    updateFishHealthUI();
    updateSkillButtons();
    checkGameOver();
    
    // 技能使用提示（手机端字体适配，简洁明了）
    status.textContent = `${status.textContent.split('|')[0]} | 技能1！造成${currentConfig.skill1Damage}伤害`;
}

// 技能2：消耗100能量，恢复200耐力（已完整）
function useSkill2() {
    if (gameOver || getAvailableFullBars() < (currentConfig.skill2Cost / currentConfig.barCapacity)) return;
    
    // 扣除能量
    totalGreenEnergy -= currentConfig.skill2Cost;
    totalGreenEnergy = Math.max(0, totalGreenEnergy);
    
    // 恢复耐力（不超过最大值）
    playerStamina += currentConfig.skill2Heal;
    playerStamina = Math.min(playerStaminaMax, playerStamina);
    
    // 更新UI
    updateGreenBarsDisplay();
    updatePlayerStaminaUI();
    updateSkillButtons();
    
    // 技能使用提示（手机端简洁）
    status.textContent = `${status.textContent.split('|')[0]} | 技能2！恢复${currentConfig.skill2Heal}耐力`;
}

// 技能3：消耗300能量，造成300点高额伤害（已完整）
function useSkill3() {
    if (gameOver || getAvailableFullBars() < (currentConfig.skill3Cost / currentConfig.barCapacity)) return;
    
    // 扣除能量
    totalGreenEnergy -= currentConfig.skill3Cost;
    totalGreenEnergy = Math.max(0, totalGreenEnergy);
    
    // 造成高额伤害
    fishHealth -= currentConfig.skill3Damage;
    
    // 更新UI
    updateGreenBarsDisplay();
    updateFishHealthUI();
    updateSkillButtons();
    checkGameOver();
    
    // 技能使用提示（手机端简洁）
    status.textContent = `${status.textContent.split('|')[0]} | 技能3！造成${currentConfig.skill3Damage}高额伤害`;
}

// 绑定所有事件监听（已完整，优化手机端触摸体验）
function bindEvents() {
    // 收线按钮 - 鼠标事件（桌面端兼容）
    reelButton.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('mouseleave', handleDragEnd);
    
    // 收线按钮 - 触摸事件（手机端优先，优化触摸响应）
    reelButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDragStart(e);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleDragMove(e);
    }, { passive: false });
    document.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleDragEnd(e);
    });
    document.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        handleDragEnd(e);
    });
    
    // 重置按钮（手机端增大点击区域，优化响应）
    resetButton.addEventListener('click', resetGame);
    resetButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        resetGame();
    });
    
    // 技能按钮（手机端触摸优化）
    skill1Button.addEventListener('click', useSkill1);
    skill1Button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        useSkill1();
    });
    
    skill2Button.addEventListener('click', useSkill2);
    skill2Button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        useSkill2();
    });
    
    skill3Button.addEventListener('click', useSkill3);
    skill3Button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        useSkill3();
    });
    
    // 鱼模式切换按钮（手机端触摸优化）
    normalFishBtn.addEventListener('click', () => switchFishMode(false));
    normalFishBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        switchFishMode(false);
    });
    
    bossFishBtn.addEventListener('click', () => switchFishMode(true));
    bossFishBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        switchFishMode(true);
    });
}

// 初始化游戏（已完整，手机端适配初始化）
function initGame() {
    // 设置初始判定区位置和大小
    targetZone.style.left = `${BASE_TARGET_START}%`;
    targetZone.style.width = `${25}%`;
    
    // 强制初始化橙色条显示
    orangeFill.style.width = '0%';
    orangeFill.style.display = 'block';
    
    // 初始化鱼方向切换定时器
    initFishDirectionTimer();
    
    // 绑定所有事件（优先触摸事件）
    bindEvents();
    
    // 启动主游戏循环（50ms/帧，手机端流畅度平衡）
    intervalId = setInterval(loop, 50);
    
    // 初始化UI显示（适配手机端尺寸）
    updateFishHealthUI();
    updatePlayerStaminaUI();
    updateGreenBarsDisplay();
    updatePlayerDirectionDisplay();
}

// 页面加载完成后自动初始化游戏（手机端优先执行）
window.addEventListener('DOMContentLoaded', initGame);