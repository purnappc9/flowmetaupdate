console.log("Salesforce Flow XML Editor: Script initialized.");

function injectButton() {
    // Try several common Salesforce header selectors
    const selectors = [
        '.slds-page-header__row_gutters',
        '.slds-page-header__row',
        '.flowdesigner-header', // Legacy/Internal
        '.builder-header-container',
        'header.slds-global-header_container',
        '.runtime_salesforce_fluxFlowDesignerStandardHeader' // Specific to Flow Designer
    ];

    let header = null;
    for (const selector of selectors) {
        header = document.querySelector(selector);
        if (header) {
            console.log(`Salesforce Flow XML Editor: Found header with selector: ${selector}`);
            break;
        }
    }

    // If we can't find a specific header, let's look for the action buttons area
    if (!header) {
        header = document.querySelector('.slds-button-group') || document.querySelector('.actions');
    }

    if (!header) {
        // console.warn("Salesforce Flow XML Editor: Could not find a suitable injection point.");
        return;
    }

    if (document.getElementById('edit-flow-xml-btn')) return;

    console.log("Salesforce Flow XML Editor: Injecting button...");
    const btn = document.createElement('button');
    btn.id = 'edit-flow-xml-btn';
    btn.className = 'slds-button slds-button_neutral';
    btn.innerText = 'Edit XML';
    btn.style.marginLeft = '10px';
    btn.style.border = '2px solid #0070d2'; // Make it pop
    btn.onclick = openXmlEditor;

    // Append to the first found header/action group
    header.appendChild(btn);
}

function getFlowIdFromUrl() {
    const url = window.location.href;
    // Patterns for both 15 and 18 character IDs
    const match = url.match(/[?&]flowId=([a-zA-Z0-9]{15,18})/);
    return match ? match[1] : null;
}

async function openXmlEditor() {
    const flowId = getFlowIdFromUrl();
    console.log("Salesforce Flow XML Editor: Target Flow ID:", flowId);

    if (!flowId) {
        alert("Flow ID not found in URL. Please ensure you are inside the Flow Builder.");
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
      <textarea id="xml-editor-content" spellcheck="false">${xml}</textarea>
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
            alert("Info: " + (response ? response.error : "Unknown error"));
        }
    });
}

function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'xml-editor-loader';
    loader.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.5); z-index:10000; display:flex; align-items:center; justify-content:center;';
    loader.innerHTML = '<div style="font-size:20px; color:#0070d2;">Fetching XML...</div>';
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('xml-editor-loader');
    if (loader) loader.remove();
}

// Observe for DOM changes as Flow Builder is a SPA
const observer = new MutationObserver(() => {
    injectButton();
});
observer.observe(document.body, { childList: true, subtree: true });

// Also try periodic check in case observer misses it
setInterval(injectButton, 3000);

// Initial run
injectButton();
