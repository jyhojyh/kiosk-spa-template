# Kiosk SPA `app.js` Template 사용 메뉴얼

이 문서는 본 레포의 `js/app.js` 패턴을 **다른 키오스크 프로젝트에서도 재사용**할 수 있도록 정리한 메뉴얼입니다.  
템플릿 코드는 `js/app.template.js`에 포함되어 있습니다.

---

## 1) 개요

템플릿은 다음 기능을 제공합니다.

- **SPA 페이지 전환**: `section#page-{id}`를 `is-active` 클래스로 전환
- **네비게이션**:
  - `data-navigate="pageId"` → 이동
  - `data-back` → 뒤로가기(내부 historyStack)
- **슬라이드 메뉴(옵션)**: 우측 메뉴 열기/닫기 + 메뉴에서 페이지 이동
- **Idle Timer(옵션)**: 일정 시간 미사용 시 홈으로 복귀 + 진행바 표시
- **페이지별 훅(라우트 맵)**:
  - `render()` → 페이지 활성화 전에 DOM 주입(리스트/슬라이드 생성용)
  - `onEnter()` → 페이지 활성화 후 실행(애니메이션/Swiper init용)
- **GSAP 진입 애니메이션(옵션)**: `main` 페이지 진입 시 텍스트 애니메이션
- **Swiper init helper(옵션)**: `initSwiperOnce()`로 1회 초기화

---

## 2) 파일 구성

- `js/app.template.js`: 재사용 가능한 템플릿 본체
- `js/app.js`: 현재 프로젝트 전용 구현(그대로 유지)
- `index.template.html`: 템플릿용 HTML 예시(필수 DOM 구조 포함)
- `css/kiosk.template.css`: 템플릿용 시스템 CSS(SPA 전환/메뉴/idle)

새 프로젝트에서는 보통 `js/app.template.js`를 복사해서 `js/app.js`로 사용합니다.

---

## 3) 필수 HTML 규칙

### 3-1) 페이지 섹션 id 규칙

`CONFIG.pages`에 선언한 id는 반드시 아래 형태로 존재해야 합니다.

```html
<section id="page-main" class="spa-page">...</section>
<section id="page-products" class="spa-page">...</section>
```

즉, **항상 `page-` prefix**를 사용합니다.

### 3-2) 이동/뒤로가기 속성

```html
<button type="button" data-navigate="products">제품</button>
<button type="button" data-back>뒤로</button>
```

### 3-3) 슬라이드 메뉴(선택)

슬라이드 메뉴를 켤 경우(`CONFIG.slideMenu.enabled = true`) 다음 요소가 필요합니다.

```html
<div id="slide-menu-backdrop"></div>
<nav id="slide-menu">
  <div id="slide-menu-close"></div>
  <a class="slide-menu-item" href="#" data-page="main">메인</a>
</nav>
```

---

## 4) 필수 CSS 규칙

템플릿은 `is-active`, `is-leaving-left`, `is-leaving-right`, `is-entering-back` 같은 클래스를 토글합니다.  
따라서 `css/kiosk.css`처럼 `.spa-page` 전환 CSS가 필요합니다.

### 4-1) 재사용 CSS 템플릿 제공

이 레포에는 템플릿용 CSS를 별도 파일로 제공합니다.

- `css/kiosk.template.css`: SPA 전환 + 슬라이드 메뉴 + idle bar에 필요한 “시스템 CSS”만 포함  
  (프로젝트별 UI 스타일은 `style.css` 같은 별도 파일로 분리 권장)

---

## 5) 라이브러리 로드(선택)

### 5-1) Swiper를 쓰는 경우

```html
<script src="./js/swiper-bundle.min.js"></script>
<script src="./js/app.js"></script>
```

### 5-2) GSAP를 쓰는 경우

```html
<script src="./js/gsap.min.js"></script>
<script src="./js/app.js"></script>
```

---

## 6) 프로젝트별 커스터마이징(핵심)

### 6-1) 페이지 목록 수정

`js/app.template.js` 상단:

```js
const CONFIG = {
  pages: ["main", "intro", "products"],
  // ...
};
```

### 6-2) 라우트 훅 추가/수정

```js
const ROUTES = {
  products: {
    render: () => { /* DOM 주입 */ },
    onEnter: () => { /* Swiper init/animation */ },
  },
};
```

### 6-3) Idle Timer 설정

```js
idle: {
  enabled: true,
  ms: 60000,
  warnAtRatio: 0.83,
  homePageId: "main",
  disabledOn: ["main"],
}
```

---

## 7) 적용 체크리스트(빠른 점검)

- `CONFIG.pages`에 있는 모든 페이지가 `#page-{id}`로 HTML에 존재한다.
- `data-navigate` 값이 `CONFIG.pages`에 포함된 값만 사용한다.
- 슬라이드 메뉴를 켰다면 `#slide-menu*` 요소가 HTML에 존재한다.
- Swiper/GSAP를 사용한다면 해당 스크립트가 `app.js`보다 먼저 로드된다.
- `.spa-page` 전환 클래스들이 CSS에 정의되어 있다.

---

## 8) 마이그레이션 가이드(현재 프로젝트 → 템플릿)

현재 프로젝트는 `js/app.js`에 데이터(`PROCESS_STEPS`, `PRODUCTS`)와 렌더/초기화가 포함되어 있습니다.

템플릿 방식으로 옮길 때 추천 흐름:

1. 데이터는 `window.PROCESS_STEPS`, `window.PRODUCTS` 또는 별도 `data.js`로 분리
2. 페이지별 렌더는 `ROUTES.{pageId}.render`로 이동
3. Swiper 초기화는 `ROUTES.{pageId}.onEnter`에서 `initSwiperOnce()` 호출

