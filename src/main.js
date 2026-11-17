/*
 QAMAL: PRISON BREAK
 Первый игровой прототип: меню, текстуры, карта и движение.
*/

// Экраны и кнопки из index.html
const mainMenu = document.getElementById("main-menu");
const settingsScreen = document.getElementById("settings-screen");
const gameScreen = document.getElementById("game-screen");

const playBtn = document.getElementById("play-btn");
const settingsBtn = document.getElementById("settings-btn");
const backBtn = document.getElementById("back-btn");
const exitBtn = document.getElementById("exit-btn");
const languageSelect = document.getElementById("language-select");

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const screens = [mainMenu, settingsScreen, gameScreen];

function showScreen(targetScreen) {
    for (const screen of screens) {
        screen.hidden = screen !== targetScreen;
    }
}

// Сохраняем выбор языка для будущих заданий с программированием
const STORAGE_KEY = "qamal.language";

try {
    const savedLanguage = localStorage.getItem(STORAGE_KEY);
    if (savedLanguage === "python" || savedLanguage === "go") {
        languageSelect.value = savedLanguage;
    }
} catch (error) {
    console.warn("Настройки пока не сохранены:", error);
}

languageSelect.addEventListener("change", () => {
    try {
        localStorage.setItem(STORAGE_KEY, languageSelect.value);
    } catch (error) {
        console.warn("Не удалось сохранить язык:", error);
    }
});

// Размер каждой клетки: 32 на 32 пикселя
const TILE_SIZE = 32;

// # = стена; . = пол; D = закрытая дверь; B = решётка
const testMap = [
    "####################",
    "#..................#",
    "#..................#",
    "#......#####.......#",
    "#......#...#.......#",
    "#......D...B.......#",
    "#......#...#.......#",
    "#......#####.......#",
    "#..................#",
    "#...###............#",
    "#..................#",
    "####################"
];

canvas.width = testMap[0].length * TILE_SIZE;
canvas.height = testMap.length * TILE_SIZE;
ctx.imageSmoothingEnabled = false;

// Увеличиваем отображение карты, сохраняя её пиксельный стиль
canvas.style.width = "min(90vw, 960px)";
canvas.style.height = "auto";
canvas.style.maxWidth = "none";
canvas.style.display = "block";
canvas.style.imageRendering = "pixelated";

const player = { col: 2, row: 8 };
const guard = { col: 9, row: 5 };
const bed = { col: 3, row: 2 };

// Пути отсчитываются от index.html, а не от src/main.js
const texturePaths = {
    floor: "./assets/floor_concrete.png",
    wall: "./assets/wall_concrete.png",
    prisoner: "./assets/prisoner_idle.png",
    guard: "./assets/guard_idle.png",
    door: "./assets/door_closed.png",
    bars: "./assets/bars.png",
    bed: "./assets/prison_bed.png"
};

const textures = {};

for (const [name, path] of Object.entries(texturePaths)) {
    const img = new Image();
    textures[name] = img;

    img.addEventListener("load", () => {
        if (!gameScreen.hidden) drawGame();
    });

    img.addEventListener("error", () => {
        console.warn("Не удалось загрузить текстуру:", path);
    });

    img.src = path;
}

// Если файл картинки пока недоступен, рисуем цветную заглушку
function drawTexture(name, x, y, width, height, fallbackColor) {
    const img = textures[name];

    if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x, y, width, height);
    } else {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(x, y, width, height);
    }
}

function drawGame() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Сначала пол, затем стены, двери и решётки
    for (let row = 0; row < testMap.length; row++) {
        for (let col = 0; col < testMap[row].length; col++) {
            const tile = testMap[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            drawTexture("floor", x, y, TILE_SIZE, TILE_SIZE, "#263748");

            if (tile === "#") {
                drawTexture("wall", x, y, TILE_SIZE, TILE_SIZE, "#45586a");
            } else if (tile === "D") {
                drawTexture("door", x, y - 16, TILE_SIZE, 48, "#875e38");
            } else if (tile === "B") {
                drawTexture("bars", x, y, TILE_SIZE, TILE_SIZE, "#7f91a3");
            }
        }
    }

    // Предметы и персонажи рисуются поверх карты
    drawTexture("bed", bed.col * TILE_SIZE, bed.row * TILE_SIZE,
        TILE_SIZE, TILE_SIZE * 2, "#715a50");

    drawTexture("guard", guard.col * TILE_SIZE, guard.row * TILE_SIZE - 16,
        TILE_SIZE, 48, "#4383b9");

    drawTexture("prisoner", player.col * TILE_SIZE, player.row * TILE_SIZE - 16,
        TILE_SIZE, 48, "#e39c45");
}

function canMoveTo(col, row) {
    if (row < 0 || row >= testMap.length) return false;
    if (col < 0 || col >= testMap[row].length) return false;

    // Точка обозначает свободный пол; двери, стены и решётки закрыты
    if (testMap[row][col] !== ".") return false;

    // Кровать занимает две клетки
    if (col === bed.col && (row === bed.row || row === bed.row + 1)) {
        return false;
    }

    // Пока охранник стоит на месте и тоже занимает клетку
    if (col === guard.col && row === guard.row) return false;

    return true;
}

// Управление: стрелки или WASD
window.addEventListener("keydown", (event) => {
    if (gameScreen.hidden) return;

    const directions = {
        arrowup: [0, -1], w: [0, -1],
        arrowdown: [0, 1], s: [0, 1],
        arrowleft: [-1, 0], a: [-1, 0],
        arrowright: [1, 0], d: [1, 0]
    };

    const direction = directions[event.key.toLowerCase()];
    if (!direction) return;

    event.preventDefault();

    const nextCol = player.col + direction[0];
    const nextRow = player.row + direction[1];

    if (canMoveTo(nextCol, nextRow)) {
        player.col = nextCol;
        player.row = nextRow;
        drawGame();
    }
});

playBtn.addEventListener("click", () => {
    showScreen(gameScreen);
    drawGame();
});

settingsBtn.addEventListener("click", () => {
    showScreen(settingsScreen);
});

backBtn.addEventListener("click", () => {
    showScreen(mainMenu);
});

exitBtn.addEventListener("click", () => {
    showScreen(mainMenu);
});

showScreen(mainMenu);
