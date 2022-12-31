// On install show html page and set applicationIsOn to true
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: "popup/install.html" });
    chrome.storage.local.set({ applicationIsOn: true });
    chrome.storage.local.set({ amountOfPlaysToSkip: 1 });
});
