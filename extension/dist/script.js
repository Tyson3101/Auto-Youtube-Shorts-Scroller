// VARIBLES
const errMsg = document.querySelector("#error");
const toggleBtn = document.querySelector(".toggleBtn");
const filteredAuthors = document.querySelector("#filterAuthors");
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
const amountOfPlaysInput = document.querySelector("#amountOfPlaysInput");
const scrollOnCommentsInput = document.querySelector("#scrollOnComments");
const nextSettings = document.querySelector("#nextSettings");
const backSettings = document.querySelector("#backSettings");
const nextFilter = document.querySelector("#nextFilter");
const backFilter = document.querySelector("#backFilter");
const pageList = document.querySelector(".pageList");
// Call Functions
getAllSettingsForPopup();
pageNavigation("settings");
pageNavigation("filter");
// Listens to toggle button click
document.onclick = (e) => {
    if (e.target.classList.contains("toggleBtn"))
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]?.url?.toLowerCase().includes("youtube.com")) {
                try {
                    chrome.tabs.sendMessage(tabs[0].id, { toggle: true }, (response) => {
                        if (!response?.success)
                            errMsg.innerText = "Please refresh the page and try again!";
                    });
                }
                catch { }
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
    toggleBtn.innerText = result ? "Stop" : "Start";
    toggleBtn.classList.remove(result ? "start" : "stop");
    toggleBtn.classList.add(result ? "stop" : "start");
}
function pageNavigation(pageType) {
    let page = pageType.charAt(0).toUpperCase() + pageType.slice(1);
    const nextButton = document.getElementById(`next${page}`);
    const backButton = document.getElementById(`back${page}`);
    nextButton.onclick = () => {
        changePage(pageType, 1);
    };
    backButton.onclick = () => {
        changePage(pageType, -1);
    };
    if (pageType == "settings") {
        pageList.onclick = (e) => {
            const ele = e.target;
            if (ele?.tagName?.toLowerCase() == "a") {
                changePage("settings", 0, parseInt(e.target.dataset["pageindex"]));
            }
        };
    }
}
function changePage(page, direction, index) {
    let pageIndex = index + 1;
    let pages;
    const pageNumber = document.querySelector(`#${page}PageNumber`);
    if (page == "settings") {
        pages = document.querySelectorAll(".settingsPage");
    }
    if (page == "filter") {
        pages = document.querySelectorAll(".filterPage");
    }
    let newPage;
    const active = [...pages].find((page) => page.classList.contains("active"));
    if (index == null) {
        newPage = (() => {
            const changeIndex = parseInt(active.dataset["pageindex"]) + direction;
            if (changeIndex >= pages.length)
                return pages[0];
            if (changeIndex < 0)
                return pages[pages.length - 1];
            return pages[changeIndex];
        })();
        pageIndex = parseInt(newPage.dataset["pageindex"]) + 1;
    }
    else {
        newPage = pages[index];
    }
    pageNumber.innerText = `${pageIndex}/${pages.length}`;
    active.classList.remove("active");
    newPage.classList.add("active");
    if (page == "settings") {
        let oldActive = pageList.querySelector(".active");
        let newActive = pageList.querySelector(`[data-pageindex="${newPage.dataset["pageindex"]}"]`);
        oldActive.classList.remove("active");
        newActive.classList.add("active");
    }
}
function getAllSettingsForPopup() {
    // Get Settings and show them on the popup (and check for updates and reflect them)
    chrome.storage.sync.get(["shortCutKeys", "shortCutInteractKeys"], async ({ shortCutKeys, shortCutInteractKeys }) => {
        if (shortCutKeys == undefined) {
            await chrome.storage.sync.set({
                shortCutKeys: ["shift", "s"],
            });
            shortCutInput.value = "shift+s";
        }
        else {
            shortCutInput.value = shortCutKeys.join("+");
        }
        shortCutInput.addEventListener("change", () => {
            const value = shortCutInput.value.trim().split("+");
            if (!value.length)
                return;
            chrome.storage.sync.set({
                shortCutKeys: value,
            });
            shortCutInput.value = value.join("+");
        });
        if (shortCutInteractKeys == undefined) {
            await chrome.storage.sync.set({
                shortCutInteractKeys: ["shift", "f"],
            });
            shortCutInteractInput.value = "shift+f";
        }
        else {
            shortCutInteractInput.value = shortCutInteractKeys.join("+");
        }
        shortCutInteractInput.addEventListener("change", (e) => {
            const value = e.target.value.trim().split("+");
            if (!value.length)
                return;
            chrome.storage.sync.set({
                shortCutInteractKeys: value,
            });
            shortCutInteractInput.value = value.join("+");
        });
    });
    chrome.storage.sync.get("filteredAuthors", (result) => {
        let value = result["filteredAuthors"];
        if (value == undefined) {
            chrome.storage.sync.set({
                filteredAuthors: ["Tyson3101"],
            });
            value = ["Tyson3101"];
        }
        filteredAuthors.value = value.join(",");
    });
    filteredAuthors.addEventListener("input", () => {
        const value = filteredAuthors.value.split(",").filter((v) => v);
        chrome.storage.sync.set({
            filteredAuthors: value,
        });
    });
    chrome.storage.sync.get(["filterByMinLength"], async (result) => {
        let value = result["filterByMinLength"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMinLength: "none" });
            return (filterByMinLength.value = "none");
        }
        filterByMinLength.value = value;
    });
    chrome.storage.sync.get(["filterByMaxLength"], async (result) => {
        let value = result["filterByMaxLength"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMaxLength: "none" });
            return (filterByMaxLength.value = "none");
        }
        filterByMaxLength.value = value;
    });
    chrome.storage.sync.get(["filterByMaxLength"], async (result) => {
        let value = result["filterByMaxLength"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMaxLength: "none" });
            return (filterByMaxLength.value = "none");
        }
        filterByMaxLength.value = value;
    });
    chrome.storage.sync.get(["filterByMinLength"], async (result) => {
        let value = result["filterByMinLength"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMinLength: "none" });
            return (filterByMinLength.value = "");
        }
        filterByMinLength.value = value;
    });
    chrome.storage.sync.get(["filterByMinViews"], async (result) => {
        let value = result["filterByMinViews"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMinViews: "none" });
            return (filterByMinViews.value = "");
        }
        filterByMinViews.value = value === "none" ? "" : value;
    });
    chrome.storage.sync.get(["filterByMaxViews"], async (result) => {
        let value = result["filterByMaxViews"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMaxViews: "none" });
            return (filterByMaxViews.value = "");
        }
        filterByMaxViews.value = value === "none" ? "" : value;
    });
    chrome.storage.sync.get(["filterByMinLikes"], async (result) => {
        let value = result["filterByMinLikes"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMinLikes: "none" });
            return (filterByMinLikes.value = "");
        }
        filterByMinLikes.value = value === "none" ? "" : value;
    });
    chrome.storage.sync.get(["filterByMaxLikes"], async (result) => {
        let value = result["filterByMaxLikes"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMaxLikes: "none" });
            return (filterByMaxLikes.value = "");
        }
        filterByMaxLikes.value = value === "none" ? "" : value;
    });
    chrome.storage.sync.get(["filterByMinComments"], async (result) => {
        let value = result["filterByMinComments"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMinComments: "none" });
            return (filterByMinComments.value = "");
        }
        filterByMinComments.value = value === "none" ? "" : value;
    });
    chrome.storage.sync.get(["filterByMaxComments"], async (result) => {
        let value = result["filterByMaxComments"];
        if (value == undefined) {
            await chrome.storage.sync.set({ filterByMaxComments: "none" });
            return (filterByMaxComments.value = "");
        }
        filterByMaxComments.value = value === "none" ? "" : value;
    });
    filterByMinLength.addEventListener("change", (e) => {
        chrome.storage.sync.set({
            filterByMinLength: e.target.value,
        });
    });
    filterByMaxLength.addEventListener("change", (e) => {
        chrome.storage.sync.set({
            filterByMaxLength: e.target.value,
        });
    });
    filterByMinViews.addEventListener("change", (e) => {
        let value = e.target.value;
        let checkValue = value.replaceAll("_", "").replaceAll(",", "");
        if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
            value = "none";
            filterByMinViews.value = "";
        }
        chrome.storage.sync.set({
            filterByMinViews: value,
        });
    });
    filterByMaxViews.addEventListener("change", (e) => {
        let value = e.target.value;
        let checkValue = value.replaceAll("_", "").replaceAll(",", "");
        if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
            value = "none";
            filterByMaxViews.value = "";
        }
        chrome.storage.sync.set({
            filterByMaxViews: value,
        });
    });
    filterByMinLikes.addEventListener("change", (e) => {
        let value = e.target.value;
        let checkValue = value.replaceAll("_", "").replaceAll(",", "");
        if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
            value = "none";
            filterByMinLikes.value = "";
        }
        chrome.storage.sync.set({
            filterByMinLikes: value,
        });
    });
    filterByMaxLikes.addEventListener("change", (e) => {
        let value = e.target.value;
        let checkValue = value.replaceAll("_", "").replaceAll(",", "");
        if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
            value = "none";
            filterByMaxLikes.value = "";
        }
        chrome.storage.sync.set({
            filterByMaxLikes: value,
        });
    });
    filterByMinComments.addEventListener("change", (e) => {
        let value = e.target.value;
        let checkValue = value.replaceAll("_", "").replaceAll(",", "");
        if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
            value = "none";
            filterByMinComments.value = "";
        }
        chrome.storage.sync.set({
            filterByMinComments: value,
        });
    });
    filterByMaxComments.addEventListener("change", (e) => {
        let value = e.target.value;
        let checkValue = value.replaceAll("_", "").replaceAll(",", "");
        if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
            value = "none";
            filterByMaxComments.value = "";
        }
        chrome.storage.sync.set({
            filterByMaxComments: value,
        });
    });
    chrome.storage.sync.get(["amountOfPlaysToSkip"], async (result) => {
        let value = result["amountOfPlaysToSkip"];
        if (value == undefined) {
            await chrome.storage.sync.set({ amountOfPlaysToSkip: 1 });
            amountOfPlaysInput.value = "1";
        }
        amountOfPlaysInput.value = value;
    });
    amountOfPlaysInput.addEventListener("change", (e) => {
        chrome.storage.sync.set({
            amountOfPlaysToSkip: parseInt(e.target.value),
        });
    });
    chrome.storage.sync.get(["scrollOnComments"], async (result) => {
        let value = result["scrollOnComments"];
        if (value == undefined) {
            await chrome.storage.sync.set({ crollOnComments: false });
            scrollOnCommentsInput.checked = true;
        }
        scrollOnCommentsInput.checked = value;
    });
    scrollOnCommentsInput.addEventListener("change", (e) => {
        chrome.storage.sync.set({
            scrollOnComments: e.target.checked,
        });
    });
    chrome.storage.onChanged.addListener((result) => {
        if (result["applicationIsOn"]?.newValue != undefined)
            changeToggleButton(result["applicationIsOn"].newValue);
    });
    chrome.storage.local.get(["applicationIsOn"], (result) => {
        if (result["applicationIsOn"] == null) {
            changeToggleButton(true);
        }
        else
            changeToggleButton(result["applicationIsOn"]);
    });
}
