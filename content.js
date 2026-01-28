console.log("Salesforce Flow XML Editor: Script V5 initializing...");

/**
 * Deep search for an element even inside Shadow DOM roots.
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
    if (document.getElementById('edit-flow-xml-btn')) return;

    // Target specific elements provided by user or seen in screenshots
    const targetSelectors = [
        '.test-toolbar-select', // Multi-select checkbox host
        '[data-key="multi_select_checkbox"]', // The icon inside it
        '.slds-builder-toolbar__actions',
        '.navBar-container'
    ];

    let targetElement = null;
    for (const sel of targetSelectors) {
        const found = querySelectorAllDeep(sel);
        if (found.length > 0) {
            targetElement = found[0];
            console.log(`Salesforce Flow XML Editor: Found target with selector: ${sel}`);
            break;
        }
    }

    const btn = document.createElement('button');
    btn.id = 'edit-flow-xml-btn';
    btn.innerText = 'XML';
    btn.title = 'Edit Flow XML (Beta)';

    // Professional Compact Styling
    btn.style.margin = '0 5px';
    btn.style.padding = '4px 8px';
    btn.style.backgroundColor = '#0176d3';
    btn.style.color = 'white';
    btn.style.border = '1px solid #0176d3';
    btn.style.borderRadius = '4px';
    btn.style.fontWeight = '700';
    btn.style.fontSize = '12px';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '2147483647'; // Max possible z-index

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openXmlEditor();
    };

    if (targetElement) {
        console.log("Salesforce Flow XML Editor: Injecting before target element.");
        // In LWC, direct DOM manipulation might be tricky, try to insert into parent
        targetElement.parentNode.insertBefore(btn, targetElement);
    } else {
        // ULTIMATE FALLBACK: Fixed position that can't be missed
        if (!document.getElementById('edit-flow-xml-btn-fallback')) {
            console.log("Salesforce Flow XML Editor: No toolbar found. Using floating fallback.");
            btn.id = 'edit-flow-xml-btn-fallback';
            btn.innerText = 'Edit Flow XML';
            btn.style.position = 'fixed';
            btn.style.bottom = '20px';
            btn.style.right = '20px';
            btn.style.padding = '10px 20px';
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
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
    if (!flowId) {
        alert("Flow ID not found. Ensure you are in the Flow Builder.");
        return;
    }

    showLoader();
    chrome.runtime.sendMessage({ action: "getFlowXml", flowId: flowId }, (response) => {
        hideLoader();
        if (response && response.success) {
            createOverlay(response.xml);
        } else {
            alert("Error: " + (response ? response.error : "API Error"));
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
            alert("Info: " + (response ? response.error : "Connection Error"));
        }
    });
}

function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'xml-editor-loader';
    loader.style = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2147483647; display:flex; align-items:center; justify-content:center; color:white; font-family:sans-serif;';
    loader.innerHTML = '<h3>Fetching Flow XML...</h3>';
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('xml-editor-loader');
    if (loader) loader.remove();
}

// Check frequently
setInterval(injectButton, 3000);
console.log("Salesforce Flow XML Editor: Script V5 ready.");
