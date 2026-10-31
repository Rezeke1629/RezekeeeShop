(function () {
    const themeButtons = document.querySelectorAll('[data-policy-theme]');
    const menuButton = document.querySelector('.policy-menu');
    const sidePanel = document.querySelector('.policy-side-panel');
    const overlay = document.querySelector('.policy-overlay');
    const header = document.querySelector('.policy-topbar');
    document.querySelectorAll('.policy-action').forEach((button) => {
        const label = button.getAttribute('aria-label');
        if (label === 'Basket') { button.dataset.storeView = 'cart'; button.setAttribute('aria-haspopup', 'dialog'); }
        if (label === 'Favorites') {
            button.dataset.storeView = 'favorites';
            button.setAttribute('aria-haspopup', 'dialog');
            button.addEventListener('click', () => {
                let favoriteCount = 0;
                try {
                    const stored = JSON.parse(localStorage.getItem('rezekee-favorites') || '[]');
                    if (Array.isArray(stored)) favoriteCount = stored.length;
                } catch (error) {
                    favoriteCount = 0;
                }
                if (favoriteCount > 0) {
                    button.removeAttribute('data-store-view');
                    window.location.href = 'favorites.html';
                } else {
                    button.dataset.storeView = 'favorites';
                }
            });
        }
        if (label === 'Search') button.addEventListener('click', () => { window.location.href = 'products.html#productList'; });
        if (label === 'Account') button.addEventListener('click', () => { window.location.href = 'home.html'; });
    });
    const savedTheme = localStorage.getItem('rezekee-theme') || 'dark';

    function applyTheme(theme) {
        const isLight = theme === 'light';
        document.body.classList.toggle('light-mode', isLight);
        themeButtons.forEach((button) => {
            button.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
            button.setAttribute('aria-pressed', String(isLight));
        });
        localStorage.setItem('rezekee-theme', theme);
    }

    applyTheme(savedTheme);
    function updateHeader() {
        if (!header) return;
        const isCompact = header.classList.contains('compact');
        const shouldCompact = isCompact ? window.scrollY > 6 : window.scrollY > 40;
        header.classList.toggle('compact', shouldCompact);
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    themeButtons.forEach((button) => button.addEventListener('click', () => {
        applyTheme(document.body.classList.contains('light-mode') ? 'dark' : 'light');
    }));
    function setMenuOpen(open) {
        sidePanel?.classList.toggle('open', open);
        overlay?.classList.toggle('open', open);
        menuButton?.setAttribute('aria-expanded', String(open));
        menuButton?.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    }
    menuButton?.addEventListener('click', () => setMenuOpen(!sidePanel?.classList.contains('open')));
    overlay?.addEventListener('click', () => setMenuOpen(false));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenuOpen(false); });
})();
