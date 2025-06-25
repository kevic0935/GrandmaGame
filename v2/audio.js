class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    // 確保音頻上下文已啟動（需要用戶交互）
    async ensureAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    // 生成音調
    createTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext || this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // 移動音效
    playMoveSound() {
        this.createTone(200, 0.1, 'square', 0.1);
    }
    
    // 旋轉音效
    playRotateSound() {
        this.createTone(300, 0.15, 'triangle', 0.15);
    }
    
    // 放置方塊音效
    playDropSound() {
        this.createTone(150, 0.2, 'sawtooth', 0.2);
    }
    
    // 消除行音效
    playClearLineSound(lines) {
        const frequencies = [400, 500, 600, 700];
        for (let i = 0; i < lines; i++) {
            setTimeout(() => {
                this.createTone(frequencies[i] || 800, 0.3, 'sine', 0.25);
            }, i * 100);
        }
    }
    
    // 遊戲結束音效
    playGameOverSound() {
        const notes = [400, 350, 300, 250, 200];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.5, 'triangle', 0.3);
            }, index * 200);
        });
    }
    
    // 等級提升音效
    playLevelUpSound() {
        const notes = [300, 400, 500, 600];
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.2, 'sine', 0.2);
            }, index * 100);
        });
    }
    
    // 背景音樂（簡單的循環音調）
    playBackgroundMusic() {
        if (this.isMuted || !this.audioContext) return;
        
        const melody = [
            {freq: 330, duration: 0.5}, // E4
            {freq: 247, duration: 0.25}, // B3
            {freq: 262, duration: 0.25}, // C4
            {freq: 294, duration: 0.5}, // D4
            {freq: 262, duration: 0.25}, // C4
            {freq: 247, duration: 0.25}, // B3
            {freq: 220, duration: 0.5}, // A3
            {freq: 220, duration: 0.25}, // A3
            {freq: 262, duration: 0.25}, // C4
            {freq: 330, duration: 0.5}, // E4
            {freq: 294, duration: 0.25}, // D4
            {freq: 262, duration: 0.25}, // C4
            {freq: 247, duration: 1.0}, // B3
        ];
        
        let currentTime = 0;
        melody.forEach(note => {
            setTimeout(() => {
                if (!this.isMuted) {
                    this.createTone(note.freq, note.duration, 'sine', 0.1);
                }
            }, currentTime * 1000);
            currentTime += note.duration;
        });
        
        // 循環播放
        if (!this.isMuted) {
            setTimeout(() => this.playBackgroundMusic(), currentTime * 1000);
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

