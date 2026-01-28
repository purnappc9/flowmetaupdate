console.log("Salesforce Flow XML Editor: Script V6 initializing...");

/**
 * Deep search for an element even inside Shadow DOM roots.
 */
function querySelectorDeep(selector, root = document) {
    let element = root.querySelector(selector);
    if (element) return element;

    const hosts = root.querySelectorAll('*');
    for (const host of hosts) {
        if (host.shadowRoot) {
            element = querySelectorDeep(selector, host.shadowRoot);
            if (element) return element;
        }
    }
    return null;
}

function injectButton() {
    if (document.getElementById('edit-flow-xml-btn')) return;

    let header = null;

    // 1. Try the exact JS Path provided by the user (Highest Priority)
    try {
        header = document.querySelector("body > div:nth-child(13) > div > devops_center-base-component > div > lightning-layout");
        if (header) console.log("Salesforce Flow XML Editor: Found target using user-provided JS path!");
    } catch (e) {
        console.error("Salesforce Flow XML Editor: Error with user path selector", e);
    }

    // 2. Deep search for devops_center components if user path fails
    if (!header) {
        header = querySelectorDeep("devops_center-base-component lightning-layout");
    }

    // 3. Fallback to common toolbar selectors
    if (!header) {
        const selectors = [
            '.navBar-container',
            '.slds-builder-toolbar__actions',
            '.slds-builder-toolbar'
        ];
        for (const sel of selectors) {
            header = querySelectorDeep(sel);
            if (header) break;
        }
    }

    const btn = document.createElement('button');
    btn.id = 'edit-flow-xml-btn';
    btn.innerText = 'Edit Flow XML';

    // High-visibility "Salesforce Blue" Styling
    btn.style.padding = '10px 18px';
    btn.style.backgroundColor = '#0070d2';
    btn.style.color = 'white';
    btn.style.border = '2px solid white';
    btn.style.borderRadius = '5px';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '2147483647';
    btn.style.boxShadow = '0 4px 10px rgba(0,112,210,0.4)';

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openXmlEditor();
    };

    if (header) {
        console.log("Salesforce Flow XML Editor: Attaching to found container...");
        btn.style.margin = '0 15px';
        header.appendChild(btn);
    } else {
        // ULTIMATE FALLBACK: Fixed position if all else fails
        if (!document.getElementById('edit-flow-xml-btn-fallback')) {
            console.log("Salesforce Flow XML Editor: No header found, using floating fallback.");
            btn.id = 'edit-flow-xml-btn-fallback';
            btn.style.position = 'fixed';
            btn.style.bottom = '30px';
            btn.style.right = '30px';
            document.body.appendChild(btn);
        }
    }
}

function getFlowIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/[?&]flowId=([a-zA-Z0-9]{15,18})/);
    return match ? match[1] : null;
}

async function openXmlEditor() {
    const flowId = getFlowIdFromUrl();
    console.log("Salesforce Flow XML Editor: Opening editor for Flow ID:", flowId);

    if (!flowId) {
        alert("Flow ID not found in URL. Are you in the Flow Builder?");
        return;
    }

    showLoader();
    chrome.runtime.sendMessage({ action: "getFlowXml", flowId: flowId }, (response) => {
        hideLoader();
        if (response && response.success) {
            createOverlay(response.xml);
        } else {
            alert("Error: " + (response ? response.error : "Unknown error"));
        }
    });
}

function createOverlay(xml) {
    if (document.getElementById('xml-editor-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'xml-editor-overlay';
    overlay.innerHTML = `
    <div class="xml-editor-container">
      <div class="xml-editor-header">
        <h2>Flow XML Editor</h2>
        <div class="xml-editor-actions">
          <button id="close-xml-editor">Close</button>
          <button id="save-xml-editor" class="primary">Save (Beta)</button>
        </div>
      </div>
      <textarea id="xml-editor-content" spellcheck="false" autocomplete="off" style="width:100%; height:100%; background:#1e1e1e; color:#d4d4d4; border:none; padding:15px; font-family:monospace;">${xml}</textarea>
    </div>
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
            alert("Info: " + (response ? response.error : "API Restriction: Direct Save Limited"));
        }
    });
}

function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'xml-editor-loader';
    loader.style = 'position:fixed; top:0; left:0; width:100\%; height:100\%; background:rgba(0,0,0,0.6); z-index:2147483647; display:flex; align-items:center; justify-content:center; color:white; font-family:sans-serif;';
    loader.innerHTML = '<h3>Fetching Flow XML...</h3>';
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('xml-editor-loader');
    if (loader) loader.remove();
}

// Initial retry and frequent checks
setTimeout(injectButton, 3000);
setInterval(injectButton, 5000);
console.log("Salesforce Flow XML Editor: Script V6 loaded.");
