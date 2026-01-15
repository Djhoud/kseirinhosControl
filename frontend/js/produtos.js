const productsList = document.getElementById('products-list');
const addProductBtn = document.getElementById('add-product-btn');
const productForm = document.getElementById('product-form');

// Carregar produtos
async function loadProductsTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        
        const products = await response.json();
        
        productsList.innerHTML = '';
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.nome}</td>
                <td>${product.categoria}</td>
                <td>${formatCurrency(product.preco)}</td>
                <td>${product.estoque}</td>
                <td class="actions">
                    <button class="action-btn edit-btn" data-id="${product.id}">Editar</button>
                    <button class="action-btn delete-btn" data-id="${product.id}">Excluir</button>
                </td>
            `;
            productsList.appendChild(row);
        });
        
        // Adicionar event listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                editProduct(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                deleteProduct(id);
            });
        });
        
    } catch (error) {
        showMessage('Erro ao carregar produtos: ' + error.message);
    }
}

// Adicionar/Editar produto
addProductBtn.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Adicionar Produto';
    productForm.reset();
    document.getElementById('product-id').value = '';
    productModal.style.display = 'flex';
});

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const nome = document.getElementById('product-name').value;
    const categoria = document.getElementById('product-category').value;
    const preco = parseFloat(document.getElementById('product-price').value);
    const estoque = parseInt(document.getElementById('product-stock').value);
    const descricao = document.getElementById('product-description').value;
    
    const productData = { nome, categoria, preco, estoque, descricao };
    
    try {
        let response;
        if (id) {
            // Editar
            response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Adicionar
            response = await fetch(`${API_BASE_URL}/produtos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.ok) {
            productModal.style.display = 'none';
            loadProductsTable();
            loadProductSelect();
            updateDashboard();
            showMessage('Produto salvo com sucesso!', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.error);
        }
    } catch (error) {
        showMessage('Erro ao salvar produto: ' + error.message);
    }
});

// Editar produto
async function editProduct(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar produto');
        
        const product = await response.json();
        
        document.getElementById('modal-title').textContent = 'Editar Produto';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.nome;
        document.getElementById('product-category').value = product.categoria;
        document.getElementById('product-price').value = product.preco;
        document.getElementById('product-stock').value = product.estoque;
        document.getElementById('product-description').value = product.descricao || '';
        productModal.style.display = 'flex';
    } catch (error) {
        showMessage('Erro ao carregar produto: ' + error.message);
    }
}

// Excluir produto
async function deleteProduct(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            loadProductsTable();
            loadProductSelect();
            updateDashboard();
            showMessage('Produto excluído com sucesso!', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.error);
        }
    } catch (error) {
        showMessage('Erro ao excluir produto: ' + error.message);
    }
}

// Carregar select de produtos para fichas
async function loadProductSelect() {
    const productSelect = document.getElementById('produto-select');
    
    try {
        const response = await fetch(`${API_BASE_URL}/produtos`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        
        const products = await response.json();
        
        productSelect.innerHTML = '<option value="">Selecione um produto</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.nome} - ${formatCurrency(product.preco)}`;
            productSelect.appendChild(option);
        });
    } catch (error) {
        showMessage('Erro ao carregar produtos: ' + error.message);
    }
    // === TESTE DE DEBUG - ADICIONE ESTE CÓDIGO NO FINAL DO ARQUIVO ===

console.log('🔧 Iniciando debug do modal de produtos...');

// 1. Verificar se os elementos existem
console.log('Elementos:');
console.log('- product-form:', document.getElementById('product-form'));
console.log('- add-product-btn:', document.getElementById('add-product-btn'));
console.log('- product-modal:', document.getElementById('product-modal'));

// 2. Verificar event listeners atuais
const form = document.getElementById('product-form');
console.log('Form tem onclick?', form.onclick);
console.log('Form tem onsubmit?', form.onsubmit);

// 3. Adicionar listener DIRETO (força bruta)
document.getElementById('product-form').addEventListener('submit', function(e) {
    console.log('✅ FORM SUBMIT CAPTURADO!');
    e.preventDefault();
    alert('Formulário enviado! Agora vamos salvar...');
    salvarProdutoTeste();
});

// 4. Função simplificada para testar
async function salvarProdutoTeste() {
    console.log('🛠️ Função salvarProdutoTeste chamada');
    
    const nome = document.getElementById('product-name').value;
    const categoria = document.getElementById('product-category').value;
    const preco = document.getElementById('product-price').value;
    const estoque = document.getElementById('product-stock').value;
    
    console.log('Dados capturados:', { nome, categoria, preco, estoque });
    
    if (!nome || !categoria) {
        alert('Preencha nome e categoria!');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Faça login primeiro!');
        return;
    }
    
    const produtoData = {
        nome: nome,
        categoria: categoria,
        preco: parseFloat(preco) || 0,
        estoque: parseInt(estoque) || 0,
        descricao: document.getElementById('product-description').value || ''
    };
    
    console.log('Enviando:', produtoData);
    
    try {
        const response = await fetch('http://localhost:3000/api/produtos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(produtoData)
        });
        
        console.log('Status:', response.status);
        
        if (response.ok) {
            const resultado = await response.json();
            console.log('✅ Produto salvo:', resultado);
            alert(`✅ Produto "${resultado.nome}" salvo com ID ${resultado.id}`);
            
            // Fechar modal
            document.getElementById('product-modal').style.display = 'none';
            
            // Recarregar produtos
            if (typeof loadProductsTable === 'function') {
                loadProductsTable();
            }
            if (typeof loadProductSelect === 'function') {
                loadProductSelect();
            }
            
        } else {
            const erro = await response.json();
            console.error('❌ Erro:', erro);
            alert(`❌ Erro: ${erro.error || 'Erro desconhecido'}`);
        }
        
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        alert('❌ Erro de conexão: ' + error.message);
    }
}

// 5. Teste manual - adiciona botão de debug
const debugBtn = document.createElement('button');
debugBtn.textContent = '🐛 Debug Produto';
debugBtn.style.position = 'fixed';
debugBtn.style.bottom = '60px';
debugBtn.style.right = '10px';
debugBtn.style.background = '#ffc107';
debugBtn.style.color = '#000';
debugBtn.style.padding = '10px';
debugBtn.style.border = 'none';
debugBtn.style.borderRadius = '5px';
debugBtn.style.zIndex = '9999';
debugBtn.style.cursor = 'pointer';

debugBtn.onclick = function() {
    console.log('=== DEBUG MANUAL ===');
    console.log('1. Abrindo modal...');
    document.getElementById('product-modal').style.display = 'flex';
    
    console.log('2. Preenchendo dados de teste...');
    document.getElementById('product-name').value = 'TESTE ' + Date.now();
    document.getElementById('product-category').value = 'Bebidas';
    document.getElementById('product-price').value = '5.90';
    document.getElementById('product-stock').value = '100';
    
    console.log('3. Dados preenchidos!');
    console.log('4. Clique no botão "Salvar" e veja o console');
};

document.body.appendChild(debugBtn);
console.log('🐛 Botão de debug adicionado na tela!');
}