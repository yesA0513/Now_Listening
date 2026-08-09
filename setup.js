/* setup.js (모바일/데스크톱 분리 버전) */

let allSongs = [];
let currentAudio = null;
let playPauseBtn = null;
let currentSongIndex = -1;
let currentArtworkRgb = [16, 17, 20];

const playIcon = '<svg width="48" height="48"><use href="#icon-play"></use></svg>';
const pauseIcon = '<svg width="48" height="48"><use href="#icon-pause"></use></svg>';

function setPersistentPlaybackState(isPlaying) {
    const button = document.getElementById('persistent-play');
    button.innerHTML = isPlaying
        ? '<svg><use href="#icon-pause"></use></svg>'
        : '<svg><use href="#icon-play"></use></svg>';
}

function updatePersistentPlayer(song) {
    const attributes = song.attributes;
    document.getElementById('persistent-cover').src = attributes.artwork.url.replace('{w}x{h}', '160x160');
    document.getElementById('persistent-title').textContent = attributes.name;
    document.getElementById('persistent-artist').textContent = attributes.artistName;
}

function setPlaybackAmbient(isPlaying) {
    const page = document.body;
    page.style.setProperty('--now-rgb', currentArtworkRgb.join(','));
    page.classList.toggle('is-playing', isPlaying);
}

function moveToAdjacentSong(offset) {
    if (!allSongs.length) return;
    const wasPlaying = currentAudio && !currentAudio.paused;
    currentSongIndex = (currentSongIndex + offset + allSongs.length) % allSongs.length;
    showSongDetailModal(allSongs[currentSongIndex], currentSongIndex);
    document.getElementById('song-detail-modal').classList.add('hidden');
    document.getElementById('album-grid').classList.remove('blurred');
    if (wasPlaying && currentAudio) {
        currentAudio.play().catch(error => console.warn('Preview playback is unavailable.', error));
    }
}

const previewTracks = [
    ['Neon Bloom', 'June Park', 'After Midnight', '#c6ff62', '#243119'],
    ['Slow Motion', 'Mina Lee', 'Still / Moving', '#ff8a8a', '#401e31'],
    ['Blue Hour', 'Haru', 'Between Waves', '#8bc5ff', '#182b51'],
    ['Daydream', 'EUN', 'Soft Focus', '#ffd166', '#4a3520'],
    ['City Lights', 'KAIRO', 'Night Bus', '#be9cff', '#2f2151'],
    ['Warmth', 'Sora', 'Small Things', '#ffb57e', '#493126']
];

function createPreviewArtwork(title, first, second) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${first}"/><stop offset="1" stop-color="${second}"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/><circle cx="650" cy="160" r="220" fill="white" fill-opacity=".14"/><circle cx="170" cy="660" r="260" fill="black" fill-opacity=".13"/><text x="64" y="670" fill="white" font-family="Arial, sans-serif" font-size="58" font-weight="700">${title}</text><text x="68" y="732" fill="white" fill-opacity=".72" font-family="Arial, sans-serif" font-size="24">NOW LISTENING</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getPreviewSongs() {
    return previewTracks.map(([name, artistName, albumName, first, second], index) => ({
        attributes: {
            name, artistName, albumName,
            releaseDate: `202${index % 5}-01-01`,
            url: '#',
            artwork: { url: createPreviewArtwork(name, first, second) },
            previews: [{ url: '' }]
        }
    }));
}

// --- 도우미 함수 ---
function formatDuration(ms){const minutes=Math.floor(ms/60000);const seconds=((ms%60000)/1000).toFixed(0);return minutes+":"+(seconds<10?'0':'')+seconds}
function formatDate(dateString){const[year,month,day]=dateString.split('-');return`${year}년 ${month}월 ${day}일`}

document.addEventListener('DOMContentLoaded', () => {
    fetchMusicData();
    // 모달 닫기 이벤트 설정
    document.querySelector('.modal-close-btn').addEventListener('click', closeSongDetailModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeSongDetailModal);
    document.getElementById('persistent-previous').addEventListener('click', () => moveToAdjacentSong(-1));
    document.getElementById('persistent-next').addEventListener('click', () => moveToAdjacentSong(1));
    document.getElementById('persistent-play').addEventListener('click', () => {
        if (!currentAudio || !currentAudio.src) return;
        if (currentAudio.paused) currentAudio.play().catch(error => console.warn('Preview playback is unavailable.', error));
        else currentAudio.pause();
    });

    document.addEventListener('keydown', (event) => {
        if (!document.getElementById('song-detail-modal').classList.contains('hidden') && event.key === 'Escape') {
            closeSongDetailModal();
        }
    });

    const grid = document.getElementById('album-grid');

    if (window.innerWidth > 768) {
        // --- 데스크톱: 마우스 패닝 효과 ---
        const panIntensityX = 450;
        const panIntensityY = 200;
        document.body.addEventListener('mousemove', (e) => {
            if (!document.getElementById('song-detail-modal').classList.contains('hidden')) return;
            const { clientWidth, clientHeight } = document.body;
            const mouseX = (e.clientX / clientWidth) - 0.5;
            const mouseY = (e.clientY / clientHeight) - 0.5;
            const panX = -mouseX * panIntensityX;
            const panY = -mouseY * panIntensityY;
            grid.style.transform = `translate(${panX}px, ${panY}px)`;
        });
    }
});

// --- 데이터 처리 및 렌더링 ---
async function fetchMusicData() {
    const apiUrl = "https://yuntae.in/api/music/recent";
    const userToken = "0.AktYAPbNiGO2P8Hw2ITiDaBpBk/RfLVmvHuR06sa7WCBGWaqU7lBI8inTp2k8uX0yBzLCFj06BOV8tRMRivbTB+UmqhRczVHIXS2mOPyKHWUN6Ej5qDbxwTMn0dNZitD25b1ujoNHmhdH4csVD7r4XOmyg51OYzAkTeoIXP2r2In2Ux7Xxx4vPKX4aOxN+p3ifY+Xn9OggHOh1y2Hjf94e/xspY5rGol3Q9rDoCC9wo/ZMXzcg=="; //media-user-token.

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'user-token': userToken
            }
        });
        if (!response.ok) throw new Error(`Music API returned ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('Music API returned no tracks');
        allSongs = data.data;
        while (allSongs.length > 0 && allSongs.length < 30) {
            allSongs = allSongs.concat(allSongs);
        }
        allSongs = allSongs.slice(0, 30);
        renderInitialGrid();
    }
    catch (error) {
        console.warn('Could not load live music data. Showing local preview tracks instead.', error);
        document.body.classList.add('preview-mode');
        document.getElementById('header-note').textContent = 'Local preview · sample tracks';
        allSongs = getPreviewSongs();
        while (allSongs.length < 30) allSongs = allSongs.concat(allSongs);
        allSongs = allSongs.slice(0, 30);
        renderInitialGrid();
        console.error("음악 데이터 로딩 실패:", error);
    }
}

function renderInitialGrid() {
    const grid = document.getElementById('album-grid');
    grid.innerHTML = '';
    allSongs.forEach((song, index) => {
        const item = createAlbumItem(song, index);
        grid.appendChild(item);
    });
}

function createAlbumItem(song, index) {
    const item = document.createElement('div');
    item.className = 'album-item';
    const artworkUrl = song.attributes.artwork.url.replace('{w}x{h}', '400x400');
    const songName = song.attributes.name;
    const artistName = song.attributes.artistName;
    const img = document.createElement('img');
    img.src = artworkUrl;
    img.alt = `${songName} - ${artistName}`;
    item.appendChild(img);
    const overlay = document.createElement('div');
    overlay.className = 'album-overlay';
    overlay.innerHTML = `<p class="overlay-song">${songName}</p><p class="overlay-artist">${artistName}</p>`;
    item.appendChild(overlay);
    
    // ▼▼▼ 화면 너비에 따라 다른 클릭 이벤트 추가 ▼▼▼
    if (window.innerWidth <= 768) {
        // 모바일: 바로 모달 표시
        item.addEventListener('click', () => showSongDetailModal(song, index));
    } else {
        // 데스크톱: 중앙 이동 애니메이션 후 모달 표시
        item.addEventListener('click', () => showSongDetailModal(song, index));
    }
    // ▲▲▲ 이벤트 분리 완료 ▲▲▲

    item.style.animationDelay = `${index * 50}ms`;
    return item;
}

// --- 데스크톱 전용 기능: 중앙 이동 및 모달 표시 ---
function centerAndShowModal(event, song) {
    const item = event.currentTarget;
    const grid = document.getElementById('album-grid');

    const getTranslateValues = (element) => {
        const style = window.getComputedStyle(element);
        const matrix = new DOMMatrix(style.transform);
        return { x: matrix.m41, y: matrix.m42 };
    };
    const currentTranslate = getTranslateValues(grid);

    const itemRect = item.getBoundingClientRect();
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const itemViewportCenterX = itemRect.left + itemRect.width / 2;
    const itemViewportCenterY = itemRect.top + itemRect.height / 2;

    const shiftX = viewportCenterX - itemViewportCenterX;
    const shiftY = viewportCenterY - itemViewportCenterY;

    const newTranslateX = currentTranslate.x + shiftX;
    const newTranslateY = currentTranslate.y + shiftY;

    grid.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px)`;

    setTimeout(() => {
        showSongDetailModal(song);
    }, 400); 
}

// --- 모달 제어 함수 (공통) ---
function showSongDetailModal(song, songIndex = allSongs.indexOf(song)) {
    const modal = document.getElementById('song-detail-modal');
    const modalCover = document.getElementById('modal-cover');
    const backdrop = document.querySelector('.modal-backdrop');
    const modalRight = document.querySelector('.modal-right');
    const closeBtn = document.querySelector('.modal-close-btn');

    currentSongIndex = songIndex;
    updatePersistentPlayer(song);

    document.getElementById('modal-artist-name').textContent = song.attributes.artistName;
    document.getElementById('modal-song-title').textContent = song.attributes.name;
    document.getElementById('modal-apple-music-link').href = song.attributes.url;

    const albumInfoEl = document.getElementById('modal-album-info');
    if (albumInfoEl) {
        const releaseYear = song.attributes.releaseDate.substring(0, 4);
        albumInfoEl.textContent = `${song.attributes.albumName} - ${releaseYear}`;
    }
    
    modalCover.src = song.attributes.artwork.url.replace('{w}x{h}', '600x600');

    modalCover.onload = () => {
        try {
            const colorThief = new ColorThief();
            const dominantColor = colorThief.getColor(modalCover);
            const modalAccent = dominantColor.map(color => Math.round(color + (255 - color) * 0.28));
            currentArtworkRgb = dominantColor;
            modal.style.setProperty('--artwork-rgb', dominantColor.join(','));
            modal.style.setProperty('--modal-accent', `rgb(${modalAccent.join(',')})`);
            if (currentAudio && !currentAudio.paused) setPlaybackAmbient(true);
            backdrop.style.backgroundColor = `rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.75)`;
            const luminance = 0.2126 * dominantColor[0] + 0.7152 * dominantColor[1] + 0.0722 * dominantColor[2];
            if (luminance < 100) {
                modalRight.classList.add('light-text');
                closeBtn.classList.add('light-text');
            } else {
                modalRight.classList.remove('light-text');
                closeBtn.classList.remove('light-text');
            }
        } catch (e) {
            console.error("색상 추출 오류:", e);
            backdrop.style.backgroundColor = '#D9D9E2';
        }
    };
    
    currentAudio = document.getElementById('modal-audio');
    playPauseBtn = document.getElementById('play-pause-btn');
    const progress = document.getElementById('playback-progress');
    const currentTimeLabel = document.getElementById('current-time');
    const durationTimeLabel = document.getElementById('duration-time');
    const updateProgress = () => {
        const duration = currentAudio.duration;
        const position = Number.isFinite(duration) && duration > 0 ? currentAudio.currentTime / duration * 100 : 0;
        progress.value = currentAudio.currentTime || 0;
        progress.style.setProperty('--progress', `${position}%`);
        currentTimeLabel.textContent = formatDuration((currentAudio.currentTime || 0) * 1000);
    };
    progress.value = 0;
    progress.max = 0;
    progress.disabled = true;
    progress.style.setProperty('--progress', '0%');
    currentTimeLabel.textContent = '0:00';
    durationTimeLabel.textContent = '0:00';
    const playIcon = '<svg width="48" height="48"><use href="#icon-play"></use></svg>';
    const pauseIcon = '<svg width="48" height="48"><use href="#icon-pause"></use></svg>';
    currentAudio.onloadedmetadata = () => {
        if (!Number.isFinite(currentAudio.duration)) return;
        progress.max = currentAudio.duration;
        progress.disabled = false;
        durationTimeLabel.textContent = formatDuration(currentAudio.duration * 1000);
        updateProgress();
    };
    currentAudio.ontimeupdate = updateProgress;
    const previewUrl = song.attributes.previews?.[0]?.url || '';
    playPauseBtn.disabled = !previewUrl;
    currentAudio.src = previewUrl;
    playPauseBtn.innerHTML = playIcon;
    currentAudio.onplay = () => {
        playPauseBtn.innerHTML = pauseIcon;
        setPersistentPlaybackState(true);
        setPlaybackAmbient(true);
        document.getElementById('persistent-player').classList.remove('hidden');
    };
    currentAudio.onpause = () => {
        playPauseBtn.innerHTML = playIcon;
        setPersistentPlaybackState(false);
        setPlaybackAmbient(false);
    };
    currentAudio.onended = () => {
        playPauseBtn.innerHTML = playIcon;
        updateProgress();
    };
    progress.oninput = () => {
        if (!progress.disabled) {
            currentAudio.currentTime = Number(progress.value);
            updateProgress();
        }
    };
    playPauseBtn.onclick = () => {
        if (currentAudio.paused) currentAudio.play().catch(error => console.warn('Preview playback is unavailable.', error));
        else currentAudio.pause();
    };

    document.getElementById('album-grid').classList.add('blurred');
    modal.classList.remove('hidden');
}

function closeSongDetailModal() {
    document.getElementById('album-grid').classList.remove('blurred');
    document.getElementById('song-detail-modal').classList.add('hidden');
}
