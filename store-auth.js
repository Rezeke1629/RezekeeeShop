(() => {
    const dialog = document.getElementById("authDialog");
    const profileButton = document.getElementById("profileButton");
    const phoneForm = document.getElementById("phoneForm");
    const otpForm = document.getElementById("otpForm");
    const accountView = document.getElementById("accountView");
    const phoneInput = document.getElementById("authPhone");
    const codeInput = document.getElementById("authCode");
    const message = document.getElementById("authMessage");
    const signedInPhone = document.getElementById("signedInPhone");
    const sendCodeButton = document.getElementById("sendCodeButton");
    const verifyCodeButton = document.getElementById("verifyCodeButton");
    const signOutButton = document.getElementById("signOutButton");
    const changePhoneButton = document.getElementById("changePhoneButton");
    const googleSignInButton = document.getElementById("googleSignInButton");
    const phonePicker = typeof window.intlTelInput === "function"
        ? window.intlTelInput(phoneInput, {
            initialCountry: "kh",
            countryOrder: ["kh"],
            separateDialCode: true,
            loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js")
        })
        : null;
    let client;
    let pendingPhone = "";

    function showMessage(text, isError = false) {
        message.textContent = text;
        message.classList.toggle("error", isError);
    }

    function setBusy(isBusy) {
        [sendCodeButton, verifyCodeButton, signOutButton, changePhoneButton, googleSignInButton].forEach((button) => {
            button.disabled = isBusy;
        });
    }

    function setAccount(user) {
        const identity = user && (user.email || user.phone);
        if (identity) {
            signedInPhone.textContent = `Signed in as ${identity}`;
            profileButton.setAttribute("aria-label", `Account: ${identity}`);
            profileButton.title = `Account: ${identity}`;
            phoneForm.hidden = true;
            otpForm.hidden = true;
            accountView.hidden = false;
        } else {
            profileButton.setAttribute("aria-label", "Sign in with phone");
            profileButton.title = "Sign in";
            accountView.hidden = true;
        }
    }

    function getClient() {
        if (client) return client;
        const config = window.REZEKEE_SUPABASE_CONFIG;
        if (!config || !config.url || !config.anonKey) {
            throw new Error("Authentication is not configured yet. Add your Supabase project URL and public anon key to supabase-config.js.");
        }
        if (!window.supabase || typeof window.supabase.createClient !== "function") {
            throw new Error("The Supabase client did not load. Check your internet connection and reload the page.");
        }
        client = window.supabase.createClient(config.url, config.anonKey);
        client.auth.onAuthStateChange((_event, session) => {
            setAccount(session && session.user);
        });
        return client;
    }

    profileButton.addEventListener("click", async () => {
        phoneForm.hidden = false;
        otpForm.hidden = true;
        accountView.hidden = true;
        showMessage("");
        dialog.showModal();
        try {
            const { data, error } = await getClient().auth.getSession();
            if (error) throw error;
            setAccount(data.session && data.session.user);
        } catch (error) {
            showMessage(error.message || "Unable to check your account.", true);
        }
    });

    googleSignInButton.addEventListener("click", async () => {
        if (!["http:", "https:"].includes(window.location.protocol)) {
            showMessage("Google sign-in requires the site to run on localhost or a hosted URL, not directly from a file.", true);
            return;
        }
        setBusy(true);
        showMessage("");
        try {
            const { error } = await getClient().auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.href }
            });
            if (error) throw error;
        } catch (error) {
            showMessage(error.message || "Unable to start Google sign-in.", true);
            setBusy(false);
        }
    });

    phoneForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        setBusy(true);
        showMessage("");
        try {
            if (!phonePicker) {
                throw new Error("The country selector did not load. Check your internet connection and reload the page.");
            }
            await phonePicker.promise;
            const phone = phonePicker.getNumber();
            if (!phonePicker.isValidNumber() || !/^\+[1-9]\d{7,14}$/.test(phone)) {
                showMessage("Enter a valid phone number for the selected country.", true);
                phoneInput.focus();
                return;
            }
            const { error } = await getClient().auth.signInWithOtp({ phone });
            if (error) throw error;
            pendingPhone = phone;
            phoneForm.hidden = true;
            otpForm.hidden = false;
            codeInput.focus();
            showMessage(`A verification code was sent to ${phone}.`);
        } catch (error) {
            showMessage(error.message || "Unable to send a verification code.", true);
        } finally {
            setBusy(false);
        }
    });

    otpForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const token = codeInput.value.trim();
        if (!token) {
            showMessage("Enter the verification code from your SMS.", true);
            codeInput.focus();
            return;
        }
        setBusy(true);
        showMessage("");
        try {
            const { data, error } = await getClient().auth.verifyOtp({
                phone: pendingPhone,
                token,
                type: "sms"
            });
            if (error) throw error;
            setAccount(data.user);
            codeInput.value = "";
            showMessage("Your phone is verified and you are signed in.");
        } catch (error) {
            showMessage(error.message || "Unable to verify that code.", true);
        } finally {
            setBusy(false);
        }
    });

    changePhoneButton.addEventListener("click", () => {
        pendingPhone = "";
        codeInput.value = "";
        otpForm.hidden = true;
        phoneForm.hidden = false;
        showMessage("");
        phoneInput.focus();
    });

    signOutButton.addEventListener("click", async () => {
        setBusy(true);
        showMessage("");
        try {
            const { error } = await getClient().auth.signOut();
            if (error) throw error;
            pendingPhone = "";
            phoneForm.hidden = false;
            otpForm.hidden = true;
            accountView.hidden = true;
            showMessage("You have signed out.");
        } catch (error) {
            showMessage(error.message || "Unable to sign out.", true);
        } finally {
            setBusy(false);
        }
    });

    document.querySelectorAll("[data-auth-close]").forEach((button) => {
        button.addEventListener("click", () => dialog.close());
    });
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
    });
})();
