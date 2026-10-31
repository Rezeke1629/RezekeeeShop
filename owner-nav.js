(() => {
    const dashboardLink = document.querySelector("[data-owner-dashboard]");
    const config = window.REZEKEE_SUPABASE_CONFIG;
    if (!dashboardLink || !config || !config.url || !config.anonKey ||
        !window.supabase || typeof window.supabase.createClient !== "function") return;

    const client = window.supabase.createClient(config.url, config.anonKey);
    let checkId = 0;

    async function updateOwnerLink(session) {
        const currentCheck = ++checkId;
        dashboardLink.hidden = true;
        if (!session) return;
        const { data, error } = await client.rpc("is_store_admin");
        if (error) throw error;
        if (currentCheck === checkId) dashboardLink.hidden = !data;
    }

    client.auth.onAuthStateChange((_event, session) => {
        updateOwnerLink(session).catch((error) => {
            dashboardLink.hidden = true;
            console.error("Could not verify owner access for dashboard navigation:", error.message);
        });
    });

    client.auth.getSession()
        .then(({ data, error }) => {
            if (error) throw error;
            return updateOwnerLink(data.session);
        })
        .catch((error) => {
            dashboardLink.hidden = true;
            console.error("Could not check owner session for dashboard navigation:", error.message);
        });
})();
