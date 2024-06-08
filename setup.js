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

    fetch("https://simple-proxy.taein.workers.dev/?destination=https://yuntae.in/api/music/recent/noa")
        .then(res => res.json())
        .then(data => {
            var artistName = data.data[0].attributes.artistName;
            var songName = data.data[0].attributes.name;
            var albumCover = data.data[0].attributes.artwork.url;
            var preview = data.data[0].attributes.previews[0].url;
            var moreInfo = data.data[0].attributes.url;

            // {w}x{h} 부분을 1000x1000으로 대체
            var resizeCover = albumCover.replace("{w}x{h}", "1000x1000");

            document.getElementById("artist").innerHTML = artistName;
            document.getElementById("song").innerHTML = songName;

            // 이미지 요소 생성
            var imgElement = document.createElement("img");
            imgElement.src = resizeCover; // 수정된 이미지 URL 설정
            imgElement.crossOrigin = "Anonymous"; // CORS 문제 방지

            // 이미지 요소를 cover ID를 가진 div에 추가
            var coverDiv = document.getElementById("cover");
            coverDiv.innerHTML = ""; // 기존 내용을 지움 (필요 시)
            coverDiv.appendChild(imgElement);

            // 오디오 요소 생성
            var audioElement = document.createElement("audio");
            audioElement.src = preview; // 미리보기 URL 설정

            // 버튼 요소 생성
            var buttonDiv = document.getElementById("button");
            var button = document.createElement("button");
            var imgIcon = document.createElement("img");
            imgIcon.src = prefersDarkScheme.matches ? "./img/play_dark.png" : "./img/play.png"; // 초기 재생 아이콘 이미지 경로 설정
            imgIcon.alt = "재생"; // 대체 텍스트 설정
            button.appendChild(imgIcon);

            // 버튼 클릭 이벤트 설정
            button.addEventListener("click", function () {
                if (audioElement.paused) {
                    audioElement.play();
                    imgIcon.src = prefersDarkScheme.matches ? "./img/pause_dark.png" : "./img/pause.png"; // 재생 중 아이콘 이미지 경로 설정
                    imgIcon.alt = "일시정지"; // 대체 텍스트 설정
                } else {
                    audioElement.pause();
                    imgIcon.src = prefersDarkScheme.matches ? "./img/play_dark.png" : "./img/play.png"; // 일시정지 중 아이콘 이미지 경로 설정
                    imgIcon.alt = "재생"; // 대체 텍스트 설정
                }
            });

            // 버튼 요소를 button ID를 가진 div에 추가
            buttonDiv.innerHTML = ""; // 기존 내용을 지움 (필요 시)
            buttonDiv.appendChild(button);

            // "Apple Music에서 보기" 링크 요소 생성
            var linkElement = document.createElement("a");
            linkElement.href = moreInfo; // 링크 URL 설정
            linkElement.target = "_blank"; // 새 탭에서 열기
            linkElement.innerHTML = "Apple Music에서 보기";
            linkElement.style.display = "block"; // 블록 요소로 표시

            // 링크 요소를 info ID를 가진 div에 추가
            var infoDiv = document.getElementById("info");
            infoDiv.appendChild(linkElement);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
});