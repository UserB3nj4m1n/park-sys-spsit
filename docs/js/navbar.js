document.addEventListener('DOMContentLoaded', () => {
    fetch('_navbar.html')
        .then(response => response.text())
        .then(data => {
            const navbarPlaceholder = document.getElementById('navbar-placeholder');
            if (navbarPlaceholder) {
                navbarPlaceholder.innerHTML = data;

                // After navbar is loaded, set active link and attach theme toggle event listener
                setActiveLink();

                const themeToggleButton = document.getElementById('theme-toggle');
                if (themeToggleButton) {
                    // Assuming handleThemeToggle is defined in theme.js and loaded globally
                    themeToggleButton.addEventListener('click', handleThemeToggle);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching navbar:', error);
        });
});

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
