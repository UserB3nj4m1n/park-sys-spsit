
document.addEventListener('DOMContentLoaded', () => {
    // Check if on the login page
    if (document.querySelector('input[name="auth-toggle"]')) {
        const authToggle = document.querySelectorAll('input[name="auth-toggle"]');
        const registerForm = document.getElementById('register-form');
        const mainButton = document.getElementById('main-button');
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        const fullNameField = document.getElementById('full-name');
        const confirmPasswordField = document.getElementById('confirm-password');

        // Initially hide register-specific fields
        const fullNameContainer = fullNameField.parentElement;
        const confirmPasswordContainer = confirmPasswordField.parentElement;
        fullNameContainer.style.display = 'none';
        confirmPasswordContainer.style.display = 'none';

        authToggle.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'Register') {
                    mainButton.textContent = 'Register';
                    fullNameContainer.style.display = 'block';
                    confirmPasswordContainer.style.display = 'block';
                } else {
                    mainButton.textContent = 'Sign In';
                    fullNameContainer.style.display = 'none';
                    confirmPasswordContainer.style.display = 'none';
                }
            });
        });

        mainButton.addEventListener('click', async (e) => {
            e.preventDefault();
            if (mainButton.textContent === 'Register') {
                await handleRegister();
            } else {
                await handleLogin();
            }
        });
    }

    // Auth Guard for protected pages
    authGuard();
});

async function handleRegister() {
    const fullName = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fullName, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            // Switch to sign in form
            document.querySelector('input[name="auth-toggle"][value="Sign In"]').checked = true;
            document.getElementById('main-button').textContent = 'Sign In';
            document.getElementById('full-name').parentElement.style.display = 'none';
            document.getElementById('confirm-password').parentElement.style.display = 'none';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Could not connect to the server.');
    }
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Could not connect to the server.');
    }
}


function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}

function authGuard() {
    // list of pages that do not require authentication
    const publicPages = ['/docs/login.html'];
    // redirect to login page if not authenticated
    if (!sessionStorage.getItem('loggedInUser') && !publicPages.includes(window.location.pathname)) {
        window.location.href = 'login.html';
    }
}

function adminAuthGuard() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        alert('You do not have administrative privileges to view this page.');
        window.location.href = '/docs/index.html'; 
    }
}
