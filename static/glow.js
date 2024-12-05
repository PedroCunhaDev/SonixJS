const glowContainer = document.getElementById('glow');

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

const source = audioContext.createMediaElementSource(audioPlayer);
source.connect(analyser);
analyser.connect(audioContext.destination);

function updateGlow() {
    analyser.getByteFrequencyData(dataArray);

    const averageAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

    const normalizedAmplitude = averageAmplitude / 255;
    const brightness = 0.3 + Math.pow(normalizedAmplitude, 1.5) * 2.7;

    const scale = 1 + Math.pow(normalizedAmplitude, 1.5) * 0.3;

    glowContainer.style.filter = `brightness(${brightness})`;
    glowContainer.style.transform = `scale(${scale})`;

    const xMovement = normalizedAmplitude * 50 - 25;
    const yMovement = normalizedAmplitude * 50 - 25;
    glowContainer.style.backgroundPosition = `${20 + xMovement}vw ${20 + yMovement}vh`;

    requestAnimationFrame(updateGlow);
}

audioPlayer.addEventListener('play', () => {
    audioContext.resume();
    updateGlow();
});
