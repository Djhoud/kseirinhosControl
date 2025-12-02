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
                fichaDetails.innerHTML = '<p>Ficha não encontrada.</p>';
                return;
            }
            throw new Error('Erro ao buscar ficha');
        }
        
        const ficha = await response.json();
        
        const data = new Date(ficha.data);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const horaFormatada = data.toLocaleTimeString('pt-BR');
        
        let html = `
            <div class="ficha-details-card">
                <h3>Ficha ${ficha.numero}</h3>
                <p><strong>Data:</strong> ${dataFormatada} às ${horaFormatada}</p>
                <p><strong>Atendente:</strong> ${ficha.usuario_nome}</p>
                <h4>Itens:</h4>
        `;
        
        ficha.itens.forEach(item => {
            const itemTotal = item.preco_unitario * item.quantidade;
            html += `
                <div class="ficha-item">
                    <div>${item.quantidade}x ${item.produto_nome}</div>
                    <div>${formatCurrency(itemTotal)}</div>
                </div>
            `;
        });
        
        html += `
            <div class="ficha-total">Total: ${formatCurrency(ficha.total)}</div>
            </div>
        `;
        
        fichaDetails.innerHTML = html;
    } catch (error) {
        showMessage('Erro ao consultar ficha: ' + error.message);
    } finally {
        setLoading(searchFichaBtn, false);
    }
});