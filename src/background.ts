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
  "amountOfPlaysToSkip",
  "scrollOnComments",
  "shortCutKeys",
  "shortCutInteractKeys",
  "filteredAuthors",
];

chrome.runtime.onInstalled.addListener((details) => {
  // For this update, transtion from local storage to sync storage
  // CHAT GPT :
  if (details.reason === "install" || details.reason === "update") {
    // Check if data exists in local storage
    chrome.storage.local.get(allStorageKeys, (resultLocal) => {
      // Migrate local storage data to sync storage
      chrome.storage.sync.get(allStorageKeys, (resultSync) => {
        let syncData = {};
        for (const key of allStorageKeys) {
          if (resultSync[key] === undefined && resultLocal[key] !== undefined) {
            syncData[key] = resultLocal[key];
          }
        }
        chrome.storage.sync.set(syncData, () => {
          // Clear local storage data
          chrome.storage.local.clear();
        });
      });
    });
  }
  // END CHAT GPT

  // Show install page on install
  if (details.reason === "install") {
    chrome.tabs.create({ url: "popup/install.html" });
  }

  // Declare default vlaues
  chrome.storage.sync.get(allStorageKeys, (resultSync) => {
    if (resultSync.applicationIsOn == undefined) {
      chrome.storage.sync.set({ applicationIsOn: true });
    }
    if (resultSync.filterByMaxLength == undefined) {
      chrome.storage.sync.set({ filterByMaxLength: "none" });
    }
    if (resultSync.filterByMinLength == undefined) {
      chrome.storage.sync.set({ filterByMinLength: "none" });
    }
    if (resultSync.filterByMinViews == undefined) {
      chrome.storage.sync.set({ filterByMinViews: "none" });
    }
    if (resultSync.filterByMaxViews == undefined) {
      chrome.storage.sync.set({ filterByMaxViews: "none" });
    }
    if (resultSync.filterByMinLikes == undefined) {
      chrome.storage.sync.set({ filterByMinLikes: "none" });
    }
    if (resultSync.filterByMaxLikes == undefined) {
      chrome.storage.sync.set({ filterByMaxLikes: "none" });
    }
    if (resultSync.filterByMinComments == undefined) {
      chrome.storage.sync.set({ filterByMinComments: "none" });
    }
    if (resultSync.filterByMaxComments == undefined) {
      chrome.storage.sync.set({ filterByMaxComments: "none" });
    }
    if (resultSync.amountOfPlaysToSkip == undefined) {
      chrome.storage.sync.set({ amountOfPlaysToSkip: 1 });
    }
    if (resultSync.scrollOnComments == undefined) {
      chrome.storage.sync.set({ scrollOnComments: false });
    }
    if (resultSync.shortCutKeys == undefined) {
      chrome.storage.sync.set({ shortCutKeys: ["shift", "s"] });
    }
    if (resultSync.shortCutInteractKeys == undefined) {
      chrome.storage.sync.set({ shortCutInteractKeys: ["shift", "f"] });
    }
    if (resultSync.filteredAuthors == undefined) {
      chrome.storage.sync.set({
        filteredAuthors: ["Tyson3101"],
      });
    }
  });
});

chrome.runtime.onUpdateAvailable.addListener(() => {
  chrome.runtime.reload();
});
