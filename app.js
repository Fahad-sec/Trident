function switchTab(tabId) {
    const tabs = ['uploadTab', 'complianceTab', 'draftTab'];
    
    tabs.forEach(id => {
        const element = document.getElementById(id);
        const button = document.getElementById(`btn-${id}`);
        
        if (!element || !button) return;

        if (id === tabId) {
            element.classList.remove('hidden');
            button.className = "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium bg-enterprise-800 text-white transition-all text-left";
        } else {
            element.classList.add('hidden');
            button.className = "w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium text-slate-400 hover:bg-enterprise-800/60 hover:text-white transition-all text-left";
        }
    });
}

function triggerIngestionPipeline() {
    const engineStatus = document.getElementById('coreEngineStatus');
    const statusDot = document.getElementById('statusIndicatorDot');
    
    if (engineStatus && statusDot) {
        engineStatus.innerText = "Engine Status: Ingesting Data Assets...";
        engineStatus.className = "text-xs font-medium text-amber-500 font-mono";
        statusDot.className = "w-2 h-2 rounded-full bg-amber-500 animate-ping";
    }

    simulateModelInference((hydratedData) => {
        const badge = document.getElementById('goNoGoBadge');
        if (badge) {
            badge.innerText = hydratedData.decision;
            badge.className = "px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800";
        }

        const scoreDisplay = document.getElementById('winScoreDisplay');
        if (scoreDisplay) {
            if (hydratedData.winProbability >= 70) {
                scoreDisplay.className = "text-5xl font-light text-emerald-500 font-mono";
            } else if (hydratedData.winProbability >= 40) {
                scoreDisplay.className = "text-5xl font-light text-amber-500 font-mono";
            } else {
                scoreDisplay.className = "text-5xl font-light text-rose-500 font-mono";
            }
        }

        animateMetricValue('winScoreDisplay', hydratedData.winProbability, true);
        animateProgressBar('budgetBar', 'budgetBarVal', hydratedData.budgetScore);
        animateProgressBar('matchBar', 'matchBarVal', hydratedData.capabilityScore);

        hydrateComplianceDataGrid(hydratedData.compliance);

        document.getElementById('complianceMatrixMeta').innerText = `${hydratedData.compliance.length} Requirements Traced`;
        document.getElementById('badgeCount-upload').innerText = "1 Active";
        document.getElementById('badgeCount-compliance').innerText = hydratedData.compliance.length;
        document.getElementById('badgeCount-draft').innerText = "2 Nodes";

        hydrateDirectiveNodeFeed(hydratedData.directives);

        streamProposalNarrative('aiDraftTextArea', hydratedData.proposalNarrative, () => {
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
        });

        switchTab('complianceTab');
    });
}

function animateMetricValue(elementId, targetValue, appendPercent = false) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let current = 0;
    const duration = 1000; 
    const fps = 60;
    const step = targetValue / (duration / (1000 / fps));

    const interval = setInterval(() => {
        current += step;
        if (current >= targetValue) {
            clearInterval(interval);
            element.innerText = targetValue + (appendPercent ? "%" : "");
        } else {
            element.innerText = Math.floor(current) + (appendPercent ? "%" : "");
        }
    }, 1000 / fps);
}

function animateProgressBar(barId, valueId, targetScore) {
    const bar = document.getElementById(barId);
    const valueLabel = document.getElementById(valueId);
    if (!bar || !valueLabel) return;

    bar.style.width = targetScore + "%";
    animateMetricValue(valueId, targetScore, true);
}

function streamProposalNarrative(elementId, fullRawText, onCompleteCallback) {
    const workspace = document.getElementById(elementId);
    if (!workspace) {
        if (onCompleteCallback) onCompleteCallback();
        return;
    }

    workspace.value = ""; 
    const lines = fullRawText.split('\n');
    let pointer = 0;

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

function hydrateComplianceDataGrid(complianceRecords) {
    const tableBody = document.getElementById('complianceTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = ""; 
    
    complianceRecords.forEach(record => {
        const flagStyle = record.status === "MANDATE-TRD-04" || record.status === "NON-COMPLIANT"
            ? "bg-rose-950/40 text-rose-400 border-rose-900"
            : "bg-emerald-950/40 text-emerald-400 border-emerald-900";
        
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

document.getElementById('exportDocumentBtn').addEventListener('click', () => {
    const narrativeWorkspace = document.getElementById('aiDraftTextArea'); 
    
    if (!narrativeWorkspace) {
        alert("No active proposal data vector available for export compilation.");
        return;
    }

    const updatedTextContent = narrativeWorkspace.value;
    const textBlob = new Blob([updatedTextContent], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(textBlob);
    
    const temporaryLink = document.createElement('a');
    temporaryLink.href = downloadUrl;
    temporaryLink.download = `TRIDENT_PROPOSAL_MANIFEST_${new Date().toISOString().slice(0,10)}.txt`;
    
    document.body.appendChild(temporaryLink);
    temporaryLink.click();
    
    document.body.removeChild(temporaryLink);
    URL.revokeObjectURL(downloadUrl);
});