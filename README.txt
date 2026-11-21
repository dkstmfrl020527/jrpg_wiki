카나 위키 HTML 프로토타입 (CSV 연결 버전)

- index.html: 진입 페이지
- style.css: 반응형 스타일
- script.js: CSV 파서, 위키 렌더러, 내부 링크, 목차
- data/kana.json: WikiText 리소스에서 옮긴 페이지 구조
- data/kana.csv: 사용자가 제공한 한국어 번역 데이터

실행: 폴더의 모든 파일을 GitHub Pages에 올리고 index.html에 접속하세요.
로컬에서 실행하려면 Python 설치 시 이 폴더에서 python -m http.server 8000을 실행하고 http://localhost:8000 에 접속하세요.

주의: 프로필 패널은 임시 표시입니다. protagonist/kohei 링크는 해당 JSON 페이지가 아직 없으므로 클릭 시 문서 없음이 나옵니다.
원본 CSV의 빈 작중 행적 항목은 화면에 표시하지 않습니다.
