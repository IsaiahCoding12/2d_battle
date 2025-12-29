// engine.js - complete version
// - shooting only on non-solid cells (cell clicks)
// - item1 is Pistol.name
// - no duplicate Weapon class
// - fixed idx bug
// - animation hub prevents white flash

// -----------------------------
// CONFIG / GLOBALS
// -----------------------------
const CELL_SIZE = 40;

let respawnx = 9;
let respawny = 9;


let hp = 100;
let money = 50;
let gameFlags = {};

let playerElement = null;
let cursorImage = null;
let gridContainer = null;

let mouseRow = null;
let mouseCol = null;
let showCoords = false;
 
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
let grid = []; // array of cell metadata length rows*cols
const keysPressed = {};

let animations = []; // { from, to, toggle }
let animationIntervalId = null;
let messageTimeoutId = null;
let messageBlocking = false;
let blockShoot = false;

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
const Sniper = new Weapon("Sniper", 100);
const SMUB = new Weapon('Super-Mega-Ultra-Blaster!!!!', 1000000000000);
const Grenade = new Weapon('Grenade', 35);
const Peters_Note = new Weapon('Peters Note', 0);
const Joes_Box = new Weapon('Joes Box', 0);

// inventory items (item1 uses actual pistol name)
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
    // UI elements (assumes these IDs exist in your HTML)
    updateUI();

    createMessageBox()
    createCoordsDisplay();

    gridContainer = document.querySelector(".grid");
    if (!gridContainer) {
        // no grid container — silently return (avoid console spam)
        return;
    }
    gridContainer.style.position = "relative";
    gridContainer.style.userSelect = "none";

    // Build grid data + DOM
    loadLevel('main');

    // start anims (water)
    addAnimation("/assets/blocks/water.png", "/assets/blocks/water_2.png");
    startAnimationHub();

    //setTimeout(() => moveMonsterTo(4, 17, 8, 5, 3000), 1000);

    // movement keys
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);


    // start loop
    requestAnimationFrame(gameLoop);
});

// =============================
// PLAYER CREATION
// =============================
function createPlayer(container) {
    playerElement = document.createElement('img');
    playerElement.src = '/assets/player/idle.png';
    playerElement.style.position = 'absolute';
    playerElement.style.left = `${player.x * CELL_SIZE}px`;
    playerElement.style.top = `${player.y * CELL_SIZE}px`;
    playerElement.style.width = `${CELL_SIZE}px`;
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

    if (event.key === 'Tab') {
        event.preventDefault();
        showCoords = !showCoords;
        const coordsEl = document.getElementById('coords-display');
        if (coordsEl) coordsEl.style.display = showCoords ? 'block' : 'none';
    }

    if (event.key === '1') showMessage("You equipped " + item1), equipped = item1;
    if (event.key === '2') showMessage("You equipped " + item2), equipped = item2;
    if (event.key === '3') showMessage("You equipped " + item3), equipped = item3;
    if (event.key === '4') showMessage("You equipped " + item4), equipped = item4;
    if (event.key === '5') showMessage("You equipped " + item5), equipped = item5;
}

function handleKeyRelease(event) {
    delete keysPressed[event.key];

    const stillMoving = ['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']
        .some(k => keysPressed[k]);

    if (!stillMoving && playerElement) {
        player.isMoving = false;
        playerElement.src = '/assets/player/idle.png';
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
    } else if (keysPressed['z']){
        showMessage(item1 + " was eqiupped!")
    }

    // bounds
    if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) return;

    // solid check
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
        return;
    }

    // visuals
    if (isHorizontalMove && playerElement) {
        player.walkFrame = player.walkFrame === 1 ? 2 : 1;
        playerElement.src = `/assets/player/walk_${player.walkFrame}.png`;
    } else if (moved && playerElement) {
        playerElement.src = '/assets/player/idle.png';
    }

    // apply move
    player.x = newX;
    player.y = newY;

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
        // visual effect if dead
        initiateGrid(rows, cols, '#FF0000', gridContainer);
        if (playerElement) playerElement.style.display = 'none';
        if (cursorImage) cursorImage.style.display = 'none';
        return;
    }

    const currentTime = timestamp || performance.now();
    const timeSinceLastMove = currentTime - player.lastMoveTime;

    const isMovingKey = ['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']
        .some(key => keysPressed[key]);

    if (isMovingKey && timeSinceLastMove >= player.moveCooldown) {
        update(currentTime);
    }

    updateCrosshair();

    requestAnimationFrame(gameLoop);
}

// =============================
// GRID INIT
// =============================
function initiateGrid(r, c, value, container) {
    // clear previous data & DOM
    grid = [];
    while (container.firstChild) container.removeChild(container.firstChild);

    // setup CSS grid sizing
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${c}, ${CELL_SIZE}px)`;
    container.style.gridTemplateRows = `repeat(${r}, ${CELL_SIZE}px)`;
    container.style.width = `${c * CELL_SIZE}px`;
    container.style.height = `${r * CELL_SIZE}px`;
    container.style.position = 'relative';

    // create cells
    for (let i = 0; i < r * c; i++) {
        const cell = document.createElement("div");
        cell.classList.add("grid-cell");
        cell.style.width = `${CELL_SIZE}px`;
        cell.style.height = `${CELL_SIZE}px`;
        cell.style.boxSizing = 'border-box';
        cell.style.backgroundSize = 'cover';
        cell.style.backgroundRepeat = 'no-repeat';

        // set initial background based on provided 'value'
        if (typeof value === 'string' && value.endsWith('.png')) {
            cell.style.backgroundImage = `url('${value}')`;
        } else {
            cell.style.backgroundColor = value;
        }

        // store index for event handlers
        cell.dataset.index = i;

        // mouseenter sets mouse coords (reliable)
        cell.addEventListener("mouseenter", (e) => {
            const idx = Number(e.currentTarget.dataset.index);
            mouseRow = Math.floor(idx / c);
            mouseCol = idx % c;
            updateCrosshair();
        });

        // click on the cell will show sign message if any, otherwise shoot if not solid
        cell.addEventListener("click", (e) => {
            const idx = Number(e.currentTarget.dataset.index);
            const clickedRow = Math.floor(idx / cols);
            const clickedCol = idx % cols;
            const cellData = grid[idx];

            // sign handling
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

            // shop handling
            if (cellData && cellData.isShop) {
                openShop(cellData.shopItems, cellData.shopName);
                return;
            }

            // only shoot non-solid cells OR monsters
            if (cellData && (!cellData.solid || cellData.monster)) {
                shoot(clickedRow, clickedCol);
            }
        });

        container.appendChild(cell);

        // initialize grid metadata
        grid.push({
            solid: false,
            isSign: false,
            message: null,
            isDoor: false,
            isShop: false,
            overhead: false,
            bg: (typeof value === 'string' ? value : null)
        });
    }

    // re-append cursor and player so they stay on top
    if (cursorImage) container.appendChild(cursorImage);
    if (playerElement) container.appendChild(playerElement);
}



// =============================
// ANIMATION HUB (no white flash)
// =============================
// animations store the image paths and optional precomputed indices to animate.
// When adding animations, we won't clear styles — we'll only replace matching backgroundImage values.

function addAnimation(fromPath, toPath) {
    animations.push({ from: fromPath, to: toPath, toggle: false });
}

function runAnimationStep(anim) {
    const cells = gridContainer.querySelectorAll(".grid-cell");

    // Determine direction based on toggle state
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
    // 400ms interval
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
        message: null,
        isDoor: false,
        isShop: false,
        overhead: false,
        bg: (typeof value === 'string' ? value : null),
        ...properties
    };

    // update visual but never clear then set (prevents flicker)
    if (typeof value === 'string' && value.endsWith('.png')) {
        cell.style.backgroundImage = `url('${value}')`;
        cell.style.backgroundColor = "";
    } else {
        cell.style.backgroundImage = "";
        cell.style.backgroundColor = value;
    }

    if (grid[index].overhead) {
        cell.style.zIndex = '20';
    } else {
        cell.style.zIndex = '';
    }
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
        if (messageTimeoutId) {
            clearTimeout(messageTimeoutId);
            messageTimeoutId = null;
        }
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

    // Reset color to default before showing new message
    messageText.style.color = color;

    if (messageTimeoutId) {
        clearTimeout(messageTimeoutId);
        messageTimeoutId = null;
    }

    messageText.textContent = text;

    messageBox.style.display = 'block';

    if (blocking) {
        messageBlocking = true;
    }

    messageTimeoutId = setTimeout(() => {
        messageBox.style.display = 'none';
        if (blocking) messageBlocking = false;
    }, 2000);
}

function updateUI() {
    const hpEl = document.getElementById("hp");
    const moneyEl = document.getElementById("money");
    if (hpEl) hpEl.textContent = "Health: " + hp;
    if (moneyEl) moneyEl.textContent = "$: " + money;
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

    // If the mouse moves over container (not required for cell clicks, but keeps UX smooth)
    container.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const col = Math.floor(cx / CELL_SIZE);
        const row = Math.floor(cy / CELL_SIZE);

        if (row < 0 || row >= rows || col < 0 || col >= cols) {
            mouseRow = null;
            mouseCol = null;
            cursorImage.style.display = "none";
            return;
        }

        mouseRow = row;
        mouseCol = col;
        updateCrosshair();
    });

    container.addEventListener("mouseleave", () => {
        mouseRow = null;
        mouseCol = null;
        cursorImage.style.display = "none";
    });

    // IMPORTANT: we do NOT attach a container-level click to shoot.
    // Shooting occurs only on cell click (handled in initiateGrid()).
}

function updateCrosshair() {
    if (hp < 1) {
        if (cursorImage) cursorImage.style.display = "none";
        return;
    }

    const coordsEl = document.getElementById('coords-display');
    if (coordsEl && showCoords) {
        coordsEl.textContent = (mouseRow !== null && mouseCol !== null) 
            ? `X: ${mouseCol} Y: ${mouseRow}` 
            : "";
    }

    if (!cursorImage || mouseRow === null || mouseCol === null) return;
    if (mouseRow < 0 || mouseRow >= rows || mouseCol < 0 || mouseCol >= cols) {
        cursorImage.style.display = "none";
        return;
    }

    const index = mouseRow * cols + mouseCol;
    if (!grid[index]) {
        cursorImage.style.display = "none";
        return;
    }

    if (grid[index].solid && !grid[index].monster) {
        cursorImage.style.display = "none";
        return;
    }

    cursorImage.style.display = "block";
    const px = mouseCol * CELL_SIZE + (CELL_SIZE / 2) - (13 / 2);
    const py = mouseRow * CELL_SIZE + (CELL_SIZE / 2) - (13 / 2);
    cursorImage.style.left = px + "px";
    cursorImage.style.top = py + "px";
}

function spawnMonster(row, col, hp, damage, skin) {
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
        lastHitTime: -1000
    };
}

// =============================
// SHOOT (writes "bang" to readout)
// =============================
function shoot(row, col) {
    const index = row * cols + col;
    const cell = grid[index];
    let damage = 0;
    const now = performance.now();

    if (equipped === 'Fish') {
        hp += 5;
        updateUI();
        showMessage("You ate a fish.", "green");
        if (item1 === 'Fish') item1 = 'nothing';
        else if (item2 === 'Fish') item2 = 'nothing';
        else if (item3 === 'Fish') item3 = 'nothing';
        else if (item4 === 'Fish') item4 = 'nothing';
        else if (item5 === 'Fish') item5 = 'nothing';
        equipped = 'nothing';
        return;
    } else if (equipped === 'Energy Bar') {
        hp += 10;
        updateUI();
        showMessage("You a ate a energy bar. You feel energized!", "green");
        if (item1 === 'Energy Bar') item1 = 'nothing';
        else if (item2 === 'Energy Bar') item2 = 'nothing';
        else if (item3 === 'Energy Bar') item3 = 'nothing';
        else if (item4 === 'Energy Bar') item4 = 'nothing';
        else if (item5 === 'Energy Bar') item5 = 'nothing';
        equipped = 'nothing';
        return;
    } else if (equipped === 'Grenade') {
        showMessage("BOOM", "red");
        if (item1 === 'Grenade') item1 = 'nothing';
        else if (item2 === 'Grenade') item2 = 'nothing';
        else if (item3 === 'Grenade') item3 = 'nothing';
        else if (item4 === 'Grenade') item4 = 'nothing';
        else if (item5 === 'Grenade') item5 = 'nothing';
        equipped = 'nothing';
        return;
    } else if (equipped === 'Bop it!') {
        showMessage("You bopped it! You are filled with a sense of joy!", "gold");
    }

    if (equipped === Pistol.name) damage = Pistol.damage;
    else if (equipped === Glock.name) damage = Glock.damage;
    else if (equipped === Sniper.name) damage = Sniper.damage;

    if (damage > 0 && blockShoot === false) {
        showMessage("Bang!", "red"); 
    }

    if (cell && cell.monster && damage > 0) {
        if (now - (cell.monster.lastHitTime || 0) < 300) return;
        cell.monster.lastHitTime = now;

        cell.monster.hp -= damage;
        if (cell.monster.hp <= 0) {
            showMessage("Monster defeated! +20 gold!", "gold", true);
            money += 20;
            updateUI();
            if (cell.monster.isFirey) {
                gameFlags.fireyKilled = true;
                setCells(0, 18, 10, 18, '/assets/blocks/stone.png', { solid: false , isDoor: true, targetLevel: 'main'});
                setupDowntownNPCs();
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
function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}

async function moveMonsterTo(startRow, startCol, targetRow, targetCol, duration) {
    const startIndex = startRow * cols + startCol;
    const startCell = grid[startIndex];

    if (!startCell || !startCell.monster) return;

    const monsterData = startCell.monster;
    const visual = monsterData.element;

    // 2. BFS Pathfinding
    const queue = [{ r: startRow, c: startCol, path: [] }];
    const visited = new Set([`${startRow},${startCol}`]);
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let finalPath = null;

    while (queue.length > 0) {
        const { r, c, path } = queue.shift();
        if (r === targetRow && c === targetCol) {
            finalPath = path;
            break;
        }
        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
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
        
        let currentR = startRow;
        let currentC = startCol;

        for (const step of finalPath) {
            if (monsterData.hp <= 0) {
                return;
            }

            // 1. Update Grid Logic (Move monster logically before visual)
            // Clear old cell
            const oldIdx = currentR * cols + currentC;
            grid[oldIdx].solid = false;
            grid[oldIdx].monster = null;

            // Occupy new cell
            const nextIndex = step.r * cols + step.c;
            grid[nextIndex].solid = true;
            grid[nextIndex].monster = monsterData;

            // Check collision with player
            if (player.x === step.c && player.y === step.r) {
                hp -= monsterData.damage;
                updateUI();
                showMessage(`Ouch! -${monsterData.damage} HP`, "red");
            }

            // 2. Animate Visual
            visual.style.left = `${step.c * CELL_SIZE}px`;
            visual.style.top = `${step.r * CELL_SIZE}px`;
            await new Promise(r => setTimeout(r, stepDuration));
            
            currentR = step.r;
            currentC = step.c;
        }
    }
}

async function follow(startRow, startCol) {
    let r = startRow;
    let c = startCol;

    while (hp > 0) {
        const idx = r * cols + c;
        const cell = grid[idx];
        if (!cell || !cell.monster || cell.monster.hp <= 0) return;

        const targetR = player.y;
        const targetC = player.x;

        const dist = Math.abs(targetR - r) + Math.abs(targetC - c);
        if (dist === 0) {
            await new Promise(res => setTimeout(res, 500));
            continue;
        }

        await moveMonsterTo(r, c, targetR, targetC, dist * 300);

        r = targetR;
        c = targetC;
    }
}

function loadLevel(levelName) {
    if (levelName === 'main') {
        rows = 19;
        cols = 19;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        
        // Default spawn for main
        b1rx = 1;
        b1ry = 15;
        player.x = respawnx; player.y = respawny;

        setCell(16, 16, '/assets/blocks/sign.png', { isSign: true, message: "Welcome to Midday city.", solid: false });
        setCells(10, 16, 9, 14, '/assets/blocks/modern_brick.png', { solid: true })
        setCells(7, 15, 9, 15, '/assets/blocks/wood.png', { solid: true });
        setCells(7, 14, 5, 16, '/assets/blocks/leaves.png', { solid: false, overhead: true });
        setCells(18, 7, 0, 11, '/assets/blocks/street_side.png', {solid: false} );
        setCell(9, 9, '/assets/blocks/street_middle.png', { solid: false });
        setCell(15, 9, '/assets/blocks/street_middle.png', { solid: false });
        setCell(3, 9, '/assets/blocks/street_middle.png', { solid: false });
        setCells(9, 1, 13, 5, '/assets/blocks/brick.png', { solid: true});
        
        setCell(13, 3, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'store' });
        setCell(12, 3, '/assets/blocks/door_top.png', { solid: false, isDoor: true, targetLevel: 'store' });
        setCells(18, 7, 18, 11, '/assets/blocks/street_side.png', { solid: false, isDoor: true, targetLevel: 'cliffs' });
        setCells(18, 0, 18, 6, '/assets/blocks/stone.png', { solid: false, isDoor: true, targetLevel: 'cliffs' });
        setCells(18, 12, 18, 18, '/assets/blocks/stone.png', { solid: false, isDoor: true, targetLevel: 'cliffs' });
        setCells(0, 0, 18, 0 , '/assets/blocks/stone.png', { solid: false, isDoor: true, targetLevel: 'downtown' });
        setCells(0, 18, 18, 18, '/assets/blocks/stone.png', { solid: false, isDoor: true, targetLevel: 'building1'});
        setCells(10, 2, 10, 4, '/assets/blocks/glass.png', { solid: true });
        setCell(14, 1, '/assets/blocks/sign.png', { isSign: true, message: "Store inside.", solid: false });
    } else if (levelName === 'store') {
        rows = 11;
        cols = 11;
        respawnx = 3;
        respawny = 13;
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
            solid: true, 
            isShop: true, 
            shopName: "Ricky's Weapons",
            shopItems: [{name: 'Sniper', price: 100}, {name: 'Glock', price: 50}],
            isSign: true, 
            message: ["Ricky: Hello and welcome to my store! (Click again)", "My name is Ricky. (Click again)", "What would you like to buy?"] 
        });
        setCell(10, 5, '/assets/blocks/door_bottom.png', { solid: false, isDoor: true, targetLevel: 'main' });
    } else if (levelName === 'cliffs') {
        //hi
        rows = 19;
        cols = 19;
        respawnx = 9;
        respawny = 17;
        initiateGrid(rows, cols, '/assets/blocks/grass.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        
        player.x = 9; player.y = 1;

        setCells(9, 0, 9, 6, '/assets/blocks/grass_dirt.png', { solid: true });
        setCells(10, 7, 10, 13, '/assets/blocks/grass_dirt.png', { solid: true });
        setCells(11, 14, 11, 19, '/assets/blocks/grass_dirt.png', { solid: true });
        setCells(14, 0, 19, 19, '/assets/blocks/water.png', { solid: true});
        setCells(10, 0, 10, 6, '/assets/blocks/dirt.png', { solid: true });
        setCells(11, 0, 11, 13, '/assets/blocks/dirt.png', { solid: false });
        setCell(9, 8, '/assets/blocks/sign.png', { solid: false , isSign: true, message: 'The cliffs...'});
        setCells(12, 0, 14, 19, '/assets/blocks/dirt.png', { solid: true })
        setCells(0, 0 , 0 , 19, '/assets/blocks/grass.png', { solid: false , isDoor: true, targetLevel: 'main'});
        setCell(3, 4, '/assets/npcs/farmer.png', { solid: true, isSign: true, message: 'Farmer: So peaceful, innit it. (sigh)'});
    } else if (levelName === 'downtown') {
        rows = 11;
        cols = 19;
        respawnx = 1;
        respawny = 8;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = 18; player.y = 5; 

        setCells(0, 18, 10, 18, '/assets/blocks/stone.png', { solid: false , isDoor: true, targetLevel: 'main'});
        setCells(1, 0, 1, 14, '/assets/blocks/dirt.png', { solid: true});
        setCell(3, 13, '/assets/blocks/sign.png', { solid: false , isSign: true, message: 'Market...' });
        setCell(0, 14, '/assets/blocks/dirt.png', { solid: true});
        setCells(7, 2, 5, 4, '/assets/blocks/leaves.png', {solid: false, overhead: true});
        setCells(8, 3, 9, 3, '/assets/blocks/wood.png', { solid: true});
        
        setupDowntownNPCs();

        if (!gameFlags.fireyKilled) {
            if (!gameFlags.downtownIntro) {
                showMessage('Monsters attack! Fight back with your weapons!', 'red');
                setCells(10, 18, 0, 18, '/assets/blocks/stone.png', { solid: false, isDoor: false} )
                gameFlags.downtownIntro = true;
            }
            spawnMonster(5, 5, 100, 20, '/assets/npcs/firey.png');
            const idx = 5 * cols + 5;
            if (grid[idx] && grid[idx].monster) grid[idx].monster.isFirey = true;
            follow(5, 5);
        }
        
    } else if (levelName === 'building1') {
        rows = 19;
        cols = 15;
        respawnx = 18;
        respawny = 15;
        initiateGrid(rows, cols, '/assets/blocks/stone.png', gridContainer);
        if (!playerElement) createPlayer(gridContainer);
        player.x = b1rx; player.y = b1ry;
        setCells(0, 0, 18, 0, '/assets/blocks/stone.png', {solid: false, isDoor: true, targetLevel: 'main'});
        setCells(14, 7, 0, 14, '/assets/blocks/brick.png', {solid: true});
        setCells(12, 0, 12, 6, '/assets/blocks/modern_brick.png', {solid: true});
        setCell(14, 9, '/assets/blocks/door_bottom.png', {solid: false, isDoor: true, targetLevel: 'Building1(in)'});
        setCell(13, 9, '/assets/blocks/door_top.png', {solid: false, isDoor: true, targetLevel: 'Building1(in)'});
        
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
                    else if (item5 === Joes_Box.name) item5 = 'nothing';
                    
                    money += 20;
                    gameFlags.peterQuestComplete = true;
                    updateUI();
                    
                    const idx = 13 * cols + 4;
                    if (grid[idx]) { grid[idx].message = ["Peter: Thanks."]; grid[idx].messageIndex = 0; }
                    return "Peter: Thanks for doing that take $20.";
                }
            ];
        } else {
            peterMsg = [
                'Peter: Hey... (Click again)', 
                'The name is Peter... (Click again)', 
                'Ya see that building... (Click again)' , 
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

                    if (slot) { updateUI(); return `Peter: Give him this note will ya? It's in your ${slot} inventory slot. Thanks!`;}
                    return "Peter: Your inventory is full!";
                }
            ];
        }
        setCell(13, 4, '/assets/npcs/peter.png', {solid: true, isSign: true, message: peterMsg});
    } else if (levelName === 'Building1(in)') {
        rows = 11;
        cols = 11;
        b1rx = 9;
        b1ry = 15;
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

                    const box = Joes_Box.name;
                    let slot = "";
                    if (item1 === 'nothing') { item1 = box; slot = "1st"; }
                    else if (item2 === 'nothing') { item2 = box; slot = "2nd"; }
                    else if (item3 === 'nothing') { item3 = box; slot = "3rd"; }
                    else if (item4 === 'nothing') { item4 = box; slot = "4th"; }
                    else if (item5 === 'nothing') { item5 = box; slot = "5th"; }

                    gameFlags.givenNoteToJoe = true;
                    updateUI();
                    const idx = 1 * cols + 5;
                    if (grid[idx]) { grid[idx].message = ["Joe: Please give that box to Peter."]; grid[idx].messageIndex = 0; }
                    if (slot) return `Joe: Oh... Please give him this box. Its in your ${slot} inventory slot.`;
                    return "Joe: Inventory full!";
                }
            ];
        } else {
            joeMsg = ["Joe: GET OUT OF MY BUILDING!!!"];
        }
        setCell(1, 5, '/assets/npcs/joe.png', {solid: true, isSign: true, message: joeMsg});
        setCell(10, 5, '/assets/blocks/door_bottom.png', {solid: false, isDoor: true, targetLevel: 'building1'});
    }   
    if (!cursorImage) setupCrosshair(gridContainer);
    if (playerElement) {
        playerElement.style.left = `${player.x * CELL_SIZE}px`;
        playerElement.style.top = `${player.y * CELL_SIZE}px`;
    }
}

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
            overlay.appendChild(createBtn(`${item.name} ($${item.price})`, () => buyItem(item.name, item.price)));
        });
    }
    overlay.appendChild(createBtn(`Exit`, () => closeShop()));

    document.body.appendChild(overlay);
}

function closeShop() {
    const overlay = document.getElementById('shop-overlay');
    if (overlay) document.body.removeChild(overlay);
}

function buyItem(name, cost) {
    if (name === '1 Doller' && money >= 10) {
        money -= 9;
        updateUI();
        showMessage("Cloak Man: Imagine falling for that scam! (Hahaha)", "green");
        closeShop();
        return;
    }
    if (money >= cost) {
        if (item1 === 'nothing') { item1 = name; money -= cost; updateUI(); showMessage(`Bought ${name}!`, "green"); closeShop(); return; }
        if (item2 === 'nothing') { item2 = name; money -= cost; updateUI(); showMessage(`Bought ${name}!`, "green"); closeShop(); return; }
        if (item3 === 'nothing') { item3 = name; money -= cost; updateUI(); showMessage(`Bought ${name}!`, "green"); closeShop(); return; }
        if (item4 === 'nothing') { item4 = name; money -= cost; updateUI(); showMessage(`Bought ${name}!`, "green"); closeShop(); return; }
        if (item5 === 'nothing') { item5 = name; money -= cost; updateUI(); showMessage(`Bought ${name}!`, "green"); closeShop(); return; }
        showMessage("Inventory full!", "red");
    } else {
        showMessage("Not enough money!", "red");
    }
}

function setupDowntownNPCs() {
    if (gameFlags.fireyKilled) {
        setCell(0, 1, '/assets/npcs/cloak_man.png', { solid: true, 
            isShop: true, 
            shopName: "Magic Shop (Items aren't really magic)",
            shopItems: [{name: 'Fish', price: 5}, {name: 'SMUB', price: 50000}, {name: '1 Doller', price: 10}],
            isSign: true, 
            message: ["Cloak Man: I am the cloak man from the world's beyond. (Click again)", "I sell mystical items here... (Click again)", "I collect them from other universes!"] 
        });
        setCell(0, 5, '/assets/npcs/bobby.png', { solid: true,
            isShop: true, 
            shopName: "Bobby's Finds",
            shopItems: [{name: 'Grenade', price: 13}, {name: 'Energy Bar', price: 10}],
            isSign: true, 
            message: ["Bobby: Hey! (Click again)", "I'm Bobby, and I sell some stuff me and my dad find! (Click again)", "Take a look!"]
        });
        setCell(0, 9, '/assets/npcs/fred.png', { solid: true,
            isShop: true,
            shopName: "Fred's Stuff",
            shopItems: [{name: 'Bop it!', price: 17}],
            isSign: true, 
            message: ["Fred: Hi. (Click again)", "My name is Fred and I only have one thing to sell. Sorry 😞"]
        });
    } else {
        setCell(0, 1, '/assets/npcs/cloak_man.png', { solid: true, isShop: false, isSign: true, message: "Cloak Man: hahaha, i like monsters" });
        setCell(0, 5, '/assets/npcs/bobby.png', { solid: true, isShop: false, isSign: true, message: "Bobby: MMMM.. MONSTER!!!" });
        setCell(0, 9, '/assets/npcs/fred.png', { solid: true, isShop: false, isSign: true, message: "Fred: MMMM.. MONSTER!!!" });
    }
}
