# Evolução da Ilha do Desenvolvedor

## Correção do chão — 05/11/2026

- Pistas subdivididas longitudinalmente e transversalmente para acompanhar as elevações, com junções de curvas que não dobram a malha sobre si mesma.
- Maior resolução do terreno e separação entre bordas e pavimento; desempate de profundidade nos cruzamentos sem deslocamento dependente da inclinação da câmera.
- Vigas da ponte inclinadas com a rampa e posicionadas abaixo do asfalto.
- Árvores continuam decorativas, sem colisores.
- Verificação visual em Chromium headless com WebGL: praça, mirante, costa e ponte. Capturas em `test-artifacts/ground-*.png`; nenhum erro JavaScript não tratado registrado. Isso não equivale a um teste completo de direção ou medição de FPS em celular.
- Dois novos testes de geometria aprovados. Suíte completa: 13 aprovados e duas falhas preexistentes em `stage3.test.mjs` (expectativa de água ao lado da ponte e obstáculos em caminhos); não alteradas nesta correção visual.
- A subdivisão aumenta a quantidade de triângulos; desempenho em aparelhos móveis ainda precisa ser medido.

Para repetir as capturas, inicie o site com `npm start`, abra um Chromium local com `--remote-debugging-port=9224` e execute `node scripts/preview-ground.mjs` (Node 22 ou superior).

## Plano de implementação

1. Direção e controles: simulação fixa, aceleração, frenagem, aderência e colisões deslizantes.
2. Carro e câmera: acabamento, suspensão física, introdução e controle de câmera.
3. Ilha: garagem, bairros, ponte, túnel, rampas, vegetação e luz.
4. Portfólio: conferir fontes públicas, descrições com evidências, seis projetos na versão clássica.
5. Atividades: seis desafios opcionais, áudio, garagem, conquistas e persistência.
6. Verificação: WebGL, multitoque, acessibilidade e medições de desempenho.

## Implementado nesta etapa

- Módulo driving.js sem dependência de renderização, parâmetros centralizados e passo de 1/120 s.
- Velocidades máximas 24 m/s e ré 10 m/s; aceleração 23 m/s²; frenagem ao inverter o comando.
- Direção progressiva com redução de ângulo em alta velocidade e retorno suave.
- Freio de mão com menor aderência e colisões que removem velocidade normal à parede.
- Formas menores para prédios e troféu; arena aberta deixa de bloquear o terreno inteiro.
- Recuperação ao ultrapassar o limite da ilha; limpeza de entrada ao abrir modal e perder foco.
- Câmera antecipando o caminho; redução de animação respeitando preferência do sistema.

## Validação e limitações

Sintaxe de world.js verificada com Node. Simulação isolada alcançou 24 m/s em três segundos e parou na superfície de uma parede sem atravessá-la. Não houve teste visual WebGL nem medição de FPS. Não tratar essas verificações como teste de jogabilidade.

Colisão do carro ainda usa círculo, sem capotamento ou suspensão física. Árvores e mobiliário ainda não têm colisores. Aderência e freio de mão precisam de ajuste visual. Conteúdo do GitHub ainda não foi reconferido. Não foram adicionadas dependências externas.

## Etapa 2 — carro, câmera e suspensão de apresentação

- Carro extraído para vehicle.js; carroceria com bordas arredondadas, cabine transparente, bancos e volante, para-lamas curvos, retrovisores, bagageiro e estepe.
- Faróis com dois spots sem sombras adicionais no modo noturno; lanternas respondem à frenagem e freio de mão.
- Rodas giram com a velocidade; ângulos interno/externo diferentes nas curvas.
- Molas amortecidas reagem à aceleração, frenagem e aceleração lateral; amortecedores visuais acompanham a compressão. Rodas mantêm contato com o chão plano.
- Introdução de 4,5 segundos, botão para pular, tecla C e botão de recentralização, zoom limitado, antecipação suave e ocultação temporária de peças que bloqueiam a visão do carro.
- Redução de movimento aplicada à introdução, suspensão de apresentação e câmera.
- Testes automatizados com Node/Three.js; nenhum modelo externo ou nova dependência de produção.

Validação visual ainda pendente: Edge headless não entregou captura ou endpoint de depuração. Instalação do Playwright bloqueada por EACCES na rede. Testes em Node não medem qualidade visual ou FPS. Rampas, saltos, suspensão física e ajuste visual de jogabilidade continuam pendentes. Próxima etapa: ilha, garagem e iluminação; depois conteúdo, atividades e testes finais.
