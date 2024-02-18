const allStorageKeys = [
  "applicationIsOn",
  "filterByMaxLength",
  "filterByMinLength",
  "filterByMinViews",
  "filterByMaxViews",
  "filterByMinLikes",
  "filterByMaxLikes",
  "filterByMinComments",
  "filterByMaxComments",
  "scrollDirection",
  "amountOfPlaysToSkip",
  "scrollOnComments",
  "shortCutKeys",
  "shortCutInteractKeys",
  "filteredAuthors",
  "filteredTags",
  "whitelistedAuthors",
];

chrome.runtime.onInstalled.addListener((details) => {
  // Show install page on install
  if (details.reason === "install") {
    chrome.tabs.create({ url: "popup/install.html" });
  }

  // Declare default vlaues
  chrome.storage.local.get("applicationIsOn", (result) => {
    if (result.applicationIsOn == undefined) {
      chrome.storage.local.set({ applicationIsOn: true });
    }
  });

  chrome.storage.sync.get(allStorageKeys, (resultSync) => {
    if (resultSync.filterByMaxLength == undefined) {
      chrome.storage.sync.set({ filterByMaxLength: "none" });
    }
    if (resultSync.filterByMinLength == undefined) {
      chrome.storage.sync.set({ filterByMinLength: "none" });
    }
    chrome.storage.sync.set({
      filterByMinViews: resultSync.filterByMinViews?.toString() || "none",
      filterByMaxViews: resultSync.filterByMaxViews?.toString() || "none",
      filterByMinLikes: resultSync.filterByMinLikes?.toString() || "none",
      filterByMaxLikes: resultSync.filterByMaxLikes?.toString() || "none",
      filterByMinComments: resultSync.filterByMinComments?.toString() || "none",
      filterByMaxComments: resultSync.filterByMaxComments?.toString() || "none",
    });
    if (resultSync.scrollDirection == undefined) {
      chrome.storage.sync.set({ scrollDirection: "down" });
    }
    if (resultSync.amountOfPlaysToSkip == undefined) {
      chrome.storage.sync.set({ amountOfPlaysToSkip: 1 });
    }
    if (resultSync.scrollOnComments == undefined) {
      chrome.storage.sync.set({ scrollOnComments: false });
    }
    if (resultSync.shortCutKeys == undefined) {
      chrome.storage.sync.set({ shortCutKeys: ["shift", "d"] });
    }
    if (resultSync.shortCutInteractKeys == undefined) {
      chrome.storage.sync.set({ shortCutInteractKeys: ["shift", "f"] });
    }
    if (resultSync.filteredAuthors == undefined) {
      chrome.storage.sync.set({
        filteredAuthors: ["Tyson3101"],
      });
    }
    if (resultSync.filteredTags == undefined) {
      chrome.storage.sync.set({
        filteredTags: ["#nsfw", "#leagueoflegends"],
      });
    }
    if (resultSync.whitelistedAuthors == undefined) {
      chrome.storage.sync.set({
        whitelistedAuthors: ["Tyson3101"],
      });
    }
  });
});

chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});
