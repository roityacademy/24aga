/* 24AGÁ — nichos da demonstração. Cada nicho tem uma clínica fictícia, equipe, serviços e conversas.
   Os ids internos dos serviços (botox, preench, …) são apenas "vagas" fixas; o que aparece na tela vem daqui. */
const SLOT_IDS = ['botox','preench','rino','labial','lumini','bioest','profhilo','micro','lavieen'];

const NICHES = {
  estetica: {
    label:'Estética e harmonização', short:'Estética', icon:'spark',
    clinic:'Clínica Vitalle', slogan:'Estética e harmonização facial',
    dr:{ name:'Dra. Helena Duarte', short:'Dra. Helena', role:'Biomédica esteta · Administradora', title:'Biomédica' },
    pro:{ name:'Dra. Paula Andrade', short:'Dra. Paula', role:'Profissional executante (fictícia)', title:'Profissional' },
    sig:{ name:'Protocolo Assinatura', concept:'Um planejamento facial global e personalizado, pensado para valorizar a harmonia e a naturalidade do rosto.' },
    services:[
      ['Toxina botulínica (Botox)','Injetáveis',45,'botox|toxina|botulin',1200,'A toxina botulínica é um procedimento injetável muito procurado para suavizar linhas de expressão. Se é indicado para você, quais áreas e como seria feito, a profissional define na avaliação individual.'],
      ['Preenchimentos faciais','Injetáveis',60,'preench(?!imento labial)',1600,'Os preenchimentos faciais trabalham volume e contorno de algumas regiões do rosto. As regiões e o produto são escolhidos depois da avaliação.'],
      ['Rinomodelação','Injetáveis',60,'rino|nariz',1800,'A rinomodelação é uma abordagem estética não cirúrgica para o nariz. Se é adequada ao seu caso, a profissional avalia pessoalmente.'],
      ['Preenchimento labial','Injetáveis',60,'labi|boca',1500,'O preenchimento labial trabalha contorno e volume dos lábios, sempre com planejamento individual feito na avaliação.'],
      ['Protocolo Assinatura','Programa da clínica',90,'assinatura|protocolo',2900,''],
      ['Bioestimuladores de colágeno','Injetáveis',60,'bioest|colageno|sculptra|radiesse',1500,'Os bioestimuladores de colágeno fazem parte de protocolos definidos pela profissional. Sessões e produto dependem da avaliação.'],
      ['Skinbooster','Injetáveis',45,'skinbooster|hidrata',1400,'O skinbooster é um tratamento injetável de qualidade da pele. A indicação e as sessões são definidas na avaliação.'],
      ['Microagulhamento','Pele',60,'microagul',600,'O microagulhamento é um procedimento para a pele feito em sessões. Quantas e com qual intervalo, a profissional define na avaliação.'],
      ['Laser e tecnologias','Tecnologias',45,'laser|tecnologia',600,'Os tratamentos com laser têm parâmetros e número de sessões definidos depois da avaliação.'],
    ],
    chats:{ c1:'Oi, boa tarde! Fiz um procedimento em outro lugar e está meio inchado, é normal?', c2:'Vi o anúncio de vocês. Quanto custa o botox?', c3svc:'labial', c3:'Oii, vocês fazem preenchimento labial?' },
    sim:{ q:'Oi! Queria saber sobre Botox e se tem horário semana que vem.', svc:'botox', what:'o Botox', goal:'Suavizar linhas de expressão com resultado natural', livre:'Quero agendar uma avaliação de preenchimento labial semana que vem à tarde', complexa:'Tenho melasma, posso fazer laser? Quantas sessões vou precisar?', saude:'Fiz preenchimento há 3 dias e está muito inchado e roxo' },
    incoming:[['Oi! Vi o anúncio no Instagram. Vocês fazem botox?','Anúncio Meta (tráfego pago)'],['Qual o valor da harmonização?','Instagram'],['Olá, tem horário pra preenchimento labial na quinta de manhã?','Anúncio Meta (tráfego pago)'],['Vocês atendem sábado?','Google'],['Fiz botox semana passada e estou com dor de cabeça forte, é normal?','WhatsApp direto'],['Quero marcar uma avaliação de bioestimulador','Site']],
  },
  odonto: {
    label:'Odontologia', short:'Odonto', icon:'heart',
    clinic:'Odonto Prime', slogan:'Odontologia integrada',
    dr:{ name:'Dr. Rafael Moreira', short:'Dr. Rafael', role:'Cirurgião-dentista · Administrador', title:'Cirurgião-dentista', g:'m' },
    pro:{ name:'Dra. Paula Andrade', short:'Dra. Paula', role:'Ortodontista (fictícia)', title:'Ortodontista' },
    sig:{ name:'Sorriso Planejado', concept:'Um planejamento completo do sorriso, em etapas, com orçamento claro desde a primeira consulta.' },
    services:[
      ['Clareamento dental','Estética dental',60,'clarea|branque|dente amarel',900,'O clareamento dental é um tratamento estético para deixar os dentes mais claros. O tipo de clareamento e o número de sessões são definidos na avaliação.'],
      ['Implante dentário','Implantes',90,'implante',3500,'O implante dentário repõe um dente perdido. Se é indicado para você e como seria feito, o dentista define depois da avaliação e dos exames.'],
      ['Aparelho ortodôntico','Ortodontia',45,'aparelho|ortodon|braquete',2400,'O aparelho ortodôntico corrige a posição dos dentes. O tipo de aparelho e o tempo de tratamento são definidos na avaliação.'],
      ['Alinhadores invisíveis','Ortodontia',45,'alinhador|invisalign|transparente',6900,'Os alinhadores invisíveis são uma alternativa discreta ao aparelho fixo. Se é indicado para o seu caso, a ortodontista avalia pessoalmente.'],
      ['Sorriso Planejado','Programa da clínica',90,'sorriso planejado|lente|faceta',8000,''],
      ['Limpeza e prevenção','Prevenção',40,'limpeza|profilaxia|tartaro',250,'A limpeza profissional remove placa e tártaro e faz parte da prevenção. A frequência ideal o dentista orienta na consulta.'],
      ['Tratamento de canal','Endodontia',60,'canal|endodon',1100,'O tratamento de canal é feito quando a polpa do dente está comprometida. A necessidade só é confirmada pelo dentista com exame.'],
      ['Restauração','Clínica geral',40,'restaura|obtura|carie',300,'A restauração recupera um dente com cárie ou desgaste. O material e o número de dentes são definidos na consulta.'],
      ['Prótese dentária','Prótese',60,'protese|dentadura|ponte',2800,'As próteses repõem dentes perdidos. O tipo de prótese é escolhido pelo dentista depois da avaliação.'],
    ],
    chats:{ c1:'Oi, extraí um dente ontem e ainda está sangrando bastante, é normal?', c2:'Vi o anúncio de vocês. Quanto custa o clareamento?', c3svc:'labial', c3:'Oii, vocês trabalham com alinhador invisível?' },
    sim:{ q:'Oi! Queria saber sobre clareamento e se tem horário semana que vem.', svc:'botox', what:'o clareamento', goal:'Dentes mais claros, com resultado natural', livre:'Quero agendar uma avaliação de implante semana que vem à tarde', complexa:'Tenho sensibilidade nos dentes, posso fazer clareamento? Quantas sessões preciso?', saude:'Estou com muita dor de dente e o rosto inchado desde ontem' },
    incoming:[['Oi! Vi o anúncio no Instagram. Vocês fazem clareamento?','Anúncio Meta (tráfego pago)'],['Qual o valor do implante?','Instagram'],['Olá, tem horário pra limpeza na quinta de manhã?','Anúncio Meta (tráfego pago)'],['Vocês atendem sábado?','Google'],['Estou com dor de dente forte e o rosto inchado, é urgente?','WhatsApp direto'],['Quero marcar uma avaliação para aparelho','Site']],
  },
  medico: {
    label:'Médicos e especialistas', short:'Médico', icon:'shield',
    clinic:'Clínica Santé', slogan:'Consultório médico de especialidades',
    dr:{ name:'Dra. Carolina Prado', short:'Dra. Carolina', role:'Médica dermatologista · Administradora', title:'Médica' },
    pro:{ name:'Dr. André Lima', short:'Dr. André', role:'Médico ginecologista (fictício)', title:'Médico', g:'m' },
    sig:{ name:'Check-up Completo', concept:'Uma consulta ampliada com revisão de exames e plano de cuidados para o ano, organizada em uma única visita.' },
    services:[
      ['Consulta dermatológica','Dermatologia',30,'dermato|pele|mancha|acne|cabelo',450,'A consulta dermatológica avalia pele, cabelos e unhas. Diagnóstico e tratamento só são definidos pela médica durante a consulta.'],
      ['Consulta ginecológica','Ginecologia',30,'gineco|preventivo|papanicolau',400,'A consulta ginecológica faz o acompanhamento da saúde da mulher. Exames e condutas são definidos pelo médico na consulta.'],
      ['Pequenos procedimentos','Procedimentos',45,'pinta|verruga|sinal|cauteriz|biopsia',600,'Pequenos procedimentos, como retirada de pintas, só são indicados depois de uma consulta com avaliação médica.'],
      ['Teleconsulta','Online',30,'online|teleconsulta|video|telemedicina',350,'A teleconsulta é feita por vídeo, com a mesma atenção da consulta presencial. A médica define se o seu caso pode ser atendido online.'],
      ['Check-up Completo','Programa da clínica',60,'check.?up|checkup',900,''],
      ['Retorno com exames','Retorno',20,'retorno|resultado|exame',0,'O retorno serve para avaliar resultados de exames com o médico que pediu. Pode ser agendado por aqui.'],
      ['Mapeamento de pintas','Dermatologia',45,'mapeamento|dermatoscop',700,'O mapeamento de pintas acompanha sinais da pele ao longo do tempo. A indicação é da médica, após consulta.'],
      ['Tratamento de acne','Dermatologia',30,'espinha|cravo',450,'O tratamento de acne começa por uma consulta. O plano é sempre individual, definido pela médica.'],
      ['Inserção de DIU','Ginecologia',45,'diu|contracep',900,'A inserção de DIU é feita após consulta e avaliação. O tipo e a indicação são definidos pelo médico.'],
    ],
    chats:{ c1:'Oi, comecei um remédio novo e estou com manchas vermelhas pelo corpo, é normal?', c2:'Vi o anúncio de vocês. Quanto custa a consulta com a dermatologista?', c3svc:'labial', c3:'Oii, vocês fazem teleconsulta?' },
    sim:{ q:'Oi! Queria uma consulta com a dermatologista e se tem horário semana que vem.', svc:'botox', what:'a consulta dermatológica', goal:'Avaliação de manchas na pele', livre:'Quero agendar uma consulta ginecológica semana que vem à tarde', complexa:'Tenho uma pinta que mudou de cor, é câncer? Qual remédio eu tomo?', saude:'Estou com febre alta e falta de ar desde ontem' },
    incoming:[['Oi! Vi o anúncio no Instagram. Vocês atendem por convênio?','Anúncio Meta (tráfego pago)'],['Qual o valor da consulta?','Instagram'],['Olá, tem horário com a dermatologista na quinta de manhã?','Anúncio Meta (tráfego pago)'],['Vocês atendem sábado?','Google'],['Estou com febre alta e falta de ar, o que faço?','WhatsApp direto'],['Quero marcar um check-up','Site']],
  },
  bemestar: {
    label:'Saúde e bem-estar', short:'Bem-estar', icon:'users',
    clinic:'Espaço Equilíbrio', ca:'do', slogan:'Psicologia, nutrição e fisioterapia',
    dr:{ name:'Ana Ribeiro', short:'Ana', role:'Psicóloga · Administradora', title:'Psicóloga' },
    pro:{ name:'Paula Andrade', short:'Paula', role:'Nutricionista (fictícia)', title:'Nutricionista' },
    sig:{ name:'Programa Equilíbrio', concept:'Um acompanhamento integrado de 12 semanas com psicologia, nutrição e movimento, montado para a sua rotina.' },
    services:[
      ['Psicoterapia individual','Psicologia',50,'psico|terapia|ansiedade|terapeuta',180,'A psicoterapia individual é um espaço de escuta e cuidado. A frequência e a abordagem são combinadas com a psicóloga na primeira sessão.'],
      ['Consulta de nutrição','Nutrição',60,'nutri|dieta|emagrec|alimenta',250,'A consulta de nutrição monta um plano alimentar para os seus objetivos. O plano é sempre individual, feito pela nutricionista.'],
      ['Fisioterapia','Fisioterapia',50,'fisio|coluna|joelho|lombar',150,'A fisioterapia trata dores e recuperação de movimento. O número de sessões é definido depois da avaliação.'],
      ['Pilates clínico','Movimento',50,'pilates',120,'O pilates clínico trabalha força, postura e flexibilidade, com turmas pequenas. Começa por uma avaliação.'],
      ['Programa Equilíbrio','Programa da clínica',60,'programa|equilibrio',1800,''],
      ['Acupuntura','Terapias',50,'acupuntura|agulha',160,'A acupuntura é uma terapia complementar. A indicação e as sessões são definidas na avaliação.'],
      ['Terapia de casal','Psicologia',60,'casal|relacionamento',250,'A terapia de casal é conduzida pela psicóloga, com sessões combinadas com os dois.'],
      ['Avaliação postural','Fisioterapia',40,'postura|postural',180,'A avaliação postural identifica desequilíbrios e orienta exercícios. É feita pela fisioterapeuta.'],
      ['Drenagem linfática','Terapias',50,'drenagem|massagem',150,'A drenagem linfática é uma técnica manual. A indicação e o número de sessões são definidos na avaliação.'],
    ],
    chats:{ c1:'Oi, estou passando por um momento muito difícil e não estou bem hoje.', c2:'Vi o anúncio de vocês. Quanto custa a sessão de terapia?', c3svc:'labial', c3:'Oii, vocês têm pilates?' },
    sim:{ q:'Oi! Queria começar terapia e saber se tem horário semana que vem.', svc:'botox', what:'a psicoterapia', goal:'Cuidar da ansiedade no dia a dia', livre:'Quero agendar uma consulta de nutrição semana que vem à tarde', complexa:'Tenho diabetes, posso fazer a dieta de jejum? Quantos quilos vou perder?', saude:'Estou tendo pensamentos ruins e não sei o que fazer' },
    incoming:[['Oi! Vi o anúncio no Instagram. Vocês atendem online?','Anúncio Meta (tráfego pago)'],['Qual o valor da consulta de nutrição?','Instagram'],['Olá, tem horário de fisioterapia na quinta de manhã?','Anúncio Meta (tráfego pago)'],['Vocês atendem sábado?','Google'],['Estou com uma crise de ansiedade agora, o que faço?','WhatsApp direto'],['Quero conhecer o pilates','Site']],
  },
};
const NICHE_KEYS = Object.keys(NICHES);
const NICHE_STORE = '24h.niche';
function currentNiche() { try { const k = localStorage.getItem(NICHE_STORE); if (NICHES[k]) return k; } catch (e) {} return 'estetica'; }
const N = () => NICHES[(typeof S !== 'undefined' && S && S.niche) || currentNiche()];
const DR = () => (S.staff.find(s => s.id === 'grazi') || {}).short || 'a profissional';
const PRO = () => (S.staff.find(s => s.id === 'paula') || {}).short || 'a profissional';
const CLINIC = () => S.settings.clinic;
const ART_M = { a:'o', A:'O', da:'do', pela:'pelo', na:'no', Na:'No' };
const art = (w, g) => g === 'm' ? (ART_M[w] || w) : w;
const drw = w => art(w, (N().dr || {}).g) + ' ' + DR();
const prow = w => art(w, (N().pro || {}).g) + ' ' + PRO();
const cw = w => art(w, N().ca === 'do' ? 'm' : 'f') + ' ' + CLINIC();
