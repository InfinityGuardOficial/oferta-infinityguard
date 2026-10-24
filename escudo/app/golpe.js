/*
 * Escudo Infinity Guard - detector de golpe em mensagem e link.
 * Roda 100% no aparelho: não abre o link e não envia o texto para lugar nenhum.
 * Funciona no navegador (window.EscudoGolpe) e no Node (require) para os testes.
 */
(function (raiz) {
  'use strict';

  // Marca -> domínios oficiais (domínio registrado, sem www)
  var MARCAS = {
    'banco do brasil': ['bb.com.br', 'bancodobrasil.com.br'],
    'bb': ['bb.com.br'],
    'caixa': ['caixa.gov.br'],
    'itau': ['itau.com.br'],
    'bradesco': ['bradesco.com.br'],
    'santander': ['santander.com.br'],
    'nubank': ['nubank.com.br', 'nu.com.br'],
    'inter': ['inter.co', 'bancointer.com.br'],
    'mercadopago': ['mercadopago.com.br', 'mercadopago.com'],
    'mercadolivre': ['mercadolivre.com.br', 'mercadolivre.com'],
    'correios': ['correios.com.br'],
    'receita': ['gov.br'],
    'detran': ['gov.br'],
    'serasa': ['serasa.com.br'],
    'picpay': ['picpay.com'],
    'whatsapp': ['whatsapp.com', 'wa.me'],
    'netflix': ['netflix.com'],
    'shopee': ['shopee.com.br'],
    'magalu': ['magazineluiza.com.br', 'magalu.com'],
    'amazon': ['amazon.com.br', 'amazon.com'],
    'apple': ['apple.com', 'icloud.com'],
    'icloud': ['icloud.com', 'apple.com'],
    'google': ['google.com', 'google.com.br'],
    'infinityguard': ['infinityguard.com.br']
  };

  var DENTRO_DE_PALAVRA = ['bancodobrasil', 'nubank', 'bradesco', 'santander', 'correios', 'mercadopago', 'mercadolivre',
    'picpay', 'serasa', 'whatsapp', 'netflix', 'shopee', 'infinityguard', 'itau'];

  var ENCURTADORES = ['bit.ly', 'tinyurl.com', 'cutt.ly', 'encurtador.com.br', 'is.gd', 't.ly', 'rebrand.ly',
    'shorturl.at', 's.id', 'rb.gy', 'ow.ly', 'tiny.cc', 'abre.ai', 'l1nq.com', 'encr.pw', 'u.to', 'goo.su', 'v.gd'];

  var TLD_SUSPEITO = ['top', 'xyz', 'click', 'shop', 'online', 'site', 'live', 'icu', 'buzz', 'rest', 'cfd', 'sbs',
    'info', 'lat', 'monster', 'cyou', 'quest', 'bond', 'win', 'vip', 'pro', 'store', 'fun', 'space', 'website'];

  var SEGUNDO_NIVEL_BR = ['com', 'gov', 'org', 'net', 'edu', 'art', 'blog', 'app', 'dev', 'eco', 'emp', 'ind', 'inf', 'jus', 'leg', 'mil', 'mp', 'tv', 'adv', 'med', 'nom'];

  var REGRAS_TEXTO = [
    { re: /(troquei de n[uú]mero|meu (novo )?n[uú]mero (novo )?[eé]|esse [eé] meu (novo )?n[uú]mero|salva (esse|este) n[uú]mero)/i, pts: 3, motivo: 'Diz que trocou de número: é o golpe do falso parente.' },
    { re: /(faz(er)? um pix|faça um pix|me (empresta|passa)|preciso (de|que voc[eê] (me )?pague)|chave pix|transfer[eê]ncia urgente|pagar (um|uma) boleto pra mim)/i, pts: 3, motivo: 'Pede dinheiro ou Pix.' },
    { re: /(senha|c[oó]digo de (verifica[cç][aã]o|seguran[cç]a|6 d[ií]gitos)|token|cvv|c[oó]digo que (chegou|voc[eê] recebeu)|dados do cart[aã]o|n[uú]mero do cart[aã]o)/i, pts: 3, motivo: 'Pede senha, código ou dados do cartão. Banco e loja de verdade nunca pedem isso.' },
    { re: /(atualiz(e|ar) (seus|os) dados|confirm(e|ar) (seus|os) dados|recadastr|regulariz(e|ar)|valid(e|ar) (sua|a) conta|desbloque(ie|ar))/i, pts: 2, motivo: 'Pede para "atualizar" ou "confirmar" dados.' },
    { re: /(urgente|imediatamente|[uú]ltimas? horas?|ainda hoje|em at[eé] \d+ ?(h|horas|minutos)|prazo final|ser[aá] (bloquead|cancelad|suspens|exclu[ií]d)|foi (bloquead|suspens)|bloqueio (do|da) (sua )?(conta|cart[aã]o))/i, pts: 2, motivo: 'Cria pressa ou ameaça bloqueio.' },
    { re: /(parab[eé]ns|voc[eê] (ganhou|foi sorteado|foi selecionad)|sorteio|pr[eê]mio|resgat(e|ar) (seu|o)|brinde gr[aá]tis|cashback de r\$|saque (do|de) (fgts|pis))/i, pts: 3, motivo: 'Promete prêmio, sorteio ou dinheiro fácil.' },
    { re: /(baix(e|ar) o (aplicativo|app)|instal(e|ar) (o )?(aplicativo|app)|\.apk\b|atualiza[cç][aã]o de seguran[cç]a do (app|aplicativo)|m[oó]dulo de seguran[cç]a)/i, pts: 3, motivo: 'Pede para instalar aplicativo por link. App de banco só se instala pela loja oficial.' },
    { re: /(taxa (de )?(entrega|libera[cç][aã]o|alf[aâ]ndega|desembara[cç]o)|encomenda (retida|parada|aguardando)|objeto (retido|tributado))/i, pts: 2, motivo: 'Cobra taxa para liberar encomenda (golpe dos falsos Correios).' },
    { re: /(cpf (irregular|bloqueado|cancelado|suspenso)|nome (negativado|sujo)|pend[eê]ncia (na|com a) receita|multa (pendente|em aberto)|d[eé]bito (pendente|em aberto)|acordo (com|de) desconto de \d+ ?%)/i, pts: 2, motivo: 'Fala de dívida, multa ou CPF irregular para assustar.' },
    { re: /(n[aã]o (conte|fale) (pra|para) ningu[eé]m|sigilo|n[aã]o (pode|consigo) (falar|atender|ligar) agora)/i, pts: 2, motivo: 'Pede segredo ou diz que não pode falar por ligação.' },
    { re: /(central de seguran[cç]a|setor de fraude|compra suspeita (no|em) (seu|sua)|n[aã]o reconhece (essa|esta) compra)/i, pts: 3, motivo: 'Diz ser "central de segurança" do banco: o banco não liga pedindo para mover dinheiro.' }
  ];

  function semAcento(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function dominioRegistrado(host) {
    var p = host.toLowerCase().replace(/\.$/, '').split('.');
    if (p.length >= 3 && p[p.length - 1] === 'br' && SEGUNDO_NIVEL_BR.indexOf(p[p.length - 2]) !== -1) {
      return p.slice(-3).join('.');
    }
    return p.slice(-2).join('.');
  }

  function distancia(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return d[m][n];
  }

  function extrairLinks(texto) {
    var re = /\b((?:https?:\/\/)?(?:[a-z0-9¡-￿](?:[a-z0-9¡-￿-]{0,61}[a-z0-9¡-￿])?\.)+(?:[a-z]{2,24}|xn--[a-z0-9-]{2,30})(?::\d{2,5})?(?:\/[^\s<>"')]*)?|https?:\/\/\d{1,3}(?:\.\d{1,3}){3}(?::\d{2,5})?(?:\/[^\s<>"')]*)?)/gi;
    var achados = [], m, bruto;
    while ((m = re.exec(texto)) !== null) {
      bruto = m[1].replace(/[.,;:!?]+$/, '');
      // ignora e-mail (parte depois do @) e números tipo 1.000,00
      if (texto.charAt(m.index - 1) === '@') { continue; }
      if (/^\d+(\.\d+)+$/.test(bruto) && !/^https?:/i.test(bruto)) { continue; }
      achados.push(bruto);
    }
    return achados;
  }

  function analisarLink(bruto) {
    var url = /^https?:\/\//i.test(bruto) ? bruto : 'http://' + bruto;
    var semProtocolo = !/^https?:\/\//i.test(bruto);
    var host, caminho;
    try {
      var u = new URL(url);
      host = u.hostname.toLowerCase();
      caminho = (u.pathname + u.search).toLowerCase();
    } catch (e) {
      return { link: bruto, pontos: 0, motivos: [] };
    }
    var r = { link: bruto, host: host, pontos: 0, motivos: [], oficial: null };
    var reg = dominioRegistrado(host);
    var rotulo = reg.split('.')[0];
    var tld = host.split('.').pop();

    var add = function (pts, motivo) { r.pontos += pts; if (r.motivos.indexOf(motivo) === -1) { r.motivos.push(motivo); } };

    // domínio oficial conhecido?
    var marca, oficiais, k;
    for (marca in MARCAS) {
      if (MARCAS[marca].indexOf(reg) !== -1 || (MARCAS[marca].indexOf('gov.br') !== -1 && /\.gov\.br$/.test(host))) {
        r.oficial = marca;
      }
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) { add(3, 'O link é um número (IP) em vez de um nome de site.'); }
    if (host.indexOf('xn--') !== -1) { add(3, 'O endereço usa letras disfarçadas (pode imitar um site conhecido).'); }
    if (ENCURTADORES.indexOf(reg) !== -1 || ENCURTADORES.indexOf(host) !== -1) { add(2, 'Link encurtado: esconde para onde leva de verdade.'); }
    if (TLD_SUSPEITO.indexOf(tld) !== -1 && !r.oficial) { add(2, 'Final de endereço (.' + tld + ') muito usado em golpes.'); }
    if (/^http:\/\//i.test(bruto)) { add(1, 'Link sem cadeado (http).'); }
    if (/\.apk(\?|$|#)/.test(caminho)) { add(4, 'O link baixa um aplicativo (.apk) por fora da loja oficial.'); }
    if (/(login|entrar|acesso|seguranca|atualiza|validar|desbloque|token|resgat|premio|fatura|boleto|rastre|pix)/.test(semAcento(host)) && !r.oficial) {
      add(1, 'O endereço tem palavras de isca (login, segurança, prêmio, fatura...).');
    }
    if ((host.match(/-/g) || []).length >= 2 && !r.oficial) { add(1, 'Endereço com muitos hífens, comum em site falso.'); }

    if (!r.oficial) {
      var soHost = semAcento(host).replace(/[-_.\/]/g, ' ');
      var tudo = semAcento(host + ' ' + caminho).replace(/[-_.\/]/g, ' ');
      for (marca in MARCAS) {
        oficiais = MARCAS[marca];
        var chave = marca.replace(/ /g, '');
        // Palavra inteira para todas; "dentro de outra palavra" só para nomes que não aparecem em palavras comuns.
        // Nomes comuns (receita, inter, caixa...) só contam no nome do site; os de marca contam também no caminho.
        var temNome = new RegExp('(^|\\s)' + marca + '(\\s|$)').test(DENTRO_DE_PALAVRA.indexOf(chave) !== -1 ? tudo : soHost) ||
          (DENTRO_DE_PALAVRA.indexOf(chave) !== -1 && tudo.replace(/ /g, '').indexOf(chave) !== -1);
        if (temNome) {
          add(4, 'Usa o nome "' + marca + '", mas o site não é o oficial (' + oficiais[0] + ').');
          break;
        }
        for (k = 0; k < oficiais.length; k++) {
          var rotOficial = oficiais[k].split('.')[0];
          if (rotOficial.length >= 5 && rotulo !== rotOficial && distancia(rotulo, rotOficial) <= 2) {
            add(4, 'Endereço parecido com ' + oficiais[k] + ', mas não é ele (letra trocada).');
            break;
          }
        }
      }
    }
    if (semProtocolo && r.pontos > 0 && r.motivos.length === 1 && /Link sem cadeado/.test(r.motivos[0])) { r.pontos = 0; r.motivos = []; }
    return r;
  }

  function analisar(texto) {
    texto = String(texto || '');
    var res = { nivel: 'baixo', pontos: 0, motivos: [], links: [] };
    if (!texto.trim()) { return res; }
    var i, regra;
    for (i = 0; i < REGRAS_TEXTO.length; i++) {
      regra = REGRAS_TEXTO[i];
      if (regra.re.test(texto)) { res.pontos += regra.pts; res.motivos.push(regra.motivo); }
    }
    var links = extrairLinks(texto);
    var oficiais = 0;
    for (i = 0; i < links.length; i++) {
      var l = analisarLink(links[i]);
      res.links.push(l);
      res.pontos += l.pontos;
      if (l.oficial) { oficiais++; }
      for (var j = 0; j < l.motivos.length; j++) {
        if (res.motivos.indexOf(l.motivos[j]) === -1) { res.motivos.push(l.motivos[j]); }
      }
    }
    // Link oficial + pedido de senha/código ainda é golpe (o golpista manda o site certo e liga pedindo o código)
    if (res.pontos >= 5) { res.nivel = 'alto'; }
    else if (res.pontos >= 3) { res.nivel = 'medio'; }
    else { res.nivel = 'baixo'; }
    res.todosOficiais = links.length > 0 && oficiais === links.length;
    return res;
  }

  var api = { analisar: analisar, analisarLink: analisarLink, extrairLinks: extrairLinks, dominioRegistrado: dominioRegistrado, distancia: distancia };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { raiz.EscudoGolpe = api; }
})(typeof self !== 'undefined' ? self : this);
