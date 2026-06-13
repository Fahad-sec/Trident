/**
 * TRIDENT PROPOSAL SUITE — DATA LAYER
 * Supabase integration: fetches the latest pipeline record from proposal_data.
 */

const SUPABASE_URL = "https://rdmtfjehzatfwppsawzc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_gS8yuDOJyH6mKvdIzGWf_w_IPPHavYB";

// Single shared Supabase client instance
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetches the newest record from proposal_data and passes it to the callback.
 * Used after the backend writes a completed result so the UI can hydrate.
 * @param {Function} callback - Receives the structured dataset object
 */
async function loadLatestProposal(callback) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/proposal_data?select=*&order=created_at.desc&limit=1`,
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Supabase responded with status ${response.status}`);
        }

        const records = await response.json();

        if (!records || records.length === 0) {
            throw new Error("No records found. Run the backend pipeline first.");
        }

        const row = records[0];

        // Map DB columns → keys expected by renderDatasetToDashboard()
        const dataset = {
            winProbability:  row.win_probability,
            budgetScore:     row.budget_score,
            capabilityScore: row.capability_score,
            decision:        row.decision,
            compliance:      row.compliance,
            directives:      row.directives,
            proposalNarrative: row.proposal_narrative
        };

        callback(dataset);

    } catch (err) {
        console.error("loadLatestProposal error:", err);
        alert(`Data fetch failed: ${err.message}`);
    }
}

// Keep the old name as an alias so nothing else breaks
const simulateModelInference = loadLatestProposal;
