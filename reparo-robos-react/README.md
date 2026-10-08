# RoboFix — Jogo de Reparo de Robôs

Projeto feito com React, TypeScript e Vite. O objetivo é consertar robôs numa oficina futurista digitando o código de substituição de cada componente antes que a oficina fique lotada.

## Requisitos
- Node.js 20 ou superior (recomendado)
- npm

## Como executar
1. Extraia o arquivo ZIP.
2. Abra a pasta `reparo-robos-react` no VS Code.
3. Abra o terminal nessa pasta e execute:

```bash
npm install
npm run dev
```

4. Abra no navegador o endereço mostrado pelo Vite (normalmente `http://localhost:5173`).

## Como jogar
1. Digite o nome do técnico e clique em **Iniciar**.
2. Selecione um robô na fila.
3. Confira o código da peça mostrado no bloco **Modo de treinamento**.
4. Digite o código no campo de substituição e clique em **Substituir**.
5. Cada robô pode ter vários componentes; continue até terminar todos os componentes dele.
6. Robôs novos chegam automaticamente a cada 18 segundos. Também é possível registrar uma chegada manual.
7. A oficina comporta até 5 robôs. Se atingir o limite, a partida termina.
8. Encerre a partida para registrar o resultado no ranking.

## Estruturas de dados
A lista principal de robôs é mantida em um array de objetos para simplificar a interface React. Para cumprir estritamente a exigência acadêmica de implementar listas encadeadas manualmente, substitua essa coleção por uma classe de lista encadeada própria (com nós, inclusão, remoção e busca) e use-a como estrutura principal de armazenamento. Não utilize bibliotecas prontas de listas encadeadas.

## Persistência
O ranking é salvo em `localStorage` no navegador. Os dados ficam no dispositivo/navegador atual.

## Observação importante para a apresentação
O código de substituição aparece na tela no modo de treinamento para facilitar a demonstração. Para deixar o desafio mais difícil, remova a exibição do código no bloco `training-code`.
