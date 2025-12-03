const generateReportBtn = document.getElementById('generate-report-btn');
const reportResults = document.getElementById('report-results');

// Gerar relatório
generateReportBtn.addEventListener('click', async () => {
    const dataInicio = document.getElementById('data-inicio').value;
    const dataFim = document.getElementById('data-fim').value;
    
    if (!dataInicio || !dataFim) {
        showMessage('Por favor, selecione as datas de início e fim.');
        return;
    }
    
    setLoading(generateReportBtn, true);
    
    try {
        // 1. PEGAR O TOKEN CORRETAMENTE
        const token = localStorage.getItem('token');
        
        if (!token) {
            showMessage('Sessão expirada. Faça login novamente.', 'error');
            // Redireciona para recarregar a página
            setTimeout(() => location.reload(), 2000);
            return;
        }
        
        console.log('📡 Enviando requisição de relatório...');
        console.log('Token:', token.substring(0, 20) + '...');
        
        // 2. FAZER A REQUISIÇÃO CORRETAMENTE
        const url = `${API_BASE_URL}/fichas/relatorio?inicio=${dataInicio}&fim=${dataFim}`;
        console.log('URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        console.log('📊 Status da resposta:', response.status);
        
        // 3. TRATAR A RESPOSTA
        if (response.ok) {
            const relatorio = await response.json();
            console.log('✅ Relatório recebido com', relatorio.itensDetalhados?.length || 0, 'itens');
            exibirRelatorioCompleto(relatorio, dataInicio, dataFim);
            showMessage('Relatório gerado com sucesso!', 'success');
        } 
        else if (response.status === 401) {
            showMessage('Sessão expirada. Faça login novamente.', 'error');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => location.reload(), 2000);
        }
        else if (response.status === 404) {
            showMessage('Erro: Rota de relatório não encontrada no servidor.', 'error');
            reportResults.innerHTML = `
                <div style="padding: 20px; background: #fff3cd; border-radius: 5px;">
                    <h3>⚠️ Problema de Configuração</h3>
                    <p>A rota de relatórios não está disponível no servidor.</p>
                    <p>Verifique se o backend está rodando corretamente.</p>
                </div>
            `;
        }
        else {
            const errorText = await response.text();
            console.error('❌ Erro da API:', errorText);
            showMessage(`Erro ${response.status}: ${response.statusText}`, 'error');
            reportResults.innerHTML = `<p style="color: red;">Erro ${response.status}: ${response.statusText}</p>`;
        }
        
    } catch (error) {
        console.error('❌ Erro completo:', error);
        showMessage('Erro ao gerar relatório: ' + error.message, 'error');
        reportResults.innerHTML = `
            <div style="padding: 20px; background: #f8d7da; border-radius: 5px;">
                <h3>❌ Erro de Conexão</h3>
                <p>${error.message}</p>
                <p><strong>Soluções:</strong></p>
                <ul>
                    <li>Verifique se o backend está rodando (npm run dev)</li>
                    <li>Verifique se a URL está correta: ${API_BASE_URL}</li>
                    <li>Recarregue a página e faça login novamente</li>
                </ul>
            </div>
        `;
    } finally {
        setLoading(generateReportBtn, false);
    }
});

// Função para exibir relatório completo
function exibirRelatorioCompleto(relatorio, dataInicio, dataFim) {
    // Formatar datas
    const inicioFormatado = formatarDataBR(dataInicio);
    const fimFormatado = formatarDataBR(dataFim);
    
    let html = `
        <div class="relatorio-completo">
            <div class="relatorio-header">
                <h2>📊 Relatório de Vendas</h2>
                <p class="periodo">Período: ${inicioFormatado} a ${fimFormatado}</p>
                <p class="data-geracao">Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
            
            <div class="resumo-geral">
                <div class="resumo-card">
                    <div class="resumo-valor">${relatorio.totalFichas}</div>
                    <div class="resumo-label">Fichas Vendidas</div>
                </div>
                <div class="resumo-card">
                    <div class="resumo-valor">${relatorio.totalItens}</div>
                    <div class="resumo-label">Itens Vendidos</div>
                </div>
                <div class="resumo-card">
                    <div class="resumo-valor">${formatCurrency(relatorio.totalVendas)}</div>
                    <div class="resumo-label">Total em Vendas</div>
                </div>
            </div>
    `;
    
    // Seção de itens detalhados
    html += `
            <div class="relatorio-section">
                <h3>📋 Itens Vendidos (${relatorio.itensDetalhados?.length || 0})</h3>
    `;
    
    if (relatorio.itensDetalhados && relatorio.itensDetalhados.length > 0) {
        html += `
            <div class="table-container">
                <table class="tabela-relatorio">
                    <thead>
                        <tr>
                            <th>Ficha</th>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Preço Unit.</th>
                            <th>Total</th>
                            <th>Data/Hora</th>
                            <th>Atendente</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Adicionar cada item na tabela
        relatorio.itensDetalhados.forEach(item => {
            html += `
                <tr>
                    <td>${item.ficha_numero}</td>
                    <td>${item.produto_nome}</td>
                    <td class="centrado">${item.quantidade}</td>
                    <td class="direita">${formatCurrency(item.preco_unitario)}</td>
                    <td class="direita">${formatCurrency(item.total_item)}</td>
                    <td>${item.data_hora}</td>
                    <td>${item.atendente}</td>
                </tr>
            `;
        });
        
        // Linha de totais
        html += `
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="2"><strong>TOTAL GERAL</strong></td>
                            <td class="centrado"><strong>${relatorio.totalItens}</strong></td>
                            <td></td>
                            <td class="direita"><strong>${formatCurrency(relatorio.totalVendas)}</strong></td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    } else {
        html += `
            <div class="sem-dados">
                <p>📭 Nenhuma venda encontrada neste período.</p>
                <p><small>As vendas só aparecem aqui após as fichas serem confirmadas.</small></p>
            </div>
        `;
    }
    
    // Seção de resumo por produto
    if (relatorio.produtosResumo && relatorio.produtosResumo.length > 0) {
        html += `
            <div class="relatorio-section">
                <h3>🏆 Produtos Mais Vendidos</h3>
                <div class="table-container">
                    <table class="tabela-resumo">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Total Vendido</th>
                                <th>Preço Médio</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        relatorio.produtosResumo.forEach(produto => {
            html += `
                <tr>
                    <td>${produto.produto_nome}</td>
                    <td class="centrado">${produto.quantidade_total}</td>
                    <td class="direita">${formatCurrency(produto.total_vendido)}</td>
                    <td class="direita">${formatCurrency(produto.preco_medio)}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Botões de ação
    html += `
            <div class="relatorio-actions">
                <button onclick="imprimirRelatorio()" class="btn btn-primary">
                    🖨️ Imprimir Relatório
                </button>
                <button onclick="exportarParaExcel()" class="btn btn-success">
                    📥 Exportar para Excel
                </button>
                <button onclick="copiarResumo()" class="btn btn-secondary">
                    📋 Copiar Resumo
                </button>
            </div>
        </div>
    `;
    
    reportResults.innerHTML = html;
}

// Funções auxiliares
function formatarDataBR(dataISO) {
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
}

// Função para imprimir
function imprimirRelatorio() {
    const conteudo = document.querySelector('.relatorio-completo').innerHTML;
    const janela = window.open('', '_blank', 'width=800,height=600');
    
    janela.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório de Vendas - Lanchonete</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    line-height: 1.4;
                }
                .relatorio-completo { max-width: 100%; }
                .relatorio-header { 
                    text-align: center; 
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                .relatorio-header h2 { 
                    color: #2c3e50; 
                    margin: 0 0 10px 0;
                }
                .periodo { 
                    font-size: 16px; 
                    color: #555;
                    margin: 5px 0;
                }
                .data-geracao { 
                    font-size: 14px; 
                    color: #777;
                    margin: 5px 0;
                }
                .resumo-geral { 
                    display: flex; 
                    justify-content: space-around; 
                    margin: 30px 0;
                    flex-wrap: wrap;
                }
                .resumo-card { 
                    text-align: center; 
                    padding: 15px;
                    min-width: 150px;
                }
                .resumo-valor { 
                    font-size: 28px; 
                    font-weight: bold; 
                    color: #2c3e50;
                }
                .resumo-label { 
                    color: #666; 
                    font-size: 14px;
                    margin-top: 5px;
                }
                .relatorio-section {
                    margin: 25px 0;
                    page-break-inside: avoid;
                }
                .relatorio-section h3 {
                    color: #34495e;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                }
                .table-container { 
                    overflow-x: auto; 
                    margin: 15px 0; 
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse;
                    font-size: 12px;
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left; 
                }
                th { 
                    background-color: #2c3e50; 
                    color: white; 
                    font-weight: bold;
                }
                tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .total-row { 
                    background-color: #e8f5e8 !important; 
                    font-weight: bold;
                }
                .centrado { text-align: center; }
                .direita { text-align: right; }
                .sem-dados {
                    text-align: center;
                    padding: 30px;
                    color: #777;
                    font-style: italic;
                    border: 1px dashed #ddd;
                    background: #fafafa;
                }
                @media print {
                    .relatorio-actions { display: none !important; }
                    button { display: none !important; }
                    body { margin: 0; }
                    table { font-size: 10px; }
                }
                @media screen and (max-width: 768px) {
                    .resumo-geral { flex-direction: column; align-items: center; }
                    .resumo-card { margin-bottom: 15px; }
                }
            </style>
        </head>
        <body>
            ${conteudo}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    janela.document.close();
}

// Função para exportar (simplificada)
function exportarParaExcel() {
    const relatorio = document.querySelector('.relatorio-completo');
    const html = relatorio.innerHTML;
    
    // Criar um blob com os dados
    const blob = new Blob([`
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Vendas</title>
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 5px; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `], { type: 'application/vnd.ms-excel' });
    
    // Criar link para download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Relatório exportado para Excel!', 'success');
}

// Função para copiar resumo
function copiarResumo() {
    const periodo = document.querySelector('.periodo')?.textContent || 'Período não definido';
    const valores = document.querySelectorAll('.resumo-valor');
    
    const resumo = `RELATÓRIO DE VENDAS - LANCHONETE
${periodo}
────────────────────
Fichas Vendidas: ${valores[0]?.textContent || '0'}
Itens Vendidos: ${valores[1]?.textContent || '0'}
Total em Vendas: ${valores[2]?.textContent || 'R$ 0,00'}
────────────────────
Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`;
    
    navigator.clipboard.writeText(resumo)
        .then(() => showMessage('✅ Resumo copiado para a área de transferência!', 'success'))
        .catch(err => {
            console.error('Erro ao copiar:', err);
            showMessage('❌ Erro ao copiar. Tente manualmente.', 'error');
        });
}

// Função de teste rápido (para debug)
window.testeRelatorioRapido = async function() {
    console.log('🔧 Teste rápido do relatório...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ Sem token');
        alert('Faça login primeiro!');
        return;
    }
    
    try {
        const hoje = new Date().toISOString().split('T')[0];
        const response = await fetch(
            `${API_BASE_URL}/fichas/relatorio?inicio=${hoje}&fim=${hoje}`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ OK! Dados:', data);
            alert(`✅ Relatório funciona!\nFichas: ${data.totalFichas}\nItens: ${data.itensDetalhados?.length || 0}`);
            return data;
        } else {
            const error = await response.text();
            console.error('❌ Erro:', error);
            alert(`❌ Erro ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        alert('❌ Erro: ' + error.message);
    }
};