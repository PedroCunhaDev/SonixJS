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
    
    // Focus on the first few bins for bass frequencies (usually the first 20 bins)
    const bassFrequencyCount = 20; // You can adjust this number to focus on more/less bass
    const bassData = dataArray.slice(0, bassFrequencyCount);

    // Calculate the average bass amplitude
    const bassAmplitude = bassData.reduce((sum, value) => sum + value, 0) / bassData.length;

    // Normalize and calculate brightness and scale based on bass
    const normalizedBassAmplitude = bassAmplitude / 255;
    const brightness = 0.3 + Math.pow(normalizedBassAmplitude, 1.5) * 2.7;

    // Scale effect based on bass frequency
    const scale = 1 + Math.pow(normalizedBassAmplitude, 1.5) * 0.3;

    glowContainer.style.filter = `brightness(${brightness})`;
    glowContainer.style.transform = `scale(${scale})`;

    // Movement can still be based on overall frequency data
    const averageAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedAmplitude = averageAmplitude / 255;
    const xMovement = normalizedAmplitude * 50 - 25;
    const yMovement = normalizedAmplitude * 50 - 25;
    glowContainer.style.backgroundPosition = `${20 + xMovement}vw ${20 + yMovement}vh`;

    requestAnimationFrame(updateGlow);
}

audioPlayer.addEventListener('play', () => {
    audioContext.resume();
    updateGlow();
});
