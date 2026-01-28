console.log("Salesforce Flow XML Editor loaded.");

function injectButton() {
    const header = document.querySelector('.slds-page-header__row'); // Adjust selector based on actual Flow Builder DOM
    if (!header || document.getElementById('edit-flow-xml-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'edit-flow-xml-btn';
    btn.className = 'slds-button slds-button_neutral';
    btn.innerText = 'Edit XML';
    btn.style.marginLeft = '10px';
    btn.onclick = openXmlEditor;

    header.appendChild(btn);
}

function getFlowIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/flowId=([a-zA-Z0-9]{15,18})/);
    return match ? match[1] : null;
}

async function openXmlEditor() {
    const flowId = getFlowIdFromUrl();
    if (!flowId) {
        alert("Flow ID not found in URL.");
        return;
    }

    showLoader();
    chrome.runtime.sendMessage({ action: "getFlowXml", flowId: flowId }, (response) => {
        hideLoader();
        if (response.success) {
            createOverlay(response.xml);
        } else {
            alert("Error: " + response.error);
        }
    });
}

function createOverlay(xml) {
    const overlay = document.createElement('div');
    overlay.id = 'xml-editor-overlay';
    overlay.innerHTML = `
    <div class="xml-editor-container">
      <div class="xml-editor-header">
        <h2>Flow XML Editor</h2>
        <div class="xml-editor-actions">
          <button id="close-xml-editor">Close</button>
          <button id="save-xml-editor" class="primary">Save</button>
        </div>
      </div>
      <textarea id="xml-editor-content">${xml}</textarea>
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
        if (response.success) {
            alert("Flow saved successfully!");
        } else {
            alert("Error saving Flow: " + response.error);
        }
    });
}

function showLoader() {
    // Simple loader implementation
}

function hideLoader() {
    // Simple loader implementation
}

// Observe for DOM changes as Flow Builder is a SPA
const observer = new MutationObserver(injectButton);
observer.observe(document.body, { childList: true, subtree: true });
injectButton();
