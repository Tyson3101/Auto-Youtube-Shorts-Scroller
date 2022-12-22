// On install show html page
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: "popup/install.html" });
});
