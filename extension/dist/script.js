// VARIBLES
const errMsg = document.querySelector("#error");
const toggleBtn = document.querySelector(".toggleBtn");
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
const scrollOnCommentsInput = document.querySelector("#scrollOnComments");
const scrollOnNoTagsInput = document.querySelector("#scrollOnNoTags");
const additionalScrollDelayInput = document.querySelector("#additionalScrollDelay");
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
        document
            .querySelectorAll(".configureTags")
            .forEach((ele) => {
            ele.addEventListener("click", () => {
                console.log(ele.dataset["gotopageindex"]);
                changePage("settings", 0, parseInt(ele.dataset["gotopageindex"]));
            });
        });
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
        oldActive?.classList.remove("active");
        newActive?.classList.add("active");
    }
}
function getAllSettingsForPopup() {
    // Get Settings and show them on the popup (and check for updates and reflect them)
    chrome.storage.local.get(["shortCutKeys", "shortCutInteractKeys"], async ({ shortCutKeys, shortCutInteractKeys }) => {
        if (shortCutKeys == undefined) {
            await chrome.storage.local.set({
                shortCutKeys: ["shift", "d"],
            });
            shortCutInput.value = "shift+d";
        }
        else {
            shortCutInput.value = shortCutKeys.join("+");
        }
        shortCutInput.addEventListener("change", () => {
            const value = shortCutInput.value.trim().split(/\s*\+\s*/);
            if (!value.length)
                return;
            chrome.storage.local.set({
                shortCutKeys: value,
            });
            shortCutInput.value = value.join("+");
        });
        if (shortCutInteractKeys == undefined) {
            await chrome.storage.local.set({
                shortCutInteractKeys: ["shift", "g"],
            });
            shortCutInteractInput.value = "shift+g";
        }
        else {
            shortCutInteractInput.value = shortCutInteractKeys.join("+");
        }
        shortCutInteractInput.addEventListener("change", (e) => {
            const value = e.target.value
                .trim()
                .split(/\s*\+\s*/);
            if (!value.length)
                return;
            chrome.storage.local.set({
                shortCutInteractKeys: value,
            });
            shortCutInteractInput.value = value.join("+");
        });
    });
    chrome.storage.local.get("filteredAuthors", (result) => {
        let value = result["filteredAuthors"];
        if (value == undefined) {
            chrome.storage.local.set({
                filteredAuthors: ["Tyson3101"],
            });
            value = ["Tyson3101"];
        }
        filteredAuthors.value = value.join(",");
    });
    filteredAuthors.addEventListener("input", () => {
        const value = filteredAuthors.value
            .trim()
            .split(/\s*,\s*/)
            .filter((v) => v);
        chrome.storage.local.set({
            filteredAuthors: value,
        });
    });
    chrome.storage.local.get("whitelistedAuthors", (result) => {
        let value = result["whitelistedAuthors"];
        if (value == undefined) {
            chrome.storage.local.set({
                whitelistedAuthors: ["Tyson3101"],
            });
            value = ["Tyson3101"];
        }
        whitelistedAuthors.value = value.join(",");
    });
    whitelistedAuthors.addEventListener("input", () => {
        const value = whitelistedAuthors.value
            .trim()
            .split(/\s*,\s*/)
            .filter((v) => v);
        chrome.storage.local.set({
            whitelistedAuthors: value,
        });
    });
    chrome.storage.local.get("filteredTags", (result) => {
        let value = result["filteredTags"];
        if (value == undefined) {
            chrome.storage.local.set({
                filteredTags: ["#nsfw", "#leagueoflegends"],
            });
            value = ["#nsfw", "#leagueoflegends"];
        }
        filteredTags.value = value.join(",");
    });
    filteredTags.addEventListener("input", () => {
        const value = filteredTags.value
            .trim()
            .split(/\s*,\s*/)
            .filter((v) => v);
        chrome.storage.local.set({
            filteredTags: value,
        });
    });
    chrome.storage.local.get(["filterByMinLength"], async (result) => {
        let value = result["filterByMinLength"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMinLength: "none" });
            return (filterByMinLength.value = "none");
        }
        filterByMinLength.value = value;
    });
    chrome.storage.local.get(["filterByMaxLength"], async (result) => {
        let value = result["filterByMaxLength"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMaxLength: "none" });
            return (filterByMaxLength.value = "none");
        }
        filterByMaxLength.value = value;
    });
    chrome.storage.local.get(["filterByMaxLength"], async (result) => {
        let value = result["filterByMaxLength"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMaxLength: "none" });
            return (filterByMaxLength.value = "none");
        }
        filterByMaxLength.value = value;
    });
    chrome.storage.local.get(["filterByMinLength"], async (result) => {
        let value = result["filterByMinLength"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMinLength: "none" });
            return (filterByMinLength.value = "");
        }
        filterByMinLength.value = value;
    });
    chrome.storage.local.get(["filterByMinViews"], async (result) => {
        let value = result["filterByMinViews"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMinViews: "none" });
            return (filterByMinViews.value = "");
        }
        filterByMinViews.value = value === "none" ? "" : value;
    });
    chrome.storage.local.get(["filterByMaxViews"], async (result) => {
        let value = result["filterByMaxViews"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMaxViews: "none" });
            return (filterByMaxViews.value = "");
        }
        filterByMaxViews.value = value === "none" ? "" : value;
    });
    chrome.storage.local.get(["filterByMinLikes"], async (result) => {
        let value = result["filterByMinLikes"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMinLikes: "none" });
            return (filterByMinLikes.value = "");
        }
        filterByMinLikes.value = value === "none" ? "" : value;
    });
    chrome.storage.local.get(["filterByMaxLikes"], async (result) => {
        let value = result["filterByMaxLikes"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMaxLikes: "none" });
            return (filterByMaxLikes.value = "");
        }
        filterByMaxLikes.value = value === "none" ? "" : value;
    });
    chrome.storage.local.get(["filterByMinComments"], async (result) => {
        let value = result["filterByMinComments"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMinComments: "none" });
            return (filterByMinComments.value = "");
        }
        filterByMinComments.value = value === "none" ? "" : value;
    });
    chrome.storage.local.get(["filterByMaxComments"], async (result) => {
        let value = result["filterByMaxComments"];
        if (value == undefined) {
            await chrome.storage.local.set({ filterByMaxComments: "none" });
            return (filterByMaxComments.value = "");
        }
        filterByMaxComments.value = value === "none" ? "" : value;
    });
    filterByMinLength.addEventListener("change", (e) => {
        chrome.storage.local.set({
            filterByMinLength: e.target.value,
        });
    });
    filterByMaxLength.addEventListener("change", (e) => {
        chrome.storage.local.set({
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
        chrome.storage.local.set({
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
        chrome.storage.local.set({
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
        chrome.storage.local.set({
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
        chrome.storage.local.set({
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
        chrome.storage.local.set({
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
        chrome.storage.local.set({
            filterByMaxComments: value,
        });
    });
    chrome.storage.local.get(["scrollDirection"], async (result) => {
        let value = result["scrollDirection"];
        if (value == undefined) {
            await chrome.storage.local.set({ scrollDirection: "down" });
            scrollDirectionInput.value = "down";
        }
        scrollDirectionInput.value = value;
    });
    scrollDirectionInput.addEventListener("change", (e) => {
        chrome.storage.local.set({
            scrollDirection: e.target.value,
        });
    });
    chrome.storage.local.get(["amountOfPlaysToSkip"], async (result) => {
        let value = result["amountOfPlaysToSkip"];
        if (value == undefined) {
            await chrome.storage.local.set({ amountOfPlaysToSkip: 1 });
            amountOfPlaysInput.value = "1";
        }
        amountOfPlaysInput.value = value;
    });
    amountOfPlaysInput.addEventListener("change", (e) => {
        chrome.storage.local.set({
            amountOfPlaysToSkip: parseInt(e.target.value),
        });
    });
    chrome.storage.local.get(["additionalScrollDelay"], async (result) => {
        let value = result["additionalScrollDelay"];
        if (value == undefined) {
            await chrome.storage.local.set({ additionalScrollDelay: 0 });
            additionalScrollDelayInput.value = "0";
        }
        additionalScrollDelayInput.value = value;
    });
    additionalScrollDelayInput.addEventListener("change", (e) => {
        chrome.storage.local.set({
            additionalScrollDelay: parseInt(e.target.value),
        });
    });
    chrome.storage.local.get(["scrollOnComments"], async (result) => {
        let value = result["scrollOnComments"];
        if (value == undefined) {
            await chrome.storage.local.set({ scrollOnComments: false });
            scrollOnCommentsInput.checked = true;
        }
        scrollOnCommentsInput.checked = value;
    });
    scrollOnCommentsInput.addEventListener("change", (e) => {
        chrome.storage.local.set({
            scrollOnComments: e.target.checked,
        });
    });
    chrome.storage.local.get(["scrollOnNoTags"], async (result) => {
        let value = result["scrollOnNoTags"];
        if (value == undefined) {
            await chrome.storage.local.set({ scrollOnNoTags: false });
            scrollOnNoTagsInput.checked = true;
        }
        scrollOnNoTagsInput.checked = value;
    });
    scrollOnNoTagsInput.addEventListener("change", (e) => {
        chrome.storage.local.set({
            scrollOnNoTags: e.target.checked,
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
