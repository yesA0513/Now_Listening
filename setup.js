/* setup.js (오류 수정 및 안정성 강화 버전) */

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

    // ▼▼▼ 여기에 ESC 키로 모달 닫기 이벤트 추가 ▼▼▼
    document.addEventListener('keydown', (event) => {
        // 모달이 열려있고, 눌린 키가 'Escape'일 때
        if (!document.getElementById('song-detail-modal').classList.contains('hidden') && event.key === 'Escape') {
            closeSongDetailModal();
        }
    });
    // ▲▲▲ 여기까지 코드 추가 ▲▲▲

    // --- 마우스 패닝 효과 ---
    const grid = document.getElementById('album-grid');
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

        let isPanning = false;
    let startX, startY;
    let initialTranslateX = 0, initialTranslateY = 0;

    // 현재 그리드의 transform 값에서 translate 값을 추출하는 함수
    const getTranslateValues = (element) => {
        const style = window.getComputedStyle(element);
        const matrix = new DOMMatrix(style.transform);
        return {
            x: matrix.m41,
            y: matrix.m42
        };
    };

    grid.addEventListener('touchstart', (e) => {
        // 모달이 열려있을 때는 작동하지 않음
        if (!document.getElementById('song-detail-modal').classList.contains('hidden')) return;
        
        isPanning = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        
        const currentTranslate = getTranslateValues(grid);
        initialTranslateX = currentTranslate.x;
        initialTranslateY = currentTranslate.y;

        // 패닝 중에는 부드러운 전환 효과를 잠시 제거하여 즉각적인 반응을 유도
        grid.style.transition = 'none'; 
    });

    grid.addEventListener('touchmove', (e) => {
        if (!isPanning) return;

        // 브라우저의 기본 스크롤 동작을 막음
        e.preventDefault(); 

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        // 초기 위치에서 터치 이동 거리를 더해 새로운 위치 계산
        const newX = initialTranslateX + deltaX;
        const newY = initialTranslateY + deltaY;

        grid.style.transform = `translate(${newX}px, ${newY}px)`;
    });

    grid.addEventListener('touchend', () => {
        if (!isPanning) return;
        isPanning = false;
        
        // 패닝이 끝나면 다시 부드러운 전환 효과를 복원
        grid.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.4s ease';
    });

    grid.addEventListener('touchcancel', () => {
        if (!isPanning) return;
        isPanning = false;
        grid.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.4s ease';
    });
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
    allSongs.forEach((song, index) => { // forEach 루프에서 'index'를 함께 가져옵니다.
        const item = createAlbumItem(song, index); // createAlbumItem 함수에 index를 전달합니다.
        grid.appendChild(item);
    });
}

// createAlbumItem 함수가 index를 파라미터로 받도록 수정합니다.
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
    item.addEventListener('click', () => showSongDetailModal(song));

    // ▼▼▼ 여기에 애니메이션 지연시간 설정 코드 추가 ▼▼▼
    // 각 아이템마다 50ms (0.05초) 씩 지연시간을 줍니다.
    item.style.animationDelay = `${index * 50}ms`;

    return item;
}

// --- 모달 제어 함수 ---
function showSongDetailModal(song) {
    const modal = document.getElementById('song-detail-modal');
    const modalCover = document.getElementById('modal-cover');
    const backdrop = document.querySelector('.modal-backdrop');
    const modalRight = document.querySelector('.modal-right');
    const closeBtn = document.querySelector('.modal-close-btn');

    // 1. 텍스트 정보 채우기
    document.getElementById('modal-artist-name').textContent = song.attributes.artistName;
    document.getElementById('modal-song-title').textContent = song.attributes.name;
    document.getElementById('modal-apple-music-link').href = song.attributes.url;

    // 앨범 정보 추가 (*** 안정성 강화 ***)
    const albumInfoEl = document.getElementById('modal-album-info');
    if (albumInfoEl) { // 해당 요소가 존재하는지 확인 후 내용 채우기
        const releaseYear = song.attributes.releaseDate.substring(0, 4);
        albumInfoEl.textContent = `${song.attributes.albumName} - ${releaseYear}`;
    }
    
    // 2. 앨범 커버 이미지 설정 및 색상 추출
    modalCover.src = song.attributes.artwork.url.replace('{w}x{h}', '600x600');

    modalCover.onload = () => {
        try {
            const colorThief = new ColorThief();
            const dominantColor = colorThief.getColor(modalCover);

            backdrop.style.backgroundColor = `rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.65)`;
            
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
            // 오류 발생 시 기본 색상으로 유지
            backdrop.style.backgroundColor = '#D9D9E2';
        }
    };
    
    // 3. 오디오 플레이어 설정
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

    // 4. 모달 보이기
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