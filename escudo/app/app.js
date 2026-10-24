/* Escudo Infinity Guard - app do celular (Android e iPhone). Tudo fica no aparelho. */
(function () {
  'use strict';
  var VERSAO = '1.0.0';
  var C = window.EscudoChecagens;
  var G = window.EscudoGolpe;
  var CHAVE = 'escudo-celular-v1';

  function ler() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; }
  }
  function gravar(d) {
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) { /* modo privado: segue sem guardar */ }
  }
  var estado = ler();
  estado.respostas = estado.respostas || {};
  if (!estado.aparelho) { estado.aparelho = C.detectarAparelho(navigator.userAgent, navigator.maxTouchPoints || 0) || 'android'; }

  var $ = function (id) { return document.getElementById(id); };
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  var ROTULO = { Critico: 'CRÍTICO', Alto: 'ALTO', Medio: 'MÉDIO' };

  // --- navegação ---
  function ir(tela) {
    ['inicio', 'checar', 'golpe'].forEach(function (t) {
      $('tela-' + t).classList.toggle('oculto', t !== tela);
    });
    document.querySelectorAll('nav button').forEach(function (b) {
      if (b.getAttribute('data-ir') === tela) { b.setAttribute('aria-current', 'page'); } else { b.removeAttribute('aria-current'); }
    });
    window.scrollTo(0, 0);
    if (location.hash !== '#' + tela) { history.replaceState(null, '', '#' + tela); }
  }
  document.addEventListener('click', function (ev) {
    var alvo = ev.target.closest('[data-ir]');
    if (alvo) { ir(alvo.getAttribute('data-ir')); }
  });

  // --- checagem ---
  function lista() { return estado.aparelho === 'iphone' ? C.IPHONE : C.ANDROID; }
  function respostas() { estado.respostas[estado.aparelho] = estado.respostas[estado.aparelho] || {}; return estado.respostas[estado.aparelho]; }

  function corDaNota(n) { return n >= 85 ? 'var(--ok)' : n >= 60 ? 'var(--medio)' : 'var(--critico)'; }

  function desenharLista() {
    document.querySelectorAll('[data-aparelho]').forEach(function (b) {
      var ativo = b.getAttribute('data-aparelho') === estado.aparelho;
      b.setAttribute('aria-pressed', String(ativo));
      b.classList.toggle('sec', !ativo);
    });
    var r = respostas();
    var html = '';
    lista().forEach(function (it, i) {
      var nome = 'q-' + it.id;
      html += '<div class="item" id="item-' + it.id + '">' +
        '<span class="tag ' + it.nivel + '">' + ROTULO[it.nivel] + '</span>' +
        '<h3 id="p-' + it.id + '">' + (i + 1) + '. ' + esc(it.pergunta) + '</h3>' +
        '<details><summary>Onde conferir</summary><p class="suave">' + esc(it.onde) + '</p></details>' +
        '<div class="resp" role="radiogroup" aria-labelledby="p-' + it.id + '">';
      [['sim', 'Sim'], ['nao', 'Não'], ['naosei', 'Não sei']].forEach(function (op) {
        var idr = nome + '-' + op[0];
        html += '<input type="radio" name="' + nome + '" id="' + idr + '" value="' + op[0] + '"' + (r[it.id] === op[0] ? ' checked' : '') + '>' +
          '<label for="' + idr + '">' + op[1] + '</label>';
      });
      html += '</div></div>';
    });
    $('lista').innerHTML = html;
    atualizarNota();
  }

  function atualizarNota() {
    var res = C.calcularNota(lista(), respostas());
    var txt = res.respondidas ? String(res.nota) : '–';
    ['check', 'inicio'].forEach(function (p) {
      $(p + '-nota').textContent = txt;
      $(p + '-nota').style.color = res.respondidas ? corDaNota(res.nota) : '';
      $(p + '-barra').style.width = Math.round(100 * res.respondidas / res.total) + '%';
    });
    var nomeAparelho = estado.aparelho === 'iphone' ? 'iPhone' : 'Android';
    $('check-resumo').textContent = res.respondidas + ' de ' + res.total + ' respondidas (' + nomeAparelho + ')';
    $('inicio-resumo').textContent = res.respondidas === 0
      ? 'Faça a checagem guiada: leva uns 10 minutos.'
      : res.completo
        ? 'Nota do seu ' + nomeAparelho + '. ' + (res.pendencias.length ? res.pendencias.length + ' item(ns) para corrigir.' : 'Tudo em ordem!')
        : 'Checagem pela metade: ' + res.respondidas + ' de ' + res.total + '.';
    var pend = res.pendencias;
    $('pendencias-cartao').classList.toggle('oculto', res.respondidas === 0);
    $('pendencias').innerHTML = pend.length
      ? pend.map(function (it) { return '<li><span class="tag ' + it.nivel + '">' + ROTULO[it.nivel] + '</span><br><strong>' + esc(it.pergunta) + '</strong><br><span class="suave">' + esc(it.fazer) + '</span></li>'; }).join('')
      : '<li>Nenhuma pendência nas respostas até agora.</li>';
  }

  $('lista').addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.name && el.name.indexOf('q-') === 0) {
      respostas()[el.name.slice(2)] = el.value;
      gravar(estado);
      atualizarNota();
    }
  });
  document.querySelectorAll('[data-aparelho]').forEach(function (b) {
    b.addEventListener('click', function () {
      estado.aparelho = b.getAttribute('data-aparelho');
      gravar(estado);
      desenharLista();
    });
  });
  $('btn-zerar').addEventListener('click', function () {
    if (window.confirm('Apagar as respostas deste celular e recomeçar?')) {
      estado.respostas[estado.aparelho] = {};
      gravar(estado);
      desenharLista();
    }
  });

  // --- golpe ---
  var TITULO = {
    alto: 'Alto risco: tem cara de golpe',
    medio: 'Atenção: sinais suspeitos',
    baixo: 'Nenhum sinal forte de golpe'
  };
  var CONSELHO = {
    alto: 'Não clique, não responda e não faça Pix. Se diz ser do banco ou de parente, ligue você para o número que já conhece.',
    medio: 'Desconfie. Não passe senha nem código. Confira por outro caminho (app oficial ou ligação para o número que você já conhece).',
    baixo: 'Mesmo assim: nunca passe senha ou código de verificação para ninguém.'
  };
  function analisar() {
    var texto = $('texto-golpe').value;
    var out = $('resultado');
    if (!texto.trim()) { out.innerHTML = '<p class="aviso">Cole uma mensagem ou link primeiro.</p>'; return; }
    var r = G.analisar(texto);
    var html = '<div class="resultado ' + r.nivel + '"><h3>' + TITULO[r.nivel] + '</h3><p>' + CONSELHO[r.nivel] + '</p>';
    if (r.motivos.length) { html += '<ul>' + r.motivos.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>'; }
    if (r.todosOficiais && r.nivel !== 'baixo') {
      html += '<p class="suave">O link é do site oficial, mas o texto pede dados ou pressa: golpistas às vezes mandam o site certo e ligam pedindo o código.</p>';
    }
    html += '</div>';
    out.innerHTML = html;
  }
  $('btn-analisar').addEventListener('click', analisar);
  $('btn-colar').addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (t) { $('texto-golpe').value = t; analisar(); }, function () { $('texto-golpe').focus(); });
    } else { $('texto-golpe').focus(); }
  });

  // --- instalar na tela inicial ---
  var pedidoInstalar = null;
  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault();
    pedidoInstalar = ev;
    $('btn-instalar').classList.remove('oculto');
  });
  $('btn-instalar').addEventListener('click', function () {
    if (pedidoInstalar) { pedidoInstalar.prompt(); pedidoInstalar = null; $('btn-instalar').classList.add('oculto'); }
  });
  var instalado = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (instalado) { $('cartao-instalar').classList.add('oculto'); }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* sem modo offline */ });
  }

  $('versao').textContent = VERSAO;
  desenharLista();
  var inicial = (location.hash || '').replace('#', '');
  ir(['inicio', 'checar', 'golpe'].indexOf(inicial) !== -1 ? inicial : 'inicio');
})();
