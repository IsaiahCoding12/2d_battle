let isStart = sessionStorage.getItem('tutorial') === 'true';
sessionStorage.removeItem('tutorial');
console.log('isStart:', isStart);

const CELL_SIZE = 40;
const NPC_SKINS = [
    '/assets/npcs/bobby.png',
    '/assets/npcs/cloak_man.png',
    '/assets/npcs/dummy.png',
    '/assets/npcs/farmer.png',
    '/assets/npcs/firey.png',
    '/assets/npcs/fred.png',
    '/assets/npcs/jay.png',
    '/assets/npcs/joe.png',
    '/assets/npcs/luke.png',
    '/assets/npcs/peter.png',
    '/assets/npcs/ricky.png',
    '/assets/npcs/rob.png',
    '/assets/npcs/slime.png'
];
const ARENA_ENEMY_SKINS = ['/assets/npcs/firey.png', '/assets/npcs/slime.png', '/assets/npcs/levithan.png'];
const ARENA_DIFFICULTIES = [
    { name: 'easy', hp: 40, damage: 5, speed: 420 },
    { name: 'medium', hp: 70, damage: 10, speed: 300 },
    { name: 'hard', hp: 110, damage: 15, speed: 180 }
];

let agpp = false;
let respawnx = 9;
let skipTutorial = false;
let respawny = 9;

let canGetHired = false;
let dtrx = 18;
let dtry = 5;
let icrx = 12;
let icry = 6;
let has_found_treasure = false;
let admin;
let rfi = false;
let hp = 100;
let money = 50;
let gameFlags = {};
let deaths = parseInt(localStorage.getItem('deaths') || '0');
let fit = "Casual";
let ownedFits = ["Casual"];
let job = "Unemployed";
let bankMoney = parseInt(localStorage.getItem('bankMoney') || '0');
let lastBankInterestTime = 0;
let isDead = false;

document.getElementById("Admin").textContent = admin;

let playerElement = null;
let cursorImage = null;
let gridContainer = null;
let hasNoteFromJay = false;
let mouseRow = null;
let mouseCol = null;
let showCoords = false;
let darkMode = false;

const player = {
    x: 9,
    y: 9,
    speed: CELL_SIZE,
    walkFrame: 1,
    isMoving: false,
    moveCooldown: 130,
    lastMoveTime: 0,
    damageCooldown: 130,
    lastDamageTime: -1000
};

let rows = 19;
let cols = 19;
let grid = [];
let door2s = [];
const keysPressed = {};
let currentLevel = null;
let casinoOutsideReturn = false;

let bjax = 10;
let bjay = 19;
let arenaReturn = false;
let b1rx = 1;
let b1ry = 15;
let msx = 1;
let msy = 17;
let biry = false;

let animations = [];
let animationIntervalId = null;
let messageTimeoutId = null;
let messageBlocking = false;
let blockShoot = false;
let bgm = null;

// -----------------------------
// WEAPON
// -----------------------------
class Weapon {
    constructor(name, damage) {
        this.name = name;
        this.damage = damage;
    }
}

const blank = new Weapon("nothing", 0);
const Pistol = new Weapon("Pistol", 10);
const Glock = new Weapon("Glock", 20);
const Sniper = new Weapon("Sniper", 45);
const Uzi = new Weapon('Uzi', 75);
const M4 = new Weapon('M4', 110);
const AK47 = new Weapon('AK47', 55);
const SMUB = new Weapon('SMUB', 5000);
const Grenade = new Weapon('Grenade', 35);
const Peters_Note = new Weapon('Peters Note', 0);
const Joes_Box = new Weapon('Joes Box', 0);
const Key = new Weapon('Key', 0);

let equipped = Pistol.name;
let item1 = Pistol.name;
let item2 = blank.name;
let item3 = blank.name;
let item4 = blank.name;
let item5 = blank.name;

// =============================
// DOM CONTENT LOADED
// =============================
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    createMessageBox();
    createCoordsDisplay();

    gridContainer = document.querySelector(".grid");
    if (!gridContainer) return;
    gridContainer.style.position = "relative";
    gridContainer.style.userSelect = "none";

    loadLevel('main');

    addAnimation("/assets/blocks/water.png", "/assets/blocks/water_2.png");
    startAnimationHub();

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);

    requestAnimationFrame(gameLoop);
});

// =============================
// PLAYER CREATION
// =============================
function createPlayer(container) {
    playerElement = document.createElement('img');
    let folder = fit.replace(/ /g, '_');
    if (fit === "Your very own cloak!!!") folder = "cloak_man_fit";
    playerElement.src = `/assets/player/${folder}/idle.png`;
    playerElement.style.display = 'block';
    playerElement.style.position = 'absolute';
    playerElement.style.left = `${player.x * CELL_SIZE}px`;
    playerElement.style.top = `${player.y * CELL_SIZE}px`;
    if (fit === "Casual" || fit === "Your very own cloak!!!") {
        playerElement.style.width = `${CELL_SIZE}px`;
        playerElement.style.marginLeft = '0px';
    } else {
        playerElement.style.width = `${CELL_SIZE * 0.8}px`;
        playerElement.style.marginLeft = `${CELL_SIZE * 0.1}px`;
    }
    playerElement.style.height = `${CELL_SIZE}px`;
    playerElement.style.zIndex = '10';
    playerElement.style.transition = 'left 0.1s linear, top 0.1s linear';
    container.appendChild(playerElement);
}

// =============================
// INPUT
// =============================
function handleKeyPress(event) {
    keysPressed[event.key] = true;

    if (event.key.toLowerCase() === 'p' && !event.repeat) {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        showMessage(darkMode ? "Dark mode on" : "Dark mode off");
    }

    if (event.key === 'Tab' && admin !== 'ADMIN IS ON') {
        event.preventDefault();
        const attempt = prompt("twin what = da password");
        if (attempt === 'JESUISFROMAGE') {
            gameFlags.fireyKilled = true;
            showMessage("TUFF TUFF TUFF SAHUR YOU KNOW THE PASSWORD TWINCHACO!!!");
            isStart = false;
            ownedFits.push("Jersey");
            ownedFits.push("Street_Wear");
            ownedFits.push("White_Tuxedo");
            skipTutorial = true;
            money = 10000000;
            admin = 'ADMIN IS ON';
            hp = 10000;
            showCoords = !showCoords;
            const coordsEl = document.getElementById('coords-display');
            if (coordsEl) coordsEl.style.display = showCoords ? 'block' : 'none';
            updateUI();
        } else {
            hp = "0 because your a dumbass cheater!!!!";
            money = "nothing cos youre also a brokie";
            admin = "I AM A BUTTHOLE";
            updateUI();
            showMessage('not tuff twin');
            rows = 0;
            cols = 0;
            initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        }
    }

    if (event.key === 'm' && admin === 'ADMIN IS ON') {
        event.preventDefault();
        const goto = prompt("twin where u tryna go?");
        loadLevel(goto);
    }

    if (event.key === '1') { showMessage("You equipped " + item1); equipped = item1; }
    if (event.key === '2') { showMessage("You equipped " + item2); equipped = item2; }
    if (event.key === '3') { showMessage("You equipped " + item3); equipped = item3; }
    if (event.key === '4') { showMessage("You equipped " + item4); equipped = item4; }
    if (event.key === '5') { showMessage("You equipped " + item5); equipped = item5; }

    if (event.key === 'l') showMessage("Clothes: " + fit + ", Job: " + job + ", Money in bank: " + bankMoney);

    if (event.key === 'e') {
        let idx = ownedFits.indexOf(fit);
        if (idx === -1) idx = 0;
        let nextIdx = (idx + 1) % ownedFits.length;
        fit = ownedFits[nextIdx];
        showMessage("Changed fit to " + fit);
        if (playerElement) {
            let folder = fit.replace(/ /g, '_');
            if (fit === "Your very own cloak!!!") folder = "cloakman_fit";
            playerElement.src = `/assets/player/${folder}/idle.png`;
            if (fit === "Casual" || fit === "Your very own cloak!!!") {
                playerElement.style.width = `${CELL_SIZE}px`;
                playerElement.style.marginLeft = '0px';
            } else {
                playerElement.style.width = `${CELL_SIZE * 0.8}px`;
                playerElement.style.marginLeft = `${CELL_SIZE * 0.1}px`;
            }
        }
    }
}

function handleKeyRelease(event) {
    delete keysPressed[event.key];
    const stillMoving = ['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']
        .some(k => keysPressed[k]);
    if (!stillMoving && playerElement) {
        player.isMoving = false;
        let folder = fit.replace(/ /g, '_');
        if (fit === "Your very own cloak!!!") folder = "cloakman_fit";
        playerElement.src = `/assets/player/${folder}/idle.png`;
    }
}

function updateFit() {
    const validFits = ["Casual", "Street Wear", "Jersey", "White Tuxedo", "Your very own cloak!!!"];
    if (validFits.includes(equipped)) {
        fit = equipped;
        if (playerElement) {
            let folder = fit.replace(/ /g, '_');
            if (fit === "Your very own cloak!!!") folder = "cloakman_fit";
            playerElement.src = `/assets/player/${folder}/idle.png`;
            if (fit === "Casual" || fit === "Your very own cloak!!!") {
                playerElement.style.width = `${CELL_SIZE}px`;
                playerElement.style.marginLeft = '0px';
            } else {
                playerElement.style.width = `${CELL_SIZE * 0.8}px`;
                playerElement.style.marginLeft = `${CELL_SIZE * 0.1}px`;
            }
        }
    }
}

// =============================
// UPDATE / MOVEMENT
// =============================
function update(currentTime) {
    let newX = player.x;
    let newY = player.y;
    let moved = false;
    let isHorizontalMove = false;

    if (keysPressed['w'] || keysPressed['ArrowUp']) {
        newY = player.y - 1;
        moved = true;
    } else if (keysPressed['s'] || keysPressed['ArrowDown']) {
        newY = player.y + 1;
        moved = true;
    } else if (keysPressed['a'] || keysPressed['ArrowLeft']) {
        newX = player.x - 1;
        if (playerElement) playerElement.style.transform = 'scaleX(-1)';
        moved = true;
        isHorizontalMove = true;
    } else if (keysPressed['d'] || keysPressed['ArrowRight']) {
        newX = player.x + 1;
        if (playerElement) playerElement.style.transform = 'scaleX(1)';
        moved = true;
        isHorizontalMove = true;
    } else if (keysPressed['z']) {
        showMessage(item1 + " was equipped!");
    }

    if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) {
        const door2 = [...door2s].reverse().find(door => door.row === newY && door.col === newX);
        if (door2) {
            if (currentLevel === 'casino' && door2.targetLevel === 'casino_outside') {
                casinoOutsideReturn = true;
            }
            loadLevel(door2.targetLevel);
        }
        return;
    }

    const targetIndex = newY * cols + newX;
    const targetCell = grid[targetIndex];
    if (!targetCell) return;

    if (targetCell.solid) {
        if (targetCell.monster) {
            if (currentTime - player.lastDamageTime >= player.damageCooldown) {
                hp -= targetCell.monster.damage;
                player.lastDamageTime = currentTime;
                updateUI();
                showMessage(`Ouch! -${targetCell.monster.damage} HP`, "red");
            }
        }
        if (targetCell.touchMessage && !targetCell.touchMessageShown) {
            showMessage(targetCell.touchMessage);
        }
        return;
    }

    if (targetCell.isArenaEntrance) {
        openShop(targetCell.shopItems, targetCell.shopName);
        return;
    }

    let folder = fit.replace(/ /g, '_');
    if (fit === "Your very own cloak!!!") folder = "cloakman_fit";

    if (isHorizontalMove && playerElement) {
        player.walkFrame = player.walkFrame === 1 ? 2 : 1;
        playerElement.src = `/assets/player/${folder}/walk_${player.walkFrame}.png`;
    } else if (moved && playerElement) {
        playerElement.src = `/assets/player/${folder}/idle.png`;
    }

    player.x = newX;
    player.y = newY;

    const landedIndex = player.y * cols + player.x;
    const landedCell = grid[landedIndex];
    if (landedCell && landedCell.touchMessage) {
        showMessage(landedCell.touchMessage);
    }
    if (landedCell) {
        console.log("Cell stepped on:", landedCell);
        if (landedCell.initFunction) {
            console.log("Running initFunction...");
            landedCell.initFunction();
        } else {
            console.log("No initFunction found");
        }
    }

    if (targetCell.isDoor && targetCell.targetLevel) {
        loadLevel(targetCell.targetLevel);
        return;
    }

    if (playerElement) {
        playerElement.style.left = `${player.x * CELL_SIZE}px`;
        playerElement.style.top = `${player.y * CELL_SIZE}px`;
    }
    player.lastMoveTime = currentTime;
}

// =============================
// GAME LOOP
// =============================
function gameLoop(timestamp) {
    if (hp < 1) {
        if (!isDead) {
            isDead = true;
            deaths++;
            localStorage.setItem('deaths', deaths);
            bankMoney = 0;
            localStorage.setItem('bankMoney', bankMoney);
            initiateGrid(rows, cols, '#FF0000', gridContainer);
            if (playerElement) playerElement.style.display = 'none';
            if (cursorImage) cursorImage.style.display = 'none';
            if (bgm) { bgm.pause(); bgm.currentTime = 0; }
            showMessage("You died! Press R to restart.", "red", true);
        }
        if (keysPressed['r'] || keysPressed['R']) location.reload();
        requestAnimationFrame(gameLoop);
        return;
    }

    const currentTime = timestamp || performance.now();
    const timeSinceLastMove = currentTime - player.lastMoveTime;

    const isMovingKey = ['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']
        .some(key => keysPressed[key]);

    if (isMovingKey && timeSinceLastMove >= player.moveCooldown) {
        update(currentTime);
    }

    if (currentTime - lastBankInterestTime > 60000) {
        if (bankMoney >= 20) {
            const interest = Math.floor(bankMoney / 20);
            bankMoney += interest;
            localStorage.setItem('bankMoney', bankMoney);
        }
        lastBankInterestTime = currentTime;
    }

    updateCrosshair();
    requestAnimationFrame(gameLoop);
}

function findDaCash() {
    money += 2000;
    updateUI();
    setCell(7, 6, '/assets/blocks/grass.png', { solid: false });
    has_found_treasure = true;
}

// =============================
// GRID INIT
// =============================
function initiateGrid(r, c, value, container) {
    rows = r;
    cols = c;

    grid = [];
    door2s = [];
    while (container.firstChild) container.removeChild(container.firstChild);

    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${c}, ${CELL_SIZE}px)`;
    container.style.gridTemplateRows = `repeat(${r}, ${CELL_SIZE}px)`;
    container.style.width = `${c * CELL_SIZE}px`;
    container.style.height = `${r * CELL_SIZE}px`;
    container.style.position = 'relative';

    for (let i = 0; i < r * c; i++) {
        const cell = document.createElement("div");
        cell.classList.add("grid-cell");
        cell.style.width = `${CELL_SIZE}px`;
        cell.style.height = `${CELL_SIZE}px`;
        cell.style.boxSizing = 'border-box';
        cell.style.backgroundSize = 'cover';
        cell.style.backgroundRepeat = 'no-repeat';

        if (typeof value === 'string' && value.endsWith('.png')) {
            cell.style.backgroundImage = `url('${value}')`;
        } else {
            cell.style.backgroundColor = value;
        }

        cell.dataset.index = i;

        cell.addEventListener("mouseenter", (e) => {
            const idx = Number(e.currentTarget.dataset.index);
            mouseRow = Math.floor(idx / c);
            mouseCol = idx % c;
            updateCrosshair();
        });

        cell.addEventListener("click", (e) => {
            const idx = Number(e.currentTarget.dataset.index);
            const clickedRow = Math.floor(idx / cols);
            const clickedCol = idx % cols;
            const cellData = grid[idx];

            if (cellData && cellData.isLockedDoor) {
                if ([item1, item2, item3, item4, item5].includes(Key.name)) {
                    showMessage("Unlocked!", "green");
                    loadLevel(cellData.targetLevel);
                } else {
                    showMessage("Locked...", "white");
                }
                return;
            }

            if (cellData && cellData.isSign && cellData.message) {
                if (Array.isArray(cellData.message)) {
                    if (typeof cellData.messageIndex === 'undefined') cellData.messageIndex = 0;
                    let msg = cellData.message[cellData.messageIndex];
                    if (typeof msg === 'function') msg = msg();
                    showMessage(msg);
                    if (cellData.isShop && cellData.messageIndex === cellData.message.length - 1) {
                        setTimeout(() => openShop(cellData.shopItems, cellData.shopName), 1000);
                    }
                    cellData.messageIndex = (cellData.messageIndex + 1) % cellData.message.length;
                } else {
                    showMessage(cellData.message);
                    if (cellData.isShop) setTimeout(() => openShop(cellData.shopItems, cellData.shopName), 1000);
                }
                return;
            }

            if (cellData && cellData.isShop) {
                openShop(cellData.shopItems, cellData.shopName);
                return;
            }

            if (cellData && (!cellData.solid || cellData.monster)) {
                shoot(clickedRow, clickedCol);
            }
        });

        container.appendChild(cell);

        grid.push({
            solid: false,
            isSign: false,
            message: null,
            isDoor: false,
            initFunction: null,
            isShop: false,
            overhead: false,
            bg: (typeof value === 'string' ? value : null)
        });
    }

    if (cursorImage) container.appendChild(cursorImage);
    if (playerElement) {
        container.appendChild(playerElement);
        playerElement.style.display = 'block';
    }
}

// =============================
// ANIMATION HUB
// =============================
function addAnimation(fromPath, toPath) {
    animations.push({ from: fromPath, to: toPath, toggle: false });
}

function runAnimationStep(anim) {
    const cells = gridContainer.querySelectorAll(".grid-cell");
    const currentSrc = anim.toggle ? anim.to : anim.from;
    const nextSrc = anim.toggle ? anim.from : anim.to;
    const currentVariants = [`url("${currentSrc}")`, `url('${currentSrc}')`];
    const nextValue = `url("${nextSrc}")`;

    cells.forEach((cell, i) => {
        const cur = cell.style.backgroundImage;
        if (cur === currentVariants[0] || cur === currentVariants[1]) {
            cell.style.backgroundImage = nextValue;
            if (grid[i]) grid[i].bg = nextSrc;
        }
    });
    anim.toggle = !anim.toggle;
}

function startAnimationHub() {
    if (animationIntervalId) clearInterval(animationIntervalId);
    animationIntervalId = setInterval(() => {
        animations.forEach(anim => runAnimationStep(anim));
    }, 150);
}

// =============================
// SET / SETS
// =============================
function setCell(row, col, value, properties = {}) {
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    const index = row * cols + col;
    const cells = gridContainer.querySelectorAll(".grid-cell");
    const cell = cells[index];
    if (!cell) return;

    grid[index] = {
        solid: false,
        isSign: false,
        initFunction: null,
        message: null,
        isDoor: false,
        isShop: false,
        overhead: false,
        bg: (typeof value === 'string' ? value : null),
        ...properties
    };

    if (typeof value === 'string' && value.endsWith('.png')) {
        cell.style.backgroundImage = `url('${value}')`;
        cell.style.backgroundColor = "";
    } else {
        cell.style.backgroundImage = "";
        cell.style.backgroundColor = value;
    }

    cell.style.zIndex = grid[index].overhead ? '20' : '';
}

function setCells(startRow, startCol, endRow, endCol, value, properties = {}) {
    const r1 = Math.min(startRow, endRow);
    const r2 = Math.max(startRow, endRow);
    const c1 = Math.min(startCol, endCol);
    const c2 = Math.max(startCol, endCol);
    for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
            setCell(r, c, value, { ...properties });
        }
    }
}

function setDoor2(row, col, targetLevel) {
    door2s.push({ row, col, targetLevel });
}

function setDoor2Cells(startRow, startCol, endRow, endCol, targetLevel) {
    const r1 = Math.min(startRow, endRow);
    const r2 = Math.max(startRow, endRow);
    const c1 = Math.min(startCol, endCol);
    const c2 = Math.max(startCol, endCol);
    for (let row = r1; row <= r2; row++) {
        for (let col = c1; col <= c2; col++) {
            setDoor2(row, col, targetLevel);
        }
    }
}

const structures = {
    slotMachine: [
        { y: -1, x: 0, value: '/assets/blocks/slot_machinetr.png', properties: {solid: true, isShop: true, shopName: 'Gamble', shopItems: [{name: 'Yes'}]} },
        { y: -1, x: 1, value: '/assets/blocks/slot_machinetl.png', properties: {solid: true, isShop: true, shopName: 'Gamble', shopItems: [{name: 'Yes'}]} },
        { y: 0, x: 0, value: '/assets/blocks/slot_machinedl.png', properties: {solid: true, isShop: true, shopName: 'Gamble', shopItems: [{name: 'Yes'}]} },
        { y: 0, x: 1, value: '/assets/blocks/slot_machinedr.png', properties: {solid: true, isShop: true, shopName: 'Gamble', shopItems: [{name: 'Yes'}]} }
    ]
};

function spawnStructure(name, y, x) {
    const structure = structures[name];
    if (!structure) return;
    structure.forEach(block => {
        setCell(y + block.y, x + block.x, block.value, { ...block.properties });
    });
}

// =============================
// MESSAGE BOX
// =============================
function createMessageBox() {
    if (document.getElementById('message-box')) return;
    const messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    messageBox.style.position = 'fixed';
    messageBox.style.bottom = '20px';
    messageBox.style.left = '50%';
    messageBox.style.transform = 'translateX(-50%)';
    messageBox.style.background = 'rgba(0,0,0,0.8)';
    messageBox.style.color = 'white';
    messageBox.style.padding = '8px 12px';
    messageBox.style.borderRadius = '6px';
    messageBox.style.display = 'none';
    messageBox.style.zIndex = 99999;

    const messageText = document.createElement('p');
    messageText.id = 'message-text';
    messageText.style.margin = 0;
    messageBox.appendChild(messageText);
    document.body.appendChild(messageBox);

    messageBox.addEventListener('click', () => {
        messageBox.style.display = 'none';
        if (messageTimeoutId) { clearTimeout(messageTimeoutId); messageTimeoutId = null; }
    });
}

function createCoordsDisplay() {
    const el = document.createElement('div');
    el.id = 'coords-display';
    el.style.position = 'fixed';
    el.style.top = '10px';
    el.style.right = '10px';
    el.style.color = 'white';
    el.style.fontFamily = '"Lora", serif';
    el.style.fontSize = '24px';
    el.style.zIndex = '10000';
    el.style.textShadow = '2px 2px 0 #000';
    el.style.display = 'none';
    document.body.appendChild(el);
}

function showMessage(text, color = 'white', blocking = false) {
    if (messageBlocking) return;
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    if (!messageBox || !messageText) return;

    messageText.style.color = color;
    if (messageTimeoutId) { clearTimeout(messageTimeoutId); messageTimeoutId = null; }
    messageText.textContent = text;
    messageBox.style.display = 'block';
    if (blocking) messageBlocking = true;

    messageTimeoutId = setTimeout(() => {
        messageBox.style.display = 'none';
        if (blocking) messageBlocking = false;
    }, 2000);
}

function updateUI() {
    const hpEl = document.getElementById("hp");
    const moneyEl = document.getElementById("money");
    const adminEl = document.getElementById("Admin");
    if (hpEl) hpEl.textContent = "Health: " + hp;
    if (moneyEl) moneyEl.textContent = "$: " + money;
    if (adminEl) adminEl.textContent = admin;
}

// =============================
// CROSSHAIR
// =============================
function setupCrosshair(container) {
    cursorImage = document.createElement("img");
    cursorImage.src = "/assets/crosshair.png";
    cursorImage.style.width = "13px";
    cursorImage.style.height = "13px";
    cursorImage.style.position = "absolute";
    cursorImage.style.pointerEvents = "none";
    cursorImage.style.zIndex = "9999";
    cursorImage.style.display = "none";
    container.appendChild(cursorImage);

    container.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const col = Math.floor(cx / CELL_SIZE);
        const row = Math.floor(cy / CELL_SIZE);
        if (row < 0 || row >= rows || col < 0 || col >= cols) {
            mouseRow = null; mouseCol = null;
            cursorImage.style.display = "none";
            return;
        }
        mouseRow = row; mouseCol = col;
        updateCrosshair();
    });

    container.addEventListener("mouseleave", () => {
        mouseRow = null; mouseCol = null;
        cursorImage.style.display = "none";
    });
}

function updateCrosshair() {
    if (hp < 1) { if (cursorImage) cursorImage.style.display = "none"; return; }

    const coordsEl = document.getElementById('coords-display');
    if (coordsEl && showCoords) {
        coordsEl.textContent = (mouseRow !== null && mouseCol !== null) ? `X: ${mouseCol} Y: ${mouseRow}` : "";
    }

    if (!cursorImage || mouseRow === null || mouseCol === null) return;
    if (mouseRow < 0 || mouseRow >= rows || mouseCol < 0 || mouseCol >= cols) {
        cursorImage.style.display = "none"; return;
    }

    const index = mouseRow * cols + mouseCol;
    if (!grid[index]) { cursorImage.style.display = "none"; return; }
    if (grid[index].solid && !grid[index].monster) { cursorImage.style.display = "none"; return; }

    cursorImage.style.display = "block";
    cursorImage.style.left = (mouseCol * CELL_SIZE + (CELL_SIZE / 2) - 6.5) + "px";
    cursorImage.style.top = (mouseRow * CELL_SIZE + (CELL_SIZE / 2) - 6.5) + "px";
}

function spawnMonster(row, col, hp, damage, skin, options = {}) {
    const index = row * cols + col;
    if (!grid[index]) return;

    const el = document.createElement('div');
    el.style.width = `${CELL_SIZE}px`;
    el.style.height = `${CELL_SIZE}px`;
    el.style.position = 'absolute';
    el.style.left = `${col * CELL_SIZE}px`;
    el.style.top = `${row * CELL_SIZE}px`;
    el.style.backgroundImage = `url('${skin}')`;
    el.style.backgroundSize = 'cover';
    el.style.zIndex = '12';
    gridContainer.appendChild(el);

    grid[index].solid = true;
    grid[index].monster = {
        hp: hp,
        damage: damage,
        element: el,
        lastHitTime: -1000,
        reward: options.reward,
        defeatMessage: options.defeatMessage,
        difficultyName: options.difficultyName,
        isFirey: options.isFirey,
        isVaultSlime: options.isVaultSlime,
        isArenaEnemy: options.isArenaEnemy,
        isCloakFight: options.isCloakFight
    };
}

function getridof(item) {
    if (item1 === item) item1 = 'nothing'; else if (item2 === item) item2 = 'nothing';
    else if (item3 === item) item3 = 'nothing'; else if (item4 === item) item4 = 'nothing';
    else if (item5 === item) item5 = 'nothing';
    equipped = 'nothing'; return;
}

// =============================
// SHOOT
// =============================
function shoot(row, col) {
    const index = row * cols + col;
    const cell = grid[index];
    let damage = 0;
    const now = performance.now();

    if (equipped === 'Note') {
    showMessage("You decide to respect Jay's privacy and not read the note.", "cyan");
    return;
 }  else if (equipped === 'Fish') {
        hp += 5; updateUI(); showMessage("You ate a fish.", "green");
        getridof('Fish');
    } else if (equipped === 'Energy Bar') {
        hp += 10; updateUI(); showMessage("You ate an energy bar. You feel energized!", "green");
        getridof('Energy Bar');
    } else if (equipped.startsWith('Beef Jerky')) {
        hp += 4; updateUI(); showMessage("You ate some Beef Jerky.", "green");
        let nextName = 'nothing';
        if (equipped === 'Beef Jerky') { nextName = 'Beef Jerky (4)'; }
        else { const match = equipped.match(/\((\d+)\)/); if (match) { const uses = parseInt(match[1], 10); if (uses > 1) nextName = `Beef Jerky (${uses - 1})`; } }
        getridof('Beef Jerky');
    } else if (equipped === 'Money Bar') {
        hp += 10; money += 10; updateUI(); showMessage("You ate a Money Bar. +$10", "green");
        getridof('Money Bar');
    } else if (equipped === 'Kombucha') {
        hp += 10; updateUI(); showMessage("You drank Kombucha.", "green");
        getridof('Kombucha');
    } else if (equipped === 'Grenade') {
        showMessage("BOOM", "red");
        if (item1 === 'Grenade') item1 = 'nothing'; else if (item2 === 'Grenade') item2 = 'nothing';
        else if (item3 === 'Grenade') item3 = 'nothing'; else if (item4 === 'Grenade') item4 = 'nothing';
        else if (item5 === 'Grenade') item5 = 'nothing';
        equipped = 'nothing'; return;
    } else if (equipped === 'Bop it!') {
        showMessage("You bopped it! You are filled with a sense of joy!", "gold");
    // FIX 2: Added 'Slice with Pineapple' to the pizza eating list
    } else if (['Slice with Cheese', 'Slice with Pepperoni', 'Slice with Black Olives', 'Slice with Pineapple'].includes(equipped)) {
        hp += 10; updateUI(); showMessage("You ate a slice of pizza.", "gold");
        if (item1 === equipped) item1 = 'nothing'; else if (item2 === equipped) item2 = 'nothing';
        else if (item3 === equipped) item3 = 'nothing'; else if (item4 === equipped) item4 = 'nothing';
        else if (item5 === equipped) item5 = 'nothing';
        equipped = 'nothing'; return;
    } else if (equipped === 'Vanilla Ice Cream') {
        hp += 2; updateUI(); showMessage("You ate the Vanilla Ice Cream! You enjoyed it!");
        getridof('Vanilla Ice Cream');
    } else if (equipped === 'Chocolate Ice Cream') {
        hp += 2; updateUI(); showMessage("You ate the Chocolate Ice Cream! You enjoyed it!");
        getridof('Chocolate Ice Cream');
    }

    if (equipped === Pistol.name) damage = Pistol.damage;
    else if (equipped === Glock.name) damage = Glock.damage;
    else if (equipped === Sniper.name) damage = Sniper.damage;
    else if (equipped === AK47.name) damage = AK47.damage;
    else if (equipped === Uzi.name) damage = Uzi.damage;
    else if (equipped === M4.name) damage = M4.damage;
    else if (equipped === SMUB.name) damage = SMUB.damage;

    if (damage > 0 && blockShoot === false) showMessage("Bang!", "red");

    if (cell && cell.monster && damage > 0) {
        if (now - (cell.monster.lastHitTime || 0) < 300) return;
        cell.monster.lastHitTime = now;
        cell.monster.hp -= damage;

        if (cell.monster.hp <= 0) {
            const reward = cell.monster.reward ?? 20;
            showMessage(cell.monster.defeatMessage || `Monster defeated! +${reward} gold!`, "gold", true);
            money += reward;
            updateUI();

            if (cell.monster.isFirey) {
                gameFlags.fireyKilled = true;
                setCells(0, 18, 10, 18, '/assets/blocks/stone.png', { solid: false });
                setDoor2Cells(0, -1, 10, -1, 'ice_cream(outside)');
                setDoor2Cells(0, 19, 10, 19, 'main');
                setupDowntownNPCs();
            }
            if (cell.monster.isVaultSlime) {
                const remaining = grid.filter(c => c.monster && c.monster.isVaultSlime).length;
                if (remaining <= 1) {
                    gameFlags.vaultCleared = true;
                    setCell(10, 5, '/assets/blocks/door_bottom.png', {solid: false, isDoor: true, targetLevel: 'Bank'});
                    money += 100; updateUI();
                    showMessage("The door opens... You found $200 and gave half to Rob.", "green");
                }
            }
            if (cell.monster.isArenaEnemy) {
                arenaReturn = true;
                setCell(9, 5, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'Bank/Job Area' });
            }
            if (cell.monster.isCloakFight) {
                gameFlags.hasBoat = true;
                showMessage("Cloak Man: Impressive... The boat is docked at the cliffs. Head south to the island!", "green");
                setTimeout(() => loadLevel('downtown'), 2500);
            }

            if (cell.monster.element) cell.monster.element.remove();
            cell.monster = null;
            cell.solid = false;
        } else {
            showMessage(`Hit! HP: ${cell.monster.hp}`, "orange");
        }
    }
}

// =============================
// UTIL
// =============================
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

async function moveMonsterTo(startRow, startCol, targetRow, targetCol, duration) {
    const startIndex = startRow * cols + startCol;
    const startCell = grid[startIndex];
    if (!startCell || !startCell.monster) return;

    const monsterData = startCell.monster;
    const visual = monsterData.element;

    const queue = [{ r: startRow, c: startCol, path: [] }];
    const visited = new Set([`${startRow},${startCol}`]);
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let finalPath = null;

    while (queue.length > 0) {
        const { r, c, path } = queue.shift();
        if (r === targetRow && c === targetCol) { finalPath = path; break; }
        for (const [dr, dc] of directions) {
            const nr = r + dr; const nc = c + dc;
            const key = `${nr},${nc}`;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const idx = nr * cols + nc;
                if (!visited.has(key) && (!grid[idx].solid || (nr === targetRow && nc === targetCol))) {
                    visited.add(key);
                    queue.push({ r: nr, c: nc, path: [...path, { r: nr, c: nc }] });
                }
            }
        }
    }

    if (finalPath) {
        const stepDuration = duration / finalPath.length;
        visual.style.transition = `left ${stepDuration}ms linear, top ${stepDuration}ms linear`;
        let currentR = startRow; let currentC = startCol;

        for (const step of finalPath) {
            if (monsterData.hp <= 0) return;
            const oldIdx = currentR * cols + currentC;
            grid[oldIdx].solid = false; grid[oldIdx].monster = null;
            const nextIndex = step.r * cols + step.c;
            grid[nextIndex].solid = true; grid[nextIndex].monster = monsterData;
            if (player.x === step.c && player.y === step.r) {
                hp -= monsterData.damage; updateUI();
                showMessage(`Ouch! -${monsterData.damage} HP`, "red");
            }
            visual.style.left = `${step.c * CELL_SIZE}px`;
            visual.style.top = `${step.r * CELL_SIZE}px`;
            await new Promise(r => setTimeout(r, stepDuration));
            currentR = step.r; currentC = step.c;
        }
    }
}

function askedBoutJob() {
    canGetHired = true;
}

async function follow(startRow, startCol, stepSpeed = 300) {
    let r = startRow; let c = startCol;
    while (hp > 0) {
        const idx = r * cols + c;
        const cell = grid[idx];
        if (!cell || !cell.monster || cell.monster.hp <= 0) return;
        const targetR = player.y; const targetC = player.x;
        const dist = Math.abs(targetR - r) + Math.abs(targetC - c);
        if (dist === 0) { await new Promise(res => setTimeout(res, 500)); continue; }
        await moveMonsterTo(r, c, targetR, targetC, dist * stepSpeed);
        r = targetR; c = targetC;
    }
}

// =============================
// LOAD LEVEL
// =============================
async function loadLevel(levelName) {
    closeShop();
    currentLevel = levelName;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    if (levelName === 'main') {
        rows = 19;
        rfi = false;
        biry = false;
        cols = 19;
        icrx = 12;
        dtrx = 18;
        dtry = 5;
        icry = 6;
        if (isStart === true) {
            const tutorialMessages = [
                "Hello and welcome to 2D battle... Move with WASD keys and click on people to talk to them.",
                "Switch between inventory slots by pressing the number of the slot you want to select (1-5).",
                "Use weapons by equipping them and clicking on the square you want to attack!!!"
            ];
            for (const msg of tutorialMessages) {
                if (skipTutorial) break;
                showMessage(msg);
                await new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (skipTutorial) { clearInterval(interval); resolve(); }
                    }, 50);
                    setTimeout(() => { clearInterval(interval); resolve(); }, 3000);
                });
            }
            skipTutorial = false;
        }
        isStart = false;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        b1rx = 1; b1ry = 15;
        bjax = 10; bjay = 19;
        player.x = respawnx; player.y = respawny;

        setCell(16, 16, '/assets/blocks/sign.png', { isSign: true, message: "Welcome to Midday city.", solid: false });
        setCells(10, 16, 9, 14, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(7, 15, 9, 15, '/assets/blocks/wood.png', { solid: true });
        setCells(7, 14, 5, 16, '/assets/blocks/leaves.png', { solid: false, overhead: true });
        setCells(18, 7, 0, 11, '/assets/blocks/street_side.png', { solid: false });
        setCell(9, 9, '/assets/blocks/street_middle.png', { solid: false });
        setCell(15, 9, '/assets/blocks/street_middle.png', { solid: false });
        setCell(3, 9, '/assets/blocks/street_middle.png', { solid: false });
        setCells(9, 1, 13, 5, '/assets/blocks/brick.png', { solid: true });
        setCell(13, 3, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'store' });
        setCell(12, 3, '/assets/blocks/door_top.png', { solid: false, isDoor: true, targetLevel: 'store' });
        setCells(18, 7, 18, 11, '/assets/blocks/street_side.png', { solid: false });
        setDoor2Cells(19, 0, 19, 18, 'cliffs');
        setCells(18, 0, 18, 6, '/assets/blocks/stone.png', { solid: false });
        setCells(18, 12, 18, 18, '/assets/blocks/stone.png', { solid: false });
        setCells(0, 0, 18, 0, '/assets/blocks/stone.png', { solid: false });
        setDoor2Cells(0, -1, 18, -1, 'downtown');
        setCells(0, 18, 18, 18, '/assets/blocks/stone.png', { solid: false });
        setDoor2Cells(0, 19, 18, 19, 'building1');
        setCells(10, 2, 10, 4, '/assets/blocks/glass.png', { solid: true });
        setCell(14, 1, '/assets/blocks/sign.png', { isSign: true, message: "Store inside.", solid: false });
        setCells(0, 0, 0, 18, '/assets/blocks/stone.png', { solid: false });
        setDoor2Cells(-1, 0, -1, 18, 'Bank/Job Area');
        setCells(0, 7, 0, 11, '/assets/blocks/street_side.png', { solid: false });

        const georgeItems = [
            {name: 'Where is the bank?', customResponse: 'To the North. See ya around!'},
            {name: 'Where is the mall?', customResponse: 'Go east till you see a sign that says MCM. The mall is in there. See ya around!'},
            {name: 'Where is the casino', customResponse: 'To the East and then South. See ya around!'}
        ];
        if (!gameFlags.askedAboutIsland) {
            georgeItems.unshift({
                name: 'Where is the island?',
                customResponse: (() => {
                    gameFlags.askedAboutIsland = true;
                    return 'The island... Hmm. You need to get a boat to go there. Someone in town might have one.';
                })()
            });
        }
        setCell(4, 4, '/assets/npcs/george.png', {
            solid: true, isSign: true, message: "George: Hey there kid...",
            isShop: true, shopName: "What do you need help with:",
            shopItems: georgeItems
        });

    } else if (levelName === 'store') {
        rows = 11; cols = 11;
        respawnx = 3; respawny = 13;
        initiateGrid(rows, cols, '/assets/blocks/wood.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 5; player.y = 10;

        setCells(0, 0, 0, 10, '/assets/blocks/brick.png', { solid: true });
        setCells(10, 0, 10, 10, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 0, 10, 0, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 10, 10, 10, '/assets/blocks/brick.png', { solid: true });
        setCells(2, 3, 2, 7, '/assets/blocks/stone.png', { solid: true });
        setCell(1, 3, '/assets/blocks/stone.png', { solid: true });
        setCell(1, 7, '/assets/blocks/stone.png', { solid: true });
        setCell(1, 5, '/assets/npcs/ricky.png', {
            solid: true, isShop: true, shopName: "Ricky's Weapons",
            shopItems: [{name: 'Sniper', price: 100}, {name: 'Glock', price: 50}],
            isSign: true,
            message: ["Ricky: Hello and welcome to my store! (Click again)", "My name is Ricky. (Click again)", "What would you like to buy?"]
        });
        setCell(10, 5, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'main' });

    } else if (levelName === 'cliffs') {
        rows = 19; cols = 19;
        if (rfi === true) { showMessage("You return to the cliffs..."); }
        rfi = false;
        respawnx = 9; respawny = 17;
        initiateGrid(rows, cols, '/assets/blocks/grass.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 9; player.y = 1;

        setCells(9, 0, 9, 6, '/assets/blocks/grass_dirt.png', { solid: true });
        setCells(10, 7, 10, 13, '/assets/blocks/grass_dirt.png', { solid: true });
        setCells(11, 14, 11, 19, '/assets/blocks/grass_dirt.png', { solid: true });
        setCells(14, 0, 19, 19, '/assets/blocks/water.png', { solid: true });
        setCells(10, 0, 10, 6, '/assets/blocks/dirt.png', { solid: true });
        setCells(11, 0, 11, 13, '/assets/blocks/dirt.png', { solid: false });
        setCell(9, 8, '/assets/blocks/sign.png', { solid: false, isSign: true, message: 'The cliffs...' });
        setCells(12, 0, 14, 19, '/assets/blocks/dirt.png', { solid: true });
        setCells(0, 0, 0, 19, '/assets/blocks/grass.png', { solid: false });
        setCells(9, 4, 14, 4, '/assets/blocks/ladder.png');
        setDoor2Cells(-1, 0, -1, 19, 'main');
        setCell(3, 4, '/assets/npcs/farmer.png', { solid: true, isSign: true, message: 'Farmer: So peaceful, innit it. (sigh)' });

        if (gameFlags.hasBoat) {
            setCell(16, 4, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'island' });
            setCell(15, 4, '/assets/blocks/sign.png', { solid: false, isSign: true, message: 'You board the boat...' });
        } else {
            setCell(15, 4, '/assets/blocks/water.png', { solid: true, touchMessage: "The waves rush and you decide to go back up the ladder..." });
        }

    } else if (levelName === 'downtown') {
        rows = 11; cols = 19;
        respawnx = 1; respawny = 8;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = dtrx; player.y = dtry;

        setCells(0, 18, 10, 18, '/assets/blocks/stone.png', { solid: false });
        if (gameFlags.fireyKilled) setDoor2Cells(0, 19, 10, 19, 'main');
        if (gameFlags.fireyKilled) setDoor2Cells(0, -1, 10, -1, 'ice_cream(outside)');
        setCells(1, 0, 1, 14, '/assets/blocks/dirt.png', { solid: true });
        setCell(3, 13, '/assets/blocks/sign.png', { solid: false, isSign: true, message: 'Market...' });
        setCell(0, 14, '/assets/blocks/dirt.png', { solid: true });
        setCells(7, 2, 5, 4, '/assets/blocks/leaves.png', { solid: false, overhead: true });
        setCells(8, 3, 9, 3, '/assets/blocks/wood.png', { solid: true });

        dtrx = 18;
        dtry = 5;

        setupDowntownNPCs();
        if (!gameFlags.fireyKilled) {
            if (!gameFlags.downtownIntro) {
                showMessage(' A monster attacks! Fight back with your weapons!', 'red');
                gameFlags.downtownIntro = true;
            }
            spawnMonster(5, 5, 100, 20, '/assets/npcs/firey.png');
            const idx = 5 * cols + 5;
            if (grid[idx] && grid[idx].monster) grid[idx].monster.isFirey = true;
            follow(5, 5);
        } else {
            setupDowntownNPCs();
        }

    } else if (levelName === 'building1') {
        rows = 19; cols = 15;
        respawnx = 18; respawny = 15;
        msx = 1; msy = 17;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        if (biry === true) { player.y = 18; } else { player.x = b1rx; player.y = b1ry; }

        setCells(0, 0, 18, 0, '/assets/blocks/stone.png', { solid: false });
        setDoor2Cells(0, -1, 18, -1, 'main');
        setCells(15, 14, 18, 14, '/assets/blocks/stone.png', { solid: false });
        setDoor2Cells(15, 15, 18, 15, 'Midday_City_Mall');
        setCells(14, 7, 0, 14, '/assets/blocks/brick.png', { solid: true });
        setCells(12, 0, 12, 6, '/assets/blocks/modern_brick.png', { solid: true });
        setCell(14, 9, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'Building1(in)' });
        setCell(13, 9, '/assets/blocks/door_top.png', { solid: false, isDoor: true, targetLevel: 'Building1(in)' });
        setCell(15, 12, '/assets/blocks/sign.png', { solid: false, isSign: true, message: 'Midday City Mall is to the west. Casino is to the south.' });
        biry = false;

        let peterMsg = [];
        if (gameFlags.peterQuestComplete) {
            peterMsg = ["Peter: Thanks."];
        } else if ([item1, item2, item3, item4, item5].includes(Joes_Box.name)) {
            peterMsg = [
                "Peter: Oh a box? (Click again)",
                "It's a sorry note and $100 dollars. (Click again)",
                () => {
                    if (item1 === Joes_Box.name) item1 = 'nothing';
                    else if (item2 === Joes_Box.name) item2 = 'nothing';
                    else if (item3 === Joes_Box.name) item3 = 'nothing';
                    else if (item4 === Joes_Box.name) item4 = 'nothing';
                    money += 20; gameFlags.peterQuestComplete = true; updateUI();
                    const idx = 13 * cols + 4;
                    if (grid[idx]) { grid[idx].message = ["Peter: Thanks."]; grid[idx].messageIndex = 0; }
                    return "Peter: Thanks for doing that take $20.";
                }
            ];
        } else {
            peterMsg = [
                'Peter: Hey... (Click again)',
                'The name is Peter... (Click again)',
                'Ya see that building... (Click again)',
                'A man named Joe lives there. He bought it with money from my invention I made. (Click again)',
                () => {
                    const note = Peters_Note.name;
                    let slot = "";
                    if ([item1, item2, item3, item4, item5].includes(note)) return "Peter: Wait a minute!!! You already have the note.";
                    if (item1 === 'nothing') { item1 = note; slot = "1st"; }
                    else if (item2 === 'nothing') { item2 = note; slot = "2nd"; }
                    else if (item3 === 'nothing') { item3 = note; slot = "3rd"; }
                    else if (item4 === 'nothing') { item4 = note; slot = "4th"; }
                    else if (item5 === 'nothing') { item5 = note; slot = "5th"; }
                    if (slot) { updateUI(); return `Peter: Give him this note will ya? It's in your ${slot} inventory slot. Thanks!`; }
                    return "Peter: Your inventory is full!";
                }
            ];
        }
        setCells(18, 0, 18, 18, '/assets/blocks/modern_brick.png', { solid: true });
        setCell(13, 4, '/assets/npcs/peter.png', { solid: true, isSign: true, message: peterMsg });
        setCells(18, 4, 18, 7, '/assets/blocks/stone.png');
        setDoor2Cells(19, 4, 19, 7, 'casino_outside');

    } else if (levelName === 'Building1(in)') {
        rows = 11; cols = 11;
        b1rx = 9; b1ry = 15;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 5; player.y = 10;

        setCells(0, 0, 0, 10, '/assets/blocks/brick.png', { solid: true });
        setCells(10, 0, 10, 10, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 0, 10, 0, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 10, 10, 10, '/assets/blocks/brick.png', { solid: true });
        setCells(2, 3, 2, 7, '/assets/blocks/modern_brick.png', { solid: true });
        setCell(1, 3, '/assets/blocks/modern_brick.png', { solid: true });
        setCell(1, 7, '/assets/blocks/modern_brick.png', { solid: true });

        let joeMsg = [];
        if (gameFlags.peterQuestComplete) {
            joeMsg = ["Joe: Thanks."];
        } else if (gameFlags.givenNoteToJoe) {
            joeMsg = ["Joe: Please give that box to Peter."];
        } else if ([item1, item2, item3, item4, item5].includes(Peters_Note.name)) {
            joeMsg = [
                "Joe: GET OU- (Click again)",
                "A note you say??? Let me read it. (Click again)",
                () => {
                    if (item1 === Peters_Note.name) item1 = 'nothing';
                    else if (item2 === Peters_Note.name) item2 = 'nothing';
                    else if (item3 === Peters_Note.name) item3 = 'nothing';
                    else if (item4 === Peters_Note.name) item4 = 'nothing';
                    else if (item5 === Peters_Note.name) item5 = 'nothing';
                    const box = Joes_Box.name; let slot = "";
                    if (item1 === 'nothing') { item1 = box; slot = "1st"; }
                    else if (item2 === 'nothing') { item2 = box; slot = "2nd"; }
                    else if (item3 === 'nothing') { item3 = box; slot = "3rd"; }
                    else if (item4 === 'nothing') { item4 = box; slot = "4th"; }
                    else if (item5 === 'nothing') { item5 = box; slot = "5th"; }
                    gameFlags.givenNoteToJoe = true; updateUI();
                    const idx = 1 * cols + 5;
                    if (grid[idx]) { grid[idx].message = ["Joe: Please give that box to Peter."]; grid[idx].messageIndex = 0; }
                    if (slot) return `Joe: Oh... Please give him this box. Its in your ${slot} inventory slot.`;
                    return "Joe: Inventory full!";
                }
            ];
        } else {
            joeMsg = ["Joe: GET OUT OF MY BUILDING!!!"];
        }
        setCell(1, 5, '/assets/npcs/joe.png', { solid: true, isSign: true, message: joeMsg });
        setCell(10, 5, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'building1' });

    } else if (levelName === 'Midday_City_Mall') {
        rows = 19; cols = 19;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        b1rx = 13; b1ry = 17;
        player.x = msx; player.y = msy;

        setCells(0, 0, 18, 0, '/assets/blocks/stone.png', { solid: false });
        setDoor2Cells(0, -1, 18, -1, 'building1');
        setCells(13, 0, 3, 18, '/assets/blocks/brick.png', { solid: true });
        setCells(13, 7, 11, 11, '/assets/blocks/stone.png', { solid: false, isDoor: true, targetLevel: 'Midday_City_Mall(in)' });
        setCell(11, 8, '/assets/blocks/MCM_sign_1.png', { solid: false, isSign: true, message: 'Welcome to the Midday City Mall!' });
        setCell(11, 9, '/assets/blocks/MCM_sign_2.png', { solid: false, isSign: true, message: 'Welcome to the Midday City Mall!' });
        setCell(11, 10, '/assets/blocks/exclamation_sign.png', { solid: false, isSign: true, message: 'Welcome to the Midday City Mall!' });
        setCells(14, 18, 18, 18, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(18, 0, 18, 18, '/assets/blocks/modern_brick.png', { solid: true });

    } else if (levelName === 'Midday_City_Mall(in)') {
        rows = 21; cols = 21;
        msx = 9; msy = 14;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 10; player.y = 20;

        setCells(20, 0, 20, 20, '/assets/blocks/stone.png', { solid: false });
        setDoor2Cells(21, 9, 21, 11, 'Midday_City_Mall');
        setCells(20, 0, 20, 8, '/assets/blocks/brick.png', { solid: true });
        setCells(20, 12, 20, 20, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 0, 19, 0, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 20, 19, 20, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 1, 0, 19, '/assets/blocks/brick.png', { solid: true });
        setCells(4, 1, 4, 4, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(1, 4, 4, 4, '/assets/blocks/modern_brick.png', { solid: true });
        setCell(2, 2, '/assets/blocks/mall_kiosk.png', { isShop: true, solid: true, isSign: true, message: "Beep...", shopName: "MCM Weapons Kiosk", shopItems: [{name: 'AK47', price: 75}, {name: 'Uzi', price: 145}, {name: 'M4', price: 200}] });
        setCells(4, 16, 4, 19, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(1, 16, 3, 16, '/assets/blocks/modern_brick.png', { solid: true });
        setCell(2, 18, '/assets/blocks/mall_kiosk.png', { isShop: true, solid: true, isSign: true, message: "Beep...", shopName: "MCM Food Kiosk", shopItems: [{name: 'Beef Jerky', price: 15}, {name: 'Money Bar', price: 25}, {name: 'Kombucha', price: 5}] });
        setCells(1, 8, 4, 12, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(3, 9, 1, 11, '/assets/blocks/stone.png', { solid: false });
        setCell(2, 10, '/assets/blocks/mall_kiosk.png', { isShop: true, solid: true, isSign: true, message: "Beep...", shopName: "MCM Clothes Kiosk", shopItems: [{name: 'Street Wear', price: 30}, {name: 'Jersey', price: 30}, {name: 'White Tuxedo', price: 30}] });
        setCells(15, 7, 15, 13, '/assets/blocks/brick.png', { solid: true });
        setCells(9, 7, 9, 13, '/assets/blocks/brick.png', { solid: true });
        setCells(9, 7, 15, 7, '/assets/blocks/brick.png', { solid: true });
        setCells(9, 13, 15, 13, '/assets/blocks/brick.png', { solid: true });
        setCells(14, 8, 10, 12, '/assets/blocks/water.png', { solid: true, isShop: true, shopName: "Wishing Fountain", shopItems: [{name: 'Throw Coin', price: 1}] });

    } else if (levelName === 'Bank/Job Area') {
        rows = 21; cols = 21;
        respawnx = 9; respawny = 1;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = bjax; player.y = bjay;
        if (arenaReturn) { player.x = 0; player.y = 7; arenaReturn = false; }

        setCell(5, 1, '/assets/blocks/sign.png', { solid: true, isSign: true, message: 'Battle Arena entrance is right beside me! Fight if you dare!' });
        setCells(9, 0, 5, 0, '/assets/blocks/stone.png', { solid: false, isShop: true, isArenaEntrance: true, shopName: "Enter the Arena?", shopItems: [{name: 'Enter Arena'}] });
        setCell(6, 1, '/assets/blocks/stone.png', { solid: false });
        setCells(4, 0, 4, 20, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(20, 0, 20, 20, '/assets/blocks/stone.png', { solid: false });
        setDoor2Cells(21, 0, 21, 20, 'main');
        setCells(0, 3, 8, 17, '/assets/blocks/brick.png', { solid: true });
        setCells(8, 9, 6, 11, '/assets/blocks/stone.png', { solid: false, isDoor: true, targetLevel: 'Bank' });
        setCell(5, 8, '/assets/blocks/B_sign.png', { solid: true, isSign: true, message: 'Midday Bank' });
        setCell(5, 9, '/assets/blocks/A_sign.png', { solid: true, isSign: true, message: 'Midday Bank' });
        setCell(5, 10, '/assets/blocks/N_sign.png', { solid: true, isSign: true, message: 'Midday Bank' });
        setCell(5, 11, '/assets/blocks/K_sign.png', { solid: true, isSign: true, message: 'Midday Bank' });
        setCell(5, 12, '/assets/blocks/exclamation_sign.png', { solid: true, isSign: true, message: 'Midday Bank' });
        setCells(17, 0, 10, 4, '/assets/blocks/brick.png', { solid: true });
        setCell(17, 2, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'Pizza Place' });
        setCell(16, 2, '/assets/blocks/door_top.png', { solid: false, isDoor: true, targetLevel: 'Pizza Place' });
        setCell(14, 2, '/assets/blocks/lukes_pizza_sign.png', { solid: true, isSign: true, message: 'Lukes Pizza: Best in the West!' });
        setCells(20, 17, 19, 19, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(19, 18, 18, 18, '/assets/blocks/wood.png', { solid: true });
        setCells(17, 17, 15, 19, '/assets/blocks/leaves.png', { solid: false, overhead: true });

        let robMsg = [];
        if (gameFlags.vaultCleared) {
            robMsg = ["Rob: Thanks. Remember don't rat to the cops."];
        } else if (gameFlags.robQuestAccepted) {
            robMsg = ["Rob: Go do it!"];
        } else {
            robMsg = [
                'Rob: Hey there! (Click Again)',
                'The name is Rob, as in: Rob a bank. (Click Again)',
                'Speaking of robbing banks I have a business opportunity for you. (Click Again)',
                'You could make a lot of money (Click Again)',
                'If you rob the bank for me I will give you 50 percent of the money! (Click Again)',
                () => {
                    setTimeout(() => openShop([{name: 'I am in!'}, {name: 'No way!'}], "Help Rob?"), 500);
                    return 'Why do I get 50 percent? Because I discovered the route into the bank. You in?';
                }
            ];
        }
        setCell(11, 18, '/assets/npcs/rob.png', { solid: true, isSign: true, message: robMsg });

    } else if (levelName === 'Bank') {
        rows = 13; cols = 23;
        bjax = 10; bjay = 9;
        initiateGrid(rows, cols, '/assets/blocks/wood.png', gridContainer);
        player.x = 11; player.y = 10;
        if (!playerElement) createPlayer(gridContainer);

        setCells(12, 0, 12, 22, '/assets/blocks/wood.png', { solid: false });
        setDoor2Cells(13, 0, 13, 22, 'Bank/Job Area');
        setCells(0, 9, 3, 9, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(0, 13, 3, 13, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(3, 9, 3, 13, '/assets/blocks/modern_brick.png', { solid: true });
        setCell(0, 17, '/assets/blocks/door_bottom.png', { solid: true, isLockedDoor: true, targetLevel: 'Bank_Vault' });
        setCell(1, 11, '/assets/npcs/jay.png', {
            solid: true, isSign: true,
            message: ['Jay: Hey... (Click again)', 'Welcome to the bank. (Click Again)', 'What can I help you with?'],
            isShop: true, shopName: "Jay: What can I help you with?",
            shopItems: [{name: 'Add Money'}, {name: 'Take Money'}, {name: 'Why should I put money here?', customResponse: "Jay: Every minute, you get $1 for every $20 in the bank! You can earn a lot!"}, {name: 'Can I help you with anything?', customResponse: 'Well, you could give my son Fred this note! He is downtown at the market!'}]
        });

        let cloakMsg = ["Cloak Man: Hey there. (Click Again)", "I'm the Cloak Man. I sell stuff downtown. You might see me there. (Click Again)", "Anyway you wanna buy someth- (Click Again)", "Jay (Bank Guy): Hey!!! Are you talking to random people again! (Click Again)", "Cloak Man: Don't listen to him. Now you wanna buy something or not."];
        let isCloakShop = true;
        if (ownedFits.includes("Your very own cloak!!!")) {
            cloakMsg = ["Cloak Man: Hi."];
            isCloakShop = false;
        }
        const bankCloakItems = [{name: 'Your very own cloak!!!', price: 20}];
        if (gameFlags.talkedToLuke && !gameFlags.hasBoat) bankCloakItems.push({name: 'Fight for the boat'});

        setCell(6, 1, '/assets/npcs/cloak_man.png', {
            solid: true, isSign: true, message: cloakMsg,
            isShop: isCloakShop, shopName: "Cloak Man",
            shopItems: bankCloakItems
        });

    } else if (levelName === 'Pizza Place') {
        rows = 13; cols = 13;
        bjax = 2; bjay = 18;
        initiateGrid(rows, cols, '/assets/blocks/wood.png', gridContainer);
        player.x = 6; player.y = 11;
        if (!playerElement) createPlayer(gridContainer);

        setCells(12, 5, 12, 0, '/assets/blocks/brick.png', { solid: true });
        setCells(12, 7, 12, 12, '/assets/blocks/brick.png', { solid: true });
        setCell(12, 6, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'Bank/Job Area' });
        setCells(0, 4, 2, 4, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 8, 2, 8, '/assets/blocks/brick.png', { solid: true });
        setCells(2, 4, 2, 8, '/assets/blocks/brick.png', { solid: true });

        // FIX 1: Added missing comma after Black Olives + added Pineapple slice
        const lukeItems = [
            {name: 'Slice with Cheese', price: 10},
            {name: 'Slice with Pepperoni', price: 10},
            {name: 'Slice with Black Olives', price: 10},
            {name: 'Slice with Pineapple', price: 12}
        ];
        if (gameFlags.askedAboutIsland && !gameFlags.hasBoat) {
            lukeItems.push({
                name: 'Do you have a boat I can borrow?',
                customResponse: (() => {
                    gameFlags.talkedToLuke = true;
                    return 'Hmm... I would, but Cloak Man is borrowing it. He hangs around downtown and the bank. Ask him!';
                })()
            });
        }
        setCell(1, 6, '/assets/npcs/luke.png', {
            solid: true, isSign: true,
            message: 'Luke: Welcome to Lukes pizza. We are the best in the west! (Click Again)',
            isShop: true, shopName: 'Lukes Pizza', shopItems: lukeItems
        });

    } else if (levelName === 'Bank_Vault') {
        rows = 11; cols = 11;
        initiateGrid(rows, cols, '/assets/blocks/modern_brick.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 5; player.y = 9;

        setCells(0, 0, 10, 0, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 0, 0, 10, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 10, 10, 10, '/assets/blocks/brick.png', { solid: true });
        setCells(10, 0, 10, 10, '/assets/blocks/brick.png', { solid: true });

        if (gameFlags.vaultCleared) {
            setCell(10, 5, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'Bank' });
            setCell(5, 5, '/assets/blocks/sign.png', { isSign: true, message: "Chunk!!! You opened the vault!" });
        } else {
            setCell(10, 5, '/assets/blocks/brick.png', { solid: true });
            spawnMonster(3, 3, 30, 5, '/assets/npcs/slime.png');
            if (grid[3 * cols + 3].monster) { grid[3 * cols + 3].monster.isVaultSlime = true; follow(3, 3); }
            spawnMonster(3, 8, 30, 5, '/assets/npcs/slime.png');
            if (grid[3 * cols + 8].monster) { grid[3 * cols + 8].monster.isVaultSlime = true; follow(3, 8); }
            showMessage("Ambush! Defeat the slimes!", "red");
        }

    } else if (levelName === 'Arena') {
        rows = 10; cols = 10;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 5; player.y = 8;

        setCells(0, 0, 0, 9, '/assets/blocks/brick.png', { solid: true });
        setCells(9, 0, 9, 9, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 0, 9, 0, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 9, 9, 9, '/assets/blocks/brick.png', { solid: true });
        setCell(9, 5, '/assets/blocks/brick.png', { solid: true });

        const difficulty = ARENA_DIFFICULTIES[Math.floor(Math.random() * ARENA_DIFFICULTIES.length)];
        const skin = ARENA_ENEMY_SKINS[Math.floor(Math.random() * ARENA_ENEMY_SKINS.length)];

        spawnMonster(3, 5, difficulty.hp, difficulty.damage, skin, {
            reward: 10,
            defeatMessage: `Arena enemy defeated! +10 coins!`,
            difficultyName: difficulty.name
        });
        if (grid[3 * cols + 5].monster) grid[3 * cols + 5].monster.isArenaEnemy = true;
        follow(3, 5, difficulty.speed);
        showMessage(`Arena fight! ${difficulty.name} enemy. Win $10!`, "orange");

    } else if (levelName === 'CloakFight') {
        rows = 10; cols = 10;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 5; player.y = 8;

        setCells(0, 0, 0, 9, '/assets/blocks/brick.png', { solid: true });
        setCells(9, 0, 9, 9, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 0, 9, 0, '/assets/blocks/brick.png', { solid: true });
        setCells(0, 9, 9, 9, '/assets/blocks/brick.png', { solid: true });

        showMessage("Cloak Man: Let's go then!!!", "red");
        spawnMonster(2, 5, 60, 12, '/assets/npcs/cloak_man.png', {
            reward: 0,
            defeatMessage: "Cloak Man: Impressive... Take the boat. The island is south of the cliffs.",
            isCloakFight: true
        });
        if (grid[2 * cols + 5].monster) grid[2 * cols + 5].monster.isCloakFight = true;
        follow(2, 5);

    } else if (levelName === 'casino_outside') {
        rows = 11; cols = 11;
        biry = true;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        if (casinoOutsideReturn) { player.x = 5; player.y = 10; casinoOutsideReturn = false; }
        else { player.x = 5; player.y = 0; }

        setCells(4, 0, 4, 10, '/assets/blocks/leaves.png', { solid: true });
        setCells(0, 4, 10, 6, '/assets/blocks/modern_brick.png');
        setCells(5, 3, 10, 0, '/assets/blocks/brick.png', { solid: true });
        setCells(5, 7, 10, 10, '/assets/blocks/brick.png', { solid: true });
        setCell(1, 1, '/assets/npcs/ricky.png', {
            solid: true, isShop: true,
            shopName: 'Ricky: Good luck in there!',
            shopItems: [{name: 'Okay', customResponse: 'Ricky: Good luck in the casino, kid.'}],
            isSign: true,
            message: ["Ricky: Hi! (Click Again)", 'I am Ricky, and I own a weapons store. (Click Again)', 'I lost my money at the casino down there. (Click Again)', 'I got kicked out because I found out a big secret. (Click Again)', 'If you get a high score on the machine and make your name on the scoreboard Jimothy you get a bonus 50 dollars! See ya around kid.']
        });
        setDoor2Cells(-1, 4, -1, 6, 'building1');
        setDoor2Cells(11, 4, 11, 6, 'casino');

    } else if (levelName === 'casino') {
        rows = 13; cols = 13;
        biry = true;
        initiateGrid(rows, cols, '/assets/blocks/red_rug.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 6; player.y = 1;

        setCells(0, 5, 0, 7, '/assets/blocks/modern_brick.png');
        setDoor2Cells(-1, 5, -1, 7, "casino_outside");
        setCells(12, 4, 11, 8, '/assets/blocks/modern_brick.png', { solid: true });
        setCells(12, 5, 12, 7, '/assets/blocks/red_rug.png');
        // FIX 3: 'Are you hiring?' has no customResponse — handled in buyItem so the
        // inventory check runs at click time, not at level-load time.
        setCell(12, 6, '/assets/npcs/lee.png', {
            solid: true, isSign: true,
            message: ['Lee: Hello. I am Lee. (Click Again)', 'Welcome to my casino! Have a good time!'],
            isShop: true,
            shopName: 'What do you ask Lee?',
            shopItems: [
                {name: 'How do I gamble here?', customResponse: 'Lee: Click on a machine and you may lose $10 or win $10. If you win you have to enter a name for the casino scoreboard.'},
                {name: 'Are you hiring?', cost: 0}
            ]
        });
        spawnStructure('slotMachine', 4, 1);
        spawnStructure('slotMachine', 7, 1);
        spawnStructure('slotMachine', 10, 1);
        spawnStructure('slotMachine', 4, 10);
        spawnStructure('slotMachine', 7, 10);
        spawnStructure('slotMachine', 10, 10);

    } else if (levelName === "island") {
        rows = 13; cols = 13;
        rfi = true;
        initiateGrid(rows, cols, '/assets/blocks/water.png', gridContainer, {touchMessage: 'You go for a nice swim...'});
        setCells(0, 13, 13, 0, '/assets/blocks/water.png', {solid: true});
        showMessage("You arrive at the island from the boat. Waves rush...");
        player.x = 7;
        player.y = 7;
        setCells(11, 1, 3, 10, '/assets/blocks/grass.png');
        setCells(11, 1, 11, 10, '/assets/blocks/grass_dirt.png', {solid: true});
        setCells(5, 10, 3, 8, '/assets/blocks/water.png', {solid: true});
        setCells(4, 8, 5, 9, '/assets/blocks/grass.png');
        setCell(4, 9, '/assets/blocks/water.png', {solid: true});
        if (has_found_treasure === false) {
            setCell(7, 6, '/assets/blocks/chest.png', {
                solid: true,
                isSign: true,
                message: [
                    () => {
                        findDaCash();
                        return "You opened the chest and found $2000!";
                    }
                ]
            });
        }
        setCell(2, 4, '/assets/blocks/door_bottom.png', { solid: false, touchMessage: 'You board the boat...' });
        setCell(1, 4, '/assets/blocks/sign.png', {
            solid: false, isSign: true,
            message: 'You board the boat...', isDoor: true,
            targetLevel: 'cliffs',
        });

    } else if (levelName === 'ice_cream(outside)') {
        rows = 13;
        cols = 13;
        dtrx = 0;
        dtry = 5;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = icrx; player.y = icry;
        icrx = 12;
        icry = 6;
        setCells(6, 0, 0, 8, '/assets/blocks/brick.png', {solid: true});
        setCells(6, 1, 4, 2, '/assets/blocks/stone.png', {isDoor: true, targetLevel: 'ice_cream'});
        setCells(4, 1, 4, 2, '/assets/blocks/ice_cream_sign.png', {isSign: true, message: 'Ice Cream Shop'});
        setDoor2Cells(0, 13, 12, 13, 'downtown');

    } else if (levelName === 'ice_cream') {
        rows = 9;
        cols = 9;
        initiateGrid(rows, cols, '/assets/blocks/pink_tile.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 4; player.y = 8;
        icrx = 1;
        icry = 7;
        setCells(2, 0, 0, 3, '/assets/blocks/modern_brick.png', {solid: true});
        setCells(1, 0, 0, 2, '/assets/blocks/pink_tile.png');
        setCell(1, 1, '/assets/npcs/alexi.png', {
            isSign: true,
            message: [
                () => {
                    askedBoutJob();
                    return "Alexi: Welcome to my Ice Cream store, how can I help you?";
                }
            ],
            isShop: true, shopName: 'Alexi: How can I help you today?',
            shopItems: [{name: 'Vanilla Ice Cream', price: 5}, {name: 'Chocolate Ice Cream', price: 5}, {name: 'Are you hiring?', customResponse: 'Nah, but I bet that you could get a job at the casino...'}]
        });
        setDoor2Cells(9, 0, 9, 8, 'ice_cream(outside)');
    }

    if (!cursorImage) setupCrosshair(gridContainer);
    if (playerElement) {
        playerElement.style.left = `${player.x * CELL_SIZE}px`;
        playerElement.style.top = `${player.y * CELL_SIZE}px`;
    }
}

// =============================
// SHOP
// =============================
function openShop(items, shopName) {
    if (messageBlocking) return;
    if (document.getElementById('shop-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'shop-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    overlay.style.padding = '20px';
    overlay.style.border = '2px solid white';
    overlay.style.borderRadius = '10px';
    overlay.style.zIndex = '10001';
    overlay.style.textAlign = 'center';
    overlay.style.color = 'white';
    overlay.style.fontFamily = '"Lora", serif';

    const title = document.createElement('h2');
    title.textContent = shopName || "Shop";
    overlay.appendChild(title);

    const createBtn = (text, onClick) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.display = 'block';
        btn.style.margin = '10px auto';
        btn.style.padding = '10px 20px';
        btn.style.fontSize = '18px';
        btn.style.cursor = 'pointer';
        btn.onclick = onClick;
        return btn;
    };

    if (items && Array.isArray(items)) {
        items.forEach(item => {
            let btnText = item.name;
            if (item.price !== undefined) btnText += ` ($${item.price})`;
            overlay.appendChild(createBtn(btnText, () => buyItem(item.name, item.price, item.customResponse)));
        });
    }
    overlay.appendChild(createBtn('Close', () => closeShop()));
    document.body.appendChild(overlay);
}

function closeShop() {
    const overlay = document.getElementById('shop-overlay');
    if (overlay) document.body.removeChild(overlay);
}

function buyItem(name, cost, customResponse) {

    if (customResponse) {
        showMessage(customResponse);
    }

    if (name === 'Fight for the boat') {
        closeShop();
        showMessage("Cloak Man: Oh you want the boat? You'll have to beat me first!", "red");
        setTimeout(() => loadLevel('CloakFight'), 1500);
        return;
    }

    if (name === 'Can I help you with anything?') {
        bought = false;
        if (item1 === 'nothing') { item1 = "Note"; bought = true; }
        else if (item2 === 'nothing') { item2 = "Note"; bought = true; }
        else if (item3 === 'nothing') { item3 = "Note"; bought = true; }
        else if (item4 === 'nothing') { item4 = "Note"; bought = true; }
        else if (item5 === 'nothing') { item5 = "Note"; bought = true; }
        if (bought) {  closeShop(); return; }
        showMessage("Inventory full!", "red");
    }

    if (name === 'Give the note!') {
    if (item1 === 'Note') item1 = 'nothing';
    else if (item2 === 'Note') item2 = 'nothing';
    else if (item3 === 'Note') item3 = 'nothing';
    else if (item4 === 'Note') item4 = 'nothing';
    else if (item5 === 'Note') item5 = 'nothing';
    equipped = 'nothing';
    money += 10;
    hasNoteFromJay = false;
    gameFlags.gaveNoteToFred = true;
    updateUI();
    showMessage("Fred: Thanks so much! Here's $10!", "gold");
    getridof('Note');
    setCell(0, 9, '/assets/npcs/fred.png', {
            solid: true, isShop: true, shopName: "Fred's Stuff",
            shopItems: [{name: 'Bop it!', price: 17}],
            isSign: true, message: ["Fred: Hi. (Click again)", "My name is Fred and I only have one thing to sell. Sorry 😞"]
        });
    closeShop();
    return;
}

    if (customResponse) {
        showMessage(customResponse, "white");
        closeShop();
        return;
    }
    if (name === 'Enter Arena') {
        closeShop();
        loadLevel('Arena');
        return;
    }
    // FIX 3: Lee hiring — checked here at click time so inventory is current
    if (name === 'Are you hiring?') {
    if (agpp === true) {
        showMessage('Lee: I already said I hired you, thanks for the pizza. Work is next year! HAHAHA');
    } else if ([item1, item2, item3, item4, item5].includes('Slice with Pineapple')) {
        getridof('Slice with Pineapple');
        job = 'Casino Worker';
        updateUI();
        showMessage("Lee: You have Pineapple pizza?! A man of culture. You're hired! I'm taking the pizza also.", "gold", true);
        agpp = true;
    } else {
        showMessage("Lee: I will hire you if you bring me a slice of pineapple pizza.", "white");
    }
    closeShop();
    return;
}
    if (name === 'Yes') {
        closeShop();
        if (money < 10) { showMessage("Not enough money to gamble!", "red"); return; }
        if (Math.random() < 0.1) {
            money += 10; updateUI(); showMessage("You won!", "gold");
            const scoreName = prompt("Enter a name for the scoreboard:");
            if (scoreName === "jimothy") {
                if (gameFlags.jimothyCheatUsed) { showMessage("You already did that cheat!", "red"); }
                else { gameFlags.jimothyCheatUsed = true; money += 50; updateUI(); showMessage("You found a secret. You got 50 coins!", "gold"); }
            }
        } else { money -= 10; updateUI(); showMessage("You lost 10 coins.", "red"); }
        return;
    }
    if (name === 'I am in!') {
        let slot = "";
        if (item1 === 'nothing') { item1 = Key.name; slot = "1st"; }
        else if (item2 === 'nothing') { item2 = Key.name; slot = "2nd"; }
        else if (item3 === 'nothing') { item3 = Key.name; slot = "3rd"; }
        else if (item4 === 'nothing') { item4 = Key.name; slot = "4th"; }
        else if (item5 === 'nothing') { item5 = Key.name; slot = "5th"; }
        if (slot) {
            gameFlags.robQuestAccepted = true; updateUI();
            showMessage(`Rob: Here is the key. It's in your ${slot} slot.`, "green");
            const robCell = grid.find(c => c.bg && c.bg.includes('rob.png'));
            if (robCell) { robCell.message = ["Rob: Go do it!"]; robCell.messageIndex = 0; }
        } else { showMessage("Rob: You don't have space for the key!", "red"); }
        closeShop(); return;
    }
    if (name === 'No way!') { showMessage("Rob: Your loss.", "white"); closeShop(); return; }
    if (name === '1 Doller' && money >= 10) {
        money -= 9; updateUI();
        showMessage("Cloak Man: Imagine falling for that scam! (Hahaha)", "green");
        closeShop(); return;
    }
    if (name === 'Throw Coin') {
        if (money >= cost) {
            money -= cost;
            if (Math.random() < 0.1) { money += 5; showMessage("✨ The Water Spirits have blessed you! +$5 ✨", "gold"); }
            else { showMessage("You threw a coin... nothing happened.", "white"); }
            updateUI(); closeShop();
        } else { showMessage("Not enough money to make a wish!", "red"); }
        return;
    }
    if (name === 'Add Money') {
        closeShop();
        setTimeout(() => openShop([{name: 'Deposit $10'},{name: 'Deposit $20'},{name: 'Deposit $50'},{name: 'Deposit $100'},{name: 'Deposit All'}], "Select Deposit Amount"), 100);
        return;
    }
    if (name.startsWith('Deposit $')) {
        const amount = parseInt(name.replace('Deposit $', ''));
        if (money >= amount) { money -= amount; bankMoney += amount; localStorage.setItem('bankMoney', bankMoney); updateUI(); showMessage(`Deposited $${amount}.`, "green"); }
        else { showMessage("Not enough cash!", "red"); }
        closeShop(); return;
    }
    if (name === 'Deposit All') {
        if (money > 0) { const amount = money; money = 0; bankMoney += amount; localStorage.setItem('bankMoney', bankMoney); updateUI(); showMessage(`Deposited $${amount}.`, "green"); }
        else { showMessage("No cash to deposit!", "red"); }
        closeShop(); return;
    }
    if (name === 'Take Money') {
        if (bankMoney > 0) { const amount = bankMoney; money += amount; bankMoney = 0; localStorage.setItem('bankMoney', bankMoney); updateUI(); showMessage(`Withdrew all $${amount}.`, "green"); }
        else { showMessage("Bank is empty!", "red"); }
        closeShop(); return;
    }
    if (money >= cost) {
        const validFits = ["Casual", "Street Wear", "Jersey", "White Tuxedo", "Your very own cloak!!!"];
        if (validFits.includes(name)) {
            if (!ownedFits.includes(name)) { money -= cost; ownedFits.push(name); updateUI(); showMessage(`Bought ${name}! Press E to change fit.`, "green"); }
            else { showMessage("You already own this outfit!", "orange"); }
            closeShop(); return;
        }
        let bought = false;
        if (item1 === 'nothing') { item1 = name; bought = true; }
        else if (item2 === 'nothing') { item2 = name; bought = true; }
        else if (item3 === 'nothing') { item3 = name; bought = true; }
        else if (item4 === 'nothing') { item4 = name; bought = true; }
        else if (item5 === 'nothing') { item5 = name; bought = true; }
        if (bought) { money -= cost; updateUI(); showMessage(`Bought ${name}!`, "green"); closeShop(); return; }
        showMessage("Inventory full!", "red");
    } else {
        showMessage("Not enough money!", "red");
    }
}

// =============================
// DOWNTOWN NPCs
// =============================
function setupDowntownNPCs() {
    let cloakMsg = ["Cloak Man: I am the cloak man from the world's beyond. (Click again)", "I sell mystical items here... (Click again)", "I collect them from other universes!"];
    if (fit === "Your very own cloak!!!") cloakMsg.unshift("Cloak Man: Nice robe. (Click again)");

    if (gameFlags.fireyKilled) {
        const downtownCloakItems = [
            {name: 'Fish', price: 5},
            {name: 'SMUB', price: 2000},
            {name: '1 Doller', price: 10}
        ];
        if (gameFlags.talkedToLuke && !gameFlags.hasBoat) downtownCloakItems.push({name: 'Fight for the boat'});

        setCell(0, 1, '/assets/npcs/cloak_man.png', {
            solid: true, isShop: true,
            shopName: "Magic Shop (Items aren't really magic)",
            shopItems: downtownCloakItems,
            isSign: true, message: cloakMsg
        });
        setCell(0, 5, '/assets/npcs/bobby.png', {
            solid: true, isShop: true, shopName: "Bobby's Finds",
            shopItems: [{name: 'Grenade', price: 13}, {name: 'Energy Bar', price: 10}],
            isSign: true, message: ["Bobby: Hey! (Click again)", "I'm Bobby, and I sell some stuff me and my dad find! (Click again)", "Take a look!"]
        });
        setCell(0, 9, '/assets/npcs/fred.png', {
            solid: true, isShop: true, shopName: "Fred's Stuff",
            shopItems: [{name: 'Bop it!', price: 17}],
            isSign: true, message: ["Fred: Hi. (Click again)", "My name is Fred and I only have one thing to sell. Sorry 😞"]
        });
        if (item1 === 'Note' || item2 === 'Note' || item3 === 'Note' || item4 === 'Note' || item5 === 'Note') {
            hasNoteFromJay = true;
            setCell(0, 9, '/assets/npcs/fred.png', {
            solid: true, isShop: true, shopName: "Fred's Stuff",
            shopItems: [{name: 'Bop it!', price: 17}, {name: 'Give the note!', customResponse: 'Thanks! For giving me this. Take ten dollars!'}],
            isSign: true, message: ["Fred: Hi. (Click again)", "My name is Fred and I only have one thing to sell. Sorry 😞"]
        });
        }
    } else {
        setCell(0, 1, '/assets/npcs/cloak_man.png', { solid: true, isShop: false, isSign: true, message: "Cloak Man: hahaha, i like monsters" });
        setCell(0, 5, '/assets/npcs/bobby.png', { solid: true, isShop: false, isSign: true, message: "Bobby: AHHH.. MONSTER!!!" });
        setCell(0, 9, '/assets/npcs/fred.png', { solid: true, isShop: false, isSign: true, message: "Fred: AHHH.. MONSTER!!!" });
    }
}