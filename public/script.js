document.addEventListener('DOMContentLoaded', () => { // Garante que o DOM esteja completamente carregado antes de executar o script.
    // Seleciona os elementos do DOM.
    const form = document.getElementById('form-abastecimento');
    const corpoTabela = document.getElementById('corpo-tabela');
    const apiUrl = 'http://localhost:3000/api/abastecimentos';

    // Função para carregar e exibir o histórico.
    async function carregarHistorico() {
        try { // Faz uma requisição GET para buscar o histórico de abastecimentos.
            const response = await fetch(apiUrl); // A URL da API deve ser a mesma que o servidor está ouvindo.
            // Verifica se a resposta foi bem-sucedida.
            if (!response.ok) {
                throw new Error('Falha ao buscar dados do servidor.'); // Lança um erro se a resposta não for OK.
            }
            const result = await response.json(); // Converte a resposta em JSON.
            const historico = result.data; // Acessa os dados do histórico de abastecimentos.

            // Limpa a tabela antes de preencher.
            corpoTabela.innerHTML = '';

            if (historico.length === 0) {
                corpoTabela.innerHTML = '<tr><td colspan="6">Nenhum registro encontrado.</td></tr>'; // Exibe uma mensagem se não houver registros.
                return;
            }

            // Itera sobre o histórico para calcular e exibir os dados.
            for (let i = 0; i < historico.length; i++) {
                const atual = historico[i];
                const anterior = historico[i + 1]; // O próximo na lista, pois está ordenado DESC.

                let distancia = '-'; // Inicializa a distância como um traço, indicando que não há dados disponíveis.
                // Calcula a distância percorrida desde o último abastecimento.
                let consumo = '-'; // Inicializa o consumo como um traço, indicando que não há dados disponíveis.

                if (anterior) {
                    distancia = (atual.odometro - anterior.odometro).toFixed(1);
                    // O consumo é calculado com base nos litros do abastecimento ATUAL.
                    // para percorrer a distância até o PRÓXIMO abastecimento.
                    consumo = (distancia / atual.litros).toFixed(2);
                }
                // Cria uma nova linha na tabela com os dados do abastecimento atual.
                const row = ` 
                    <tr>
                        <td>${new Date(atual.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                        <td>${atual.tipo_combustivel || '-'}</td>
                        <td>${atual.odometro.toFixed(1)}</td>
                        <td>${atual.litros.toFixed(2)}</td>
                        <td>${distancia}</td>
                        <td>${consumo}</td>
                    </tr>
                `;
                corpoTabela.innerHTML += row;
            }

        } catch (error) { // Captura erros na requisição ou processamento dos dados.
            // Exibe uma mensagem de erro no console e na tabela.
            console.error('Erro ao carregar histórico:', error);
            corpoTabela.innerHTML = `<tr><td colspan="6">Erro ao carregar dados. Verifique o console.</td></tr>`;
        }
    }

    // Função para adicionar um novo abastecimento.
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o recarregamento da página.

        const novoAbastecimento = { // Cria um objeto com os dados do formulário.
            // Obtém os valores dos campos do formulário.
            data: document.getElementById('data').value,
            odometro: parseFloat(document.getElementById('odometro').value),
            litros: parseFloat(document.getElementById('litros').value),
            valor_litro: parseFloat(document.getElementById('valor_litro').value) || null,
            tipo_combustivel: document.getElementById('tipo_combustivel').value || null
        };

        try { // Faz uma requisição POST para salvar o novo abastecimento.
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(novoAbastecimento),
            });

            if (!response.ok) { // Verifica se a resposta foi bem-sucedida.
                // Se não for, tenta extrair a mensagem de erro do corpo da resposta.
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao salvar o abastecimento.');
            }

            // Limpa o formulário e recarrega o histórico.
            form.reset();
            carregarHistorico();

        } catch (error) { // Captura erros na requisição ou processamento dos dados.
            // Exibe uma mensagem de erro no console e um alerta para o usuário.
            console.error('Erro ao salvar:', error);
            alert(`Erro ao salvar: ${error.message}`);
        }
    });

    // Carrega o histórico inicial ao carregar a página.
    carregarHistorico();
});
