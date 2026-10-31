(() => {
    const cartKey = "rezekee-cart";
    const favoritesKey = "rezekee-favorites";
    const dialog = document.createElement("dialog");
    dialog.className = "store-action-dialog";
    dialog.setAttribute("aria-labelledby", "storeActionTitle");

    const header = document.createElement("div");
    header.className = "store-action-dialog-header";
    const title = document.createElement("h2");
    title.id = "storeActionTitle";
    const closeButton = document.createElement("button");
    closeButton.className = "store-action-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.textContent = "\u00D7";
    header.append(title, closeButton);

    const list = document.createElement("ul");
    list.className = "store-action-list";
    const total = document.createElement("p");
    total.className = "store-action-total";
    const homeNextStep = document.body.classList.contains("home-page")
        ? document.createElement("div")
        : null;
    if (homeNextStep) {
        homeNextStep.className = "store-action-next-step";
        homeNextStep.hidden = true;
        const nextStepText = document.createElement("p");
        nextStepText.textContent = "Contact the showroom to confirm product availability and next steps.";
        const callLink = document.createElement("a");
        callLink.href = "tel:+855965110561";
        callLink.textContent = "Call the showroom";
        homeNextStep.append(nextStepText, callLink);
    }
    const status = document.createElement("p");
    status.className = "store-action-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    dialog.append(header, list, total);
    if (homeNextStep) dialog.append(homeNextStep);
    dialog.append(status);
    document.body.append(dialog);
    const toast = document.createElement("p");
    toast.className = "store-action-toast";
    toast.setAttribute("role", "alert");
    document.body.append(toast);

    document.querySelectorAll(".promotion-link, .policy-promotion, .store-action-button, .search-button, .profile-button, .dots-box").forEach((link) => {
        const width = Math.max(30, Math.round(link.getBoundingClientRect().width) || 100);
        const height = Math.max(30, Math.round(link.getBoundingClientRect().height) || 44);
        const radius = Math.max(4, Math.min(parseFloat(getComputedStyle(link).borderTopLeftRadius) || 9, height / 2));

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("promotion-runner");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("aria-hidden", "true");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        gradient.id = "promotion-rgb-gradient";
        gradient.innerHTML = '<stop offset="0" stop-color="#39ff14"/><stop offset=".34" stop-color="#00eaff"/><stop offset=".68" stop-color="#2979ff"/><stop offset="1" stop-color="#ff4fd8"/>';
        defs.append(gradient);

        const createRunnerRect = (className) => {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.classList.add(className);
            rect.setAttribute("x", "1");
            rect.setAttribute("y", "1");
            rect.setAttribute("width", String(width - 2));
            rect.setAttribute("height", String(height - 2));
            rect.setAttribute("rx", String(radius));
            rect.setAttribute("pathLength", "280");
            return rect;
        };

        svg.append(defs, createRunnerRect("promotion-base"), createRunnerRect("promotion-train"));
        link.append(svg);
    });

    let toastTimer;

    let activeView = "cart";
    let cart = readItems(cartKey, true);
    let favorites = readItems(favoritesKey, false);

    function readItems(key, withQuantity) {
        try {
            const stored = window.localStorage.getItem(key);
            if (!stored) return [];
            const items = JSON.parse(stored);
            if (!Array.isArray(items)) throw new Error("Saved store data is not a list.");
            return items.filter((item) =>
                item && typeof item.id === "string" && typeof item.name === "string"
            ).map((item) => ({
                id: item.id,
                name: item.name,
                price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
                image: typeof item.image === "string" ? item.image : "",
                sku: typeof item.sku === "string" ? item.sku : "",
                description: typeof item.description === "string" ? item.description : "",
                specifications: Array.isArray(item.specifications) ? item.specifications.filter((line) => typeof line === "string") : [],
                quantity: withQuantity ? Math.max(1, Math.floor(Number(item.quantity) || 1)) : undefined
            }));
        } catch (error) {
            console.error(`Could not read saved ${key === cartKey ? "basket" : "favorites"}:`, error);
            return [];
        }
    }

    function persist() {
        try {
            window.localStorage.setItem(cartKey, JSON.stringify(cart));
            window.localStorage.setItem(favoritesKey, JSON.stringify(favorites));
            status.textContent = "";
            toast.textContent = "";
            toast.classList.remove("show");
            window.clearTimeout(toastTimer);
            renderBadges();
            renderProductButtons();
            if (dialog.open) renderDialog();
            window.dispatchEvent(new CustomEvent("rezekee:store-updated"));
            return true;
        } catch (error) {
            console.error("Could not save basket or favorites in this browser:", error);
            const errorMessage = "Your browser could not save this change. Check its storage settings.";
            status.textContent = errorMessage;
            toast.textContent = errorMessage;
            toast.classList.add("show");
            window.clearTimeout(toastTimer);
            toastTimer = window.setTimeout(() => toast.classList.remove("show"), 6000);
            return false;
        }
    }

    function formatPrice(price) {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
    }

    function renderBadges() {
        const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const favoriteCount = favorites.length;
        document.querySelectorAll("[data-store-view]").forEach((button) => {
            const view = button.dataset.storeView;
            const count = view === "cart" ? cartCount : favoriteCount;
            const badge = button.querySelector(".store-action-count");
            badge.textContent = count > 99 ? "99+" : String(count);
            badge.hidden = count === 0;
            const label = view === "cart" ? "shopping basket" : "favorites";
            const countLabel = view === "cart" ? `${count} ${count === 1 ? "item" : "items"}` : `${count} saved`;
            button.setAttribute("aria-label", `Open ${label} (${countLabel})`);
            button.title = `${view === "cart" ? "Basket" : "Favorites"} (${count})`;
        });
    }

    function renderProductButtons() {
        document.querySelectorAll(".product-card").forEach((card) => {
            const id = card.dataset.productId;
            const inCart = cart.find((item) => item.id === id);
            const favoriteButton = card.querySelector(".favorite-product-button");
            const addButton = card.querySelector(".add-to-cart");
            if (favoriteButton) {
                const isFavorite = favorites.some((item) => item.id === id);
                favoriteButton.setAttribute("aria-pressed", String(isFavorite));
                favoriteButton.setAttribute("aria-label", isFavorite ? "Remove from favorites" : "Add to favorites");
                favoriteButton.textContent = isFavorite ? "\u2665" : "\u2661";
            }
            if (addButton) {
                addButton.classList.toggle("is-added", Boolean(inCart));
                const addButtonLabel = inCart ? `In basket (${inCart.quantity}) \u00B7 Add more` : "Add to basket";
                const addButtonLabelElement = addButton.querySelector("span");
                if (addButtonLabelElement) addButtonLabelElement.textContent = addButtonLabel;
                else addButton.textContent = addButtonLabel;
            }
        });
    }

    function normalizeCartButtonIcons() {
        const cartIcon = '<svg class="button-cart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="9.5" cy="19" r="1.2" fill="currentColor"></circle><circle cx="18" cy="19" r="1.2" fill="currentColor"></circle></svg>';
        document.querySelectorAll(".add-to-cart").forEach((button) => {
            if (button.querySelector(".button-cart-icon")) return;
            const label = button.textContent.includes("In basket") ? button.textContent.trim() : "Add to basket";
            button.innerHTML = `${cartIcon}<span>${label}</span>`;
        });
    }

    const cartButtonObserver = new MutationObserver(normalizeCartButtonIcons);
    cartButtonObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    normalizeCartButtonIcons();

    function makeButton(text, action, id, label) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.dataset.storeAction = action;
        button.dataset.productId = id;
        if (label) button.setAttribute("aria-label", label);
        if (action === "remove-cart" || action === "remove-favorite") button.className = "store-action-remove";
        return button;
    }

    function renderDialog() {
        const isCart = activeView === "cart";
        const items = isCart ? cart : favorites;
        title.textContent = isCart ? "Your basket" : "Your favorites";
        list.replaceChildren();
        total.hidden = !isCart || !items.length;
        if (homeNextStep) homeNextStep.hidden = !isCart || !items.length;
        total.replaceChildren();
        if (!items.length) {
            const empty = document.createElement("li");
            empty.className = "store-action-empty";
            empty.textContent = isCart ? "Your basket is empty. Add products to see them here." : "You haven't saved any favorites yet.";
            list.append(empty);
            return;
        }

        for (const item of items) {
            const row = document.createElement("li");
            row.className = "store-action-item";
            if (item.image) {
                const image = document.createElement("img");
                image.className = "store-action-item-image";
                image.src = item.image;
                image.alt = "";
                image.loading = "lazy";
                row.append(image);
            }

            const copy = document.createElement("div");
            copy.className = "store-action-item-copy";
            const name = document.createElement("strong");
            name.textContent = item.name;
            const details = document.createElement("p");
            details.textContent = isCart
                ? `${formatPrice(item.price)} each \u00B7 ${item.quantity} in basket`
                : formatPrice(item.price);
            copy.append(name, details);
            row.append(copy);

            const controls = document.createElement("div");
            controls.className = "store-action-item-controls";
            if (isCart) {
                controls.append(
                    makeButton("-", "decrease-cart", item.id, `Remove one ${item.name}`),
                    makeButton("+", "increase-cart", item.id, `Add one ${item.name}`)
                );
            } else {
                controls.append(makeButton("Add to basket", "favorite-to-cart", item.id));
            }
            controls.append(makeButton("Remove", isCart ? "remove-cart" : "remove-favorite", item.id));
            row.append(controls);
            list.append(row);
        }

        if (isCart) {
            const label = document.createElement("span");
            label.textContent = "Total";
            const amount = document.createElement("span");
            amount.textContent = formatPrice(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
            total.append(label, amount);
        }
    }

    function addToCart(product) {
        const existing = cart.find((item) => item.id === product.id);
        if (existing) existing.quantity += 1;
        else cart.push({ ...product, quantity: 1 });
        persist();
    }

    function updateFromProductEvent(event, isFavoriteToggle) {
        const product = event.detail && event.detail.product;
        if (!product || product.id === undefined || !product.name) {
            console.error("A product action was requested without valid product details.");
            return;
        }
        const item = {
            id: String(product.id),
            name: String(product.name),
            price: Number.isFinite(Number(product.price)) ? Number(product.price) : 0,
            image: typeof product.image === "string" ? product.image : "",
            sku: typeof product.sku === "string" ? product.sku : "",
            description: typeof product.description === "string" ? product.description : "",
            specifications: Array.isArray(product.specifications) ? product.specifications.filter((line) => typeof line === "string") : []
        };
        if (!isFavoriteToggle) {
            addToCart(item);
            return;
        }
        const index = favorites.findIndex((favorite) => favorite.id === item.id);
        if (index === -1) favorites.push(item);
        else favorites.splice(index, 1);
        persist();
    }

    document.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest("[data-store-view]") : null;
        if (!button) return;

        const view = button.dataset.storeView;

        // Handle search view - show search panel
        if (view === "search") {
            const searchPanel = document.getElementById("searchPanel");
            if (searchPanel) {
                searchPanel.hidden = false;
                const searchInput = document.getElementById("storeSearch");
                if (searchInput) searchInput.focus();
            }
            return;
        }

        // Handle profile view - show auth dialog
        if (view === "profile") {
            const authDialog = document.getElementById("authDialog");
            if (authDialog) {
                authDialog.showModal();
            }
            return;
        }

        // Handle theme view - toggle dark/light mode
        if (view === "theme") {
            document.body.classList.toggle("light-mode");
            const themeButtons = document.querySelectorAll(".theme-toggle i");
            themeButtons.forEach(btn => btn.classList.toggle("hidden", document.body.classList.contains("light-mode")));
            return;
        }

        // Handle menu view - open side panel
        if (view === "menu") {
            const sidePanel = document.getElementById("sidePanel");
            if (sidePanel) {
                sidePanel.hidden = false;
            }
            const menuToggle = document.getElementById("menuToggle");
            if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
            return;
        }

        // Default handling for cart and favorites - show dialog
        if (view === "favorites" && favorites.length > 0) {
            window.location.href = "favorites.html";
            return;
        }

        activeView = view;
        status.textContent = "";
        renderDialog();
        dialog.showModal();
    });

    dialog.addEventListener("click", (event) => {
        const clicked = event.target;
        if (clicked === closeButton || clicked === dialog) {
            dialog.close();
            return;
        }
        if (!(clicked instanceof Element)) return;
        const button = clicked.closest("[data-store-action]");
        if (!button) return;
        const id = button.dataset.productId;
        const item = (activeView === "cart" ? cart : favorites).find((product) => product.id === id);
        if (button.dataset.storeAction === "increase-cart" && item) item.quantity += 1;
        if (button.dataset.storeAction === "decrease-cart" && item) {
            if (item.quantity === 1) cart = cart.filter((product) => product.id !== id);
            else item.quantity -= 1;
        }
        if (button.dataset.storeAction === "remove-cart") cart = cart.filter((product) => product.id !== id);
        if (button.dataset.storeAction === "remove-favorite") favorites = favorites.filter((product) => product.id !== id);
        if (button.dataset.storeAction === "favorite-to-cart") {
            const favorite = favorites.find((product) => product.id === id);
            if (favorite) addToCart(favorite);
        } else {
            persist();
        }
    });

    closeButton.addEventListener("click", () => dialog.close());
    window.addEventListener("rezekee:add-to-cart", (event) => updateFromProductEvent(event, false));
    window.addEventListener("rezekee:toggle-favorite", (event) => updateFromProductEvent(event, true));
    window.addEventListener("rezekee:products-loaded", renderProductButtons);
    window.addEventListener("storage", (event) => {
        if (event.key !== cartKey && event.key !== favoritesKey && event.key !== null) return;
        cart = readItems(cartKey, true);
        favorites = readItems(favoritesKey, false);
        renderBadges();
        renderProductButtons();
        if (dialog.open) renderDialog();
    });

    renderBadges();
    renderProductButtons();
})();
