
// 遊戲板設定
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // 每個方塊的大小 (像素)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const linesDisplay = document.getElementById('lines');
const startButton = document.getElementById('startButton');
const controlsDiv = document.getElementById('controls');

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

let board = [];
let score = 0;
let level = 1;
let lines = 0;
let currentPiece;
let gameInterval;
let dropSpeed = 500; // 初始下落速度 (毫秒)

// 方塊形狀定義
const SHAPES = [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]], // Z
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]], // J
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]]  // L
];

// 顏色定義
const COLORS = [
    'cyan', 'yellow', 'purple', 'green', 'red', 'blue', 'orange'
];

// 初始化遊戲板
function initBoard() {
    board = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    dropSpeed = 500;
    updateDisplays();
    drawBoard();
}

// 更新顯示
function updateDisplays() {
    scoreDisplay.textContent = `分數: ${score}`;
    levelDisplay.textContent = `等級: ${level}`;
    linesDisplay.textContent = `消除行數: ${lines}`;
}

// 繪製遊戲板
function drawBoard() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            drawBlock(c, r, board[r][c]);
        }
    }
}

// 繪製單個方塊
function drawBlock(x, y, colorIndex) {
    ctx.fillStyle = colorIndex ? COLORS[colorIndex - 1] : '#000';
    ctx.strokeStyle = '#333';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// 隨機生成新方塊
function generateNewPiece() {
    const randShapeIndex = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[randShapeIndex];
    const colorIndex = randShapeIndex + 1; // 顏色索引從1開始，0代表空

    currentPiece = {
        shape: shape,
        colorIndex: colorIndex,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };

    // 檢查遊戲是否結束 (新方塊生成時就發生碰撞)
    if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver();
        return false;
    }
    return true;
}

// 繪製當前方塊
function drawCurrentPiece() {
    const { shape, x, y, colorIndex } = currentPiece;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                drawBlock(x + c, y + r, colorIndex);
            }
        }
    }
}

// 檢查移動是否有效
function isValidMove(newX, newY, newShape) {
    for (let r = 0; r < newShape.length; r++) {
        for (let c = 0; c < newShape[r].length; c++) {
            if (newShape[r][c]) {
                const boardX = newX + c;
                const boardY = newY + r;

                // 檢查邊界
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return false;
                }
                // 檢查是否與已固定的方塊碰撞 (不檢查超出頂部的方塊)
                if (boardY >= 0 && board[boardY][boardX]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// 將當前方塊固定到遊戲板上
function lockPiece() {
    const { shape, x, y, colorIndex } = currentPiece;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                board[y + r][x + c] = colorIndex;
            }
        }
    }
    clearLines();
    if (!generateNewPiece()) {
        gameOver();
    }
}

// 清除滿行
function clearLines() {
    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell !== 0)) {
            // 移除滿行
            board.splice(r, 1);
            // 在頂部添加新行
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            r++; // 重新檢查當前行，因為上面的行已經下移
        }
    }
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level; // 根據等級計分
        
        // 每消除10行升級
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropSpeed = Math.max(50, 500 - (level - 1) * 50); // 加快下落速度
            // 重新設定遊戲間隔
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, dropSpeed);
        }
        
        updateDisplays();
    }
}

// 遊戲結束
function gameOver() {
    clearInterval(gameInterval);
    alert(`遊戲結束！\n分數: ${score}\n等級: ${level}\n消除行數: ${lines}`);
    startButton.style.display = 'block';
    controlsDiv.style.display = 'none';
}

// 遊戲主循環
function gameLoop() {
    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();

    // 方塊下落
    const newY = currentPiece.y + 1;
    if (isValidMove(currentPiece.x, newY, currentPiece.shape)) {
        currentPiece.y = newY;
    } else {
        lockPiece();
    }
    drawCurrentPiece();
}

// 旋轉方塊
function rotate(piece) {
    // 簡單的90度順時針旋轉
    const newShape = piece.shape[0].map((_, index) => piece.shape.map(row => row[index]).reverse());
    if (isValidMove(piece.x, piece.y, newShape)) {
        piece.shape = newShape;
        redrawGame();
    }
}

// 移動方塊
function movePiece(direction) {
    if (!currentPiece) return;
    
    let newX = currentPiece.x;
    let newY = currentPiece.y;
    
    switch (direction) {
        case 'left':
            newX--;
            break;
        case 'right':
            newX++;
            break;
        case 'down':
            newY++;
            break;
    }
    
    if (isValidMove(newX, newY, currentPiece.shape)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        redrawGame();
    } else if (direction === 'down') {
        lockPiece();
    }
}

// 快速下落
function hardDrop() {
    if (!currentPiece) return;
    
    while (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        currentPiece.y++;
    }
    lockPiece();
}

// 重新繪製遊戲
function redrawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawCurrentPiece();
}

// 鍵盤事件處理
document.addEventListener('keydown', e => {
    if (!currentPiece) return; // 遊戲未開始或已結束

    switch (e.key) {
        case 'ArrowLeft':
            movePiece('left');
            break;
        case 'ArrowRight':
            movePiece('right');
            break;
        case 'ArrowDown':
            movePiece('down');
            break;
        case 'ArrowUp':
            rotate(currentPiece);
            break;
        case ' ': // 空格鍵快速下落
            hardDrop();
            break;
    }
});

// 觸控按鈕事件處理
document.getElementById('leftBtn').addEventListener('click', () => movePiece('left'));
document.getElementById('rightBtn').addEventListener('click', () => movePiece('right'));
document.getElementById('downBtn').addEventListener('click', () => movePiece('down'));
document.getElementById('rotateBtn').addEventListener('click', () => rotate(currentPiece));
document.getElementById('dropBtn').addEventListener('click', () => hardDrop());

// 防止觸控按鈕的長按選擇
document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('touchstart', e => e.preventDefault());
    btn.addEventListener('touchend', e => e.preventDefault());
    btn.addEventListener('touchmove', e => e.preventDefault());
});

// 開始遊戲按鈕事件
startButton.addEventListener('click', startGame);

function startGame() {
    startButton.style.display = 'none';
    controlsDiv.style.display = 'block';
    initBoard();
    if (generateNewPiece()) {
        gameInterval = setInterval(gameLoop, dropSpeed);
    }
}

// 檢測觸控設備並調整畫布大小
function adjustCanvasForMobile() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        const maxWidth = Math.min(window.innerWidth - 40, 300);
        const newBlockSize = Math.floor(maxWidth / COLS);
        canvas.width = COLS * newBlockSize;
        canvas.height = ROWS * newBlockSize;
        
        // 更新全域變數
        window.BLOCK_SIZE = newBlockSize;
        
        // 重新定義繪製函數以使用新的方塊大小
        window.drawBlock = function(x, y, colorIndex) {
            ctx.fillStyle = colorIndex ? COLORS[colorIndex - 1] : '#000';
            ctx.strokeStyle = '#333';
            ctx.fillRect(x * newBlockSize, y * newBlockSize, newBlockSize, newBlockSize);
            ctx.strokeRect(x * newBlockSize, y * newBlockSize, newBlockSize, newBlockSize);
        };
    }
}

// 頁面載入時調整畫布
window.addEventListener('load', adjustCanvasForMobile);
window.addEventListener('resize', adjustCanvasForMobile);

// 初始繪製遊戲板
initBoard();


