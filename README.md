# Felipe World — portfólio 3D

Código completo da versão criada nesta conversa, com modelos procedurais em Three.js, seis projetos e versão clássica.

## Rodar no Windows

### Expedição lunar — Selene

Use **Estação lunar** no menu ou siga a estrada para a pequena ilha a leste. Entre pela rampa usando os mesmos controles do carro. Ao cruzar a entrada, o foguete reconhece o veículo e inicia a viagem automaticamente, sem exigir alinhamento perfeito ou girar o carro. Durante o embarque, **Sair da cápsula** cancela a partida. A viagem inclui nuvens suaves, aproximação gradual do destino, transições entre cenas e pouso. Há opção de pular e suporte a movimento reduzido.

Na Lua, explore a base, o arco rochoso, a sonda caída e os cristais. Um alien observa a área de desembarque; outros dois ficam próximos aos pontos de interesse. Eles permanecem visíveis até você chegar perto e se escondem antes de serem alcançados. A seta e a distância indicam o foguete em relação à frente do carro; o mapa também traça a direção de retorno. **R** ou **Voltar ao foguete** recupera o veículo junto à rampa. Para retornar à Terra, entre novamente na cápsula. O terreno lunar é uma representação artística procedural, com uma área dirigível de 220 m de diâmetro e paisagem além dela.

Arquivos principais: `dist/lunar-journey.js`, `dist/selene-rocket.js`, `dist/flight-clouds.js`, `dist/flight-renderer.js`, `dist/lunar-exploration.js`, `dist/lunar-models.js` e `dist/lunar-terrain.js`. Testes: `tests/lunar*.test.mjs`.

### Iniciar o servidor
1. Extraia o ZIP (não rode de dentro do arquivo compactado).
2. Instale Node.js caso ainda não tenha.
3. Abra o terminal na pasta felipe-world.
4. Execute: npm.cmd start (ou npm start fora do PowerShell).
5. Abra http://localhost:3000 no navegador.

Não precisa de npm install. Não abra index.html com duplo clique: os módulos JavaScript precisam de um servidor HTTP.
Alternativa com Python: python -m http.server 3000 --directory dist

### Acessar pela rede local

`npm.cmd start` também aceita conexões da rede local. Abra em outro dispositivo conectado ao mesmo Wi-Fi o endereço `Rede:` exibido no terminal, usando o IP do adaptador Wi-Fi ou Ethernet (não o adaptador virtual do WSL). A porta padrão é 3000. Para restringir o servidor ao próprio computador, defina `HOST=127.0.0.1` antes de iniciar. O computador deve permanecer ligado com o servidor em execução.

## Controles
WASD ou setas: dirigir. Espaço: freio de mão. E: abrir projeto próximo.
R: voltar ao início. H: buzina. Arraste para girar a câmera; roda do mouse para zoom.
C ou botão ◎: recentralizar a câmera. O passeio inicial dura 4,5 segundos; use “Pular passeio”, “Vamos explorar” ou comece a dirigir para pular.
No celular, arraste o joystick: cima acelera, baixo freia e engata ré, e as diagonais combinam aceleração e curva. Soltar o joystick zera os comandos e o carro desacelera. O botão FREIO aciona o freio de mão com outro dedo. O Menu reúne projetos, configurações, recuperação do carro e câmera; o mapa só aparece se você ativar.

Árvores tombam quando o carro passa por elas com velocidade. Elas continuam sem colisão sólida; toques lentos não derrubam. A animação da queda é instantânea para quem prefere menos movimento.

## Arquivos para editar
- dist/projects.js: nomes, descrições, tecnologias e repositórios.
- dist/models.js: prédios e objetos 3D procedurais.
- dist/vehicle.js: off-road procedural, interior, materiais, faróis e rodas.
- dist/suspension.js: molas amortecidas de apresentação e esterçamento das rodas.
- dist/camera.js: introdução, órbita, zoom, antecipação e tratamento de obstruções.
- dist/driving.js: direção e colisões em passos fixos.
- dist/world.js: cenário, iluminação e integração dos módulos.
- dist/world.css: aparência dos menus e interface.
- dist/ui.js: interações, configurações e janelas de projetos.
- dist/index.html: entrada do passeio 3D.
- dist/classico.html: portfólio tradicional.
- dist/three.js: biblioteca Three.js local, com aviso de licença preservado.

## Publicar
Hospede o conteúdo da pasta dist em uma hospedagem estática com HTTPS.
O servidor incluído é apenas para desenvolvimento local.

### Cloudflare Pages (plano gratuito)

O arquivo `felipe-world-pages.zip` contém apenas os 19 arquivos de `dist`, com `index.html` na raiz. No painel [Workers & Pages](https://dash.cloudflare.com/), escolha **Create application → Get started → Drag and drop your files**, informe o nome desejado (por exemplo, `felipe-world-projeto`), envie o ZIP e selecione **Deploy site**. O painel mostrará o endereço permanente `*.pages.dev`. Não há comando de build nem dependências de produção. A versão clássica também está no pacote.

Para publicar uma alteração futura, recrie o ZIP a partir de `dist` com `Compress-Archive -Path 'dist\*' -DestinationPath 'felipe-world-pages.zip' -Force` e use **Create a new deployment** no projeto do Cloudflare. Projetos criados por upload direto exigem novas publicações manuais; a integração automática com Git não pode ser ativada nesse mesmo projeto posteriormente.

## Requisitos e validação
O modo 3D requer WebGL e aceleração gráfica. As fontes externas usam internet; o navegador usa fontes alternativas se não conseguir carregá-las.
A renderização foi conferida em Chromium com WebGL: praça, mirante, costa, ponte e modo noturno. A otimização reduziu chamadas de desenho e triângulos; os tempos de quadro locais variaram e não permitem garantir 60 FPS. Consulte [DESEMPENHO.md](DESEMPENHO.md) para medições, limitações e como repetir os testes.

Execute `npm.cmd test` para os testes de direção, suspensão, geometria, câmera e qualidade adaptativa. Permanecem duas falhas preexistentes em caminhos e água da ponte; elas estão documentadas no relatório.

A suspensão atual é visual: inclinação e compressão respondem à aceleração e às curvas; não simula ainda contato vertical com rampas, saltos ou capotamento. Ao obstruir o carro, peças da construção são temporariamente ocultadas. A preferência `prefers-reduced-motion` desliga introdução e inclinação e mantém a câmera sem antecipação por velocidade.

## Desempenho e configurações

Em Configurações, clique em Qualidade gráfica para alternar entre Automática, Alta, Equilibrada e Leve. A escolha é salva neste navegador. O modo automático ajusta a resolução e as sombras conforme a carga, mantendo os modelos. Alta mantém a qualidade fixa.

- `dist/graphics.js`: perfis, limite de resolução e adaptação gradual.
- `dist/render-optimization.js`: agrupamento de peças rígidas sem remover detalhes.
- `scripts/benchmark.mjs`: medição local repetível.
- `scripts/check-performance-browser.mjs`: verificação funcional e capturas WebGL.

## Interface de toque

`dist/touch-controls.js` controla o joystick proporcional nos dois eixos, a zona neutra e a captura independente dos dedos. `dist/mobile.css` concentra o layout compacto. Os comandos são limpos ao abrir menus, trocar de aba, girar a tela e recuperar o carro.

Validação: cinco testes unitários de toque e teste WebGL com toque emulado, incluindo avanço, diagonais, ré e freio simultâneo, em telas horizontais e verticais. Ainda não foi testado em aparelho físico. As duas falhas anteriores de caminhos/água continuam pendentes.
## Segredos da ilha

Ilha ampliada de 58 para 82 metros de raio, com três trilhas de terra além do circuito central. As referências escolhidas por Felipe são **Fullmetal Alchemist** (braço automail inspirado em Edward Elric), **The Witcher** (espada de prata inspirada em Geralt e medalhão de lobo) e **Homem-Aranha** (máscara e teia). São interpretações estilizadas feitas com geometria procedural, sem modelos ou imagens externos. As frases relacionam cada referência à tecnologia, aparecem após descobrir o local e são identificadas como textos originais de Felipe World, não citações dos personagens. O mirante continua como paisagem.

Aproxime o carro para registrar cada descoberta e iluminar um detalhe do objeto. No desktop, abra **Segredos**; no celular, **Menu → Segredos da ilha**. A coleção mostra pistas antes da descoberta e uma mensagem depois, sem marcadores permanentes no mapa.

O progresso fica neste navegador (`felipe-world-secrets-v3`); as descobertas antigas não desbloqueiam as novas. O botão **Apagar descobertas** pede um segundo clique para confirmar. Se o armazenamento estiver bloqueado, a exploração continua nesta sessão. Os objetos não usam luzes adicionais ou animação contínua. A vegetação geral usa instâncias; as cenas dos segredos agrupam as malhas estáticas por material.

`dist/secrets.js` contém posições, pistas e persistência; `dist/secret-models.js` constrói os objetos. Testes: `node --test tests/secrets.test.mjs`. Para repetir a verificação visual com o servidor local e Chromium CDP na porta 9224: `node scripts/preview-secrets.mjs` (usa e apaga o progresso apenas no perfil de teste).


## Movimento do cenário e passagem sob a ponte

Gaivotas circulam perto da ponte, caranguejos caminham na praia leste e a chaminé da lanchonete solta fumaça. As animações respeitam movimento reduzido e não adicionam colisores ou luzes.

A ponte tem tabuleiro a 4,6 m, uma passagem seca transversal e níveis de circulação separados. O carro acessa o tabuleiro pelas rampas; os pilares e as partes baixas das rampas bloqueiam quem está no chão. As rodas mantêm o nível selecionado nas bordas. A rua inferior conecta a via do campus à estrada costeira.

Validação desta alteração: testes de travessia nos dois sentidos, acesso pelas duas rampas, folga do teto, contato das rodas nas bordas, bloqueio sob rampas baixas, conexões das ruas, animações e movimento reduzido. Resta uma falha anterior no teste geral de obstáculos de outras ruas (costa, Arenix e mirante). A revisão visual desta versão não foi executada: o ambiente bloqueou a abertura do navegador.

## Correção da vista inicial

A câmera usa plano próximo de 1 m para preservar a precisão de profundidade na abertura distante. Ruas e meios-fios usam compensação de profundidade proporcional à inclinação, com asfalto à frente das bordas nos cruzamentos. A tela de carregamento aguarda o primeiro quadro renderizado antes de desaparecer.

Validação: 10 testes de câmera, separação de profundidade nas proporções desktop/celular, geometria do terreno, direção e suspensão passaram; verificação de sintaxe de world.js e ui.js passou. Resultado visual ainda requer conferência no navegador.

Os marcadores circulares dos seis projetos agora têm camadas próprias após o asfalto: disco, anel e letra P. Os materiais mantêm teste de profundidade para o carro continuar cobrindo o marcador e não compartilham a compensação com materiais das construções. Validação: 11 testes de marcadores, terreno, câmera e veículo passaram; revisão visual pendente.

## Junções das trilhas dos segredos

As três trilhas de areia são recortadas no contorno exato da estrada costeira, incluindo as curvas e a borda. Isso elimina as superfícies de areia/asfalto sobrepostas nas entradas. O recorte é calculado uma vez na criação do cenário, em dist/ground-junction.js.

Validação: 10 testes passaram, incluindo raios verticais nas três entradas para detectar buracos e sobreposição, marcadores, terreno, câmera e segredos. A aparência desta correção ainda requer conferência no navegador.

A praça circular foi retirada do cruzamento central e reduzida para uma área de descanso ao lado da garagem (centro -12, -6; raio 3,6 m). Bancos, placa e seus colisores foram movidos juntos. A vegetação preserva o espaço da praça. Conferido que o contorno da praça não invade as ruas ou suas bordas.

## Legibilidade da interface

A apresentação, a marca, os menus e os indicadores usam painéis opacos em creme com texto verde escuro. A faixa inferior apresenta teclas destacadas, fonte de 13 px e quebra de linha; título e descrição de abertura usam fontes maiores com alternativas de sistema. Os controles móveis continuam compactos. As regras estão em dist/readability.css, carregado após os estilos existentes.

Verificação: arquivos CSS referenciados presentes, seis grupos de teclas no HTML e contraste calculado das combinações principais entre 5,75:1 e 11,64:1. O layout desta versão ainda não foi conferido visualmente no navegador.

## Sobre mim e currículo

O acesso antes chamado Versão clássica agora se chama Sobre mim & currículo no menu desktop, menu móvel, configurações e carregamento. O endereço classico.html foi mantido para preservar links existentes; a página passou a apresentar perfil, currículo online e projetos, com retorno à ilha.

O currículo reúne apenas informações já presentes no portfólio: Felipe, perfil de desenvolvedor, tecnologias, experiência em projetos e GitHub. Formação, experiências profissionais, períodos e novos contatos dependem de dados fornecidos pelo titular. O botão Imprimir / salvar em PDF abre a impressão do navegador; a folha de impressão mostra apenas o currículo. Estilos em dist/profile.css.

Verificação: âncoras válidas, IDs únicos, três botões de projetos preservados, ação de impressão e sintaxe do JavaScript. Layout e impressão ainda precisam de conferência visual no navegador.

## Carro na terra, barco no mar

Ao entrar no mar o carro vira um pequeno barco laranja com uma nuvem de fumaça. Ao voltar à praia ele vira carro automaticamente. Os controles de teclado, joystick, ré, freio e recuperação são compartilhados. O barco tem aceleração e velocidade próprias, balanço e rastro de espuma; movimento reduzido desliga fumaça, balanço e rastro.

A navegação permite dar a volta na ilha, até 130 m do centro. O limite externo segura o veículo sem teleportá-lo. A ponte mantém o modo carro, e recuperar ou visitar um projeto restaura o veículo. O minimapa inclui o mar.

Verificação: 15 testes passaram, cobrindo ida e volta pela praia, navegação, limite, troca de modelos, fumaça, recuperação do modelo, ponte e direção. Aparência e controles integrados ainda precisam de revisão visual no navegador.

## Mar e navega??o

A ilha est? sem m?sica, sem player externo e sem som de motor. Os m?dulos de r?dio e seus controles foram removidos.

O mar mant?m profundidade de cor, reflexos, ondas costeiras e areia molhada. A passagem do barco eleva suavemente a ?gua junto ? proa e abre ondas laterais. Espuma e rastro ficam em coordenadas do mundo, acompanham o percurso nas curvas, espalham-se e desaparecem. A emiss?o depende da dist?ncia percorrida e da velocidade, funciona em r? e ? interrompida em terra, durante o arremesso do kraken e com movimento reduzido. Um conjunto fixo de malhas limita o custo.

O casco acompanha a altura e a inclina??o das mesmas ondas usadas no mar. A navega??o tem desacelera??o mais gradual, resposta progressiva do leme e inclina??o nas curvas. A f?sica do carro em terra permanece separada.

Testes cobrem navega??o, proa/rastro, r?, pausa, dissipa??o, movimento reduzido, garagem e kraken. A compila??o dos shaders na GPU e o acabamento visual ainda precisam de confer?ncia no navegador.

## Garagem tecnológica — FW Custom Lab

Dirija para dentro da garagem para abrir a personalização automaticamente. A placa na fachada diz **Entre para personalizar veículo**, sem botão no centro da tela. A porta abre por aproximação; a tecla **E** continua disponível perto da entrada. O carro se alinha na plataforma e a câmera aproxima para personalização. Na saída, a plataforma alinha o carro antes de ele avançar, com as rodas girando de acordo com a distância percorrida.

São seis pinturas e três acabamentos de rodas, com braço articulado, spray, iluminação e plataforma giratória. Arraste a visualização ou use o controle de ângulo para inspecionar o carro. **Aplicar e sair** salva no navegador; **Cancelar** ou Escape restaura o visual anterior. Restaurar original também é uma prévia até a confirmação. A pintura acompanha o barco. Se o navegador bloquear armazenamento, o visual continua disponível na sessão.

A interface tem disposição para celular, controles por teclado e suporte a movimento reduzido. A animação de pintura pode ser pulada. Testes cobrem entrada, saída, cancelamento, persistência, dados inválidos, armazenamento indisponível e materiais do carro/barco; regressões de barco, kraken e câmera também passaram. Revisão visual no navegador pendente.

Para atualizar o Cloudflare, use o arquivo `felipe-world-pages.zip` desta pasta em um novo deployment do projeto existente.

## Encontro com o kraken

Ao navegar além de 108 m do centro da ilha (cerca de 26 m da costa), um kraken emerge do mar. Um tentáculo envolve o barco, levanta-o e arremessa-o de volta. O voo dura três segundos e segue uma trajetória em arco, chegando a mais de 24 m de altura. No pouso, o veículo volta ao modo carro com fumaça e um pequeno salto de impacto.

O destino é selecionado em terra, longe de colisores e árvores. Os controles de direção ficam suspensos durante a sequência; menus pausam a ação, e recuperar ou visitar um projeto cancela o encontro. A câmera abre o enquadramento. Movimento reduzido desliga a rotação do veículo e usa um arco menor. O kraken retorna ao fundo e há um intervalo antes de outro encontro.

Verificação: 13 testes passaram, cobrindo trajetória contínua em 30/60/144 FPS, pouso, devolução de controles, pausa, cancelamento, movimento reduzido, barco e câmera. A aparência da sequência ainda precisa de conferência visual no navegador.

Atualização do kraken: removida a espera de 18 segundos após o pouso. Cada nova ida ao mar distante dispara outro encontro. Agora há preparação do arremesso: o tentáculo puxa o barco para trás e acelera para soltá-lo. O voo dura 1,65 s, com altura máxima acima de 36 m. O modelo usa oito tentáculos contínuos, ventosas em duas fileiras, manto alongado com variação de cor e olhos detalhados. Geometria dinâmica dos braços em uma malha; ventosas instanciadas.

Verificação desta atualização: oito testes passaram, incluindo três encontros consecutivos sem espera, trajetória em três taxas de quadros, pausa, cancelamento e transformação carro/barco. Aparência ainda não revisada no navegador.

O destino do arremesso agora é sorteado pela ilha, com exclusão de água, ponte, obstáculos e árvores. Pousos consecutivos procuram pontos separados por pelo menos 18 m. O tentáculo prepara o lançamento na direção do destino escolhido, e a duração do voo acompanha a distância.

O corpo do kraken balança e respira; os oito tentáculos têm ondas independentes de movimento em altura, alcance e curvatura. O braço que segura o barco também ondula, mantendo a ponta presa ao veículo. Movimento reduzido mantém a pose estável. Dez testes passaram, incluindo destinos em todos os quadrantes, distância entre pousos, movimento dos oito braços, repetição do encontro e trajetória. Revisão visual pendente.
