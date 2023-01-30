// On install show html page and set applicationIsOn to true, + settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: "popup/install.html" });
  chrome.storage.local.set({ applicationIsOn: true });
  chrome.storage.local.set({ filterByMaxLength: "none" });
  chrome.storage.local.set({ filterByMinLength: "none" });
  chrome.storage.local.set({ amountOfPlaysToSkip: 1 });
  chrome.storage.local.set({ scrollOnComments: false });
  chrome.storage.local.set({ shortCutKeys: ["shift", "s"] });
  chrome.storage.local.set({ shortCutInteractKeys: ["shift", "f"] });
  chrome.storage.local.set({
    filteredAuthors: ["Tyson3101"],
  });
});

chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});
