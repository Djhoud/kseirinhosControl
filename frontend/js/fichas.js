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
    console.log('Botão salvar clicado!'); // DEBUG
    
    const fichaNumero = document.getElementById('ficha-numero').value;
    console.log('Número da ficha:', fichaNumero); // DEBUG
    console.log('Itens atuais:', currentFichaItems); // DEBUG
    
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
        
        console.log('Enviando dados:', fichaData); // DEBUG
        
        const response = await fetch(`${API_BASE_URL}/fichas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(fichaData)
        });
        
        console.log('Status da resposta:', response.status); // DEBUG
        
        if (response.ok) {
            const data = await response.json();
            console.log('Resposta da API:', data); // DEBUG
            
            // Limpar ficha atual
            currentFichaItems = [];
            document.getElementById('ficha-numero').value = '';
            updateFichaDisplay();
            
            showMessage('✅ Ficha salva com sucesso!', 'success');
            updateDashboard();
            
            // Recarregar produtos para atualizar estoque
            loadProductsTable();
            loadProductSelect();
            
        } else {
            const error = await response.json();
            console.error('Erro da API:', error); // DEBUG
            
            let mensagemErro = error.error || 'Erro ao salvar ficha';
            
            // Mensagens mais amigáveis
            if (mensagemErro.includes('pendente')) {
                mensagemErro = '⚠️ Este número já está em uso por uma ficha pendente. Use outro número ou finalize a ficha anterior.';
            } else if (mensagemErro.includes('estoque')) {
                mensagemErro = '⚠️ ' + mensagemErro;
            }
            
            throw new Error(mensagemErro);
        }
    } catch (error) {
        console.error('Erro completo:', error); // DEBUG
        showMessage('❌ ' + error.message);
    } finally {
        setLoading(saveFichaBtn, false);
    }
});

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
                                <li>Ficha já foi confirmada e finalizada</li>
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

// Mostrar detalhes da ficha com botão de confirmação
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
                    ✅ Confirmar Pagamento e Finalizar Ficha
                </button>
                <p class="help-text" style="font-size: 0.9em; color: #666; margin-top: 5px;">
                    Após confirmar, os itens serão descontados do estoque e a ficha será removida do sistema.
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

// Confirmar e finalizar uma ficha
async function confirmarFicha(fichaId) {
    if (!confirm('CONFIRMAR pagamento e FINALIZAR esta ficha?\n\nApós confirmar:\n• Itens serão descontados do estoque\n• Ficha será removida do sistema\n• Registrada no relatório diário')) {
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
            const resultado = await response.json();
            
            showMessage(`✅ Ficha ${resultado.numero} finalizada! ${resultado.itens} itens processados.`, 'success');
            
            // Limpar a busca atual se for a mesma ficha
            const fichaAtual = document.getElementById('search-ficha').value;
            if (fichaAtual === resultado.numero) {
                fichaDetails.innerHTML = `
                    <div class="ficha-details-card">
                        <h3>Ficha ${resultado.numero} - FINALIZADA</h3>
                        <p>Total: ${formatCurrency(resultado.total)}</p>
                        <p style="color: green; font-weight: bold;">✅ Ficha processada com sucesso!</p>
                        <p><small>Os itens foram descontados do estoque e registrados no relatório diário.</small></p>
                        <p><small>O número ${resultado.numero} já está disponível para reuso.</small></p>
                    </div>
                `;
            }
            
            // Atualizar tudo
            loadPendingFichas();
            updateDashboard();
            loadProductsTable(); // Para atualizar estoque na tela
            loadProductSelect(); // Para atualizar select
            
        } else {
            const error = await response.json();
            throw new Error(error.error);
        }
    } catch (error) {
        showMessage('Erro ao finalizar ficha: ' + error.message);
    }
}

// Carregar fichas pendentes
async function loadPendingFichas() {
    try {
        const response = await fetch(`${API_BASE_URL}/fichas/pendentes`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar fichas pendentes');
        
        const fichas = await response.json();
        const container = document.getElementById('pending-fichas-list');
        
        if (!container) return; // Se a aba não existir
        
        if (fichas.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma ficha pendente no momento.</p>';
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
                            👁️ Ver Itens
                        </button>
                        <button class="btn btn-success btn-confirm-ficha" data-id="${ficha.id}">
                            ✅ Confirmar e Finalizar
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
                
                // Mudar para aba de consulta
                document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
                document.querySelector('[data-target="consultar-ficha"]').classList.add('active');
                document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
                document.getElementById('consultar-ficha').classList.add('active');
                
                // Buscar a ficha
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
        console.error('Erro ao carregar fichas pendentes:', error);
        showMessage('Erro: ' + error.message);
    }
}

// Função para teste rápido (remova depois)
function debugFichas() {
    console.log('=== DEBUG FICHAS ===');
    console.log('Token:', getToken() ? 'Presente' : 'Ausente');
    console.log('API Base:', API_BASE_URL);
    console.log('Botão Salvar:', saveFichaBtn);
    console.log('Itens atuais:', currentFichaItems);
    console.log('==================');
}

// Adicionar botão de debug temporário (remova depois)
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona botão de debug se estiver em desenvolvimento
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '🐛 Debug';
        debugBtn.style.position = 'fixed';
        debugBtn.style.bottom = '10px';
        debugBtn.style.right = '10px';
        debugBtn.style.zIndex = '9999';
        debugBtn.style.padding = '5px 10px';
        debugBtn.style.background = '#ffc107';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '3px';
        debugBtn.style.cursor = 'pointer';
        debugBtn.onclick = debugFichas;
        document.body.appendChild(debugBtn);
    }
});