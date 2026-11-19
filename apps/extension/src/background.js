// VyaparMarg Extension Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log("VyaparMarg Assistant Extension installed successfully.");
  chrome.storage.local.set({
    language: "mr",
    safeAutofillEnabled: true,
    apiBaseUrl: ""
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_ACTIVE_PORTAL_CONTEXT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const url = activeTab?.url || "";
      let portal = "unknown";
      if (url.includes("aaplesarkar")) portal = "aaple-sarkar";
      else if (url.includes("mahadbt")) portal = "mahadbt";
      else if (url.includes("udyamregistration")) portal = "udyam";
      else if (url.includes("kviconline")) portal = "pmegp";
      else if (url.includes("mahadiscom")) portal = "cmegp";

      sendResponse({ portal, url });
    });
    return true; // async
  }
});
