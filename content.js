// VERSION 7 - INDESTRUCTIBLE INJECTION
console.log("%c Salesforce Flow XML Editor: Script V7 (Indestructible) initializing...", "color: #0070d2; font-weight: bold; font-size: 14px;");

/**
 * Recursive Shadow DOM piercing search
 */
function querySelectorAllDeep(selector, root = document) {
    let results = Array.from(root.querySelectorAll(selector));
    const hosts = root.querySelectorAll('*');
    for (const host of hosts) {
        if (host.shadowRoot) {
            results = results.concat(querySelectorAllDeep(selector, host.shadowRoot));
        }
    }
    return results;
}

function injectButton() {
    // Check if the V7 button already exists
    if (document.getElementById('edit-flow-xml-btn-v7')) return;

    // Remove any older versions if they somehow exist
    const oldBtn = document.getElementById('edit-flow-xml-btn');
    if (oldBtn) oldBtn.remove();

    // 1. Target the JS Path provided by user
    let header = document.querySelector("body > div:nth-child(13) > div > devops_center-base-component > div > lightning-layout");

    // 2. Target the toolbar actions area (deep search)
    if (!header) {
        const toolbarActions = querySelectorAllDeep('.slds-builder-toolbar__actions');
        if (toolbarActions.length > 0) header = toolbarActions[0];
    }

    // 3. Target the button group (deep search)
    if (!header) {
        const buttonGroups = querySelectorAllDeep('lightning-button-group');
        if (buttonGroups.length > 0) header = buttonGroups[0];
    }

    // Create the V7 Button
    const btn = document.createElement('button');
    btn.id = 'edit-flow-xml-btn-v7';
    btn.innerHTML = '<span>⚡ Edit XML </span><span style="font-size:8px; opacity:0.7">v7</span>';

    // High-visibility Force Styling
    btn.style.cssText = `
        padding: 8px 16px !important;
        background-color: #0176d3 !important;
        color: white !important;
        border: 2px solid #fff !important;
        border-radius: 4px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        z-index: 2147483647 !important;
        font-family: 'Salesforce Sans', Arial, sans-serif !important;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
    `;

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openXmlEditor();
    };

    if (header) {
        console.log("Salesforce Flow XML Editor: V7 Injected into Header.");
        btn.style.margin = '0 10px';
        header.insertBefore(btn, header.firstChild);
    } else {
        // ULTIMATE STICKY FALLBACK (Floating)
        console.log("Salesforce Flow XML Editor: V7 Using Sticky Fallback.");
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '50px';
        btn.style.border = '2px solid #0070d2';
        document.body.appendChild(btn);
    }
}

function getFlowIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/[?&]flowId=([a-zA-Z0-9]{15,18})/);
    return match ? match[1] : null;
}

async function openXmlEditor() {
    const flowId = getFlowIdFromUrl();
    if (!flowId) {
        alert("Salesforce Flow XML Editor [V7]: Flow ID not found. Ensure you are in the Flow Builder page.");
        return;
    }

    showLoader();
    chrome.runtime.sendMessage({ action: "getFlowXml", flowId: flowId }, (response) => {
        hideLoader();
        if (response && response.success) {
            createOverlay(response.xml);
        } else {
            alert("Error: " + (response ? response.error : "API Timeout"));
        }
    });
}

function createOverlay(xml) {
    if (document.getElementById('xml-editor-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'xml-editor-overlay';
    overlay.innerHTML = `
        <div class="xml-editor-container" style="width:90%; height:90%; background:#1e1e1e; border-radius:12px; display:flex; flex-direction:column; box-shadow: 0 0 50px rgba(0,0,0,0.8);">
            <div class="xml-editor-header" style="padding:15px; background:#2d2d2d; color:white; display:flex; justify-content:space-between; align-items:center;">
                <h2 style="margin:0">Flow XML Editor <span style="font-size:10px; opacity:0.5">v7</span></h2>
                <div>
                    <button id="close-xml-editor" style="padding:8px; margin-right:10px; cursor:pointer">Close</button>
                    <button id="save-xml-editor" style="padding:8px 16px; background:#0176d3; color:white; border:none; cursor:pointer">Save (Beta)</button>
                </div>
            </div>
            <textarea id="xml-editor-content" spellcheck="false" style="flex:1; background:#1e1e1e; color:#d4d4d4; padding:20px; font-family:monospace; font-size:14px; border:none; outline:none; resize:none;">${xml}</textarea>
        </div>
    `;

    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(5px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(overlay);

    document.getElementById('close-xml-editor').onclick = () => overlay.remove();
    document.getElementById('save-xml-editor').onclick = () => {
        const newXml = document.getElementById('xml-editor-content').value;
        saveXml(newXml);
    };
}

function saveXml(xml) {
    const flowId = getFlowIdFromUrl();
    chrome.runtime.sendMessage({ action: "saveFlowXml", flowId: flowId, xml: xml }, (response) => {
        if (response && response.success) {
            alert("Flow saved successfully!");
        } else {
            alert("Note [V7]: Direct saving is limited by Salesforce Tooling API for XML. Use the XML to manually update via CLI/Metadata API.");
        }
    });
}

function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'xml-editor-loader';
    loader.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100\%; background:rgba(0,0,0,0.5); z-index:2147483647; display:flex; align-items:center; justify-content:center; color:white; font-size:20px; font-weight:bold;';
    loader.innerText = '⚡ Fetching Flow XML...';
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('xml-editor-loader');
    if (loader) loader.remove();
}

// Aggressive periodic check
setInterval(injectButton, 2000);
console.log("Salesforce Flow XML Editor: Script V7 Ready.");
