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
                    if (key !== "applicationIsOn") {
                        if (resultSync[key] === undefined &&
                            resultLocal[key] !== undefined) {
                            syncData[key] = resultLocal[key];
                        }
                    }
                }
                chrome.storage.sync.set(syncData, () => {
                    // Clear local storage data + keep applicationIsOn
                    chrome.storage.local.get(["applicationIsOn"], (result) => {
                        chrome.storage.local.clear();
                        if (result.applicationIsOn == undefined) {
                            result.applicationIsOn = true;
                        }
                        chrome.storage.local.set({
                            applicationIsOn: result.applicationIsOn,
                        });
                    });
                });
                // Get all filters, then turn it into a string
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
