/**
 * TRIDENT PROPOSAL SUITE - APPLICATION CONTROLLER ENGINE
 * Orchestrates event handling routines, SPA page state mutations, and DOM structural binding pipelines.
 */

/**
 * Handles Tab navigation mutations across the interface matrix viewport.
 * @param {string} tabId - Target section container element key strings
 */
function switchTab(tabId) {
    const tabs = ['uploadTab', 'complianceTab', 'draftTab'];
    
    tabs.forEach(id => {
        const element = document.getElementById(id);
        const button = document.getElementById(`btn-${id}`);
        
        if (!element || !button) return;

        if (id === tabId) {
            element.classList.remove('hidden');
            // Inject Active Corporate Styling Framework
            button.className = "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium bg-enterprise-800 text-white transition-all text-left";
        } else {
            element.classList.add('hidden');
            // Inject Neutral High-Contrast Styling Framework
            button.className = "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium text-slate-400 hover:bg-enterprise-800/60 hover:text-white transition-all text-left";
        }
    });
}

/**
 * Triggers the main document parse and data extraction process.
 * Talks to the mock data interface and processes metrics pipelines directly.
 */
function triggerIngestionPipeline() {
    // 1. Shift Top Header App State Visual Indicators to Ingestion Mode
    const engineStatus = document.getElementById('coreEngineStatus');
    const statusDot = document.getElementById('statusIndicatorDot');
    
    if (engineStatus && statusDot) {
        engineStatus.innerText = "Engine Status: Ingesting Data Assets...";
        engineStatus.className = "text-xs font-medium text-amber-500 font-mono";
        statusDot.className = "w-2 h-2 rounded-full bg-amber-500 animate-ping";
    }

    // 2. Pass control parameters to data layer model cycles
    simulateModelInference((hydratedData) => {
        
        // Populate Strategic Evaluation Badges
        const badge = document.getElementById('goNoGoBadge');
        if (badge) {
            badge.innerText = hydratedData.decision;
            badge.className = "px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800";
        }

        // Hydrate Strategic Probability Metrics Displays
        const scoreDisplay = document.getElementById('winScoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.innerText = hydratedData.winProbability + "%";
            scoreDisplay.className = "text-5xl font-light text-emerald-500 font-mono";
        }
        
        // Handle Progress Bar Metric Animations
        updateProgressBar('budgetBar', 'budgetBarVal', hydratedData.budgetScore);
        updateProgressBar('matchBar', 'matchBarVal', hydratedData.capabilityScore);

        // Build Compliance Traceability Matrix View
        hydrateComplianceDataGrid(hydratedData.compliance);

        // Update Global UI Counter Badges
        document.getElementById('complianceMatrixMeta').innerText = `${hydratedData.compliance.length} Requirements Traced`;
        document.getElementById('badgeCount-upload').innerText = "1 Active";
        document.getElementById('badgeCount-compliance').innerText = hydratedData.compliance.length;
        document.getElementById('badgeCount-draft').innerText = "2 Nodes";

        // Hydrate Technical Directive Nodes Panels
        hydrateDirectiveNodeFeed(hydratedData.directives);

        // Populate Final Output Technical Narrative Field Block
        const draftEditor = document.getElementById('aiDraftTextArea');
        if (draftEditor) {
            draftEditor.value = hydratedData.proposalNarrative;
        }

        // Complete synchronization updates on global UI elements
        if (engineStatus && statusDot) {
            engineStatus.innerText = "Engine Status: Synchronization Complete";
            engineStatus.className = "text-xs font-medium text-emerald-500 font-mono";
            statusDot.className = "w-2 h-2 rounded-full bg-emerald-500";
        }

        const apiText = document.getElementById('apiStatusDisplay');
        if (apiText) {
            apiText.innerText = "Dataset Hydrated";
            apiText.className = "text-emerald-500 font-medium";
        }

        // Advance application runtime viewport view layout automatically
        switchTab('complianceTab');
    });
}

/**
 * Utility tracker helper function updating utility horizontal bar indicators
 */
function updateProgressBar(barId, valueId, targetScore) {
    const bar = document.getElementById(barId);
    const valueLabel = document.getElementById(valueId);
    if (bar && valueLabel) {
        bar.style.width = targetScore + "%";
        valueLabel.innerText = targetScore + "%";
        valueLabel.className = "text-emerald-500";
    }
}

/**
 * Loops and builds tabular data rows for the core Traceability Matrix 
 */
function hydrateComplianceDataGrid(complianceRecords) {
    const tableBody = document.getElementById('complianceTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = ""; // Clear current default HTML schemas
    
    complianceRecords.forEach(record => {
        const flagStyle = record.status === "COMPLIANT" 
            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900" 
            : "bg-rose-950/40 text-rose-400 border-rose-900";
        
        const rowStringMarkup = `
            <tr class="hover:bg-enterprise-900/40 transition-colors">
                <td class="px-5 py-3 text-slate-500 font-bold">${record.id}</td>
                <td class="px-5 py-3 text-slate-300 font-sans tracking-tight">${record.req}</td>
                <td class="px-5 py-3 text-slate-400 font-sans text-[11px] leading-relaxed">${record.match}</td>
                <td class="px-5 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${flagStyle}">${record.status}</span>
                </td>
            </tr>
        `;
        tableBody.innerHTML += rowStringMarkup;
    });
}

/**
 * Renders individual card panels inside the extracted tender panels feed 
 */
function hydrateDirectiveNodeFeed(directivesList) {
    const directiveContainer = document.getElementById('rfpContextArea');
    if (!directiveContainer) return;
    
    directiveContainer.innerHTML = "";
    directivesList.forEach(textSegment => {
        directiveContainer.innerHTML += `
            <div class="bg-enterprise-900 p-3.5 rounded border border-enterprise-800 font-sans text-xs text-slate-400 leading-normal">
                ${textSegment}
            </div>`;
    });
}