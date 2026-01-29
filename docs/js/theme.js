function handleThemeToggle() {
    const isDarkMode = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Hneď na začiatku nastavím tému, aby nepreblikla
initializeTheme();

// Počkám, kým sa načíta celá stránka a až potom priradím kliknutie na tlačidlo
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', handleThemeToggle);
    }
});
