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
        const response = await fetch(`${API_BASE_URL}/fichas/relatorio?inicio=${dataInicio}&fim=${dataFim}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao gerar relatório');
        
        const relatorio = await response.json();
        
        let html = `
            <div class="relatorio-card">
                <h3>Relatório de ${dataInicio} a ${dataFim}</h3>
                <div class="stats-grid">
                    <div class="stats-card">
                        <div class="stats-value">${relatorio.totalFichas}</div>
                        <div class="stats-label">Fichas no Período</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${formatCurrency(relatorio.totalVendas)}</div>
                        <div class="stats-label">Total de Vendas</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-value">${relatorio.produtosVendidos.length}</div>
                        <div class="stats-label">Produtos Vendidos</div>
                    </div>
                </div>
        `;
        
        if (relatorio.produtosVendidos.length > 0) {
            html += `
                <h4 style="margin-top: 20px;">Produtos Mais Vendidos</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Total (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            relatorio.produtosVendidos.forEach(produto => {
                html += `
                    <tr>
                        <td>${produto.nome}</td>
                        <td>${produto.quantidade}</td>
                        <td>${formatCurrency(produto.total)}</td>
                    </tr>
                `;
            });
            
            html += `</tbody></table>`;
        } else {
            html += '<p>Nenhuma venda no período selecionado.</p>';
        }
        
        html += `</div>`;
        reportResults.innerHTML = html;
    } catch (error) {
        showMessage('Erro ao gerar relatório: ' + error.message);
    } finally {
        setLoading(generateReportBtn, false);
    }
});

// Atualizar dashboard
async function updateDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar dashboard');
        
        const dashboard = await response.json();
        
        document.getElementById('total-produtos').textContent = dashboard.totalProdutos;
        document.getElementById('vendas-hoje').textContent = formatCurrency(dashboard.vendasHoje);
        document.getElementById('produtos-baixo-estoque').textContent = dashboard.produtosBaixoEstoque;
        document.getElementById('fichas-hoje').textContent = dashboard.fichasHoje;
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
    }
}