console.log("Salesforce Flow XML Editor: Script V3 initializing...");

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

    // Exact selector from user's HTML
    const targetSelector = '.slds-builder-toolbar__actions';
    const header = querySelectorDeep(targetSelector);

    if (!header) {
        // console.log("Salesforce Flow XML Editor: Still looking for toolbar...");
        return;
    }

    console.log("Salesforce Flow XML Editor: Found toolbar! Injecting button...");

    const btn = document.createElement('button');
    btn.id = 'edit-flow-xml-btn';
    btn.className = 'slds-button slds-button_brand'; // Brand blue for visibility
    btn.innerText = 'Edit Flow XML';
    btn.style.marginLeft = '12px';
    btn.style.boxShadow = '0 0 10px rgba(0,112,210,0.5)';

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openXmlEditor();
    };

    header.appendChild(btn);
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
        alert("Flow ID not found. Are you in the Flow Builder?");
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
    loader.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:100000; display:flex; align-items:center; justify-content:center; color:white; font-family:sans-serif;';
    loader.innerHTML = '<h3>Fetching Flow XML...</h3>';
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('xml-editor-loader');
    if (loader) loader.remove();
}

// More frequent check for injection
setInterval(injectButton, 2000);
console.log("Salesforce Flow XML Editor: Script V3 fully loaded.");
