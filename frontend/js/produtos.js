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
}