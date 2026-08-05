# Monique Meirelles — site estático

Versão estática da landing page `moniquemeirelles.com.br`, sem WordPress, PHP ou banco
de dados. É só HTML, CSS, JS e mídia — basta servir a pasta.

```
index.html
assets/
  css/    folhas do tema, do Elementor e das fontes (auto-hospedadas)
  fonts/  woff2 dos subsets latin e latin-ext
  img/    imagens, favicons e o vídeo da seção "Hérnia de Disco"
  js/     swiper.min.js + site.js
```

## Rodar localmente

Qualquer servidor estático serve, desde que envie o `Content-Type` correto:

```bash
npx serve .
```

## O que mudou em relação ao WordPress

- jQuery, jQuery Migrate, jQuery UI, o runtime do Elementor e o Essential Addons
  (≈ 900 KB de JS) foram substituídos por `assets/js/site.js`, que reimplementa o que a
  página realmente usa: animações de entrada, o acordeão do FAQ, o carrossel de
  depoimentos (via Swiper 8) e o lightbox do vídeo.
- As fontes do Google são servidas do próprio site.
- O Font Awesome foi removido: todos os ícones da página são SVG inline.
- Tags de RSS, oEmbed, xmlrpc, canonical, shortlink e emoji do WordPress foram removidas.
- O mapa da seção Contato continua sendo um iframe do Google Maps — é a única
  requisição que sai do domínio.
- O rodapé foi refeito no mesmo padrão do site do Dr. Fred: copyright à esquerda com
  o ano preenchido automaticamente, crédito de autoria à direita e os ícones sociais
  removidos. Mantém o gradiente e a tipografia daqui, com o logotipo na cor da paleta
  local (`#C3D8E5`). Estilos próprios ficam em `assets/css/site.css`.

A página foi comparada pixel a pixel com o site original em 390, 900 e 1280 px de
largura: zero pixels de diferença, exceto o rodapé, alterado de propósito.
