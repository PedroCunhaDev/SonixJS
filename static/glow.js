const glowContainer = document.getElementById('glow');

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

const source = audioContext.createMediaElementSource(audioPlayer);
source.connect(analyser);
analyser.connect(audioContext.destination);

function roundDecimal(value, multiplier) {
    return Math.round(value * multiplier) / multiplier;
}

function updateGlow() {
    analyser.getByteFrequencyData(dataArray);
    
    const bassFrequencyCount = 20;
    const bassData = dataArray.slice(0, bassFrequencyCount);

    const bassAmplitude = bassData.reduce((sum, value) => sum + value, 0) / bassData.length;

    const normalizedBassAmplitude = bassAmplitude / 255;
    const brightness = 0.3 + Math.pow(normalizedBassAmplitude, 1.5) * 2.7;

    const scale = 1 + Math.pow(normalizedBassAmplitude, 1.5) * 0.3;

    glowContainer.style.filter = `brightness(${roundDecimal(brightness, 100)})`;
    glowContainer.style.transform = `scale(${roundDecimal(scale, 100)})`;

    const averageAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedAmplitude = averageAmplitude / 255;
    const xMovement = normalizedAmplitude * 50 - 25;
    const yMovement = normalizedAmplitude * 50 - 25;
    glowContainer.style.backgroundPosition = `${20 + roundDecimal(xMovement, 100)}vw ${20 + roundDecimal(yMovement, 100)}vh`;

    requestAnimationFrame(updateGlow);
}

audioPlayer.addEventListener('play', () => {
    audioContext.resume();
    updateGlow();
});
