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
                const footerTextColor = getBrightness(footerColor) > 125 ? 'grey' : 'lightgrey';
                document.documentElement.style.setProperty('--text-color', textColor);
                document.documentElement.style.setProperty('--footer-text-color', footerTextColor);

                // 버튼 배경색과 아이콘 색상 업데이트
                const button = document.querySelector('#button button');
                button.style.backgroundColor = textColor;
                button.querySelector('svg').style.fill = `rgb(${bgColor.join(',')})`;
            };

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
            var svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            var useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
            useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#play-icon");
            svgIcon.appendChild(useElement);
            button.appendChild(svgIcon);

            // 버튼 클릭 이벤트 설정
            button.addEventListener("click", function () {
                if (audioElement.paused) {
                    audioElement.play();
                    useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#pause-icon");
                } else {
                    audioElement.pause();
                    useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#play-icon");
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