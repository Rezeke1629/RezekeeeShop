(() => {
    const config = window.REZEKEE_SUPABASE_CONFIG;
    if (!config || !config.url || !config.anonKey ||
        !window.supabase || typeof window.supabase.createClient !== "function") return;

    // Use the shared singleton client, or create it once if it doesn't exist yet
    if (!window.supabaseClient) {
        window.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    }
    const client = window.supabaseClient;

    const previousAboutDefaults = {
        about_title: "About Us",
        about_body: "We are a creative team focused on clean design, modern web experiences, and customer-friendly digital products. Our goal is to build simple an"
    };
// ... rest of your code remains the same
    const currentAboutDefaults = {
        about_title: "About RezekeeeShop",
        about_body: "Welcome to RezekeeeShop, your trusted online destination for top-quality computer hardware, laptops, custom desktop PCs, and tech accessories in Cambodia."
    };
    const previousHomeDefaults = {
        home_title: "Home Page",
        home_body: "Welcome to our world. Tap through the right-side menu to catch the vibe and check out what we're building."
    };
    const currentHomeDefaults = {
        home_title: "Next-Gen Gaming Laptops & Custom Rigs",
        home_body: "Discover top-tier laptops, custom PC builds, and gaming accessories with official warranty and fast local delivery."
    };

    async function loadPageContent() {
        const entries = [
            ["home_title", "homeTitle"],
            ["home_body", "homeBody"],
            ["about_title", "aboutTitle"],
            ["about_body", "aboutBody"]
        ];
        const currentPageKeys = entries
            .filter(([, elementId]) => document.getElementById(elementId))
            .map(([key]) => key);
        if (!currentPageKeys.length) return;
        const { data, error } = await client
            .from("site_content")
            .select("key,value")
            .in("key", currentPageKeys);
        if (error) {
            console.error("Could not load editable shop page text:", error.message);
            return;
        }
        const normalize = (text) => String(text ?? "")
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .trim();
        const values = Object.fromEntries(data.map(({ key, value }) => {
            const isPreviousAboutDefault = previousAboutDefaults[key] && value === previousAboutDefaults[key];
            if (isPreviousAboutDefault) return [key, currentAboutDefaults[key]];
            const previousHome = previousHomeDefaults[key];
            const isPreviousHomeDefault = previousHome && normalize(value) === normalize(previousHome);
            if (isPreviousHomeDefault) return [key, currentHomeDefaults[key]];
            return [key, value];
        }));
        for (const [key, elementId] of entries) {
            const element = document.getElementById(elementId);
            if (element && values[key]) element.textContent = values[key];
        }
    }

    function parseSpecificationItems(input) {
        if (!input) return [];
        const text = Array.isArray(input) ? input.join("\n") : String(input);
        const rawLines = text.trim().split(/\r?\n/);
        const results = [];
        let currentItem = null;

        for (const rawLine of rawLines) {
            const line = rawLine.trim();
            if (!line) continue;

            const isBullet = /^[-–—•*›]/.test(line);
            const hasKey = /^[A-Za-z0-9][\w\s/&.'"-]{1,30}:/.test(line);

            if (!isBullet && !hasKey && currentItem) {
                currentItem += "; " + line;
                results[results.length - 1] = currentItem;
                continue;
            }

            const parts = line.split(/(?<=[\s,;])[-–—•*›]\s*(?=[A-Za-z0-9])|^[-–—•*›]\s*/);
            for (const part of parts) {
                let cleaned = part.trim();
                cleaned = cleaned.replace(/^[-–—•*›\s:]+/, "").replace(/[\s,;]+$/, "");
                cleaned = cleaned
                    .replace(/^CPU\s*\/\s*Processor:/i, "CPU:")
                    .replace(/^Operating\s+System:/i, "OS:")
                    .replace(/^RAM\s*\/\s*Memory:/i, "RAM:")
                    .replace(/^Graphic:/i, "Graphics:");
                if (cleaned.length > 0) {
                    results.push(cleaned);
                    currentItem = cleaned;
                }
            }
        }
        return results;
    }

    async function loadProducts() {
        const list = document.getElementById("productList");
        if (!list) return;
        const { data, error } = await client
            .from("products")
            .select("id,sku,name,description,specifications,price_usd,discount_percent,image_url,image_urls")
            .eq("is_active", true)
            .order("created_at", { ascending: false });
        if (error) {
            console.error("Could not load shop products:", error.message);
        }
        const fallbackProducts = [
            {
                id: "test-asus-rog-strix-g16",
                sku: "LURS-0939",
                name: "ASUS ROG Strix G16 G614PR-RV151W",
                description: "AMD Ryzen 9 8940HX, 16GB DDR5 5600, 512GB SSD, NVIDIA GeForce RTX 5070 Ti 12GB, 16-inch FHD+ 165Hz display.",
                specifications: [
                    "CPU: AMD Ryzen 9 8940HX",
                    "OS: Windows 11 Home SL License",
                    "RAM: 16GB DDR5 5600",
                    "Storage: SSD 512GB M.2",
                    "Graphics: NVIDIA GeForce RTX 5070 Ti 12GB",
                    "Display: 16-inch FHD+ (1920 x 1200) 165Hz",
                    "Battery: 4-cell integrated",
                    "Backlit 4-zone RGB chiclet keyboard with Copilot key",
                    "ROG gaming mouse and backpack",
                    "Weight: 2.50 kg · Eclipse Gray",
                    "2Y + 1st Year Local Perfect Warranty"
                ],
                price_usd: 2399,
                image_url: "inmage/ASUS ROG Strix G16 (Model G614PR-RV151W).png"
            },
            {
                id: "test-asus-rog-zephyrus-g16",
                sku: "LURZ-0930",
                name: "ASUS ROG Zephyrus G16 GU606AR-TB042W",
                description: "Intel Core Ultra 9 386H, 32GB LPDDR5X, 1TB SSD, NVIDIA GeForce RTX 5070 Ti 12GB, 16-inch 2.5K OLED 240Hz display.",
                specifications: [
                    "CPU / Processor: Intel® Core™ Ultra 9 Processor 386H (18MB Cache, 2.1 GHz up to 4.9 GHz, 16 cores, 16 Threads)",
                    "Neural Processor: Intel® NPU up to 50 TOPS",
                    "Operating System: Windows 11 Home",
                    "RAM / Memory: 32GB LPDDR5X 8533 on board (Not upgradable)",
                    "Storage: 1TB PCIe® 4.0 NVMe™ M.2 SSD (Free one more slot M.2 2280)",
                    "Graphic: NVIDIA® GeForce RTX™ 5070 Ti Laptop GPU 12GB GDDR7",
                    "Display: ROG Nebula HDR 16-inch 2.5K (2560 x 1600, WQXGA) OLED 16:10 aspect ratio, 240Hz refresh rate, 1,100 nits peak brightness, anti-reflection display",
                    "Optical Drive: None",
                    "Wireless: Wi-Fi 7 (802.11be) triple band and Bluetooth® 6.0 Wireless Card",
                    "Network: None",
                    "Audio: AI noise-canceling technology, Dolby Atmos Hi-Res certification, Smart Amp Technology, 4-speaker system with Smart Amplifier Technology, 2 tweeters",
                    "Webcam: 1080P FHD IR Camera for Windows Hello, built-in 3-microphone array",
                    "Ports: 1x 3.5mm Combo Audio Jack; 1x HDMI 2.1 FRL; 1x Thunderbolt™ 4 with DisplayPort™ and power delivery; 1x USB 3.2 Gen 2 Type-C with DisplayPort™, power delivery and G-SYNC; 2x USB 3.2 Gen 2 Type-A; 1x SD card reader (UHS-II, 312MB/s)",
                    "Keyboard: Backlit Chiclet Keyboard, 1-Zone RGB with Copilot key",
                    "Fingerprint: None",
                    "Battery: 90WHrs, 4S1P, 4-cell Li-ion (TYPE-C 100W AC Adapter + Rectangle Conn 250W AC Adapter)",
                    "Weight: 1.95 Kg (4.30 lbs)",
                    "Color: Platinum White",
                    "Warranty: 2Y Warranty + 1st Year Local Perfect Warranty",
                    "What's in box: ROG Impact Gaming Mouse + ROG Zephyrus G16 Sleeve"
                ],
                price_usd: 3499,
                image_url: "inmage/ASUS ROG Zephyrus G16 GU606AR-TB042W.png"
            },
            {
                id: "test-asus-rog-strix-scar-18",
                sku: "LURSC-3921",
                name: "ASUS ROG Strix SCAR 18 G835LWGTQ349W",
                description: "Intel Core Ultra 9 290HX Plus, 32GB DDR5, 1TB SSD, NVIDIA GeForce RTX 5080 16GB, 18-inch 4K 240Hz display.",
                specifications: [
                    "CPU: Core Ultra 9 Processor 290HX Plus",
                    "Intel AI Boost NPU up to 13 TOPS",
                    "OS: Windows 11 Home SL License",
                    "RAM: 32GB DDR5 6400",
                    "Storage: SSD 1TB M.2",
                    "Graphics: NVIDIA GeForce RTX 5080 16GB",
                    "Display: 18-inch 4K (3840 x 2400) 240Hz",
                    "Battery: 4-cell integrated",
                    "Backlit RGB chiclet keyboard with Copilot key",
                    "ROG gaming mouse and backpack",
                    "Weight: 3.70 kg · Off Black",
                    "2Y + 1st Year Local Perfect Warranty"
                ],
                price_usd: 4299,
                image_url: "inmage/ASUS ROG Strix SCAR 18 G835LWGTQ349W.png"
            },
            {
                id: "test-asus-rog-strix-g18",
                sku: "LURS-4748",
                name: "ASUS ROG Strix G18 G815LP-TT145W",
                description: "Intel Core Ultra 9 290HX Plus, 16GB DDR5, 1TB SSD, NVIDIA GeForce RTX 5070 8GB, 18-inch WQXGA display.",
                specifications: [
                    "CPU: Core Ultra 9 290HX Plus",
                    "OS: Windows 11 Home SL License",
                    "RAM: 16GB DDR5 5600",
                    "Storage: SSD 1TB M.2",
                    "Graphics: NVIDIA GeForce RTX 5070 8GB",
                    "Display: 18-inch WQXGA (2560 x 1600)",
                    "Battery: 4-cell integrated",
                    "Backlit chiclet keyboard with Copilot key",
                    "ROG backpack and ROG Impact Gaming mouse",
                    "Weight: 3.20 kg · Volt Green",
                    "2 years + 1st Year Warranty"
                ],
                price_usd: 2649,
                image_url: "inmage/ASUS ROG Strix G18 G815LP-TT145W.png"
            },
            {
                id: "test-asus-tuf-fa506ncq",
                sku: "ASUS TUF",
                name: "ASUS TUF Gaming A15 FA506NCQ-HN026W",
                description: "AMD Ryzen 7 170, 16GB DDR5, 512GB M.2 SSD, NVIDIA RTX 3050 4GB, 15.6-inch Full HD IPS display.",
                specifications: [
                    "CPU: AMD Ryzen 7 170",
                    "OS: Windows 11 Home Single Language",
                    "RAM: 16GB DDR5",
                    "Storage: SSD 512GB M.2",
                    "Graphics: NVIDIA RTX 3050 4GB",
                    "Display: 15.6-inch FHD (1920 x 1080) IPS",
                    "Battery: 3-cell",
                    "Backlit chiclet keyboard",
                    "TUF Gaming M3 mouse and TUF backpack",
                    "Weight: 2.30 kg",
                    "2Y + 1st Year Local Perfect Warranty"
                ],
                price_usd: 799,
                image_url: "inmage/asus-tuf-fa506ncq.png"
            }
        ];
        const products = data?.length ? [...data, ...fallbackProducts] : fallbackProducts;
        list.replaceChildren();
        localStorage.setItem("rezekee-products", JSON.stringify(products));
        const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
        for (const product of products) {
            const card = document.createElement("article");
            card.className = "product-card";
            if (product.id === "test-asus-rog-strix-g16") {
                card.classList.add("product-card--roomy-image");
            }
            card.id = `product-${product.id}`;
            card.dataset.productId = String(product.id);
            const imageUrls = Array.isArray(product.image_urls) && product.image_urls.length
                ? product.image_urls
                : (product.image_url ? [product.image_url] : []);
            const gallery = document.createElement("div");
            gallery.className = "product-gallery";
            if (imageUrls[0]) {
                const image = document.createElement("img");
                image.src = imageUrls[0];
                image.alt = product.name;
                image.loading = "eager";
                image.decoding = "async";
                gallery.append(image);
            }
            const galleryCount = document.createElement("span");
            galleryCount.className = "gallery-count";
            galleryCount.textContent = `${imageUrls.length || 0}/${imageUrls.length || 0}`;
            gallery.append(galleryCount);
            card.append(gallery);
            const meta = document.createElement("div");
            meta.className = "product-meta";
            const sku = document.createElement("span");
            sku.className = "product-sku";
            sku.textContent = product.sku || "";
            const rating = document.createElement("span");
            rating.className = "product-rating";
            rating.setAttribute("aria-label", "4 out of 5 stars");
            rating.textContent = "★ ★ ★ ★";
            const stock = document.createElement("span");
            stock.className = "product-stock";
            stock.textContent = "● In Stock";
            meta.append(sku, rating, stock);
            card.append(meta);
            const title = document.createElement("h2");
            title.textContent = product.name;
            card.append(title);
            const parsedCompact = parseSpecificationItems(product.specifications);
            const parsedFull = parseSpecificationItems(product.description);
            const storedSpecifications = parsedCompact.length ? parsedCompact : parsedFull;
            let cardSpecifications = storedSpecifications.slice(0, 10);
            if (product.id === "test-asus-rog-zephyrus-g16") {
                cardSpecifications = [
                    "CPU: Core Ultra 9 Processor 386H",
                    "OS: Windows 11 Home SL License",
                    "RAM: 32GB LPDDR5X 8533",
                    "Storage: SSD 1TB M.2 2280",
                    "Graphic: NVIDIA RTX™ 5070 Ti 12GB",
                    "Display: HDR 16-inch 2.5K OLED 240Hz",
                    "Battery: 4-cell 90WHrs",
                    "ROG Mouse & ROG G16 Sleeve",
                    "Backlit Chiclet Keyboard 1-Zone RGB",
                    "Weight: 1.95 Kg · Platinum White"
                ];
            }
            if (cardSpecifications.length) {
                const specifications = document.createElement("ul");
                specifications.className = "product-specifications";
                for (const specification of cardSpecifications) {
                    const item = document.createElement("li");
                    item.textContent = specification;
                    specifications.append(item);
                }
                card.append(specifications);
                const extraDetails = document.createElement("p");
                extraDetails.className = "product-extra-details";
                extraDetails.textContent = product.description;
                card.append(extraDetails);
            } else {
                const description = document.createElement("p");
                description.className = "product-description";
                description.textContent = product.description;
                card.append(description);
            }
            const price = document.createElement("p");
            price.className = "product-price";
            const originalPrice = Number(product.price_usd);
            const discountPercent = Math.min(100, Math.max(0, Number(product.discount_percent || 0)));
            const salePrice = originalPrice * (1 - discountPercent / 100);
            if (discountPercent > 0) {
                price.innerHTML = `<span class="product-price-original">${formatter.format(originalPrice)}</span><span class="product-price-sale">${formatter.format(salePrice)}</span><span class="product-discount-badge">${discountPercent}% OFF</span>`;
            } else {
                price.textContent = formatter.format(originalPrice);
            }
            const actions = document.createElement("div");
            actions.className = "product-actions";
            const addToCart = document.createElement("button");
            addToCart.type = "button";
            addToCart.className = "add-to-cart";
            addToCart.innerHTML = '<svg class="button-cart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="9.5" cy="19" r="1.2" fill="currentColor"></circle><circle cx="18" cy="19" r="1.2" fill="currentColor"></circle></svg><span>Add To Basket</span>';
            addToCart.addEventListener("click", () => {
                window.dispatchEvent(new CustomEvent("rezekee:add-to-cart", {
                    detail: {
                        product: {
                            id: String(product.id),
                            name: product.name,
                            price: salePrice,
                            image: imageUrls[0] || "",
                            image_urls: imageUrls
                        }
                    }
                }));
            });
            const favoriteButton = document.createElement("button");
            favoriteButton.type = "button";
            favoriteButton.className = "favorite-product-button";
            favoriteButton.textContent = "♡";
            favoriteButton.setAttribute("aria-label", "Add to favorites");
            favoriteButton.setAttribute("aria-pressed", "false");
            favoriteButton.addEventListener("click", () => {
                window.dispatchEvent(new CustomEvent("rezekee:toggle-favorite", {
                    detail: {
                        product: {
                            id: String(product.id),
                            name: product.name,
                            price: salePrice,
                            image: imageUrls[0] || "",
                            image_urls: imageUrls,
                            sku: typeof product.sku === "string" ? product.sku : "",
                            description: typeof product.description === "string" ? product.description : "",
                            specifications: storedSpecifications
                        }
                    }
                }));
            });
            const seeMore = document.createElement("button");
            seeMore.type = "button";
            seeMore.className = "see-more";
            seeMore.textContent = "◉  See More";
            seeMore.setAttribute("aria-expanded", "false");
            seeMore.innerHTML = '<img class="button-eye-icon" src="inmage/image-removebg-preview.png" alt=""><span>See More</span>';
            seeMore.addEventListener("click", () => {
                const expanded = card.classList.toggle("is-expanded");
                const seeMoreLabel = seeMore.querySelector("span");
                if (seeMoreLabel) seeMoreLabel.textContent = expanded ? "Hide Details" : "See More";
                else seeMore.textContent = expanded ? "Hide Details" : "◉  See More";
                seeMore.setAttribute("aria-expanded", String(expanded));
            });
            seeMore.addEventListener("click", () => {
                localStorage.setItem("rezekee-selected-product", JSON.stringify(product));
                window.location.href = `product-details.html?id=${encodeURIComponent(product.id)}`;
            });
            actions.append(addToCart, favoriteButton, seeMore);
            card.append(price, actions);
            list.append(card);
        }
        window.dispatchEvent(new CustomEvent("rezekee:products-loaded", { detail: { products } }));
    }

    loadPageContent();
    loadProducts();
})();
