let songs = [];
let allSongs = [];
let currentSong = 0;
let isPlaying = false;
let isEditing = false;
let repeatSong = false;

const audioPlayer = document.getElementById('audio-player');
const progressBar = document.getElementById('progress-bar');
const volumeBar = document.getElementById('volume');
const previousBtn = document.getElementById('go-previous');
const nextBtn = document.getElementById('go-next');
const playBtn = document.getElementById('play-pause');
const playSvg = document.getElementById('play');
const pauseSvg = document.getElementById('pause');
const editBtn = document.getElementById('edit-btn');
const nowPlaying = document.getElementById('now-playing');
const tableBody = document.querySelector("#songs-table tbody");
const searchInput = document.getElementById('search');

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
        playPause();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        playPause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPreviousSong();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextSong();
    });
}
progressBar.style.setProperty('--value', `0%`);

audioPlayer.ontimeupdate = () => {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.setProperty('--value', `${progress}%`);
    progressBar.value = progress || 0;
};

audioPlayer.onended = () => {
	if (repeatSong) {
		audioPlayer.currentTime = 0;
		return audioPlayer.play();
	}
	
    playNextSong();
}

progressBar.oninput = () => {
    const seekTime = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
};

function updateVolumeBar() {
    const volume = volumeBar.value * 100;
    volumeBar.style.setProperty('--value', `${volume}%`);
    audioPlayer.volume = volumeBar.value;
}
volumeBar.oninput = () => updateVolumeBar();
updateVolumeBar();
audioPlayer.volume = 1;

previousBtn.onclick = () => play(currentSong == 0 ? songs.length - 1 : currentSong - 1);
playBtn.onclick = () => playPause();
nextBtn.onclick = () => play((currentSong == songs.length - 1) ? 0 : (currentSong + 1));

document.onkeydown = (event) => {
    if (isEditing) {
        if (event.key == 'Enter') {
            updateMetadata(index, cell.dataset.field, cell.textContent)
        }
        return;
    }
    const isSearching = searchInput === document.activeElement;
    if (isSearching) {
        return;
    }
    if (event.key == ' ' ||
        event.key == 'ArrowLeft' ||
        event.key == 'ArrowRight' ||
        event.key == 'ArrowUp' ||
        event.key == 'ArrowDown' ||
        event.key == 'PageUp' ||
        event.key == 'PageDown'
    ) {
        event.preventDefault();
    }
    switch (event.key) {
        case ' ':
            playPause();
            break;
        case 'ArrowLeft':
            audioPlayer.currentTime -= 5;
            break;
        case 'ArrowRight':
            audioPlayer.currentTime += 5;
            break;
        case 'ArrowUp':
            if (window.innerWidth >= 768) {
                volumeBar.value = Math.min(1, parseFloat(volumeBar.value) + 0.05);
                updateVolumeBar();
            }
            break;
        case 'ArrowDown':
            if (window.innerWidth >= 768) {
                volumeBar.value = Math.max(0, parseFloat(volumeBar.value) - 0.05);
                updateVolumeBar();
            }
            break;
        case 'PageUp':
            if (currentSong != 0) {
                playPreviousSong();
            } else {
                play(currentSong);
            }
            break;
        case 'PageDown':
            if (currentSong == songs.length - 1) {
                play(0);
            } else {
                playNextSong();
            }
            break;
    }
}

playSvg.style.display = 'block';
pauseSvg.style.display = 'none';

function playPreviousSong() {
    play(currentSong - 1);
}
function playNextSong() {
    play(currentSong + 1);
}

function playPause() {
    if (isPlaying) {
        pause();
    } else {
        play();
    }
}

function toggleEdit() {
    isEditing = !isEditing;
    if (isEditing) {
        editBtn.classList.add('enabled');
        return;
    }
    editBtn.classList.remove('enabled');
}
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function loadTable(_songs) {
    tbody.innerHTML = "";
    _songs.forEach((song, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td data-field="title">${song.title}</td>
            <td data-field="artist" class="unimportant-2">${song.artist}</td>
            <td data-field="album" class="unimportant">${song.album}</td>
            <td>${Math.floor(song.duration / 60)}:${Math.floor(song.duration % 60).toString().padStart(2, '0')}</td>
        `;
        row.dataset.index = index;

        row.onclick = (event) => {
            const cell = event.target.closest('td[data-field]');

            if (cell && isEditing) {
                cell.contentEditable = "true";
                cell.focus();
                cell.onblur = () => updateMetadata(index, cell.dataset.field, cell.textContent);
            }
            else {
                play(index);
            }
        }

        tableBody.appendChild(row);
    });
}
async function fetchSongs(search) {
    const response = await fetch(`/api/songs${search ? `?search=${search}` : ''}`);
    songs = await response.json();
    songs = shuffle(songs);
    if (!search) {
        allSongs = songs;
    }
    loadTable(songs);
}

async function updateMetadata(index, field, value) {
    const song = songs[index];
    const updatedData = { filename: song.filename, field, value };

    const response = await fetch('/api/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
    });

    if (response.ok) {
        song[field] = value;
        console.log(`Updated ${field} for ${song.title}`);
    } else {
        console.error('Failed to update metadata');
    }
}

function uploadMp3() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (!file) {
        document.getElementById('upload-message').innerText = 'Please select a file first.';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    document.getElementById('upload-message').innerText = 'Uploading...';

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('upload-message').innerText = 'Upload successful!';
            if (data.metadata) {
                document.getElementById('upload-message').innerText += `\nMetadata: ${JSON.stringify(data.metadata)}`;
            }
        } else {
            document.getElementById('upload-message').innerText = `Error: ${data.error || 'Unknown error'}`;
        }
    })
    .catch(error => {
        document.getElementById('upload-message').innerText = 'Error during upload. Please try again.';
        console.error(error);
    });
}

async function ngrok() {
	const response = await fetch('/ngrok', {method:'POST'});
	debugger;
	const result = await response.text();
	alert(result);
}

let searchTimeout;
previousSearch = '';
function search() {
    const text = searchInput.value.toLowerCase();
    console.log(text);
    if (text.length == 1 || text == previousSearch) return;
    previousSearch = text;
    if (text.length == 0) {
        loadTable(allSongs);
        return;
    }
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        fetchSongs(text);
    }, 1000);
}
searchInput.addEventListener("keyup", search);

function pause() {
    audioPlayer.pause();
    isPlaying = false;
    playSvg.style.display = 'block';
    pauseSvg.style.display = 'none';
}

function play(filename) {
    tableBody.children[currentSong]?.classList.remove('playing');
    if (typeof (filename) == 'number') {
        currentSong = filename;
        play(songs[currentSong].filename);
        return;
    }
    tableBody.children[currentSong].classList.add('playing');
    if (!filename && !audioPlayer.src) {
        play(songs[0].filename);
        return;
    }
    isPlaying = true;
    if (filename) {
        audioPlayer.src = `song/${filename}`;
    }
    playSvg.style.display = 'none';
    pauseSvg.style.display = 'block';
    audioPlayer.play();
    nowPlayingText();
}

function nowPlayingText() {
    let text = `${songs[currentSong].filename.slice(0, -4)}`;
    document.title = text;
    if (songs[currentSong].artist != "Unknown Artist") {
        text += ` - ${songs[currentSong].artist}`;
    }
    nowPlaying.innerHTML = text;
}


fetchSongs();
