document.addEventListener('DOMContentLoaded', () => {
    fetch('_navbar.html')
        .then(response => response.text())
        .then(data => {
            const navbarPlaceholder = document.getElementById('navbar-placeholder');
            if (navbarPlaceholder) {
                navbarPlaceholder.innerHTML = data;

                // After navbar is loaded, update UI and attach theme toggle event listener
                updateUI();
                setActiveLink();

                const themeToggleButton = document.getElementById('theme-toggle');
                if (themeToggleButton) {
                    themeToggleButton.addEventListener('click', handleThemeToggle);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching navbar:', error);
        });
});

function updateUI() {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const loginButton = document.getElementById('login-button');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const logoutButton = document.getElementById('logout-button');
    const adminLink = document.getElementById('admin-link');

    if (loggedInUser) {
        if (loginButton) loginButton.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = loggedInUser.fullName;
        if(logoutButton) logoutButton.addEventListener('click', handleLogout);

        if (loggedInUser.role === 'admin') {
            if (adminLink) adminLink.classList.remove('hidden');
        }

    } else {
        if (loginButton) loginButton.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }
}

function setActiveLink() {
    const links = document.querySelectorAll('#navbar-placeholder a');
    const currentPage = window.location.pathname.split('/').pop();

    links.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
