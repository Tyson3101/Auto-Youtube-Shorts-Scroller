// VARIBLES
const errMsg = document.querySelector("#error-message");
const statusToggle = document.querySelector("#status-toggle");
const filteredAuthors = document.querySelector("#filterAuthors");
const whitelistedAuthors = document.querySelector("#whitelistedAuthors");
const filteredTags = document.querySelector("#filterTags");
const shortCutInput = document.querySelector("#shortCutInput");
const shortCutInteractInput = document.querySelector("#shortCutInteractInput");
const filterByMaxLength = document.querySelector("#filterByMaxLength");
const filterByMinLength = document.querySelector("#filterByMinLength");
const filterByMinViews = document.querySelector("#filterByMinViews");
const filterByMaxViews = document.querySelector("#filterByMaxViews");
const filterByMinLikes = document.querySelector("#filterByMinLikes");
const filterByMaxLikes = document.querySelector("#filterByMaxLikes");
const filterByMinComments = document.querySelector("#filterByMinComments");
const filterByMaxComments = document.querySelector("#filterByMaxComments");
const scrollDirectionInput = document.querySelector("#scrollDirectionInput");
const amountOfPlaysInput = document.querySelector("#amountOfPlaysInput");
const scrollOnCommentsInput = document.querySelector("#scrollOnCommentsInput");
const scrollOnNoTagsInput = document.querySelector("#scrollOnNoTagsInput");
const additionalScrollDelayInput = document.querySelector("#additionalScrollDelayInput");

// Navigation Elements
const navItems = document.querySelectorAll(".nav-item");
const contentPanels = document.querySelectorAll(".content-panel");

// Call Functions
getAllSettingsForPopup();
setupNavigation();
setupEventListeners();

// Listens to toggle button click
document.onclick = (e) => {
    if (e.target.classList.contains("toggleBtn"))
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs[0]?.url?.toLowerCase().includes("youtube.com")) {
                errMsg.innerText = "Only can be toggled on Youtube!";
            }
            else {
                // get applicationIsOn from chrome storage
                chrome.storage.local.get(["applicationIsOn"], (result) => {
                    if (!result.applicationIsOn) {
                        chrome.storage.local.set({ applicationIsOn: true });
                        changeToggleButton(true);
                    }
                    else {
                        chrome.storage.local.set({ applicationIsOn: false });
                        changeToggleButton(false);
                    }
                });
            }
        });
};

function changeToggleButton(result) {
    statusToggle.checked = result;
}

function setupNavigation() {
    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            const targetPanelId = item.dataset.targetPanel;

            // Update nav item active state
            navItems.forEach((nav) => nav.classList.remove("active"));
            item.classList.add("active");

            // Update content panel active state
            contentPanels.forEach((panel) => {
                if (panel.id === targetPanelId) {
                    panel.classList.add("active");
                } else {
                    panel.classList.remove("active");
                }
            });
        });
    });
}

function setupEventListeners() {
    // Master Status Toggle
    statusToggle.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            // Basic check if on YouTube - could be refined
            if (!tabs[0]?.url?.toLowerCase().includes("youtube.com/shorts")) {
                errMsg.innerText = "Toggle works reliably on youtube.com/shorts pages.";
                // Optionally revert the toggle visually if not on YT
                // e.target.checked = !isChecked;
                chrome.storage.local.set({ applicationIsOn: isChecked }); // Still allow setting it
            } else {
                errMsg.innerText = ""; // Clear error on success
                chrome.storage.local.set({ applicationIsOn: isChecked });
            }
        });
    });

    // Update listeners to use 'input' for textareas for better responsiveness
    filteredAuthors.addEventListener("input", handleListInputChange(filteredAuthors, "filteredAuthors"));
    whitelistedAuthors.addEventListener("input", handleListInputChange(whitelistedAuthors, "whitelistedAuthors"));
    filteredTags.addEventListener("input", handleListInputChange(filteredTags, "filteredTags"));

    // Use 'change' for inputs/selects that don't need instant updates
    shortCutInput.addEventListener("change", handleShortcutInputChange(shortCutInput, "shortCutKeys", "shift+d"));
    shortCutInteractInput.addEventListener("change", handleShortcutInputChange(shortCutInteractInput, "shortCutInteractKeys", "shift+g"));

    filterByMinLength.addEventListener("change", handleSelectChange("filterByMinLength"));
    filterByMaxLength.addEventListener("change", handleSelectChange("filterByMaxLength"));

    filterByMinViews.addEventListener("change", handleNumericInputChange("filterByMinViews"));
    filterByMaxViews.addEventListener("change", handleNumericInputChange("filterByMaxViews"));
    filterByMinLikes.addEventListener("change", handleNumericInputChange("filterByMinLikes"));
    filterByMaxLikes.addEventListener("change", handleNumericInputChange("filterByMaxLikes"));
    filterByMinComments.addEventListener("change", handleNumericInputChange("filterByMinComments"));
    filterByMaxComments.addEventListener("change", handleNumericInputChange("filterByMaxComments"));

    scrollDirectionInput.addEventListener("change", handleSelectChange("scrollDirection"));
    amountOfPlaysInput.addEventListener("change", handleIntegerInputChange("amountOfPlaysToSkip", 1));
    additionalScrollDelayInput.addEventListener("change", handleIntegerInputChange("additionalScrollDelay", 0));

    scrollOnCommentsInput.addEventListener("change", handleCheckboxChange("scrollOnComments"));
    scrollOnNoTagsInput.addEventListener("change", handleCheckboxChange("scrollOnNoTags"));

    // Listen for storage changes to update UI (especially the master toggle)
    chrome.storage.onChanged.addListener((changes) => {
        if (changes["applicationIsOn"]?.newValue !== undefined) {
            statusToggle.checked = changes["applicationIsOn"].newValue;
        }
        // Add listeners for other settings if needed for dynamic updates,
        // but usually reloading settings on popup open is sufficient.
    });
}

function handleListInputChange(element, storageKey) {
    return () => {
        const value = element.value
            .trim()
            .split(/\s*,\s*/)
            .map(v => v.trim()) // Trim each item
            .filter((v) => v); // Remove empty strings
        chrome.storage.local.set({ [storageKey]: value });
    };
}

function handleShortcutInputChange(element, storageKey, defaultValue) {
    return () => {
        const value = element.value.trim().toLowerCase().split(/\s*\+\s*/).filter(v => v);
        if (!value.length) {
            // Optional: reset to default or show error
            // chrome.storage.local.set({ [storageKey]: defaultValue.split('+') });
            // element.value = defaultValue;
            return;
        }
        chrome.storage.local.set({ [storageKey]: value });
        element.value = value.join("+"); // Standardize format
    };
}

function handleSelectChange(storageKey) {
    return (e) => {
        chrome.storage.local.set({ [storageKey]: e.target.value });
    };
}

function handleNumericInputChange(storageKey) {
    return (e) => {
        let value = e.target.value.trim().toLowerCase();
        let storageValue = "none"; // Default to 'none'

        if (value === "" || value === "none") {
           storageValue = "none";
           e.target.value = ""; // Clear input if set to none/empty
        } else {
            // Basic check if it looks like a number or has k/m suffix
            // More robust parsing could be added (like in content.js)
             if (/^(\d+(\.\d+)?|\d+)[km]?$/.test(value) || /^\d+$/.test(value.replace(/[,_]/g, ''))) {
                 storageValue = value; // Store the user's input format (like 50k)
             } else {
                 // Invalid format, treat as 'none'
                 storageValue = "none";
                 e.target.value = ""; // Clear invalid input
                 errMsg.innerText = `Invalid number format for ${storageKey}. Use numbers, k, or m.`;
                 setTimeout(() => errMsg.innerText = "", 3000); // Clear error message
             }
        }
        chrome.storage.local.set({ [storageKey]: storageValue });
    };
}

function handleIntegerInputChange(storageKey, defaultValue) {
    return (e) => {
        const value = parseInt(e.target.value, 10);
        if (isNaN(value) || value < (e.target.min || 0)) {
             chrome.storage.local.set({ [storageKey]: defaultValue });
             e.target.value = defaultValue.toString(); // Reset to default if invalid
        } else {
             chrome.storage.local.set({ [storageKey]: value });
             e.target.value = value.toString(); // Ensure it's displayed as a clean number
        }
    };
}

function handleCheckboxChange(storageKey) {
    return (e) => {
        chrome.storage.local.set({ [storageKey]: e.target.checked });
    };
}

function getAllSettingsForPopup() {
    // Combine keys for a single 'get' call
    const keysToGet = [
        "applicationIsOn", "shortCutKeys", "shortCutInteractKeys",
        "filteredAuthors", "whitelistedAuthors", "filteredTags",
        "filterByMinLength", "filterByMaxLength", "filterByMinViews",
        "filterByMaxViews", "filterByMinLikes", "filterByMaxLikes",
        "filterByMinComments", "filterByMaxComments", "scrollDirection",
        "amountOfPlaysToSkip", "scrollOnComments", "scrollOnNoTags",
        "additionalScrollDelay"
    ];

    chrome.storage.local.get(keysToGet, (result) => {
        // Master Status Toggle
        statusToggle.checked = result.applicationIsOn ?? true; // Default to true if undefined

        // Shortcuts
        shortCutInput.value = (result.shortCutKeys ?? ["shift", "d"]).join("+");
        shortCutInteractInput.value = (result.shortCutInteractKeys ?? ["shift", "g"]).join("+");

        // Lists (Authors/Tags)
        filteredAuthors.value = (result.filteredAuthors ?? ["Tyson3101"]).join(",");
        whitelistedAuthors.value = (result.whitelistedAuthors ?? ["Tyson3101"]).join(","); // Default potentially empty?
        filteredTags.value = (result.filteredTags ?? ["#nsfw", "#leagueoflegends"]).join(",");

        // Filters
        filterByMinLength.value = result.filterByMinLength ?? "none";
        filterByMaxLength.value = result.filterByMaxLength ?? "none";
        filterByMinViews.value = (result.filterByMinViews === "none" || result.filterByMinViews === undefined) ? "" : result.filterByMinViews;
        filterByMaxViews.value = (result.filterByMaxViews === "none" || result.filterByMaxViews === undefined) ? "" : result.filterByMaxViews;
        filterByMinLikes.value = (result.filterByMinLikes === "none" || result.filterByMinLikes === undefined) ? "" : result.filterByMinLikes;
        filterByMaxLikes.value = (result.filterByMaxLikes === "none" || result.filterByMaxLikes === undefined) ? "" : result.filterByMaxLikes;
        filterByMinComments.value = (result.filterByMinComments === "none" || result.filterByMinComments === undefined) ? "" : result.filterByMinComments;
        filterByMaxComments.value = (result.filterByMaxComments === "none" || result.filterByMaxComments === undefined) ? "" : result.filterByMaxComments;

        // General Settings
        scrollDirectionInput.value = result.scrollDirection ?? "down";
        amountOfPlaysInput.value = (result.amountOfPlaysToSkip ?? 1).toString();
        additionalScrollDelayInput.value = (result.additionalScrollDelay ?? 0).toString();
        scrollOnCommentsInput.checked = result.scrollOnComments ?? false; // Default to false
        scrollOnNoTagsInput.checked = result.scrollOnNoTags ?? false; // Default to false

        // Initialize default values in storage if they were undefined
        const defaultsToSet = {};
        if (result.applicationIsOn === undefined) defaultsToSet.applicationIsOn = true;
        if (result.shortCutKeys === undefined) defaultsToSet.shortCutKeys = ["shift", "d"];
        if (result.shortCutInteractKeys === undefined) defaultsToSet.shortCutInteractKeys = ["shift", "g"];
        if (result.filteredAuthors === undefined) defaultsToSet.filteredAuthors = ["Tyson3101"];
        if (result.whitelistedAuthors === undefined) defaultsToSet.whitelistedAuthors = []; // Maybe empty default?
        if (result.filteredTags === undefined) defaultsToSet.filteredTags = ["#nsfw", "#leagueoflegends"];
        if (result.filterByMinLength === undefined) defaultsToSet.filterByMinLength = "none";
        if (result.filterByMaxLength === undefined) defaultsToSet.filterByMaxLength = "none";
        if (result.filterByMinViews === undefined) defaultsToSet.filterByMinViews = "none";
        if (result.filterByMaxViews === undefined) defaultsToSet.filterByMaxViews = "none";
        if (result.filterByMinLikes === undefined) defaultsToSet.filterByMinLikes = "none";
        if (result.filterByMaxLikes === undefined) defaultsToSet.filterByMaxLikes = "none";
        if (result.filterByMinComments === undefined) defaultsToSet.filterByMinComments = "none";
        if (result.filterByMaxComments === undefined) defaultsToSet.filterByMaxComments = "none";
        if (result.scrollDirection === undefined) defaultsToSet.scrollDirection = "down";
        if (result.amountOfPlaysToSkip === undefined) defaultsToSet.amountOfPlaysToSkip = 1;
        if (result.scrollOnComments === undefined) defaultsToSet.scrollOnComments = false;
        if (result.scrollOnNoTags === undefined) defaultsToSet.scrollOnNoTags = false;
        if (result.additionalScrollDelay === undefined) defaultsToSet.additionalScrollDelay = 0;

        if (Object.keys(defaultsToSet).length > 0) {
            chrome.storage.local.set(defaultsToSet);
        }
    });
}
