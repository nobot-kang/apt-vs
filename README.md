# APT VS — public release

이 디렉터리의 **내용물만** 새 public repository의 루트에 업로드하세요.
원래 private 프로젝트의 Git 기록이나 상위 폴더를 복사하지 마세요.

## GitHub Pages

1. 별도의 빈 public repository를 만듭니다.
2. 이 폴더의 모든 파일과 `data/`, 숨김 파일 `.nojekyll`을 저장소 루트에 업로드합니다.
3. Settings → Pages → Build and deployment에서 **Deploy from a branch**,
   업로드한 브랜치(예: `main`)와 **/(root)**를 선택하고 저장합니다.
4. 배포 완료 후 Pages가 표시한 주소로 접속합니다.

[GitHub Pages 공식 설정 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

사용자 사이트와 `/저장소명/` 아래 프로젝트 사이트 모두 지원합니다.
별도 빌드, Python 백엔드, API 키, npm 설치가 필요하지 않습니다.

## 업데이트

private 프로젝트에서 공개본을 다시 생성하고, 새 release의 전체 내용으로
public repository의 배포 파일을 교체합니다. 예전 해시 파일은 제거하세요.
파일명 해시가 바뀌므로 사용자가 버전 쿼리를 붙일 필요가 없습니다.
열려 있던 게임은 새로고침 후 최신 릴리스를 사용합니다.

## 포함 범위

APT VS 게임·안내 HTML, 스타일·스크립트, 게임용 추정가격 스냅샷만 포함합니다.
대시보드, 원천 거래, 분석 DB, 로컬 진단 로그, 비밀키는 포함하지 않습니다.
가격 기준은 2026년 6월이며 상세 설명은 게임의 **데이터·이용 안내**를 확인하세요.
정적 파일 안의 정답은 열람할 수 있으며 기록은 브라우저에만 저장됩니다.
