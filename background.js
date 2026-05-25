const ext = typeof browser !== "undefined" ? browser : chrome;
const PANEL_URL = "popup.html";

function openVaultPanel() {
  const targetUrl = ext.runtime.getURL(PANEL_URL);

  if (typeof browser !== "undefined") {
    return ext.tabs.create({ url: targetUrl });
  }

  return new Promise((resolve, reject) => {
    ext.tabs.create({ url: targetUrl }, (tab) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(tab);
    });
  });
}

if (ext.runtime && ext.runtime.onInstalled) {
  ext.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      console.log("Salesforce Query Vault installed.");
    }
  });
}

if (ext.action && ext.action.onClicked) {
  ext.action.onClicked.addListener(() => {
    openVaultPanel().catch((error) => {
      console.error("Unable to open Salesforce Query Vault panel", error);
    });
  });
}