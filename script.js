document.addEventListener('DOMContentLoaded', function() {
    // Game elements
    const gameContainer = document.querySelector('.game-container');
    const gameBoard = document.getElementById('gameBoard');
    const holes = document.querySelectorAll('.hole');
    const characters = document.querySelectorAll('.character');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const hammer = document.getElementById('hammer');
    const gameOverScreen = document.getElementById('gameOver');
    const finalScoreDisplay = document.getElementById('finalScore');
    const playAgainBtn = document.getElementById('playAgainBtn');
    
    // Game variables
    let score = 0;
    let timeLeft = 60;
    let timer;
    let gameActive = false;
    let lastHole = -1;
    
    // Character images from GitHub
    const characterImages = [
        "https://raw.githubusercontent.com/Vivek78900/Lamumu-whack/main/20250826_200245-removebg-preview.png",
        "https://raw.githubusercontent.com/Vivek78900/Lamumu-whack/main/SPOILER_23c98620-c032-4454-8201-495b8315f3d8-removebg-preview.png",
        "https://raw.githubusercontent.com/Vivek78900/Lamumu-whack/main/char1.png",
        "https://raw.githubusercontent.com/Vivek78900/Lamumu-whack/main/char2.png"
    ];
    
    // Preload images
    function preloadImages() {
        characterImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    preloadImages();
    
    // Create audio context for better sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Sound functions
    function playStartSound() {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    function playWhackSound() {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.9, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    function playBombSound() {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.8);
    }
    
    // Move hammer with mouse
    document.addEventListener('mousemove', (e) => {
        hammer.style.left = e.pageX + 'px';
        hammer.style.top = (e.pageY - 40) + 'px';
    });
    
    // Hammer click animation
    document.addEventListener('mousedown', () => {
        hammer.classList.add('hit');
    });
    
    document.addEventListener('mouseup', () => {
        hammer.classList.remove('hit');
    });
    
    // Start game
    startBtn.addEventListener('click', startGame);
    
    // Reset game
    resetBtn.addEventListener('click', resetGame);
    
    // Play again
    playAgainBtn.addEventListener('click', resetGame);
    
    // Whack action
    gameBoard.addEventListener('click', (e) => {
        if (!gameActive) return;
        
        let clickedElement = e.target;
        while (clickedElement && !clickedElement.classList.contains('hole') && clickedElement !== gameBoard) {
            clickedElement = clickedElement.parentElement;
        }
        
        if (clickedElement && clickedElement.classList.contains('hole')) {
            const character = clickedElement.querySelector('.character');
            const holeContainer = clickedElement.parentElement;
            
            // Add hammer hit animation and camera shake
            hammer.classList.add('hammer-hit');
            gameContainer.classList.add('shake');
            setTimeout(() => {
                hammer.classList.remove('hammer-hit');
                gameContainer.classList.remove('shake');
            }, 400);
            
            // Add cracked hole effect and grass scatter
            clickedElement.classList.add('cracked');
            holeContainer.classList.add('grass-scatter');
            setTimeout(() => {
                clickedElement.classList.remove('cracked');
                holeContainer.classList.remove('grass-scatter');
            }, 500);
            
            // Create debris particles
            createDebris(clickedElement);
            
            if (character && character.classList.contains('up')) {
                const isBomb = character.classList.contains('bomb');
                
                if (isBomb) {
                    playBombSound();
                    createExplosion(character);
                    createSmoke(character);
                    character.classList.remove('up');
                    setTimeout(() => gameOver(), 500);
                    return;
                }
                
                playWhackSound();
                score += 10;
                scoreDisplay.textContent = score;
                
                character.classList.add('character-hit');
                setTimeout(() => {
                    character.classList.remove('character-hit');
                }, 300);
                
                character.classList.remove('up');
            }
        }
    });
    
    function startGame() {
        if (gameActive) return;
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        playStartSound();
        gameActive = true;
        score = 0;
        timeLeft = 60;
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timeLeft;
        
        // Start timer
        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                gameOver();
            }
        }, 1000);
        
        // Start popping up characters
        popUpCharacters();
    }
    
    function resetGame() {
        clearInterval(timer);
        gameActive = false;
        score = 0;
        timeLeft = 60;
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timeLeft;
        
        // Hide all characters
        characters.forEach(char => {
            char.classList.remove('up');
            char.classList.remove('bomb');
            char.classList.remove('bomb-flash');
            char.style.backgroundImage = "";
            char.innerHTML = "";
        });
        
        // Hide game over screen
        gameOverScreen.style.display = 'none';
    }
    
    function popUpCharacters() {
        if (!gameActive) return;
        
        const time = Math.random() * 1500 + 500;
        const hole = selectRandomHole();
        const character = hole.querySelector('.character');
        const isBomb = Math.random() < 0.2;
        
        if (isBomb) {
            character.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="40" r="30" fill="#212121"/>
                    <rect x="45" y="70" width="10" height="15" fill="#795548"/>
                    <path d="M40,25 Q50,10 60,25" stroke="#ff5e5b" stroke-width="3" fill="none"/>
                    <circle cx="40" cy="30" r="3" fill="#ff5e5b" class="bomb-flash"/>
                    <circle cx="60" cy="30" r="3" fill="#ff5e5b" class="bomb-flash"/>
                    <path d="M45,40 Q50,45 55,40" stroke="#ff5e5b" stroke-width="2" fill="none"/>
                </svg>
            `;
            character.classList.add('bomb');
            character.style.backgroundImage = "";
        } else {
            const randomChar = Math.floor(Math.random() * 4);
            character.style.backgroundImage = `url(${characterImages[randomChar]})`;
            character.innerHTML = "";
            character.classList.remove('bomb');
        }
        
        character.classList.add('up');
        
        setTimeout(() => {
            if (character.classList.contains('up')) {
                character.classList.remove('up');
            }
            if (gameActive) {
                popUpCharacters();
            }
        }, time);
    }
    
    function selectRandomHole() {
        let index = Math.floor(Math.random() * holes.length);
        while (index === lastHole) {
            index = Math.floor(Math.random() * holes.length);
        }
        lastHole = index;
        return holes[index];
    }
    
    function createExplosion(element) {
        const rect = element.getBoundingClientRect();
        const explosion = document.createElement('div');
        explosion.classList.add('explosion');
        explosion.style.left = (rect.left + rect.width/2 - 50) + 'px';
        explosion.style.top = (rect.top + rect.height/2 - 50) + 'px';
        document.body.appendChild(explosion);
        
        setTimeout(() => {
            document.body.removeChild(explosion);
        }, 600);
    }
    
    function createSmoke(element) {
        const rect = element.getBoundingClientRect();
        const smoke = document.createElement('div');
        smoke.classList.add('smoke');
        smoke.style.left = (rect.left + rect.width/2 - 40) + 'px';
        smoke.style.top = (rect.top + rect.height/2 - 40) + 'px';
        document.body.appendChild(smoke);
        
        setTimeout(() => {
            document.body.removeChild(smoke);
        }, 2000);
    }
    
    function createDebris(element) {
        const rect = element.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
            const debris = document.createElement('div');
            debris.classList.add('debris');
            const dx = (Math.random() - 0.5) * 100;
            const dy = (Math.random() - 0.5) * 100;
            debris.style.setProperty('--dx', `${dx}px`);
            debris.style.setProperty('--dy', `${dy}px`);
            debris.style.left = (rect.left + rect.width / 2 - 5) + 'px';
            debris.style.top = (rect.top + rect.height / 2 - 5) + 'px';
            document.body.appendChild(debris);
            setTimeout(() => {
                document.body.removeChild(debris);
            }, 600);
        }
    }
    
    function gameOver() {
        gameActive = false;
        clearInterval(timer);
        
        finalScoreDisplay.textContent = score;
        gameOverScreen.style.display = 'flex';
    }
});
