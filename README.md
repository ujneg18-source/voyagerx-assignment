# Voyager X 서류 합격자 과제 · 유진영

정적 웹 프레젠테이션. Vite + Vanilla JS(ES Modules).

## 실행
```bash
nvm use        # Node 22 (.nvmrc)
npm install    # 처음 한 번
npm run dev    # http://localhost:5173
```

## 빌드 · 배포
```bash
npm run build    # dist/ 생성
npm run preview  # 빌드 결과 확인
```
`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 GitHub Pages로 배포한다.
(저장소 Settings → Pages → Source를 **GitHub Actions**로 한 번 설정)

## 구조
```
index.html            페이지 본문 (Q1~Q4 문서)
src/main.js           진입점
src/router.js         상단 세그먼트 탭 · 사이드바 · 목차 · 이전/다음
src/intro.js          온보딩 (별 점 → 사람 → '과제 확인하기')
src/q2-demos.js       Q2 데모 3종 (현행 · 입력 마스크 · 날짜 범위 선택기)
src/styles/*.css      base · intro · docs · q2-demos · print
public/assets/        캡처 · 로고
```

## 공개 사이트
https://ujneg18-source.github.io/voyagerx-assignment/
