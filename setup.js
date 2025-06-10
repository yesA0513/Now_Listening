/* setup.js (모바일/데스크톱 분리 버전) */

let allSongs = [];
let currentAudio = null;
let playPauseBtn = null;

// --- 도우미 함수 ---
function formatDuration(ms){const minutes=Math.floor(ms/60000);const seconds=((ms%60000)/1000).toFixed(0);return minutes+":"+(seconds<10?'0':'')+seconds}
function formatDate(dateString){const[year,month,day]=dateString.split('-');return`${year}년 ${month}월 ${day}일`}

document.addEventListener('DOMContentLoaded', () => {
    fetchMusicData();
    // 모달 닫기 이벤트 설정
    document.querySelector('.modal-close-btn').addEventListener('click', closeSongDetailModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeSongDetailModal);

    document.addEventListener('keydown', (event) => {
        if (!document.getElementById('song-detail-modal').classList.contains('hidden') && event.key === 'Escape') {
            closeSongDetailModal();
        }
    });

    const grid = document.getElementById('album-grid');

    // ▼▼▼ 화면 너비에 따라 다른 기능 적용 ▼▼▼
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
    // ▲▲▲ 데스크톱 기능 종료 ▲▲▲
});

// --- 데이터 처리 및 렌더링 ---
async function fetchMusicData() {
    const apiUrl = "https://simple-proxy.taein.workers.dev/?destination=https://yuntae.in/api/music/recent/noa?size=30";
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        allSongs = data.data;
        while (allSongs.length > 0 && allSongs.length < 30) {
            allSongs = allSongs.concat(allSongs);
        }
        allSongs = allSongs.slice(0, 30);
        renderInitialGrid();
    } catch (error) {
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
        item.addEventListener('click', () => showSongDetailModal(song));
    } else {
        // 데스크톱: 중앙 이동 애니메이션 후 모달 표시
        item.addEventListener('click', (event) => centerAndShowModal(event, song));
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
function showSongDetailModal(song) {
    const modal = document.getElementById('song-detail-modal');
    const modalCover = document.getElementById('modal-cover');
    const backdrop = document.querySelector('.modal-backdrop');
    const modalRight = document.querySelector('.modal-right');
    const closeBtn = document.querySelector('.modal-close-btn');

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
    const playIcon = '<svg width="48" height="48"><use href="#icon-play"></use></svg>';
    const pauseIcon = '<svg width="48" height="48"><use href="#icon-pause"></use></svg>';
    currentAudio.src = song.attributes.previews[0].url;
    playPauseBtn.innerHTML = playIcon;
    currentAudio.onplay = () => playPauseBtn.innerHTML = pauseIcon;
    currentAudio.onpause = () => playPauseBtn.innerHTML = playIcon;
    currentAudio.onended = () => playPauseBtn.innerHTML = playIcon;
    playPauseBtn.onclick = () => {
        if (currentAudio.paused) currentAudio.play();
        else currentAudio.pause();
    };

    document.getElementById('album-grid').classList.add('blurred');
    modal.classList.remove('hidden');
}

function closeSongDetailModal() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
    }
    document.getElementById('album-grid').classList.remove('blurred');
    document.getElementById('song-detail-modal').classList.add('hidden');
}