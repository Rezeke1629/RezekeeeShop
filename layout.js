(function () {
    const headerHTML = `
<header class="topbar">
    <a class="brand" href="home.html" aria-label="RezekeeeShop home">
        <img class="brand-logo" src="inmage/rezekee-shop-horizontal.png" alt="RezekeeeShop logo">
    </a>
    <nav class="menu" aria-label="Main navigation" id="mainNav">
        <a href="home.html" data-page="home">Home</a>
        <a href="shop.html" data-page="shop">Shop</a>
        <a href="contact.html" data-page="contact">Contact</a>
        <a href="about.html" data-page="about">About</a>
        <a class="promotion-link" href="promotion.html" data-page="promotion">Promotion</a>
    </nav>
    <div class="topbar-actions" aria-label="Store actions">
        <button id="searchButton" type="button" aria-label="Search" aria-expanded="false" aria-controls="searchPanel">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" stroke-width="1.8"></circle><path d="m15.5 15.5 4.2 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>
        </button>
        <div class="search-panel" id="searchPanel" aria-hidden="true">
            <form class="search-form" id="searchForm" role="search">
                <input class="search-input" id="searchInput" type="search" placeholder="Search products" aria-label="Search products">
            </form>
            <div class="search-results" id="searchResults" aria-live="polite"></div>
        </div>
        <button class="profile-button" id="profileButton" type="button" aria-label="Account" aria-haspopup="dialog" aria-expanded="false">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"></circle><path d="M4.5 20c.7-3.5 3.2-5.4 7.5-5.4s6.8 1.9 7.5 5.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>
        </button>
        <button class="store-action-button" type="button" data-store-view="cart" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="9.5" cy="19" r="1.2" fill="currentColor"></circle><circle cx="18" cy="19" r="1.2" fill="currentColor"></circle></svg>
            <span class="store-action-count" hidden>0</span>
        </button>
<button class="store-action-button" type="button" data-store-view="favorites" aria-label="Favorites">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.8 8.8c0 5.3-8.8 11-8.8 11s-8.8-5.7-8.8-11A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 8.8 2.3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path></svg>
            <span class="store-action-count" hidden>0</span>
        </button>
        <button class="dots-box" id="menuToggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="sidePanel">
            <i class="fa-solid fa-ellipsis"></i>
        </button>
    </div>
</header>
<div class="overlay" id="overlay"></div>
<aside class="side-panel" id="sidePanel" aria-label="More navigation" aria-hidden="true" inert>
    <button class="side-panel-close" type="button" aria-label="Close navigation menu" id="sidePanelClose">×</button>
    <a href="home.html">Home page</a>
    <a href="products.html#brands">Products</a>
    <a href="promotion.html">Promotions</a>
    <a href="about.html">About us</a>
    <div class="appearance-control">
        <span class="appearance-label" id="appearanceLabel">Appearance</span>
        <button class="theme-toggle" type="button" id="themeToggle" aria-label="Switch to light mode" aria-pressed="false" aria-describedby="appearanceLabel">
            <span class="theme-toggle-thumb"><i class="fa-solid fa-moon"></i></span>
            <span class="theme-icon sun" aria-hidden="true"><i class="fa-solid fa-sun"></i></span>
            <span class="theme-icon moon" aria-hidden="true"><i class="fa-solid fa-moon"></i></span>
        </button>
    </div>
</aside>`;

    const footerHTML = `
<footer class="store-footer">
    <div class="store-footer-main">
        <section class="store-footer-brand">
            <a href="home.html" aria-label="RezekeeeShop home"><img class="store-footer-logo" src="inmage/Gemini_Generated_Image_bgsyf5bgsyf5bgsy-removebg-preview.png" alt="RezekeeeShop"></a>
            <h4>OPENING HOURS</h4>
            <p>Monday to Sunday, 8:00 AM to 5:30 PM.</p>
        </section>
        <div class="footer-column">
            <h4>CONTACT US</h4>

            <div class="contact-subblock">
                <span class="contact-subtitle">Sales Showroom</span>
                <a href="tel:0965110561" class="contact-link"><i class="fa-solid fa-phone"></i> 096 511 0561</a>
            </div>

            <div class="contact-subblock">
                <span class="contact-subtitle">Service Center</span>
                <a href="tel:0965660561" class="contact-link"><i class="fa-solid fa-phone"></i> 096 566 0561</a>
            </div>
        </div>
        <section>
            <h4>INFORMATION</h4>
            <ul class="store-footer-list">
                <li><a href="terms.html">Terms &amp; Conditions</a></li>
                <li><a href="privacy.html">Privacy Policy</a></li>
                <li><a href="help.html">Help</a></li>
                <li><a href="about.html">About us</a></li>
            </ul>
        </section>
        <section>
            <h4>MY ACCOUNT</h4>
            <ul class="store-footer-list">
                <li><button class="footer-login-button" type="button" id="footerLoginButton">Login</button></li>
                <li><a href="favorites.html">My favorites</a></li>
                <li><a href="cart.html">Cart</a></li>
            </ul>
        </section>
        <section>
            <h4>FOLLOW US</h4>
            <ul class="store-footer-list store-footer-social-list">
                <li><a href="https://www.facebook.com/share/19gmzMMRUH/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg> Facebook</a></li>
                <li><a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.6 6.8a4.7 4.7 0 0 1-3.3-1.4 4.7 4.7 0 0 1-1.2-3.2h-3.1v12.4a2.8 2.8 0 1 1-2.8-2.8c.3 0 .6 0 .9.1V8.8a6 6 0 0 0-.9-.1 5.9 5.9 0 1 0 5.9 5.9V9.2a7.8 7.8 0 0 0 4.5 1.4V7.5a4.7 4.7 0 0 1-1-.7z"/></svg> TikTok</a></li>
                <li><a href="https://www.instagram.com/rezekeee.shop?exln=a21zbm4yenc0MjZz&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg> Instagram</a></li>
                <li><a href="https://t.me/RezekeeeShop" target="_blank" rel="noopener noreferrer" aria-label="Telegram"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 4.6 3.8 11.5c-1.2.5-1.2 1.2-.2 1.5l4.6 1.4 1.8 5.4c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.2-2.1 4.6 3.4c.8.5 1.4.2 1.6-.8l3-14.2c.3-1.2-.4-1.7-1.5-1.3z"/></svg> Telegram</a></li>
            </ul>
        </section>
    </div>
    <div class="store-footer-bottom">
        <span>&copy; RezekeeeShop &middot; Cambodia</span>
        <div class="store-footer-payments" aria-label="Accepted payment methods">
            <img class="store-payment-image" src="inmage/Asset102x_1756112120.png" alt="Wing Bank">
            <img class="store-payment-image" src="inmage/KHQR-available-here-logo-with-bg.webp" alt="KHQR">
            <img class="store-payment-image" src="inmage/Visa_Inc.-Logo.wine.png" alt="Visa">
        </div>
    </div>
</footer>`;

    if (!document.querySelector('header.topbar')) {
        const headerSlot = document.getElementById('site-header');
        if (headerSlot) headerSlot.innerHTML = headerHTML;
        else document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }

    if (!document.querySelector('footer.store-footer')) {
        const footerSlot = document.getElementById('site-footer');
        if (footerSlot) footerSlot.innerHTML = footerHTML;
        else document.body.insertAdjacentHTML('beforeend', footerHTML);
    }

    const page = (location.pathname.split('/').pop() || 'home.html').toLowerCase();
    const pageKey = page.replace('.html', '');
    document.querySelectorAll('#mainNav a[data-page]').forEach((a) => {
        if (a.dataset.page === pageKey || (pageKey === '' && a.dataset.page === 'home') || (pageKey === 'index' && a.dataset.page === 'home')) {
            a.setAttribute('aria-current', 'page');
        }
    });

    // Dropdown menu and dark mode toggle are handled by shared script.js.
    document.addEventListener('click', (e) => {
        if (e.target instanceof Element && e.target.closest('#footerLoginButton')) {
            const pb = document.getElementById('profileButton');
            if (pb) pb.click();
        }
    });

    const searchButton = document.getElementById('searchButton');
    const searchPanel = document.getElementById('searchPanel');
    if (searchButton && searchPanel) {
        searchButton.addEventListener('click', () => {
            const open = searchPanel.classList.toggle('open');
            searchPanel.setAttribute('aria-hidden', String(!open));
            searchButton.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('pointerdown', (e) => {
            if (e.target instanceof Node && !searchPanel.contains(e.target) && !searchButton.contains(e.target)) {
                searchPanel.classList.remove('open');
                searchPanel.setAttribute('aria-hidden', 'true');
                searchButton.setAttribute('aria-expanded', 'false');
            }
        });
    }
})();

