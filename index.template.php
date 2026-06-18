<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="initial-scale=1.0,user-scalable=no,maximum-scale=1,width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Kiosk SPA Template (PHP includes)</title>

  <!-- Project UI styles (optional) -->
  <link rel="stylesheet" href="./css/reset.css">
  <link rel="stylesheet" href="./css/font.css">

  <!-- Template system CSS (required) -->
  <link rel="stylesheet" href="./css/kiosk.template.css">

  <!-- Your project styles (recommended) -->
  <link rel="stylesheet" href="./css/style.css">
</head>

<body>
  <div id="spa-root">
<?php
/**
 * 시안별 페이지 파일 — pages/ 아래에 각 시안을 별도 파일로 분리.
 *
 * 새 페이지 추가 흐름:
 *   1) pages/<id>.php 작성 (section id="page-{id}" class="spa-page")
 *   2) 아래 $pages 배열에 한 줄 추가
 *   3) js/app.js (또는 app.template.js) CONFIG.pages 에 {id} 등록
 *
 * 단일 HTML 패턴(index.template.html)도 그대로 지원 — 둘 중 하나를 선택해 쓰면 됨.
 */
$pages = [
  'pages/main.php',
  'pages/hub.php',
  'pages/company.php',
  'pages/process.php',
  'pages/products.php',
];
foreach ($pages as $p) {
  include __DIR__ . '/' . $p;
}
?>
  </div>

  <!-- Idle progress bar (optional) -->
  <div id="idle-bar" aria-hidden="true"></div>

  <!-- Slide menu (optional) -->
  <div id="slide-menu-backdrop" class="slide-menu-backdrop"></div>
  <nav id="slide-menu" class="slide-menu" aria-label="전체 메뉴">
    <div id="slide-menu-close" class="slide-menu-close" role="button" tabindex="0" aria-label="메뉴 닫기">
      <span aria-hidden="true">×</span>
    </div>

    <a class="slide-menu-item" href="#" data-page="main"><span class="label">메인</span><span class="dot" aria-hidden="true"></span></a>
    <a class="slide-menu-item" href="#" data-page="hub"><span class="label">허브</span><span class="dot" aria-hidden="true"></span></a>
    <a class="slide-menu-item" href="#" data-page="company"><span class="label">회사소개</span><span class="dot" aria-hidden="true"></span></a>
    <a class="slide-menu-item" href="#" data-page="process"><span class="label">제조과정</span><span class="dot" aria-hidden="true"></span></a>
    <a class="slide-menu-item" href="#" data-page="products"><span class="label">제품</span><span class="dot" aria-hidden="true"></span></a>
  </nav>

  <!-- Libraries (optional) -->
  <!-- If you use Swiper/GSAP, load before app.js -->
  <!-- <script src="./js/swiper-bundle.min.js"></script> -->
  <!-- <script src="./js/gsap.min.js"></script> -->

  <!-- Template JS -->
  <script src="./js/app.template.js"></script>
</body>
</html>
