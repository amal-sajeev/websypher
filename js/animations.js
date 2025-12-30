/* Matrix and Lain-inspired animations */

// Matrix falling characters
function initMatrixBackground() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const bgElement = document.getElementById('matrix-bg');
    
    if (!bgElement) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bgElement.appendChild(canvas);
    
    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = matrix[Math.floor(Math.random() * matrix.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            
            drops[i]++;
        }
    }
    
    setInterval(draw, 35);
    
    // Resize handler
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Lain glitch effect
function applyGlitchEffect(element) {
    if (!element) return;
    
    element.addEventListener('mouseenter', function() {
        this.style.animation = 'glitch-hover 0.3s infinite';
    });
    
    element.addEventListener('mouseleave', function() {
        this.style.animation = 'none';
    });
}

// Add glitch animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes glitch-hover {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
    }
    
    @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 65, 0.5); }
        50% { box-shadow: 0 0 20px rgba(0, 255, 65, 0.8); }
    }
    
    .pulse-glow {
        animation: pulse-glow 2s infinite;
    }
`;
document.head.appendChild(style);

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initMatrixBackground();
    
    // Apply glitch to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        applyGlitchEffect(btn);
    });
    
    // Apply glitch to result cards
    document.querySelectorAll('.result-card').forEach(card => {
        applyGlitchEffect(card);
    });
});

// Export for use in main.js
window.initMatrixBackground = initMatrixBackground;
window.applyGlitchEffect = applyGlitchEffect;


