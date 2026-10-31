(function () {
    function applyTheme(theme) {
        const isLight = theme === 'light';
        document.body.classList.toggle('light-mode', isLight);
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.setAttribute('aria-pressed', String(isLight));
            toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
        }
        try { localStorage.setItem('rezekee-theme', theme); } catch (e) {}
    }

    function initTheme() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        const saved = (function () {
            try { return localStorage.getItem('rezekee-theme'); } catch (e) { return null; }
        })();
        applyTheme(saved || 'dark');
        toggle.addEventListener('click', function () {
            applyTheme(document.body.classList.contains('light-mode') ? 'dark' : 'light');
        });
    }

    function initMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidePanel = document.getElementById('sidePanel');
        const overlay = document.getElementById('overlay');
        const closeBtn = document.getElementById('sidePanelClose');
        if (!menuToggle || !sidePanel || !overlay) return;

        function setMenuOpen(isOpen) {
            sidePanel.classList.toggle('open', isOpen);
            if (overlay.classList) overlay.classList.toggle('show', isOpen);
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
            sidePanel.setAttribute('aria-hidden', String(!isOpen));
            sidePanel.inert = !isOpen;
            if (isOpen && closeBtn) closeBtn.focus({ preventScroll: true });
            else menuToggle.focus({ preventScroll: true });
        }

        menuToggle.addEventListener('click', function (event) {
            event.stopPropagation();
            setMenuOpen(!sidePanel.classList.contains('open'));
        });
        overlay.addEventListener('click', function () { setMenuOpen(false); });
        if (closeBtn) closeBtn.addEventListener('click', function () { setMenuOpen(false); });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && sidePanel.classList.contains('open')) {
                setMenuOpen(false);
                menuToggle.focus();
            }
        });
    }

    function init() {
        initTheme();
        initMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();