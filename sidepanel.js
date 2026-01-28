const editor = document.getElementById('editor');
const status = document.getElementById('status');
const loading = document.getElementById('loading-overlay');
const refreshBtn = document.getElementById('refresh-btn');
const saveBtn = document.getElementById('save-btn');

let currentFlowId = null;
let currentUrl = null;

async function init() {
    await updateFromActiveTab();
}

async function updateFromActiveTab() {
    chrome.runtime.sendMessage({ action: "getCurrentTabUrl" }, (response) => {
        if (response && response.url) {
            handleUrlChange(response.url);
        }
    });
}

function handleUrlChange(url) {
    currentUrl = url;
    const match = url.match(/[?&]flowId=([a-zA-Z0-9]{15,18})/);
    if (match) {
        currentFlowId = match[1];
        status.innerText = `Flow detected: ${currentFlowId}`;
        fetchFlowXml();
    } else {
        currentFlowId = null;
        status.innerText = "No Flow Detected (Open Flow Builder)";
        editor.value = "";
    }
}

function fetchFlowXml() {
    if (!currentFlowId) return;

    loading.style.display = 'flex';
    chrome.runtime.sendMessage({
        action: "getFlowXml",
        flowId: currentFlowId,
        url: currentUrl
    }, (response) => {
        loading.style.display = 'none';
        if (response && response.success) {
            editor.value = response.xml;
        } else {
            status.innerText = "Error fetching XML: " + (response ? response.error : "Unknown");
        }
    });
}

refreshBtn.onclick = () => {
    updateFromActiveTab();
};

saveBtn.onclick = () => {
    if (!currentFlowId) return;
    const xml = editor.value;
    chrome.runtime.sendMessage({
        action: "saveFlowXml",
        flowId: currentFlowId,
        xml: xml,
        url: currentUrl
    }, (response) => {
        if (response && response.success) {
            alert("Flow saved successfully!");
        } else {
            alert("Note: Direct Save is limited by Tooling API. Use this XML to manually update via CLI.");
        }
    });
};

// Update when tabs are switched or updated
chrome.tabs.onActivated.addListener(updateFromActiveTab);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateFromActiveTab();
    }
});

init();
