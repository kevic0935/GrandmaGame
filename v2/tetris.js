class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // 音效系統
        this.audioSystem = new AudioSystem();
        
        // 遊戲設定
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        // 調整畫布大小
        this.canvas.width = this.BOARD_WIDTH * this.BLOCK_SIZE;
        this.canvas.height = this.BOARD_HEIGHT * this.BLOCK_SIZE;
        
        // 遊戲狀態
        this.board = this.createBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000; // 1秒
        
        // 方塊定義
        this.pieces = {
            I: {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00f5ff'
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#800080'
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00ff00'
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#ff0000'
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000ff'
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#ffa500'
            }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    createBoard() {
        return Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    initializeGame() {
        this.nextPiece = this.createRandomPiece();
        this.spawnNewPiece();
        this.updateDisplay();
        this.showGameOverlay('遊戲準備就緒', '點擊開始遊戲');
    }
    
    createRandomPiece() {
        const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        const piece = this.pieces[type];
        return {
            type: type,
            shape: piece.shape,
            color: piece.color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
            y: 0
        };
    }
    
    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createRandomPiece();
        
        // 檢查遊戲結束
        if (this.isCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
            return;
        }
        
        this.drawNextPiece();
    }
    
    isCollision(piece, newX, newY) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    movePiece(dx, dy) {
        if (!this.gameRunning || this.gamePaused) return false;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.isCollision(this.currentPiece, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            this.draw();
            
            // 播放移動音效
            if (dx !== 0) {
                this.audioSystem.playMoveSound();
            }
            
            return true;
        }
        
        // 如果是向下移動且發生碰撞，則固定方塊
        if (dy > 0) {
            this.placePiece();
        }
        
        return false;
    }
    
    rotatePiece() {
        if (!this.gameRunning || this.gamePaused) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        // 檢查旋轉後是否發生碰撞
        if (this.isCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            // 嘗試左右移動來適應旋轉
            let adjusted = false;
            for (let offset of [-1, 1, -2, 2]) {
                if (!this.isCollision(this.currentPiece, this.currentPiece.x + offset, this.currentPiece.y)) {
                    this.currentPiece.x += offset;
                    adjusted = true;
                    break;
                }
            }
            
            if (!adjusted) {
                this.currentPiece.shape = originalShape; // 恢復原狀
                return;
            }
        }
        
        // 播放旋轉音效
        this.audioSystem.playRotateSound();
        this.draw();
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = matrix[y][x];
            }
        }
        
        return rotated;
    }
    
    dropPiece() {
        if (!this.gameRunning || this.gamePaused) return;
        
        while (this.movePiece(0, 1)) {
            // 繼續下降直到碰撞
        }
    }
    
    placePiece() {
        // 將當前方塊放置到遊戲板上
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // 播放放置音效
        this.audioSystem.playDropSound();
        
        // 檢查並清除完整的行
        this.clearLines();
        
        // 生成新方塊
        this.spawnNewPiece();
        
        this.draw();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // 重新檢查同一行
            }
        }
        
        if (linesCleared > 0) {
            const oldLevel = this.level;
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            // 播放消除行音效
            this.audioSystem.playClearLineSound(linesCleared);
            
            // 如果等級提升，播放等級提升音效
            if (this.level > oldLevel) {
                setTimeout(() => {
                    this.audioSystem.playLevelUpSound();
                }, 500);
            }
            
            this.updateDisplay();
        }
    }
    
    calculateScore(linesCleared) {
        const baseScore = [0, 100, 300, 500, 800];
        return baseScore[linesCleared] * this.level;
    }
    
    draw() {
        // 清除畫布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 繪製遊戲板
        this.drawBoard();
        
        // 繪製當前方塊
        if (this.currentPiece) {
            this.drawPiece(this.ctx, this.currentPiece, this.currentPiece.x, this.currentPiece.y);
        }
        
        // 繪製網格線
        this.drawGrid();
    }
    
    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(
                        x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                    
                    // 添加邊框效果
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(
                        x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                }
            }
        }
    }
    
    drawPiece(ctx, piece, offsetX, offsetY) {
        ctx.fillStyle = piece.color;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const drawX = (offsetX + x) * this.BLOCK_SIZE;
                    const drawY = (offsetY + y) * this.BLOCK_SIZE;
                    
                    ctx.fillRect(drawX, drawY, this.BLOCK_SIZE, this.BLOCK_SIZE);
                    
                    // 添加邊框效果
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(drawX, drawY, this.BLOCK_SIZE, this.BLOCK_SIZE);
                }
            }
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        // 垂直線
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 水平線
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            this.nextCtx.fillStyle = this.nextPiece.color;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        const drawX = offsetX + x * blockSize;
                        const drawY = offsetY + y * blockSize;
                        
                        this.nextCtx.fillRect(drawX, drawY, blockSize, blockSize);
                        this.nextCtx.strokeStyle = '#fff';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(drawX, drawY, blockSize, blockSize);
                    }
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    gameLoop(timestamp) {
        if (!this.gameRunning || this.gamePaused) return;
        
        if (timestamp - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = timestamp;
        }
        
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.hideGameOverlay();
        this.dropTime = performance.now();
        
        // 啟動音頻上下文並播放背景音樂
        this.audioSystem.ensureAudioContext().then(() => {
            this.audioSystem.playBackgroundMusic();
        });
        
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        this.draw();
    }
    
    pauseGame() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            this.showGameOverlay('遊戲暫停', '按空白鍵繼續');
        } else {
            this.hideGameOverlay();
            this.dropTime = performance.now();
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.audioSystem.playGameOverSound();
        this.showGameOverlay('遊戲結束', `最終分數: ${this.score}`);
        document.getElementById('restartButton').style.display = 'inline-block';
    }
    
    restartGame() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.updateDisplay();
        this.initializeGame();
        document.getElementById('restartButton').style.display = 'none';
    }
    
    showGameOverlay(title, message) {
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').textContent = message;
        document.getElementById('gameOverlay').style.display = 'flex';
    }
    
    hideGameOverlay() {
        document.getElementById('gameOverlay').style.display = 'none';
    }
    
    setupEventListeners() {
        // 鍵盤控制
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.code !== 'Space') return;
            
            switch (e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'Space':
                    e.preventDefault();
                    if (this.gameRunning) {
                        this.pauseGame();
                    }
                    break;
            }
        });
        
        // 按鈕事件
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('muteButton').addEventListener('click', () => {
            const isMuted = this.audioSystem.toggleMute();
            document.getElementById('muteButton').textContent = isMuted ? '靜音' : '音效';
        });
        
        // 觸控控制 - 改進的事件處理
        const addTouchControl = (elementId, action) => {
            const element = document.getElementById(elementId);
            
            // 點擊事件
            element.addEventListener('click', (e) => {
                e.preventDefault();
                action();
            });
            
            // 觸控事件
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                element.style.transform = 'scale(0.9)';
                action();
            });
            
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                element.style.transform = 'scale(1)';
            });
            
            // 防止長按選擇
            element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        };
        
        addTouchControl('leftButton', () => this.movePiece(-1, 0));
        addTouchControl('rightButton', () => this.movePiece(1, 0));
        addTouchControl('downButton', () => this.movePiece(0, 1));
        addTouchControl('rotateButton', () => this.rotatePiece());
        addTouchControl('dropButton', () => this.dropPiece());
        
        // 添加滑動手勢支持
        this.addSwipeGestures();
    }
    
    addSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let isTouch = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isTouch = true;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!isTouch) return;
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            const minSwipeDistance = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // 水平滑動
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.movePiece(1, 0); // 右滑
                    } else {
                        this.movePiece(-1, 0); // 左滑
                    }
                }
            } else {
                // 垂直滑動
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.movePiece(0, 1); // 下滑
                    } else {
                        this.rotatePiece(); // 上滑旋轉
                    }
                }
            }
            
            isTouch = false;
        });
        
        // 雙擊快速下降
        let lastTap = 0;
        this.canvas.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                this.dropPiece();
            }
            lastTap = currentTime;
        });
    }
}

// 初始化遊戲
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new TetrisGame();
});

