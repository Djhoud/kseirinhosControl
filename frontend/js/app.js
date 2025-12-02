// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Elementos DOM
const loginScreen = document.getElementById('login-screen');
const mainSystem = document.getElementById('main-system');
const navTabs = document.querySelectorAll('.nav-tab');
const sections = document.querySelectorAll('.section');
const productModal = document.getElementById('product-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');

// Navegação entre abas
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        
        // Atualizar aba ativa
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Mostrar seção correspondente
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === target) {
                section.classList.add('active');
            }
        });
        
        // Atualizar dados se necessário
        if (target === 'dashboard') {
            updateDashboard();
        } else if (target === 'estoque') {
            loadProductsTable();
        }
    });
});

// Modal functions
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        productModal.style.display = 'none';
    });
});

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === productModal) {
        productModal.style.display = 'none';
    }
});

// Utility functions
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('login-message');
    messageDiv.textContent = message;
    messageDiv.style.color = type === 'success' ? 'green' : 'red';
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function getToken() {
    return localStorage.getItem('token');
}

function setLoading(element, isLoading) {
    if (isLoading) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se usuário está logado
    const token = getToken();
    if (token) {
        // Validar token com a API
        validateToken();
    }
});