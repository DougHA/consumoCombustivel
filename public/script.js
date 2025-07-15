document.addEventListener('DOMContentLoaded', () => { // Garante que o DOM esteja completamente carregado antes de executar o script.
    // Seleciona os elementos do DOM.
    const formAbastecimento = document.getElementById('form-abastecimento');
    const corpoTabela = document.getElementById('corpo-tabela');
    const litrosInput = document.getElementById('litros');
    const valorAbastecidoInput = document.getElementById('valor_abastecido');
    const valorLitroInput = document.getElementById('valor_litro');
    const apiUrl = 'http://localhost:3000/api/abastecimentos';

    // Elementos da tela de setup e containers
    const appContainer = document.getElementById('app-container');
    const setupContainer = document.getElementById('setup-container');
    const formSetup = document.getElementById('form-setup');
    const vehicleInfoDisplay = document.getElementById('vehicle-info-display');

    // Função para exibir os dados do veículo no cabeçalho
    function displayVehicleInfo(config) {
        if (config && config.modelo && config.ano) {
            vehicleInfoDisplay.textContent = `Veículo: ${config.modelo} ${config.ano}`;
        }
    }

    // Lógica de inicialização do app
    const vehicleConfig = JSON.parse(localStorage.getItem('vehicleConfig'));

    if (!vehicleConfig) {
        // Se não houver configuração, mostra a tela de setup (o "popup")
        setupContainer.style.display = 'block';
    } else {
        // Se já houver, mostra o app principal
        appContainer.style.display = 'block';
        displayVehicleInfo(vehicleConfig);
        carregarHistorico();
    }

    // Listener para o formulário de setup inicial
    formSetup.addEventListener('submit', (event) => {
        event.preventDefault();
        const config = {
            modelo: document.getElementById('modelo_veiculo').value,
            ano: document.getElementById('ano_veiculo').value,
            odometroInicial: parseFloat(document.getElementById('odometro_inicial').value)
        };
        localStorage.setItem('vehicleConfig', JSON.stringify(config));

        // Esconde o setup e mostra o app principal
        setupContainer.style.display = 'none';
        appContainer.style.display = 'block';
        displayVehicleInfo(config);
        carregarHistorico(); // Carrega o histórico (vazio) pela primeira vez
    });

    // Função para calcular e atualizar o valor por litro automaticamente.
    function calcularValorPorLitro() {
        const litros = parseFloat(litrosInput.value);
        const valorTotal = parseFloat(valorAbastecidoInput.value);

        if (litros > 0 && valorTotal > 0) {
            const valorPorLitro = valorTotal / litros;
            valorLitroInput.value = valorPorLitro.toFixed(3);
        } else {
            valorLitroInput.value = '';
        }
    }

    // Adiciona listeners para recalcular ao digitar.
    litrosInput.addEventListener('input', calcularValorPorLitro);
    valorAbastecidoInput.addEventListener('input', calcularValorPorLitro);
    // Função para carregar e exibir o histórico.
    async function carregarHistorico() {
        const vehicleConfig = JSON.parse(localStorage.getItem('vehicleConfig'));
        // Se o app foi iniciado, a config deve existir.
        // Esta verificação é uma segurança extra.
        if (!vehicleConfig) {
            corpoTabela.innerHTML = '<tr><td colspan="6">Por favor, configure seu veículo.</td></tr>';
            return;
        }

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
                const anterior = historico[i + 1]; // O registro cronologicamente anterior

                let distancia = '-'; // Inicializa a distância como um traço, indicando que não há dados disponíveis.
                let consumo = '-'; // Inicializa o consumo como um traço, indicando que não há dados disponíveis.

                let odometroAnterior;

                if (anterior) {
                    odometroAnterior = anterior.odometro;
                } else {
                    // Se não houver registro anterior, usa o odômetro inicial da configuração
                    odometroAnterior = vehicleConfig.odometroInicial;
                }

                if (atual.odometro > odometroAnterior) {
                    distancia = (atual.odometro - odometroAnterior).toFixed(1);
                    // Calcula o consumo para o trecho percorrido
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
    formAbastecimento.addEventListener('submit', async (event) => {
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
            formAbastecimento.reset();
            carregarHistorico();

        } catch (error) { // Captura erros na requisição ou processamento dos dados.
            // Exibe uma mensagem de erro no console e um alerta para o usuário.
            console.error('Erro ao salvar:', error);
            alert(`Erro ao salvar: ${error.message}`);
        }
    });
});
