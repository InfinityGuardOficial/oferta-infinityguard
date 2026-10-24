/*
 * Escudo Infinity Guard - checagens guiadas do celular (Android e iPhone).
 * Cada item: id, peso (Critico 25, Alto 12, Medio 4), pergunta, onde conferir e o que fazer.
 */
(function (raiz) {
  'use strict';
  var PESO = { Critico: 25, Alto: 12, Medio: 4 };

  var ANDROID = [
    { id: 'a-acess', nivel: 'Critico', pergunta: 'Em Acessibilidade, só aparecem apps que você usa de propósito?',
      onde: 'Configurações > Acessibilidade > Apps instalados (ou Serviços instalados).',
      fazer: 'Desligue e desinstale qualquer app de "atualização", "segurança", "lanterna" ou nome estranho com acesso ligado. É assim que o golpe do Pix lê a tela e digita por você.' },
    { id: 'a-desconhecidos', nivel: 'Alto', pergunta: '"Instalar apps desconhecidos" está como Não permitido para todos os apps?',
      onde: 'Configurações > Apps > Acesso especial > Instalar apps desconhecidos.',
      fazer: 'Deixe todos como "Não permitido". Golpe chega como link no WhatsApp pedindo para instalar um arquivo .apk.' },
    { id: 'a-admin', nivel: 'Alto', pergunta: 'Em Apps de administração do dispositivo só tem o "Encontre meu dispositivo" (ou o da empresa)?',
      onde: 'Configurações > Segurança > Mais configurações > Apps de administração do dispositivo.',
      fazer: 'Desmarque o que não reconhece e desinstale o app.' },
    { id: 'a-playprotect', nivel: 'Alto', pergunta: 'O Play Protect está ligado e a última verificação não achou nada?',
      onde: 'Play Store > foto do perfil > Play Protect.',
      fazer: 'Toque na engrenagem, ligue "Verificar apps com o Play Protect" e toque em Verificar.' },
    { id: 'a-patch', nivel: 'Alto', pergunta: 'A atualização de segurança do celular é dos últimos 6 meses?',
      onde: 'Configurações > Sobre o telefone > Versão do Android > Nível do patch de segurança.',
      fazer: 'Configurações > Sistema > Atualização. Se o fabricante não manda mais atualização, evite usar banco nesse aparelho.' },
    { id: 'a-bloqueio', nivel: 'Alto', pergunta: 'O celular tem PIN de 6 dígitos ou senha (não só deslizar ou desenho simples)?',
      onde: 'Configurações > Segurança > Bloqueio de tela.',
      fazer: 'Use PIN de 6 dígitos ou senha, junto com a digital ou o rosto.' },
    { id: 'a-notif', nivel: 'Alto', pergunta: 'Em Acesso a notificações só aparecem apps que você reconhece?',
      onde: 'Configurações > Apps > Acesso especial > Acesso a notificações.',
      fazer: 'Desligue o que não reconhece: esse acesso lê o código do banco que chega por SMS.' },
    { id: 'a-whats', nivel: 'Alto', pergunta: 'O WhatsApp tem confirmação em duas etapas (PIN)?',
      onde: 'WhatsApp > Configurações > Conta > Confirmação em duas etapas.',
      fazer: 'Ative e cadastre um e-mail. Evita clonagem do WhatsApp.' },
    { id: 'a-roubo', nivel: 'Medio', pergunta: 'A proteção contra roubo está ligada (bloqueio quando o celular é arrancado da mão)?',
      onde: 'Configurações > Google > Todos os serviços > Proteção contra roubo (Android 10 ou mais novo).',
      fazer: 'Ligue "Bloqueio por detecção de roubo" e "Bloqueio remoto".' },
    { id: 'a-encontre', nivel: 'Medio', pergunta: 'O "Encontre meu dispositivo" está ligado?',
      onde: 'Configurações > Google > Encontre meu dispositivo.',
      fazer: 'Ligue. Se o celular sumir, dá para bloquear e apagar de longe.' },
    { id: 'a-google', nivel: 'Medio', pergunta: 'Sua conta Google tem verificação em duas etapas?',
      onde: 'myaccount.google.com > Segurança.',
      fazer: 'Ative a verificação em duas etapas e rode o Check-up de segurança.' },
    { id: 'a-banco', nivel: 'Medio', pergunta: 'No app do banco, o limite de Pix noturno está baixo?',
      onde: 'App do banco > Pix > Meus limites.',
      fazer: 'Deixe o limite noturno baixo. Se o celular for roubado, o prejuízo fica pequeno.' }
  ];

  var IPHONE = [
    { id: 'i-update', nivel: 'Alto', pergunta: 'O iPhone está atualizado e com atualizações automáticas ligadas?',
      onde: 'Ajustes > Geral > Atualização de Software > Atualizações Automáticas.',
      fazer: 'Instale o que estiver pendente e ligue também "Respostas de Segurança e Arquivos do Sistema".' },
    { id: 'i-perfis', nivel: 'Critico', pergunta: 'Em "VPN e Gerenciamento de Dispositivos" não tem nada que você não reconheça?',
      onde: 'Ajustes > Geral > VPN e Gerenciamento de Dispositivos.',
      fazer: 'Perfil desconhecido pode desviar sua internet e espionar o aparelho. Se não é do trabalho ou escola, toque nele e Remover Perfil.' },
    { id: 'i-roubo', nivel: 'Alto', pergunta: 'A "Proteção de Dispositivo Roubado" está ligada?',
      onde: 'Ajustes > Face ID e Código > Proteção de Dispositivo Roubado.',
      fazer: 'Ligue em "Sempre". Mesmo com o seu código, o ladrão não consegue trocar a senha da conta Apple nem ver senhas salvas.' },
    { id: 'i-codigo', nivel: 'Alto', pergunta: 'O código de bloqueio tem 6 dígitos ou mais (e não é data de nascimento)?',
      onde: 'Ajustes > Face ID e Código > Alterar Código.',
      fazer: 'Use 6 dígitos ou "Código Alfanumérico". Evite 123456, 000000 e datas.' },
    { id: 'i-jailbreak', nivel: 'Alto', pergunta: 'O iPhone NÃO tem jailbreak nem apps instalados por fora da App Store?',
      onde: 'Procure apps como Cydia, Sileo ou lojas "alternativas" que você não reconhece.',
      fazer: 'Restaure o iPhone pelo computador ou em Ajustes > Geral > Transferir ou Redefinir.' },
    { id: 'i-whats', nivel: 'Alto', pergunta: 'O WhatsApp tem confirmação em duas etapas (PIN)?',
      onde: 'WhatsApp > Configurações > Conta > Confirmação em duas etapas.',
      fazer: 'Ative e cadastre um e-mail. Evita clonagem do WhatsApp.' },
    { id: 'i-buscar', nivel: 'Medio', pergunta: 'O "Buscar iPhone" está ligado?',
      onde: 'Ajustes > [seu nome] > Buscar > Buscar iPhone.',
      fazer: 'Ligue também "Rede do app Buscar" e "Enviar Última Localização".' },
    { id: 'i-aparelhos', nivel: 'Medio', pergunta: 'Na lista de aparelhos da sua conta Apple só tem aparelhos seus?',
      onde: 'Ajustes > [seu nome] > role até o fim da tela.',
      fazer: 'Toque no aparelho desconhecido e em "Remover da Conta", depois troque a senha da conta Apple.' },
    { id: 'i-checkup', nivel: 'Medio', pergunta: 'Você revisou o "Check-up de Segurança" (quem vê sua localização e seus dados)?',
      onde: 'Ajustes > Privacidade e Segurança > Check-up de Segurança.',
      fazer: 'Pare de compartilhar com quem você não quer e reveja o acesso dos apps.' },
    { id: 'i-banco', nivel: 'Medio', pergunta: 'No app do banco, o limite de Pix noturno está baixo?',
      onde: 'App do banco > Pix > Meus limites.',
      fazer: 'Deixe o limite noturno baixo. Se o celular for roubado, o prejuízo fica pequeno.' }
  ];

  /** respostas: { id: 'sim' | 'nao' | 'naosei' }. "Não sei" conta metade, porque pode estar desprotegido. */
  function calcularNota(lista, respostas) {
    var nota = 100, respondidas = 0, pendencias = [], i, it, r;
    for (i = 0; i < lista.length; i++) {
      it = lista[i];
      r = respostas[it.id];
      if (!r) { continue; }
      respondidas++;
      if (r === 'nao') { nota -= PESO[it.nivel]; pendencias.push(it); }
      else if (r === 'naosei') { nota -= Math.ceil(PESO[it.nivel] / 2); pendencias.push(it); }
    }
    var ordem = { Critico: 0, Alto: 1, Medio: 2 };
    pendencias.sort(function (a, b) { return ordem[a.nivel] - ordem[b.nivel]; });
    return { nota: Math.max(0, nota), respondidas: respondidas, total: lista.length, completo: respondidas === lista.length, pendencias: pendencias };
  }

  function detectarAparelho(userAgent, maxTouchPoints) {
    var ua = String(userAgent || '');
    if (/android/i.test(ua)) { return 'android'; }
    if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && maxTouchPoints > 1)) { return 'iphone'; }
    return null;
  }

  var api = { ANDROID: ANDROID, IPHONE: IPHONE, PESO: PESO, calcularNota: calcularNota, detectarAparelho: detectarAparelho };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { raiz.EscudoChecagens = api; }
})(typeof self !== 'undefined' ? self : this);
