<?php /* 예시 페이지: page-process (Swiper 예시) */ ?>
<section id="page-process" class="spa-page" aria-label="제조과정">
  <header style="padding:40px 80px; display:flex; gap:12px; align-items:center;">
    <button type="button" data-back aria-label="뒤로가기">←</button>
    <div style="flex:1; font-weight:700;">제조과정</div>
    <button type="button" class="sn-menu" aria-label="메뉴 열기">≡</button>
  </header>

  <div style="padding:40px 80px;">
    <p>이 영역은 ROUTES.process.render()에서 Swiper 슬라이드를 주입하는 예시입니다.</p>
    <div class="swiper sn-process-swiper" style="margin-top:24px;">
      <div class="swiper-wrapper" id="process-swiper-wrapper"></div>
      <div class="swiper-pagination sn-process-pagination"></div>
    </div>
    <button class="sn-nav sn-nav-prev" type="button" aria-label="이전">Prev</button>
    <button class="sn-nav sn-nav-next" type="button" aria-label="다음">Next</button>
  </div>
</section>
