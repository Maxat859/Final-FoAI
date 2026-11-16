
/*
 QAMAL: PRISON BREAK
 Main application
*/

// Получаем элементы HTML

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

// Все игровые экраны

const screens = [
    mainMenu,
    settingsScreen,
    gameScreen
];

// Функция переключения экранов

function showScreen(targetScreen) {

    for (const screen of screens) {
        screen.hidden = screen !== targetScreen;
    }

}

// Сохранение выбранного языка

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
        localStorage.setItem(
            STORAGE_KEY,
            languageSelect.value
        );
    } catch (error) {
        console.warn("Не удалось сохранить язык:", error);
    }

});

// Временная тестовая карта

const TILE_SIZE = 32;

const testMap = [
    "##########",
    "#........#",
    "#..##....#",
    "#.....#..#",
    "#........#",
    "##########"
];

// Рисуем временную карту

function drawTestMap() {

    canvas.width = testMap[0].length * TILE_SIZE;
    canvas.height = testMap.length * TILE_SIZE;

    ctx.imageSmoothingEnabled = false;

    for (let row = 0; row < testMap.length; row++) {

        for (let col = 0; col < testMap[row].length; col++) {

            const tile = testMap[row][col];

            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            if (tile === "#") {
                ctx.fillStyle = "#45586a";
            } else {
                ctx.fillStyle = "#263748";
            }

            ctx.fillRect(
                x,
                y,
                TILE_SIZE,
                TILE_SIZE
            );

            ctx.strokeStyle = "#182330";

            ctx.strokeRect(
                x,
                y,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }

    // Временный персонаж

    ctx.fillStyle = "#e39c45";
    ctx.fillRect(72, 103, 16, 22);

    // Временный охранник

    ctx.fillStyle = "#4383b9";
    ctx.fillRect(232, 70, 16, 22);

    // Подпись тестового экрана

    ctx.fillStyle = "#ffffff";
    ctx.font = "9px monospace";
    ctx.fillText(
        "QAMAL TEST MAP",
        38,
        52
    );
}

// Кнопка "Начать игру"

playBtn.addEventListener("click", () => {

    showScreen(gameScreen);

    drawTestMap();

});

// Кнопка "Настройки"

settingsBtn.addEventListener("click", () => {

    showScreen(settingsScreen);

});

// Кнопка "Назад"

backBtn.addEventListener("click", () => {

    showScreen(mainMenu);

});

// Кнопка "Выйти в меню"

exitBtn.addEventListener("click", () => {

    showScreen(mainMenu);

});

// Начальный экран

showScreen(mainMenu);
