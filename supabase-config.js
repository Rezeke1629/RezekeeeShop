window.REZEKEE_SUPABASE_CONFIG = {
    url: "https://xtvaaopjrsajfeyirabr.supabase.co",
    anonKey: "sb_publishable_-F03YOk96LNHHdbWa4oORw_ZKpEfKpQ"
};

// Initialize the Supabase client only if it hasn't been created yet
if (!window.supabaseClient && window.supabase) {
    window.supabaseClient = window.supabase.createClient(
        window.REZEKEE_SUPABASE_CONFIG.url,
        window.REZEKEE_SUPABASE_CONFIG.anonKey
    );
}
