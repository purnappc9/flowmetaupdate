console.log("Salesforce Flow XML Editor: Script V4 initializing...");

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

    // Expanded selectors based on user feedback and common SF patterns
    const selectors = [
        '.navBar-container', // New selector provided by user
        '.slds-builder-toolbar__actions',
        '.slds-builder-toolbar',
        '.flowdesigner-header',
        '.slds-page-header__row',
        '.fix_button-group-flexbox'
    ];

    let header = null;
    for (const sel of selectors) {
        header = querySelectorDeep(sel);
        if (header) break;
    }

    const btn = document.createElement('button');
    btn.id = 'edit-flow-xml-btn';
    btn.innerText = 'Edit Flow XML';

    // High-visibility styling
    btn.style.padding = '8px 16px';
    btn.style.backgroundColor = '#0070d2';
    btn.style.color = 'white';
    btn.style.border = '2px solid white';
    btn.style.borderRadius = '4px';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '999999';

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openXmlEditor();
    };

    if (header) {
        console.log("Salesforce Flow XML Editor: Found injection point, attaching...");
        btn.style.marginLeft = '12px';
        header.appendChild(btn);
    } else {
        // FALLBACK: If no header found, float it at the top right
        console.log("Salesforce Flow XML Editor: No header found, using floating fallback.");
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '100px';
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
    console.log("Salesforce Flow XML Editor: Opening editor for Flow ID:", flowId);

    if (!flowId) {
        alert("Flow ID not found in URL. Please ensure you are in the Flow Builder.");
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
      <textarea id="xml-editor-content" spellcheck="false" autocomplete="off">${xml}</textarea>
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
            alert("Info: " + (response ? response.error : "Connection Error or API Limitation"));
        }
    });
}

function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'xml-editor-loader';
    loader.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000000; display:flex; align-items:center; justify-content:center; color:white; font-family:sans-serif;';
    loader.innerHTML = '<h3>Fetching Flow XML...</h3>';
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('xml-editor-loader');
    if (loader) loader.remove();
}

// Initial run
setTimeout(injectButton, 3000);
// Check frequently
setInterval(injectButton, 5000);
console.log("Salesforce Flow XML Editor: Script V4 loaded.");
