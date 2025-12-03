const addItemBtn = document.getElementById('add-item-btn');
const fichaItems = document.getElementById('ficha-items');
const fichaTotal = document.getElementById('ficha-total');
const saveFichaBtn = document.getElementById('save-ficha-btn');
const searchFichaBtn = document.getElementById('search-ficha-btn');
const fichaDetails = document.getElementById('ficha-details');

let currentFichaItems = [];

// Adicionar item à ficha
addItemBtn.addEventListener('click', async () => {
    const productId = parseInt(document.getElementById('produto-select').value);
    const quantidade = parseInt(document.getElementById('quantidade').value);
    
    if (!productId || quantidade < 1) {
        showMessage('Selecione um produto e uma quantidade válida.');
        return;
    }
    
    try {
        // Buscar detalhes do produto
        const response = await fetch(`${API_BASE_URL}/produtos/${productId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar produto');
        
        const product = await response.json();
        
        // Verificar estoque
        if (product.estoque < quantidade) {
            showMessage(`Estoque insuficiente. Disponível: ${product.estoque}`);
            return;
        }
        
        // Verificar se o produto já está na ficha
        const existingItem = currentFichaItems.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantidade += quantidade;
        } else {
            currentFichaItems.push({
                productId,
                nome: product.nome,
                preco: product.preco,
                quantidade
            });
        }
        
        updateFichaDisplay();
        
        // Limpar seleção
        document.getElementById('produto-select').value = '';
        document.getElementById('quantidade').value = 1;
        
    } catch (error) {
        showMessage('Erro ao adicionar item: ' + error.message);
    }
});

// Atualizar display da ficha
function updateFichaDisplay() {
    fichaItems.innerHTML = '';
    let total = 0;
    
    currentFichaItems.forEach((item, index) => {
        const itemTotal = item.preco * item.quantidade;
        total += itemTotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'ficha-item';
        itemDiv.innerHTML = `
            <div>
                <strong>${item.nome}</strong> - ${formatCurrency(item.preco)} x ${item.quantidade}
            </div>
            <div>
                ${formatCurrency(itemTotal)}
                <button class="action-btn delete-btn" data-index="${index}" style="margin-left: 10px;">Remover</button>
            </div>
        `;
        fichaItems.appendChild(itemDiv);
    });
    
    fichaTotal.textContent = `Total: ${formatCurrency(total)}`;
    
    // Adicionar event listeners para remover itens
    fichaItems.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            currentFichaItems.splice(index, 1);
            updateFichaDisplay();
        });
    });
}

// Salvar ficha
saveFichaBtn.addEventListener('click', async () => {
    const fichaNumero = document.getElementById('ficha-numero').value;
    
    if (!fichaNumero) {
        showMessage('Por favor, informe o número da ficha.');
        return;
    }
    
    if (currentFichaItems.length === 0) {
        showMessage('Adicione pelo menos um item à ficha.');
        return;
    }
    
    setLoading(saveFichaBtn, true);
    
    try {
        const fichaData = {
            numero: fichaNumero,
            itens: currentFichaItems.map(item => ({
                produto_id: item.productId,
                quantidade: item.quantidade,
                preco_unitario: item.preco
            }))
        };
        
        const response = await fetch(`${API_BASE_URL}/fichas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(fichaData)
        });
        
        if (response.ok) {
            // Limpar ficha atual
            currentFichaItems = [];
            document.getElementById('ficha-numero').value = '';
            updateFichaDisplay();
            
            showMessage('Ficha salva com sucesso!', 'success');
            updateDashboard();
        } else {
            const error = await response.json();
            throw new Error(error.error);
        }
    } catch (error) {
        showMessage('Erro ao salvar ficha: ' + error.message);
    } finally {
        setLoading(saveFichaBtn, false);
    }
});

// Consultar ficha
// Consultar ficha
searchFichaBtn.addEventListener('click', async () => {
    const fichaNumero = document.getElementById('search-ficha').value;
    
    if (!fichaNumero) {
        showMessage('Por favor, informe o número da ficha.');
        return;
    }
    
    setLoading(searchFichaBtn, true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/fichas/${fichaNumero}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                // Mensagem mais específica
                const errorData = await response.json();
                fichaDetails.innerHTML = `
                    <div class="ficha-details-card">
                        <h3>Ficha ${fichaNumero}</h3>
                        <p style="color: #666; font-style: italic;">
                            ${errorData.error || 'Ficha não encontrada ou já foi finalizada.'}
                        </p>
                        <p style="margin-top: 10px;">
                            <strong>Possíveis motivos:</strong>
                            <ul style="margin-left: 20px;">
                                <li>Número incorreto</li>
                                <li>Ficha já foi confirmada e paga</li>
                                <li>Ficha foi cancelada</li>
                            </ul>
                        </p>
                    </div>
                `;
                return;
            }
            throw new Error('Erro ao buscar ficha');
        }
        
        const ficha = await response.json();
        await mostrarDetalhesFicha(ficha);
        
    } catch (error) {
        showMessage('Erro ao consultar ficha: ' + error.message);
    } finally {
        setLoading(searchFichaBtn, false);
    }
});
async function buscarFichaAdmin(numero) {
    try {
        const response = await fetch(`${API_BASE_URL}/fichas/${numero}?admin=true`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ficha não encontrada');
        }
        
        const ficha = await response.json();
        return ficha;
    } catch (error) {
        throw error;
    }
}
// Botão de busca admin
document.getElementById('search-ficha-admin')?.addEventListener('click', async () => {
    const fichaNumero = document.getElementById('search-ficha').value;
    
    if (!fichaNumero) {
        showMessage('Por favor, informe o número da ficha.');
        return;
    }
    
    if (!confirm('Modo Administrador: Buscar fichas mesmo as já confirmadas?')) {
        return;
    }
    
    setLoading(searchFichaBtn, true);
    
    try {
        const ficha = await buscarFichaAdmin(fichaNumero);
        await mostrarDetalhesFicha(ficha);
        showMessage('Ficha encontrada (modo administrador)', 'success');
    } catch (error) {
        fichaDetails.innerHTML = `
            <div class="ficha-details-card">
                <h3>Ficha ${fichaNumero}</h3>
                <p style="color: #dc3545;">Ficha não encontrada em nenhum status.</p>
            </div>
        `;
    } finally {
        setLoading(searchFichaBtn, false);
    }
});

// NOVA FUNÇÃO: Mostrar detalhes da ficha com botão de confirmação
async function mostrarDetalhesFicha(ficha) {
    const data = new Date(ficha.data);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const horaFormatada = data.toLocaleTimeString('pt-BR').substring(0,5);
    
    let html = `
        <div class="ficha-details-card">
            <div class="ficha-header">
                <h3>Ficha ${ficha.numero}</h3>
                <span class="ficha-status ${ficha.status}">${ficha.status.toUpperCase()}</span>
            </div>
            <p><strong>Data:</strong> ${dataFormatada} às ${horaFormatada}</p>
            <p><strong>Atendente:</strong> ${ficha.usuario_nome}</p>
    `;
    
    if (ficha.status === 'confirmada' && ficha.usuario_confirmacao_nome) {
        html += `<p><strong>Confirmada por:</strong> ${ficha.usuario_confirmacao_nome}</p>`;
    }
    
    html += `<h4 style="margin-top: 15px;">Itens:</h4>`;
    
    ficha.itens.forEach(item => {
        const itemTotal = item.preco_unitario * item.quantidade;
        html += `
            <div class="ficha-item">
                <div>${item.quantidade}x ${item.produto_nome}</div>
                <div>${formatCurrency(itemTotal)}</div>
            </div>
        `;
    });
    
    html += `<div class="ficha-total">Total: ${formatCurrency(ficha.total)}</div>`;
    
    // BOTÃO DE CONFIRMAR (só se estiver pendente)
    if (ficha.status === 'pendente') {
        html += `
            <div class="ficha-actions" style="margin-top: 20px;">
                <button id="confirm-ficha-btn" class="btn btn-success" 
                        data-id="${ficha.id}">
                    ✅ Confirmar Pagamento e Fechar Ficha
                </button>
                <p class="help-text" style="font-size: 0.9em; color: #666; margin-top: 5px;">
                    Após confirmar, a ficha será incluída no relatório diário.
                </p>
            </div>
        `;
    }
    
    html += `</div>`;
    fichaDetails.innerHTML = html;
    
    // Adicionar event listener ao botão se existir
    const confirmBtn = document.getElementById('confirm-ficha-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            await confirmarFicha(ficha.id);
        });
    }
}

// NOVA FUNÇÃO: Confirmar uma ficha
async function confirmarFicha(fichaId) {
    if (!confirm('Confirmar pagamento desta ficha? Após confirmar, ela será incluída no relatório diário.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/fichas/${fichaId}/confirmar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showMessage('✅ Ficha confirmada com sucesso!', 'success');
            
            // Atualizar a visualização atual
            const fichaNumero = document.getElementById('search-ficha').value;
            if (fichaNumero) {
                const updatedResponse = await fetch(`${API_BASE_URL}/fichas/${fichaNumero}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                const fichaAtualizada = await updatedResponse.json();
                await mostrarDetalhesFicha(fichaAtualizada);
            }
            
            // Atualizar dashboard
            updateDashboard();
        } else {
            const error = await response.json();
            throw new Error(error.error);
        }
    } catch (error) {
        showMessage('Erro ao confirmar ficha: ' + error.message);
    }
}

// NOVA FUNÇÃO: Carregar fichas pendentes
async function loadPendingFichas() {
    try {
        const response = await fetch(`${API_BASE_URL}/fichas/pendentes`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar fichas pendentes');
        
        const fichas = await response.json();
        const container = document.getElementById('pending-fichas-list');
        
        if (fichas.length === 0) {
            container.innerHTML = '<p>Nenhuma ficha pendente.</p>';
            return;
        }
        
        let html = '';
        fichas.forEach(ficha => {
            const data = new Date(ficha.data);
            html += `
                <div class="ficha-card" data-id="${ficha.id}">
                    <div class="ficha-header">
                        <h3>Ficha ${ficha.numero}</h3>
                        <span class="ficha-status pendente">PENDENTE</span>
                    </div>
                    <p><strong>Data:</strong> ${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR').substring(0,5)}</p>
                    <p><strong>Total:</strong> ${formatCurrency(ficha.total)}</p>
                    <p><strong>Criada por:</strong> ${ficha.usuario_nome}</p>
                    
                    <div class="ficha-actions">
                        <button class="btn btn-primary btn-view-items" data-numero="${ficha.numero}">
                            Ver Itens
                        </button>
                        <button class="btn btn-success btn-confirm-ficha" data-id="${ficha.id}">
                            ✅ Confirmar Pagamento
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Adicionar event listeners
        document.querySelectorAll('.btn-confirm-ficha').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const fichaId = e.target.getAttribute('data-id');
                await confirmarFicha(fichaId);
                loadPendingFichas(); // Recarregar a lista
            });
        });
        
        document.querySelectorAll('.btn-view-items').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const numero = e.target.getAttribute('data-numero');
                document.getElementById('search-ficha').value = numero;
                document.querySelector('[data-target="consultar-ficha"]').click();
                const response = await fetch(`${API_BASE_URL}/fichas/${numero}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                if (response.ok) {
                    const ficha = await response.json();
                    await mostrarDetalhesFicha(ficha);
                }
            });
        });
        
    } catch (error) {
        showMessage('Erro: ' + error.message);
    }
}