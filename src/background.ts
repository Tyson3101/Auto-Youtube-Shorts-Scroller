// On install show html page and set applicationIsOn to true, + settings
chrome.runtime.onInstalled.addListener(() => {
  // Check installion or updated

  chrome.storage.local.get(
    [
      "applicationIsOn",
      "filterByMaxLength",
      "filterByMinLength",
      "amountOfPlaysToSkip",
      "scrollOnComments",
      "shortCutKeys",
      "shortCutInteractKeys",
      "filteredAuthors",
    ],
    (result) => {
      if (result.applicationIsOn == undefined) {
        chrome.storage.local.set({ applicationIsOn: true });
        chrome.tabs.create({ url: "popup/install.html" });
      }
      if (result.filterByMaxLength == undefined) {
        chrome.storage.local.set({ filterByMaxLength: "none" });
      }
      if (result.filterByMinLength == undefined) {
        chrome.storage.local.set({ filterByMinLength: "none" });
      }
      if (result.amountOfPlaysToSkip == undefined) {
        chrome.storage.local.set({ amountOfPlaysToSkip: 1 });
      }
      if (result.scrollOnComments == undefined) {
        chrome.storage.local.set({ scrollOnComments: false });
      }
      if (result.shortCutKeys == undefined) {
        chrome.storage.local.set({ shortCutKeys: ["shift", "s"] });
      }
      if (result.shortCutInteractKeys == undefined) {
        chrome.storage.local.set({ shortCutInteractKeys: ["shift", "f"] });
      }
      if (result.filteredAuthors == undefined) {
        chrome.storage.local.set({
          filteredAuthors: ["Tyson3101"],
        });
      }
    }
  );
});

chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});
