# Otimização — novembro de 2026

O modo Alta mantém os materiais, os detalhes do carro, o cenário, as luzes e as sombras de 2048 px. As otimizações comuns a todos os modos são:

- Agrupamento de peças rígidas por material, sem eliminar triângulos do carro. Rodas, suspensão e vidros mantêm seus movimentos e transparência. Construções continuam com peças individuais para a câmera ocultar somente o que bloqueia o carro.
- Matrizes das partes imóveis do cenário calculadas uma vez; bandeiras e espuma continuam animadas.
- Malha das estradas com células de 0,5 m, mantendo os testes de separação do relevo. O terreno continua com a resolução usada na correção dos recortes.
- Detecção de obstrução da câmera a 20 Hz, com descarte inicial dos bairros fora do raio de visão. A câmera e a direção continuam atualizadas a cada quadro; a física permanece a 120 passos por segundo.
- Fundo do minimapa desenhado uma vez; marcador e instrumentos atualizados a 10 Hz. Partículas inativas não são desenhadas nem lançam sombras.
- Nenhuma nova biblioteca ou modelo externo.

## Qualidade gráfica

| Modo | DPR máximo | Limite de pixels | Sombra do sol |
| --- | ---: | ---: | ---: |
| Automática (padrão) | 1,5 | 3 milhões | 2048 ou 1024 |
| Alta | 2 | 6 milhões | 2048 |
| Equilibrada | 1,5 | 2,5 milhões | 1024 |
| Leve | 1 | 1,2 milhão | 512 |

Automática reduz gradualmente a resolução após duas janelas de quatro segundos abaixo de 45 FPS e tenta recuperá-la após três janelas acima de 57 FPS. Ignora aquecimento inicial, menus e abas ocultas. O fator de resolução varia de 65% a 100% do limite inicial. Não remove modelos. Alta fixa a qualidade, sem adaptação. Os limites de pixels também evitam buffers excessivos em telas 4K/Retina.

A escolha fica em `localStorage` sob `felipe-world-quality`. Se o armazenamento estiver indisponível, o jogo continua funcionando. Mapas de sombra substituídos são liberados.

## Medição local

Chromium headless, WebGL via AMD Radeon Vega 8 / D3D11, janela de 1440 × 1000, DPR 1, modo Alta, carro parado. Cada posição teve dois segundos de acomodação e 3,5 segundos de amostragem. Os contadores abaixo são de `renderer.info.render`:

| Posição | Desenhos antes → depois | Triângulos antes → depois |
| --- | ---: | ---: |
| Praça | 329 → 148 (−55%) | 251.972 → 174.588 (−31%) |
| Mirante | 298 → 148 (−50%) | 211.024 → 155.868 (−26%) |
| Ponte | 464 → 289 (−38%) | 240.694 → 169.512 (−30%) |

Os tempos de quadro não foram estáveis entre execuções: a mediana na praça foi 16,7 ms antes, 16,7 ms na primeira passagem otimizada e 83 ms na repetição final. Portanto, esses testes **não demonstram um ganho de FPS consistente**, nem garantem 60 FPS em outras máquinas. A redução de chamadas e triângulos foi reproduzida; a avaliação de fluidez precisa de medições mais longas, isoladas e em dispositivos reais, especialmente celulares.

Relatórios brutos: `test-artifacts/performance-before.json`, `performance-after.json` e `performance-after-final.json`. A posição noturna desses benchmarks mede a iluminação ambiente noturna; o teste funcional separado também ativa os faróis pela interface.

## Repetir a verificação

1. Execute `npm.cmd start` (ou `npm start`).
2. Abra um Chromium de teste com `--remote-debugging-port=9224` e perfil separado. Não use seu perfil pessoal.
3. Com Node 22 ou superior, execute `node scripts/benchmark.mjs nome-do-relatorio`.
4. Execute `node scripts/check-performance-browser.mjs` para verificar modos gráficos, persistência, teclado, menus e dois toques simultâneos, além de salvar capturas `test-artifacts/optimized-*.png`.

O teste de toque usa emulação em 844 × 390 e DPR 3; não substitui um aparelho físico. Os testes automatizados de geometria, agrupamento, qualidade adaptativa, suspensão e câmera estão em `npm.cmd test`. Continuam existindo duas falhas anteriores em `stage3.test.mjs`: a expectativa de água ao lado da ponte e obstáculos nos caminhos. Elas não são regressões desta otimização.
