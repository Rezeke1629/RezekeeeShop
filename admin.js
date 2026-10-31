(() => {
    const loginSection = document.getElementById("loginSection");
    const loginForm = document.getElementById("loginForm");
    const loginButton = document.getElementById("loginButton");
    const dashboard = document.getElementById("dashboard");
    const status = document.getElementById("dashboardStatus");
    const ownerIdentity = document.getElementById("ownerIdentity");
    const productForm = document.getElementById("productForm");
    const productList = document.getElementById("productList");
    const cancelProductEdit = document.getElementById("cancelProductEdit");
    const contentForm = document.getElementById("contentForm");
    const logoutButton = document.getElementById("logoutButton");
    const config = window.REZEKEE_SUPABASE_CONFIG;
    let client;
    let products = [];

    function showStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle("error", isError);
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

            const isBullet = /^[-?]/.test(line);
            const hasKey = /^[A-Za-z0-9][\w\s/&.'"-]{1,30}:/.test(line);

            if (!isBullet && !hasKey && currentItem) {
                currentItem += "; " + line;
                results[results.length - 1] = currentItem;
                continue;
            }

            const parts = line.split(/(?<=[\s,;])[-?]\s*(?=[A-Za-z0-9])|^[-?]\s*/);
            for (const part of parts) {
                let cleaned = part.trim();
                cleaned = cleaned.replace(/^[-?\s:]+/, "").replace(/[\s,;]+$/, "");
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

    function getClient() {
        // Return the existing shared client if it's already created
        if (window.supabaseClient) return window.supabaseClient;
        
        if (!config || !config.url || !config.anonKey) {
            throw new Error("Supabase is not configured. Check supabase-config.js.");
        }
        if (!window.supabase || typeof window.supabase.createClient !== "function") {
            throw new Error("Supabase did not load. Check your internet connection and reload.");
        }
    
    // Create it once and store it globally
    window.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    return window.supabaseClient;
}

    function setBusy(button, busy) {
        button.disabled = busy;
    }

    function clampDiscount(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return 0;
        return Math.min(100, Math.max(0, number));
    }

    function trimPercent(value) {
        return String(Math.round(value * 100) / 100);
    }

    function readDiscountDrafts() {
        try {
            const parsed = JSON.parse(localStorage.getItem("rezekee-discount-drafts") || "{}");
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function writeDiscountDrafts(drafts) {
        try {
            localStorage.setItem("rezekee-discount-drafts", JSON.stringify(drafts));
        } catch (error) {
            // Storage may be unavailable; discounts still save without the on/off memory.
        }
    }

    function syncShopCache() {
        try {
            const active = products.filter((product) => product.is_active !== false);
            localStorage.setItem("rezekee-products", JSON.stringify(active));
        } catch (error) {
            // Storage may be unavailable; the shop fetches from Supabase directly.
        }
    }

    async function saveProductDiscount(product, percent, rememberPrevious) {
        const next = clampDiscount(percent);
        const previous = clampDiscount(product.discount_percent);
        const drafts = readDiscountDrafts();
        if (next > 0) {
            drafts[product.id] = next;
        } else if (rememberPrevious && previous > 0) {
            drafts[product.id] = previous;
        } else {
            delete drafts[product.id];
        }
        writeDiscountDrafts(drafts);
        const { error } = await getClient().from("products").update({ discount_percent: next }).eq("id", product.id);
        if (error) throw error;
        // Keep the in-memory row in sync so the badge updates instantly, then refresh the shop cache.
        product.discount_percent = next;
        syncShopCache();
        await renderProducts();
    }

    function buildDiscountBox(product) {
        const drafts = readDiscountDrafts();
        const current = clampDiscount(product.discount_percent);
        const remembered = clampDiscount(drafts[product.id]);
        const box = document.createElement("div");
        box.className = "row-discount";

        const badge = document.createElement("span");
        badge.className = "discount-badge" + (current > 0 ? " on" : "");
        badge.textContent = current > 0 ? `${trimPercent(current)}% OFF` : "Discount off";
        badge.title = "Discount currently shown in the shop";

        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = "100";
        input.step = "0.01";
        input.className = "discount-input";
        input.placeholder = "%";
        input.setAttribute("aria-label", `Discount percent for ${product.name}`);
        input.value = current > 0 ? trimPercent(current) : (remembered > 0 ? trimPercent(remembered) : "");

        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.className = "discount-toggle";
        toggle.checked = current > 0;
        toggle.dataset.discountToggle = product.id;
        const toggleLabel = document.createElement("label");
        toggleLabel.className = "switch";
        toggleLabel.title = current > 0 ? "Turn this discount off" : "Turn this discount on";
        toggleLabel.append(toggle, document.createTextNode("On"));

        const apply = document.createElement("button");
        apply.type = "button";
        apply.className = "secondary";
        apply.dataset.discountApply = product.id;
        apply.textContent = "Set discount";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "danger";
        remove.dataset.discountRemove = product.id;
        remove.textContent = "Remove";
        remove.title = "Take the discount out completely";

        box.append(badge, input, toggleLabel, apply, remove);
        return box;
    }

    const setupCategoryLabels = {
        gpu: "Graphics card",
        cpu: "Processor (CPU)",
        ram: "Memory (RAM)",
        storage: "Storage drive",
        monitor: "Monitor",
        peripherals: "Keyboard, mouse & headset"
    };

    async function renderProducts() {
        const { data, error } = await getClient()
            .from("products")
            .select("id,sku,name,description,specifications,price_usd,discount_percent,image_url,image_urls,setup_category,is_active")
            .order("created_at", { ascending: false });
        if (error) throw error;
        products = data;
        syncShopCache();
        productList.replaceChildren();
        if (!products.length) {
            productList.textContent = "No products yet. Add your first product above.";
            return;
        }
        for (const product of products) {
            const row = document.createElement("article");
            row.className = "product-row";
            const info = document.createElement("div");
            info.className = "product-info";
            const imageUrl = Array.isArray(product.image_urls) && product.image_urls.length
                ? product.image_urls[0]
                : product.image_url;
            if (imageUrl) {
                const image = document.createElement("img");
                image.src = imageUrl;
                image.alt = "";
                image.loading = "lazy";
                info.append(image);
            }
            const details = document.createElement("div");
            const name = document.createElement("h3");
            name.textContent = product.name;
            const description = document.createElement("p");
            const setupLabel = setupCategoryLabels[product.setup_category] ? ` · Setup: ${setupCategoryLabels[product.setup_category]}` : "";
            description.textContent = `${product.description || "No description"} · $${Number(product.price_usd).toFixed(2)} USD · ${product.is_active ? "Visible" : "Hidden"}${setupLabel}`;
            details.append(name, description);
            info.append(details);
            const actions = document.createElement("div");
            actions.className = "actions";
            const edit = document.createElement("button");
            edit.type = "button";
            edit.className = "secondary";
            edit.dataset.editProduct = product.id;
            edit.textContent = "Edit";
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "danger";
            remove.dataset.deleteProduct = product.id;
            remove.textContent = "Delete";
            actions.append(edit, remove);
            row.append(info, actions, buildDiscountBox(product));
            productList.append(row);
        }
    }

    async function loadSiteContent() {
        const keys = ["home_title", "home_body", "about_title", "about_body"];
        const { data, error } = await getClient()
            .from("site_content")
            .select("key,value")
            .in("key", keys);
        if (error) throw error;
        const values = Object.fromEntries(data.map(({ key, value }) => [key, value]));
        document.getElementById("homeTitle").value = values.home_title || "";
        document.getElementById("homeBody").value = values.home_body || "";
        document.getElementById("aboutTitle").value = values.about_title || "";
        document.getElementById("aboutBody").value = values.about_body || "";
    }

    async function showDashboard(user) {
        const { data, error } = await getClient().rpc("is_store_admin");
        if (error) throw error;
        if (!data) {
            await getClient().auth.signOut();
            loginSection.hidden = false;
            dashboard.hidden = true;
            showStatus("This account is not authorized as the shop owner. Ask the project owner to grant access in Supabase.", true);
            return;
        }
        ownerIdentity.textContent = `Signed in as ${user.email || "owner"}`;
        loginSection.hidden = true;
        dashboard.hidden = false;
        await Promise.all([renderProducts(), loadSiteContent()]);
        showStatus("");
    }

    function resetProductForm() {
        productForm.reset();
        document.getElementById("productId").value = "";
        document.getElementById("productSku").value = "";
        document.getElementById("productSpecifications").value = "";
        document.getElementById("productDiscount").value = "0";
        document.getElementById("productSetupCategory").value = "";
        document.getElementById("productActive").checked = true;
        document.getElementById("saveProductButton").textContent = "Add product";
        cancelProductEdit.hidden = true;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setBusy(loginButton, true);
        showStatus("");
        try {
            const { data, error } = await getClient().auth.signInWithPassword({
                email: document.getElementById("ownerEmail").value.trim(),
                password: document.getElementById("ownerPassword").value
            });
            if (error) throw error;
            await showDashboard(data.user);
        } catch (error) {
            showStatus(error.message || "Unable to sign in.", true);
        } finally {
            setBusy(loginButton, false);
        }
    });

    productForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const saveButton = document.getElementById("saveProductButton");
        setBusy(saveButton, true);
        showStatus("");
        try {
            const imageUrls = document.getElementById("productImages").value
                .split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
            for (const imageUrl of imageUrls) {
                if (!["https:", "http:"].includes(new URL(imageUrl).protocol)) {
                    throw new Error("Every product image URL must start with http:// or https://.");
                }
            }
            const rawSpecInput = document.getElementById("productSpecifications").value.trim();
            const rawDescInput = document.getElementById("productDescription").value.trim();
            const parsedSpecs = parseSpecificationItems(rawSpecInput);
            const finalSpecs = parsedSpecs.length
                ? parsedSpecs.join("\n")
                : (rawDescInput ? parseSpecificationItems(rawDescInput).slice(0, 10).join("\n") : "");

            const product = {
                sku: document.getElementById("productSku").value.trim(),
                name: document.getElementById("productName").value.trim(),
                description: rawDescInput,
                specifications: finalSpecs,
                price_usd: Number(document.getElementById("productPrice").value),
                discount_percent: Number(document.getElementById("productDiscount").value || 0),
                image_url: imageUrls[0] || "",
                image_urls: imageUrls,
                setup_category: document.getElementById("productSetupCategory").value,
                is_active: document.getElementById("productActive").checked
            };
            if (!product.name || !Number.isFinite(product.price_usd) || product.price_usd < 0) {
                throw new Error("Enter a product name and a valid price.");
            }
            const id = document.getElementById("productId").value;
            const request = id
                ? getClient().from("products").update(product).eq("id", id)
                : getClient().from("products").insert(product);
            const { error } = await request;
            if (error) throw error;
            resetProductForm();
            await renderProducts();
            showStatus(id ? "Product updated." : "Product added.");
        } catch (error) {
            showStatus(error.message || "Unable to save product.", true);
        } finally {
            setBusy(saveButton, false);
        }
    });

    productList.addEventListener("click", async (event) => {
        if (!(event.target instanceof Element)) return;
        const applyDiscountButton = event.target.closest("[data-discount-apply]");
        if (applyDiscountButton) {
            await handleDiscountAction(applyDiscountButton, "apply");
            return;
        }
        const removeDiscountButton = event.target.closest("[data-discount-remove]");
        if (removeDiscountButton) {
            await handleDiscountAction(removeDiscountButton, "remove");
            return;
        }
        const editButton = event.target.closest("[data-edit-product]");
        const deleteButton = event.target.closest("[data-delete-product]");
        if (editButton) {
            const product = products.find((item) => item.id === editButton.dataset.editProduct);
            if (!product) return;
            document.getElementById("productId").value = product.id;
            document.getElementById("productSku").value = product.sku || "";
            document.getElementById("productName").value = product.name;
            document.getElementById("productDescription").value = product.description || "";
            document.getElementById("productSpecifications").value = parseSpecificationItems(product.specifications || "").join("\n");
            document.getElementById("productPrice").value = product.price_usd;
            document.getElementById("productDiscount").value = product.discount_percent || 0;
            document.getElementById("productImages").value = (Array.isArray(product.image_urls) && product.image_urls.length
                ? product.image_urls
                : (product.image_url ? [product.image_url] : [])).join("\n");
            document.getElementById("productSetupCategory").value = product.setup_category || "";
            document.getElementById("productActive").checked = product.is_active;
            document.getElementById("saveProductButton").textContent = "Save changes";
            cancelProductEdit.hidden = false;
            document.getElementById("productName").focus();
            return;
        }
        if (deleteButton) {
            const product = products.find((item) => item.id === deleteButton.dataset.deleteProduct);
            if (!product || !window.confirm(`Delete "${product.name}" from the catalog?`)) return;
            deleteButton.disabled = true;
            showStatus("");
            try {
                const { error } = await getClient().from("products").delete().eq("id", product.id);
                if (error) throw error;
                await renderProducts();
                showStatus("Product deleted.");
            } catch (error) {
                showStatus(error.message || "Unable to delete product.", true);
                deleteButton.disabled = false;
            }
        }
    });

    async function handleDiscountAction(button, mode) {
        const productId = button.dataset.discountApply || button.dataset.discountRemove;
        const product = products.find((item) => item.id === productId);
        if (!product) return;
        const row = button.closest(".product-row");
        const input = row ? row.querySelector(".discount-input") : null;
        let percent = 0;
        if (mode === "apply") {
            percent = clampDiscount(input ? input.value : NaN);
            if (percent <= 0) {
                showStatus("Enter a discount between 1 and 100 percent to put it on.", true);
                if (input) input.focus();
                return;
            }
        }
        setBusy(button, true);
        showStatus("");
        try {
            await saveProductDiscount(product, percent, mode !== "remove");
            showStatus(mode === "apply"
                ? `Discount of ${trimPercent(percent)}% is now on ${product.name}.`
                : `Discount taken out of ${product.name}.`);
        } catch (error) {
            showStatus(error.message || "Unable to update the discount.", true);
            setBusy(button, false);
        }
    }

    productList.addEventListener("change", async (event) => {
        if (!(event.target instanceof Element)) return;
        const toggle = event.target.closest("[data-discount-toggle]");
        if (!toggle) return;
        const product = products.find((item) => item.id === toggle.dataset.discountToggle);
        if (!product) return;
        const row = toggle.closest(".product-row");
        const input = row ? row.querySelector(".discount-input") : null;
        toggle.disabled = true;
        showStatus("");
        try {
            if (toggle.checked) {
                const drafts = readDiscountDrafts();
                const source = input && input.value !== "" ? input.value : drafts[product.id];
                const percent = clampDiscount(source);
                if (percent <= 0) {
                    throw new Error("Type a discount percentage first, then switch it on.");
                }
                await saveProductDiscount(product, percent, true);
                showStatus(`Discount switched on for ${product.name} (${trimPercent(percent)}%).`);
            } else {
                const previous = clampDiscount(product.discount_percent);
                await saveProductDiscount(product, 0, true);
                showStatus(previous > 0
                    ? `Discount switched off for ${product.name}. Switch it back on to restore ${trimPercent(previous)}%.`
                    : `Discount is off for ${product.name}.`);
            }
        } catch (error) {
            showStatus(error.message || "Unable to update the discount.", true);
            if (toggle.isConnected) {
                toggle.disabled = false;
                toggle.checked = clampDiscount(product.discount_percent) > 0;
                if (input && clampDiscount(input.value) <= 0) input.focus();
            }
        }
    });

    cancelProductEdit.addEventListener("click", resetProductForm);

    const autoFormatSpecsBtn = document.getElementById("autoFormatSpecsBtn");
    if (autoFormatSpecsBtn) {
        autoFormatSpecsBtn.addEventListener("click", () => {
            const specField = document.getElementById("productSpecifications");
            const descField = document.getElementById("productDescription");
            const source = specField.value.trim() || descField.value.trim();
            if (!source) {
                showStatus("Paste some specifications or description first.", true);
                return;
            }
            const items = parseSpecificationItems(source);
            if (items.length) {
                specField.value = items.join("\n");
                showStatus(`Formatted ${items.length} specifications.`);
            } else {
                showStatus("No specifications could be detected.", true);
            }
        });
    }

    contentForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const saveButton = document.getElementById("saveContentButton");
        setBusy(saveButton, true);
        showStatus("");
        try {
            const rows = [
                ["home_title", "homeTitle"],
                ["home_body", "homeBody"],
                ["about_title", "aboutTitle"],
                ["about_body", "aboutBody"]
            ].map(([key, id]) => ({ key, value: document.getElementById(id).value.trim() }));
            const { error } = await getClient().from("site_content").upsert(rows, { onConflict: "key" });
            if (error) throw error;
            showStatus("Page text saved. Refresh the public pages to see the changes.");
        } catch (error) {
            showStatus(error.message || "Unable to save page text.", true);
        } finally {
            setBusy(saveButton, false);
        }
    });

    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        try {
            const { error } = await getClient().auth.signOut();
            if (error) throw error;
            dashboard.hidden = true;
            loginSection.hidden = false;
            showStatus("Signed out.");
        } catch (error) {
            showStatus(error.message || "Unable to sign out.", true);
        } finally {
            logoutButton.disabled = false;
        }
    });
// Paste it right here at the bottom of admin.js
async function deleteProduct(productID) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  const { error } = await window.supabaseClient
    .from('products')
    .delete()
    .eq('id', productID);

  if (error) {
    console.error('Error deleting product:', error.message);
    alert('Failed to delete product: ' + error.message);
  } else {
    console.log('Product deleted successfully!');
    location.reload(); 
  }
}
     async function deleteProductByName(productName) {
  if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

  const { error } = await window.supabaseClient
    .from('products')
    .delete()
    .eq('name', productName); // Targets the name column instead of ID

  if (error) {
    console.error('Error deleting product:', error.message);
    alert('Failed to delete product: ' + error.message);
  } else {
    console.log('Product deleted successfully!');
    location.reload(); 
  }
}
    async function restoreSession() {
        try {
            const { data, error } = await getClient().auth.getSession();
            if (error) throw error;
            if (data.session) await showDashboard(data.session.user);
        } catch (error) {
            showStatus(error.message || "Unable to connect to Supabase.", true);
        }
    }

    restoreSession();
})();
