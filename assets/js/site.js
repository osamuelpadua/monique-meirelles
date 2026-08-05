/**
 * Comportamentos da página, reimplementados sem jQuery e sem o runtime do Elementor.
 *
 * Substitui jquery + jquery-migrate + jquery-ui + webpack.runtime + frontend-modules +
 * frontend + essential-addons (≈ 900 KB) por este arquivo. A única biblioteca mantida
 * é o Swiper 8, usada pelo carrossel de depoimentos com os mesmos parâmetros que o
 * Elementor calculava em runtime.
 */
(function () {
  'use strict';

  var ua = navigator.userAgent;
  var m = function (s) { return ua.indexOf(s) >= 0; };

  // ---------------------------------------------------------------- user agent
  // O CSS conditionals/apple-webkit depende de .e--ua-appleWebkit no <body>.
  (function addUserAgentClasses() {
    var isOpera = !!window.opr && !!window.opr.addons || !!window.opera || m(' OPR/');
    var isFirefox = m('Firefox');
    var isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    var isIE = /Trident|MSIE/.test(ua) && !!document.documentMode;
    var isEdge = !isIE && !!window.StyleMedia || m('Edg');
    var isChrome = !!window.chrome && m('Chrome') && !(isEdge || isOpera);
    var isBlink = m('Chrome') && !!window.CSS;
    var env = {
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      appleWebkit: m('AppleWebKit') && !isBlink,
      blink: isBlink,
      chrome: isChrome,
      edge: isEdge,
      firefox: isFirefox,
      ie: isIE,
      mac: m('Macintosh'),
      opera: isOpera,
      safari: isSafari,
      webkit: m('AppleWebKit'),
    };
    for (var k in env) if (env[k]) document.body.classList.add('e--ua-' + k);
  })();

  // ------------------------------------------------------------- device mode
  var BREAKPOINTS = { mobile: 767, tablet: 1024 };
  function deviceMode() {
    var w = window.innerWidth;
    if (w <= BREAKPOINTS.mobile) return 'mobile';
    if (w <= BREAKPOINTS.tablet) return 'tablet';
    return 'desktop';
  }
  function setDeviceMode() { document.body.setAttribute('data-elementor-device-mode', deviceMode()); }
  setDeviceMode();
  window.addEventListener('resize', setDeviceMode);

  // ------------------------------------------------- animações de entrada
  // .elementor-invisible é visibility:hidden. O Elementor observa o elemento e,
  // ao entrar na viewport, remove a classe e aplica "animated <nome>" após o delay.
  (function entranceAnimations() {
    var alvos = [].filter.call(document.querySelectorAll('[data-settings]'), function (el) {
      return el.classList.contains('elementor-invisible');
    });
    if (!alvos.length) return;

    var revelar = function (el) {
      var cfg = {};
      try { cfg = JSON.parse(el.getAttribute('data-settings')) || {}; } catch (e) { /* sem settings */ }
      var anim = cfg.animation || cfg._animation;
      var atraso = cfg._animation_delay || cfg.animation_delay || 0;
      if (!anim || anim === 'none') { el.classList.remove('elementor-invisible'); return; }
      setTimeout(function () {
        el.classList.remove('elementor-invisible');
        el.classList.add('animated', anim);
      }, atraso);
    };

    if (!('IntersectionObserver' in window)) { alvos.forEach(revelar); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        revelar(e.target);
        obs.unobserve(e.target);
      });
    }, { root: null, rootMargin: '0px', threshold: 0 });
    alvos.forEach(function (el) { obs.observe(el); });
  })();

  // ------------------------------------------------------------ acordeão (FAQ)
  // O Essential Addons alterna .active/.show-this no cabeçalho e faz slideToggle
  // no painel; o CSS já cuida da rotação do ícone através de .active.
  (function accordion() {
    document.querySelectorAll('.eael-adv-accordion').forEach(function (raiz) {
      var velocidade = parseInt(raiz.dataset.toogleSpeed || '300', 10);
      var tipo = raiz.dataset.accordionType || 'accordion';
      var itens = [].map.call(raiz.querySelectorAll('.eael-accordion-list'), function (li) {
        return {
          header: li.querySelector('.eael-accordion-header'),
          content: li.querySelector('.eael-accordion-content'),
        };
      }).filter(function (i) { return i.header && i.content; });

      function abrir(i, animar) {
        i.header.classList.add('active', 'show-this');
        i.header.setAttribute('aria-expanded', 'true');
        var c = i.content;
        c.style.display = 'block';
        if (!animar) return;
        var alvo = c.scrollHeight;
        c.style.overflow = 'hidden';
        c.style.height = '0px';
        c.style.transition = 'height ' + velocidade + 'ms ease';
        requestAnimationFrame(function () {
          c.style.height = alvo + 'px';
          setTimeout(function () { c.style.height = ''; c.style.overflow = ''; c.style.transition = ''; }, velocidade);
        });
      }

      function fechar(i, animar) {
        i.header.classList.remove('active', 'show-this');
        i.header.setAttribute('aria-expanded', 'false');
        var c = i.content;
        if (!animar) { c.style.display = 'none'; return; }
        c.style.overflow = 'hidden';
        c.style.height = c.scrollHeight + 'px';
        c.style.transition = 'height ' + velocidade + 'ms ease';
        requestAnimationFrame(function () {
          c.style.height = '0px';
          setTimeout(function () {
            c.style.display = 'none';
            c.style.height = ''; c.style.overflow = ''; c.style.transition = '';
          }, velocidade);
        });
      }

      itens.forEach(function (i) {
        var aberto = i.header.classList.contains('active-default');
        if (aberto) abrir(i, false); else fechar(i, false);

        var alternar = function (ev) {
          ev.preventDefault();
          var estavaAberto = i.header.classList.contains('active');
          if ('accordion' === tipo && !estavaAberto) {
            itens.forEach(function (o) { if (o !== i && o.header.classList.contains('active')) fechar(o, true); });
          }
          if (estavaAberto) fechar(i, true); else abrir(i, true);
        };
        i.header.addEventListener('click', alternar);
        i.header.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') alternar(ev);
        });
      });
    });
  })();

  // ------------------------------------------------- carrossel de depoimentos
  // Parâmetros idênticos aos que o Elementor montava a partir de data-settings
  // (2 slides, avanço de 3, 16px de espaço, autoplay 5s, pausa no hover).
  (function carousel() {
    if (typeof Swiper === 'undefined') return;
    document.querySelectorAll('.elementor-widget-image-carousel').forEach(function (widget) {
      var container = widget.querySelector('.elementor-image-carousel-wrapper.swiper');
      if (!container || widget.querySelectorAll('.swiper-slide').length < 2) return;

      var s = {};
      try { s = JSON.parse(widget.getAttribute('data-settings') || '{}'); } catch (e) { /* padrões */ }
      var mostrar = +s.slides_to_show || 3;
      var unico = 1 === mostrar;
      var espaco = s.image_spacing_custom ? Number(s.image_spacing_custom.size) || 0 : 0;
      var id = widget.getAttribute('data-id');

      var opts = {
        slidesPerView: mostrar,
        loop: 'yes' === s.infinite,
        speed: s.speed,
        spaceBetween: espaco,
        // o Elementor inverte os breakpoints do Swiper (max-width → min-width):
        // < 767 mostra 1, 767–1023 mostra 2 avançando 1, ≥ 1024 mostra 2 avançando 3
        breakpoints: {
          0: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: espaco },
          767: { slidesPerView: unico ? 1 : 2, slidesPerGroup: 1, spaceBetween: espaco },
          1024: { slidesPerView: mostrar, slidesPerGroup: +s.slides_to_scroll || 1 },
        },
        a11y: {
          enabled: true,
          prevSlideMessage: 'Slide anterior',
          nextSlideMessage: 'Próximo slide',
          firstSlideMessage: 'Este é o primeiro slide',
          lastSlideMessage: 'Este é o último slide',
        },
      };
      if (unico) opts.effect = s.effect || 'slide';
      else opts.slidesPerGroup = +s.slides_to_scroll || 1;

      if ('yes' === s.autoplay) {
        opts.autoplay = { delay: s.autoplay_speed, disableOnInteraction: 'yes' === s.pause_on_interaction };
      }
      var navegacao = s.navigation;
      if ('arrows' === navegacao || 'both' === navegacao) {
        opts.navigation = {
          prevEl: widget.querySelector('.elementor-swiper-button-prev'),
          nextEl: widget.querySelector('.elementor-swiper-button-next'),
        };
      }
      if ('dots' === navegacao || 'both' === navegacao || s.pagination) {
        opts.pagination = {
          el: widget.querySelector('.swiper-pagination'),
          type: s.pagination || 'bullets',
          clickable: true,
          renderBullet: function (index, classname) {
            return '<span class="' + classname + '" role="button" tabindex="0" data-bullet-index="' + index +
              '" aria-label="Ir para o slide ' + (index + 1) + '"></span>';
          },
        };
      }

      var swiper = new Swiper(container, opts);
      widget.setAttribute('data-swiper-id', id || '');

      if ('yes' === s.pause_on_hover && swiper.autoplay) {
        container.addEventListener('mouseenter', function () { swiper.autoplay.stop(); });
        container.addEventListener('mouseleave', function () { swiper.autoplay.start(); });
      }
    });
  })();

  // ----------------------------------------------------------- lightbox de vídeo
  // Reproduz o modal do Elementor (mesmas classes, para reaproveitar dialog.css e
  // lightbox.css) para o vídeo hospedado localmente.
  (function videoLightbox() {
    var gatilhos = document.querySelectorAll('[data-elementor-open-lightbox="yes"][data-elementor-lightbox]');
    if (!gatilhos.length) return;

    var FECHAR_SVG = '<svg class="e-font-icon-svg e-eicon-close dialog-close-button-icon" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M742 167L500 408 258 167C246 154 233 150 217 150 196 150 179 158 167 167 154 179 150 196 150 212 150 229 154 242 171 254L408 500 167 742C138 771 138 800 167 829 196 858 225 858 254 829L496 587 738 829C750 842 767 846 783 846 800 846 817 842 829 829 842 817 846 804 846 783 846 767 842 750 829 737L588 500 833 258C863 229 863 200 833 171 804 137 775 137 742 167Z"></path></svg>';

    var aberto = null;

    function fechar() {
      if (!aberto) return;
      aberto.remove();
      aberto = null;
      document.body.classList.remove('dialog-body', 'dialog-lightbox-body', 'dialog-container', 'dialog-lightbox-container');
      document.removeEventListener('keydown', onKey);
    }
    function onKey(ev) { if (ev.key === 'Escape') fechar(); }

    function abrir(cfg) {
      var v = cfg.videoParams || {};
      var modal = document.createElement('div');
      modal.className = 'dialog-widget dialog-lightbox-widget dialog-type-buttons dialog-type-lightbox elementor-lightbox';
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('role', 'document');
      modal.setAttribute('tabindex', '0');
      if (cfg.modalOptions && cfg.modalOptions.id) modal.id = cfg.modalOptions.id;
      modal.innerHTML =
        '<div class="dialog-widget-content dialog-lightbox-widget-content">' +
          '<a role="button" tabindex="0" aria-label="Fechar (Esc)" href="#" class="dialog-close-button dialog-lightbox-close-button">' + FECHAR_SVG + '</a>' +
          '<div class="dialog-header dialog-lightbox-header"></div>' +
          '<div class="dialog-message dialog-lightbox-message">' +
            '<div class="elementor-video-container elementor-lightbox-prevent-close">' +
              '<div class="elementor-video-wrapper elementor-video-landscape" style="--video-aspect-ratio: 1.33333">' +
                '<video src="' + cfg.url + '" autoplay preload="' + (v.preload || 'metadata') + '"' +
                  (v.muted ? ' muted' : '') + ' controls controlslist="' + (v.controlsList || 'nodownload') + '"></video>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="dialog-buttons-wrapper dialog-lightbox-buttons-wrapper"></div>' +
        '</div>';
      document.body.appendChild(modal);
      document.body.classList.add('dialog-body', 'dialog-lightbox-body', 'dialog-container', 'dialog-lightbox-container');
      aberto = modal;

      modal.querySelector('.dialog-close-button').addEventListener('click', function (ev) { ev.preventDefault(); fechar(); });
      modal.addEventListener('click', function (ev) {
        if (!ev.target.closest('.elementor-lightbox-prevent-close, .dialog-close-button')) fechar();
      });
      document.addEventListener('keydown', onKey);
      modal.focus();
    }

    gatilhos.forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (ev) {
        var cfg;
        try { cfg = JSON.parse(el.getAttribute('data-elementor-lightbox')); } catch (e) { return; }
        if (!cfg || cfg.type !== 'video' || !cfg.url) return;
        ev.preventDefault();
        abrir(cfg);
      });
    });
  })();
})();
