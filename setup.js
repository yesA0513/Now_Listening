let currentSong = null;
let currentHistorySongs = [];

document.addEventListener("DOMContentLoaded", () => {
    // 다크 모드 감지 및 처리
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
        if (prefersDarkScheme.matches) {
            document.body.setAttribute("data-theme", "dark");
        } else {
            document.body.removeAttribute("data-theme");
        }
    };

    updateTheme();
    prefersDarkScheme.addEventListener("change", updateTheme);

    // 초기 데이터 로드
    fetchAndUpdateMusic();

    // 60초마다 업데이트 확인
    setInterval(fetchAndUpdateMusic, 10000);

    fetch("https://simple-proxy.taein.workers.dev/?destination=https://yuntae.in/api/music/recent/noa")
        .then(res => res.json())
        .then(data => {
            // 메인 컨텐츠 (첫 번째 노래)
            displayMainSong(data.data[0]);

            // 히스토리 컨텐츠 (2번째부터 30번째까지)
            const historySongs = data.data.slice(1, 30);
            displayHistorySongs(historySongs);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });

    // 화면 크기 변경 시 처리
    window.addEventListener('resize', function () {
        const historyContent = document.getElementById("history-content");
        const showMoreButton = document.getElementById("show-more");
        if (window.innerWidth <= 768) {
            historyContent.classList.remove("show-all");
            showMoreButton.style.display = "block";
        } else {
            historyContent.classList.add("show-all");
            showMoreButton.style.display = "none";
        }
    });

    // 초기 로드 시에도 실행
    if (window.innerWidth <= 768) {
        const historyContent = document.getElementById("history-content");
        historyContent.classList.remove("show-all");
        document.getElementById("show-more").style.display = "block";
    } else {
        document.getElementById("history-content").classList.add("show-all");
        document.getElementById("show-more").style.display = "none";
    }
});

function fetchAndUpdateMusic() {
    fetch("https://simple-proxy.taein.workers.dev/?destination=https://yuntae.in/api/music/recent/noa")
        .then(res => res.json())
        .then(data => {
            const latestSong = data.data[0];
            const historySongs = data.data.slice(1, 30);

            // 메인 곡 업데이트
            if (!currentSong || currentSong.id !== latestSong.id) {
                currentSong = latestSong;
                displayMainSong(latestSong);
            }

            // 히스토리 업데이트
            if (JSON.stringify(currentHistorySongs) !== JSON.stringify(historySongs)) {
                currentHistorySongs = historySongs;
                displayHistorySongs(historySongs);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function displayMainSong(song) {
    var artistName = song.attributes.artistName;
    var songName = song.attributes.name;
    var albumCover = song.attributes.artwork.url;
    var preview = song.attributes.previews[0].url;
    var moreInfo = song.attributes.url;

    var resizeCover = albumCover.replace("{w}x{h}", "1000x1000");

    document.getElementById("artist").innerHTML = artistName;
    document.getElementById("song").innerHTML = songName;

    var imgElement = document.createElement("img");
    imgElement.src = resizeCover;
    imgElement.crossOrigin = "Anonymous";

    // 이미지 로드 완료 후 색상 추출
    imgElement.onload = function () {
        const colorThief = new ColorThief();
        let palette = colorThief.getPalette(imgElement, 2); // 2개의 색상 추출

        // 색상의 밝기 계산 함수
        const getBrightness = (color) => (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000;

        // 밝기에 따라 색상 정렬 (밝은 색이 첫 번째)
        palette.sort((a, b) => getBrightness(b) - getBrightness(a));

        const bgColor = palette[0];
        const darkerBgColor = bgColor.map(c => Math.max(0, c - 50)); // 약간 어둡게 만듦
        const footerColor = palette[1];

        // CSS 변수 설정
        document.documentElement.style.setProperty('--background-color', `rgb(${bgColor.join(',')})`);
        document.documentElement.style.setProperty('--background-color-dark', `rgb(${darkerBgColor.join(',')})`);
        document.documentElement.style.setProperty('--footer-color', `rgb(${footerColor.join(',')})`);

        // 텍스트 색상 설정
        const textColor = getBrightness(bgColor) > 125 ? 'black' : 'white';
        const footerTextColor = getBrightness(footerColor) > 125 ? 'black' : 'white';
        document.documentElement.style.setProperty('--text-color', textColor);
        document.documentElement.style.setProperty('--footer-text-color', footerTextColor);

        // 버튼 배경색과 아이콘 색상 업데이트
        const button = document.querySelector('#button button');
        button.style.backgroundColor = textColor;
        button.querySelector('svg').style.fill = `rgb(${bgColor.join(',')})`;
    };

    var coverDiv = document.getElementById("cover");
    coverDiv.innerHTML = "";
    coverDiv.appendChild(imgElement);

    var audioElement = document.createElement("audio");
    audioElement.src = preview;

    var buttonDiv = document.getElementById("button");
    var button = document.createElement("button");
    var svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
    useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#play-icon");
    svgIcon.appendChild(useElement);
    button.appendChild(svgIcon);

    button.addEventListener("click", function () {
        if (audioElement.paused) {
            audioElement.play();
            useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#pause-icon");
        } else {
            audioElement.pause();
            useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#play-icon");
        }
    });

    buttonDiv.innerHTML = "";
    buttonDiv.appendChild(button);

    var infoDiv = document.getElementById("info");
    // 기존의 모든 링크 요소 제거
    var existingLinks = infoDiv.querySelectorAll("a");
    existingLinks.forEach(link => link.remove());

    // 새로운 링크 요소 생성 및 추가
    var linkElement = document.createElement("a");
    linkElement.href = moreInfo;
    linkElement.target = "_blank";
    linkElement.innerHTML = "Apple Music에서 보기";
    linkElement.style.display = "block";
    infoDiv.appendChild(linkElement);
}

function displayHistorySongs(songs) {
    const historyContent = document.getElementById("history-content");
    const showMoreButton = document.getElementById("show-more");

    // 변경된 부분만 업데이트
    songs.forEach((song, index) => {
        let historyItem = historyContent.children[index];
        
        if (!historyItem) {
            historyItem = document.createElement("div");
            historyItem.className = "history-item";
            historyContent.appendChild(historyItem);
        }

        const albumCover = song.attributes.artwork.url.replace("{w}", "40").replace("{h}", "40");
        
        historyItem.innerHTML = `
            <img src="${albumCover}" alt="Album Cover" class="history-album-cover">
            <div class="history-song-info">
                <p class="history-song-name">${song.attributes.name}</p>
                <p class="history-artist-name">${song.attributes.artistName}</p>
            </div>
        `;
    });

    // 불필요한 항목 제거
    while (historyContent.children.length > songs.length) {
        historyContent.removeChild(historyContent.lastChild);
    }

    // showMoreButton 이벤트 리스너는 한 번만 추가
    if (!showMoreButton.hasEventListener) {
        showMoreButton.addEventListener("click", function() {
            historyContent.classList.add("show-all");
            this.style.display = "none";
        });
        showMoreButton.hasEventListener = true;
    }
}

// 기존의 DOMContentLoaded 이벤트 리스너 내부에 다음 코드 추가
window.addEventListener('resize', function () {
    const historyContent = document.getElementById("history-content");
    const showMoreButton = document.getElementById("show-more");
    if (window.innerWidth <= 768) {
        historyContent.classList.remove("show-all");
        showMoreButton.style.display = "block";
    } else {
        historyContent.classList.add("show-all");
        showMoreButton.style.display = "none";
    }
});