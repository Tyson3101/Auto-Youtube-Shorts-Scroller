// On install show html page and set applicationIsOn to true, + settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: "popup/install.html" });
  chrome.storage.local.set({ AUTOYT_applicationIsOn: true });
  chrome.storage.local.set({ AUTOYT_filterByMaxLength: "none" });
  chrome.storage.local.set({ AUTOYT_filterByMinLength: "none" });
  chrome.storage.local.set({ AUTOYT_amountOfPlaysToSkip: 1 });
  chrome.storage.local.set({ AUTOYT_scrollOnComments: false });
  chrome.storage.local.set({ AUTOYT_shortCutKeys: ["shift", "s"] });
  chrome.storage.local.set({ AUTOYT_shortCutInteractKeys: ["shift", "f"] });
  chrome.storage.local.set({
    AUTOYT_filteredAuthors: ["Tyson3101"],
  });
});

chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});
