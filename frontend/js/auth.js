const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const currentUserSpan = document.getElementById('current-user');

// Login
loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage('Por favor, preencha usuário e senha.');
        return;
    }
    
    setLoading(loginBtn, true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            currentUserSpan.textContent = data.user.nome;
            loginScreen.style.display = 'none';
            mainSystem.style.display = 'block';
            
            // Carregar dados iniciais
            updateDashboard();
            loadProductsTable();
            loadProductSelect();
        } else {
            showMessage(data.error || 'Erro ao fazer login');
        }
    } catch (error) {
        showMessage('Erro de conexão com o servidor');
    } finally {
        setLoading(loginBtn, false);
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    mainSystem.style.display = 'none';
    loginScreen.style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

// Validar token
async function validateToken() {
    const token = getToken();
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (token && user) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                currentUserSpan.textContent = user.nome;
                loginScreen.style.display = 'none';
                mainSystem.style.display = 'block';
                updateDashboard();
                loadProductsTable();
                loadProductSelect();
            } else {
                throw new Error('Token inválido');
            }
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
}