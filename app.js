/**
 * TRIDENT PROPOSAL SUITE — APP CONTROLLER
 *
 * Fixes applied vs. previous version:
 *  1. uploadRFPToBackend() sends FormData with field name "file" (matches FastAPI).
 *  2. No fetch timeout — Claude+RAG can take 30-90 s; spinner runs the whole time.
 *  3. loadLatestProposal() is called AFTER the POST resolves, never in parallel.
 *  4. CORS: the fetch goes to the backend origin only; no credentials: 'include'
 *     which would require a more restrictive CORS policy on the server.
 *  5. initializePhysicalUploadBridge() now routes drops/clicks through
 *     uploadRFPToBackend() instead of the old Supabase-direct path.
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BACKEND_URL = "https://profusely-headphone-latitude.ngrok-free.dev";

// ─── SECTION 1: NAVIGATION & TAB CONTROLLER ──────────────────────────────────
function switchTab(tabId) {
    const tabs = ['uploadTab', 'complianceTab', 'draftTab'];

    tabs.forEach(id => {
        const el  = document.getElementById(id);
        const btn = document.getElementById(`btn-${id}`);
        if (!el || !btn) return;

        if (id === tabId) {
            el.classList.remove('hidden');
            btn.className = "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium bg-enterprise-800 text-white transition-all text-left";
        } else {
            el.classList.add('hidden');
            btn.className = "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium text-slate-400 hover:bg-enterprise-800/60 hover:text-white transition-all text-left";
        }
    });
}

// ─── SECTION 2: METRIC VISUALISATION ANIMATIONS ──────────────────────────────
const activeMetricIntervals = {};

function animateMetricValue(elementId, targetValue, appendPercent = false) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (activeMetricIntervals[elementId]) {
        clearInterval(activeMetricIntervals[elementId]);
    }

    let current  = 0;
    const fps    = 60;
    const step   = targetValue / (1000 / (1000 / fps));   // reach target in ~1 s

    activeMetricIntervals[elementId] = setInterval(() => {
        current += step;
        if (current >= targetValue) {
            clearInterval(activeMetricIntervals[elementId]);
            delete activeMetricIntervals[elementId];
            el.textContent = targetValue + (appendPercent ? "%" : "");
        } else {
            el.textContent = Math.floor(current) + (appendPercent ? "%" : "");
        }
    }, 1000 / fps);
}

function animateProgressBar(barId, valueId, targetScore) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    bar.style.width = targetScore + "%";
    animateMetricValue(valueId, targetScore, true);
}

function streamProposalNarrative(elementId, fullRawText, onCompleteCallback) {
    const workspace = document.getElementById(elementId);
    if (!workspace) { if (onCompleteCallback) onCompleteCallback(); return; }

    workspace.value = "";
    const lines   = fullRawText.split('\n');
    let   pointer = 0;

    const streamInterval = setInterval(() => {
        if (pointer < lines.length) {
            workspace.value += lines[pointer] + '\n';
            workspace.scrollTop = workspace.scrollHeight;
            pointer++;
        } else {
            clearInterval(streamInterval);
            if (onCompleteCallback) onCompleteCallback();
        }
    }, 100);
}

// ─── SECTION 3: DATA HYDRATION GRID RENDERING ────────────────────────────────
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function hydrateComplianceDataGrid(complianceRecords) {
    const tableBody = document.getElementById('complianceTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = "";

    complianceRecords.forEach(record => {
        const flagStyle = record.status === "NON-COMPLIANT"
            ? "bg-rose-950/40 text-rose-400 border-rose-900"
            : "bg-emerald-950/40 text-emerald-400 border-emerald-900";

        tableBody.innerHTML += `
            <tr class="hover:bg-enterprise-900/40 transition-colors">
                <td class="px-5 py-3 text-slate-500 font-bold">${escapeHTML(record.id)}</td>
                <td class="px-5 py-3 text-slate-300 font-sans tracking-tight">${escapeHTML(record.req)}</td>
                <td class="px-5 py-3 text-slate-400 font-sans text-[11px] leading-relaxed">${escapeHTML(record.match)}</td>
                <td class="px-5 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${flagStyle}">
                        ${escapeHTML(record.status)}
                    </span>
                </td>
            </tr>`;
    });
}

function hydrateDirectiveNodeFeed(directivesList) {
    const container = document.getElementById('rfpContextArea');
    if (!container) return;

    container.innerHTML = "";
    directivesList.forEach(segment => {
        // directives may contain intentional <strong>/<br> — render them directly
        // (they come from our own backend, not user input, so this is safe)
        container.innerHTML += `
            <div class="bg-enterprise-900 p-3.5 rounded border border-enterprise-800 font-sans text-xs text-slate-400 leading-normal">
                ${segment}
            </div>`;
    });
}

// ─── SECTION 4: SPINNER HELPERS ───────────────────────────────────────────────
function setEngineStatus(text, color) {
    // color: 'amber' | 'rose' | 'emerald' | 'slate'
    const statusEl = document.getElementById('coreEngineStatus');
    const dotEl    = document.getElementById('statusIndicatorDot');
    if (!statusEl || !dotEl) return;

    statusEl.innerText   = text;
    statusEl.className   = `text-xs font-medium text-${color}-500 font-mono`;

    const dotBase = `w-2 h-2 rounded-full bg-${color}-500`;
    dotEl.className = color === 'amber' ? `${dotBase} animate-ping` : dotBase;
}

function showLoadingOverlay(filename) {
    // Inject a semi-transparent spinner overlay into the drop zone
    const zone = document.getElementById('dropZoneContainer');
    if (!zone) return;

    // Remove any existing overlay first
    const old = document.getElementById('uploadOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'uploadOverlay';
    overlay.className = "absolute inset-0 bg-enterprise-950/80 flex flex-col items-center justify-center rounded z-10 pointer-events-none";
    overlay.innerHTML = `
        <svg class="animate-spin w-8 h-8 text-enterprise-accent mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <p class="text-xs text-slate-300 font-mono">Analysing <span class="text-white font-bold">${escapeHTML(filename)}</span></p>
        <p class="text-[10px] text-slate-500 mt-1">This can take 30–90 seconds — please wait…</p>`;

    // dropZoneContainer must be position:relative for the overlay to anchor
    zone.style.position = 'relative';
    zone.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('uploadOverlay');
    if (overlay) overlay.remove();
}

// ─── SECTION 5: FILE UPLOAD → FASTAPI → SUPABASE → DASHBOARD ─────────────────

/**
 * POST the PDF to FastAPI as multipart/form-data with field name "file".
 * After the backend writes to Supabase, fetch the latest record and render.
 *
 * No fetch timeout is set — the Claude+RAG pipeline legitimately takes
 * 30-90 s and should not be cancelled early.
 */
async function uploadRFPToBackend(file) {
    setEngineStatus(`Uploading: ${file.name}…`, 'amber');
    showLoadingOverlay(file.name);

    // --- 1. Build the multipart body (field MUST be "file" to match FastAPI) ---
    const formData = new FormData();
    formData.append("file", file);          // ← field name matches backend param

    try {
        // --- 2. POST to /analyze (no explicit timeout — let the browser wait) ---
        const response = await fetch(`${BACKEND_URL}/analyze`, {
            method: "POST",
            body: formData
            // Do NOT set Content-Type manually; the browser sets the correct
            // multipart boundary automatically when body is FormData.
            // Do NOT pass credentials:'include' unless the server allows it.
        });

        if (!response.ok) {
            let detail = `HTTP ${response.status}`;
            try { detail = (await response.json()).detail || detail; } catch (_) {}
            throw new Error(detail);
        }

        const result = await response.json();
        console.info("Backend complete. Supabase record ID:", result.record_id);

        setEngineStatus("Fetching results from database…", 'amber');

        // --- 3. AFTER POST resolves, fetch the latest record (sequential, not parallel) ---
        await loadLatestProposal(renderDatasetToDashboard);

    } catch (err) {
        console.error("uploadRFPToBackend error:", err);
        setEngineStatus(`Error: ${err.message}`, 'rose');
        alert(`Pipeline error: ${err.message}`);
    } finally {
        hideLoadingOverlay();
    }
}

// ─── SECTION 6: DRAG-AND-DROP / CLICK UPLOAD BRIDGE ──────────────────────────
function initializePhysicalUploadBridge() {
    const uploadBox = document.getElementById('dropZoneContainer');
    if (!uploadBox) return;

    // Hidden native file input
    const nativeInput = document.createElement('input');
    nativeInput.type      = 'file';
    nativeInput.accept    = '.pdf,.docx';
    nativeInput.className = 'hidden';
    document.body.appendChild(nativeInput);

    // Click anywhere on the drop zone → open file picker
    uploadBox.addEventListener('click', (e) => {
        e.stopPropagation();
        nativeInput.click();
    });

    // File chosen via picker
    nativeInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) uploadRFPToBackend(file);
        nativeInput.value = ""; // reset so same file can be re-selected
    });

    // Drag-over highlight
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('border-emerald-500', 'bg-enterprise-800/20');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('border-emerald-500', 'bg-enterprise-800/20');
    });

    // Drop handler
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('border-emerald-500', 'bg-enterprise-800/20');
        const file = e.dataTransfer.files[0];
        if (file) uploadRFPToBackend(file);
    });
}

// Kept for any inline onclick="triggerIngestionPipeline()" references in HTML
function triggerIngestionPipeline() {
    const box = document.getElementById('dropZoneContainer');
    if (box) box.click();
}

// ─── SECTION 7: DASHBOARD RENDERER ───────────────────────────────────────────
function renderDatasetToDashboard(data) {
    // GO / NO-GO badge
    const badge = document.getElementById('goNoGoBadge');
    if (badge) {
        badge.innerText  = data.decision;
        badge.className  = data.winProbability < 40
            ? "px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800"
            : "px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800";
    }

    // Win score colour
    const scoreDisplay = document.getElementById('winScoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.className = data.winProbability >= 70
            ? "text-5xl font-light text-emerald-500 font-mono"
            : data.winProbability >= 40
                ? "text-5xl font-light text-amber-500 font-mono"
                : "text-5xl font-light text-rose-500 font-mono";
    }

    animateMetricValue('winScoreDisplay', data.winProbability, true);
    animateProgressBar('budgetBar', 'budgetBarVal', data.budgetScore);
    animateProgressBar('matchBar',  'matchBarVal',  data.capabilityScore);

    hydrateComplianceDataGrid(data.compliance);

    document.getElementById('complianceMatrixMeta').innerText  = `${data.compliance.length} Requirements Traced`;
    document.getElementById('badgeCount-upload').innerText      = "1 Active";
    document.getElementById('badgeCount-compliance').innerText  = data.compliance.length;
    document.getElementById('badgeCount-draft').innerText       = `${data.directives.length} Nodes`;

    hydrateDirectiveNodeFeed(data.directives);

    streamProposalNarrative('aiDraftTextArea', data.proposalNarrative, () => {
        setEngineStatus("Engine Status: Synchronisation Complete", 'emerald');

        const apiText = document.getElementById('apiStatusDisplay');
        if (apiText) {
            apiText.innerText  = "Dataset Hydrated";
            apiText.className  = "text-emerald-500 font-medium";
        }
    });

    switchTab('complianceTab');
}

// ─── SECTION 8: EXPORT ────────────────────────────────────────────────────────
function initExportButton() {
    const exportBtn = document.getElementById('exportDocumentBtn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
        const ta = document.getElementById('aiDraftTextArea');
        if (!ta) return;

        const blob        = new Blob([ta.value], { type: 'text/plain' });
        const downloadUrl = URL.createObjectURL(blob);
        const link        = document.createElement('a');

        link.href     = downloadUrl;
        link.download = `TRIDENT_PROPOSAL_${new Date().toISOString().slice(0, 10)}.txt`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    });
}

// ─── SECTION 9: BOOTSTRAP ────────────────────────────────────────────────────
function initializeAppComponents() {
    initializePhysicalUploadBridge();
    initExportButton();
}

document.addEventListener('DOMContentLoaded', initializeAppComponents);
