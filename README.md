# Felipe World — portfólio 3D

Código completo da versão criada nesta conversa, com modelos procedurais em Three.js, seis projetos e versão clássica.

## Rodar no Windows
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
