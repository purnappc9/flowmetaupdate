chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getFlowXml") {
        handleGetFlowXml(request.flowId, request.url || sender.tab.url).then(sendResponse);
        return true;
    } else if (request.action === "saveFlowXml") {
        handleSaveFlowXml(request.flowId, request.xml, request.url || sender.tab.url).then(sendResponse);
        return true;
    } else if (request.action === "getCurrentTabUrl") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendResponse({ url: tabs[0].url });
        });
        return true;
    }
});

async function getSessionId(url) {
    const domain = new URL(url).hostname;
    const cookies = await chrome.cookies.getAll({ domain: domain, name: "sid" });
    if (cookies.length > 0) {
        return cookies[0].value;
    }
    // Try alternative for subdomains
    const rootDomain = domain.split('.').slice(-2).join('.');
    const rootCookies = await chrome.cookies.getAll({ domain: rootDomain, name: "sid" });
    if (rootCookies.length > 0) {
        return rootCookies[0].value;
    }
    throw new Error("Session ID not found. Please log in to Salesforce.");
}

async function handleGetFlowXml(flowId, url) {
    try {
        const sessionId = await getSessionId(url);
        const domain = new URL(url).hostname;
        const endpoint = `https://${domain}/services/data/v60.0/tooling/sobjects/Flow/${flowId}`;

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${sessionId}`,
                'Accept': 'application/xml'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Flow: ${response.statusText}`);
        }

        const xml = await response.text();
        return { success: true, xml: xml };
    } catch (error) {
        console.error(error);
        return { success: false, error: error.message };
    }
}

async function handleSaveFlowXml(flowId, xml, url) {
    try {
        const sessionId = await getSessionId(url);
        const domain = new URL(url).hostname;
        const endpoint = `https://${domain}/services/data/v60.0/tooling/sobjects/Flow/${flowId}`;

        // Note: Tooling API for Flow doesn't accept XML directly for PATCH.
        // To implement "Save", we would need to parse the XML to JSON and send it in the 'Metadata' field.
        // Alternatively, we can use the Metadata API to deploy the XML directly.
        // For this version, we'll guide the user to download/deploy or use this as a viewer/editor 
        // with future Metadata API integration.

        return {
            success: false,
            error: "Direct XML patching via Tooling API is not supported. Use the 'Download' feature to get the XML, or wait for the Metadata API integration."
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
