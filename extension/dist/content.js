// CONSTANT SELECTORS VARIBLES
const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const NEXT_VIDEO_BUTTON_SELECTOR = "#navigation-button-down > ytd-button-renderer > yt-button-shape > button";
const LIKE_BUTTON_SELECTOR = "ytd-reel-video-renderer[is-active] #like-button > yt-button-shape > label > button";
const DISLIKE_BUTTON_SELECTOR = "ytd-reel-video-renderer[is-active] #dislike-button > yt-button-shape > label > button";
const COMMENTS_SELECTOR = "ytd-reel-video-renderer[is-active] ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-comments-section']";
const LIKES_COUNT_SELECTOR = "ytd-reel-video-renderer[is-active] #factoids > ytd-factoid-renderer:nth-child(1) > div > yt-formatted-string.factoid-value.style-scope.ytd-factoid-renderer";
const VIEW_COUNT_SELECTOR = "ytd-reel-video-renderer[is-active] #factoids > ytd-factoid-renderer:nth-child(2) > div > yt-formatted-string.factoid-value.style-scope.ytd-factoid-renderer";
const COMMENTS_COUNT_SELECTOR = "ytd-reel-video-renderer[is-active] #comments-button > ytd-button-renderer > yt-button-shape > label > div > span";
// APP VARIABLES
let shortCutToggleKeys = [];
let shortCutInteractKeys = [];
let scrollOnCommentsCheck = false;
let scrollDirection = 1;
let amountOfPlays = 0;
let amountOfPlaysToSkip = 1;
let filterMinLength = "none";
let filterMaxLength = "none";
let filterMinViews = "none";
let filterMaxViews = "none";
let filterMinLikes = "none";
let filterMaxLikes = "none";
let filterMinComments = "none";
let filterMaxComments = "none";
let blockedCreators = [];
let whitelistedCreators = [];
let blockedTags = [];
// STATE VARIABLES
let currentVideoIndex = null;
let applicationIsOn = false;
let scrollingIsDone = true;
let lastVideo = null;
// -------
function startAutoScrolling() {
    if (!applicationIsOn) {
        applicationIsOn = true;
        // Save state to chrome storage so it will be on next time on page load
        chrome.storage.local.set({ applicationIsOn: true });
        if (window.location.href.includes("hashtag/shorts")) {
            // If on hashtag page, click on a shorts video to start the auto scrolling (WHEN THIS FUNCTION CALLED)
            document
                .querySelector("#thumbnail [aria-label='Shorts']")
                .parentElement.parentElement.parentElement.click();
        }
    }
}
function stopAutoScrolling() {
    if (applicationIsOn) {
        applicationIsOn = false;
        // Save state to chrome storage so it will be off next time on page load
        chrome.storage.local.set({ applicationIsOn: false });
    }
    const currentVideo = document.querySelector("#shorts-container video[tabindex='-1']");
    // Lets the video loop again
    if (currentVideo)
        currentVideo.setAttribute("loop", "");
}
function checkForNewShort() {
    const currentVideo = document.querySelector("#shorts-container video[tabindex='-1']");
    // Check to see if the video has loaded
    if (isNaN(currentVideo?.duration) || currentVideo?.duration == null)
        return;
    // Checks if the appliaction is on. If not, lets the video loop again
    if (!applicationIsOn)
        return currentVideo.setAttribute("loop", "");
    else
        currentVideo.removeAttribute("loop");
    const newCurrentShortsIndex = Array.from(document.querySelectorAll(VIDEOS_LIST_SELECTOR)).findIndex((e) => e.hasAttribute("is-active"));
    if (scrollingIsDone /*to prevent double scrolls*/) {
        if (newCurrentShortsIndex !== currentVideoIndex) {
            lastVideo?.removeEventListener("ended", videoFinished);
            lastVideo = currentVideo;
            currentVideoIndex = newCurrentShortsIndex;
            amountOfPlays = 0;
        }
        if (!checkIfVaildVideo()) {
            scrollToNextShort();
            return;
        }
    }
    if (currentVideo) {
        currentVideo.addEventListener("ended", videoFinished);
    }
}
function videoFinished() {
    console.log("video finished");
    const currentVideo = document.querySelector("#shorts-container video[tabindex='-1']");
    if (!applicationIsOn)
        return currentVideo.setAttribute("loop", "");
    amountOfPlays++;
    if (amountOfPlays >= amountOfPlaysToSkip) {
        // If the video is finished and is equal to the amount of plays needed to skip,
        // check if the comments are open.
        const comments = document.querySelector(COMMENTS_SELECTOR);
        if (scrollOnCommentsCheck || !comments)
            return scrollToNextShort(); // Scroll due to scrollOnComments being true or comments not being found
        else if (comments.getAttribute("visibility") ===
            "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN" ||
            comments.clientWidth <= 0)
            return scrollToNextShort(); // Scroll due to comments not being open
        // If the comments are open, wait for them to close
        let intervalComments = setInterval(() => {
            if (comments.getAttribute("visibility") ===
                "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN" ||
                comments.clientWidth <= 0) {
                scrollToNextShort();
                clearInterval(intervalComments);
            }
        }, 100);
    }
    else {
        // If the video hasn't been played enough times, play it again
        currentVideo?.play();
    }
}
async function scrollToNextShort() {
    const currentVideoParent = getParentVideo();
    if (!currentVideoParent)
        return;
    const currentVideo = currentVideoParent.querySelector("video");
    if (!applicationIsOn)
        return currentVideo?.setAttribute("loop", "");
    amountOfPlays = 0;
    scrollingIsDone = false;
    const nextVideoParent = document.getElementById(`${Number(currentVideoParent?.id) + scrollDirection}`);
    if (nextVideoParent) {
        nextVideoParent.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
        });
    }
    else {
        currentVideo?.play();
    }
    setTimeout(() => {
        // Hardcoded timeout to make sure the video is scrolled before other scrolls are allowed
        scrollingIsDone = true;
    }, 700);
}
function checkIfVaildVideo() {
    const currentVideoParent = getParentVideo();
    const currentVideo = currentVideoParent?.querySelector("video");
    if (!currentVideo)
        return false;
    if (!applicationIsOn) {
        currentVideo.setAttribute("loop", "");
        return false;
    }
    // Check if the video is from a blocked creator and if it is, skip it (FROM SETTINGS)
    const authorOfVideo = currentVideoParent?.querySelector("#text a")?.innerText
        ?.toLowerCase()
        .replace("@", "");
    const tagsOfVideo = [
        ...currentVideoParent?.querySelectorAll("h2.title a"),
    ].map((src) => src?.innerText?.toLowerCase()?.replaceAll("#", ""));
    if (authorOfVideo &&
        blockedCreators
            .map((c) => c?.toLowerCase()?.replace("@", ""))
            .includes(authorOfVideo)) {
        return false;
    }
    else if (tagsOfVideo &&
        tagsOfVideo
            .map((tag) => tag?.replaceAll("#", "")?.toLowerCase())
            .some((tag) => blockedTags
            .map((tag) => tag?.toLowerCase())
            .map((tag) => tag?.replace("#", ""))
            .includes(tag)) &&
        !whitelistedCreators
            .map((c) => c?.toLowerCase()?.replace("@", ""))
            .includes(authorOfVideo)) {
        return false;
    }
    // Check if the video is within the length filter (FROM SETTINGS)
    if (filterMaxLength != "none" || filterMinLength != "none") {
        if (currentVideo.duration < parseInt(filterMinLength) ||
            currentVideo.duration > parseInt(filterMaxLength)) {
            return false;
        }
    }
    if (filterMinViews != "none" || filterMaxViews != "none") {
        const viewCountInnerText = document.querySelector(VIEW_COUNT_SELECTOR)?.innerText;
        if (viewCountInnerText) {
            const viewCount = parseInt(viewCountInnerText.replaceAll(",", ""));
            if (viewCount <
                parseInt(filterMinViews.replaceAll("_", "").replaceAll(",", "")) ||
                viewCount >
                    parseInt(filterMaxViews.replaceAll("_", "").replaceAll(",", ""))) {
                return false;
            }
        }
    }
    if (filterMinLikes != "none" || filterMaxLikes != "none") {
        const likeCountInnerText = document.querySelector(LIKES_COUNT_SELECTOR)?.innerText?.toLowerCase();
        if (likeCountInnerText) {
            let likeCount = parseFloat(likeCountInnerText);
            if (likeCountInnerText.endsWith("k")) {
                likeCount *= 1000;
            }
            else if (likeCountInnerText.endsWith("m")) {
                likeCount *= 1000000;
            }
            else if (likeCountInnerText.endsWith("b")) {
                likeCount *= 1000000000;
            }
            else if (isNaN(likeCount) && filterMinLikes != "none") {
                return false;
            }
            if (likeCount <
                parseInt(filterMinLikes.replaceAll("_", "").replaceAll(",", "")) ||
                likeCount >
                    parseInt(filterMaxLikes.replaceAll("_", "").replaceAll(",", ""))) {
                return false;
            }
        }
    }
    if (filterMinComments != "none" || filterMaxComments != "none") {
        const commentsCountInnerText = document.querySelector(COMMENTS_COUNT_SELECTOR)?.innerText?.toLowerCase();
        if (commentsCountInnerText) {
            let commentsCount = parseFloat(commentsCountInnerText);
            if (commentsCountInnerText.endsWith("k")) {
                commentsCount *= 1000;
            }
            else if (commentsCountInnerText.endsWith("m")) {
                commentsCount *= 1000000;
            }
            else if (commentsCountInnerText.endsWith("b")) {
                commentsCount *= 1000000000;
            }
            else if (isNaN(commentsCount) && filterMinComments != "none") {
                return false;
            }
            if (commentsCount <
                parseInt(filterMinComments.replaceAll("_", "").replaceAll(",", "")) ||
                commentsCount >
                    parseInt(filterMaxComments.replaceAll("_", "").replaceAll(",", ""))) {
                return false;
            }
        }
        else if (filterMinComments != "none") {
            return false;
        }
    }
    return true;
}
// Helper function to get the parent of the current short playing/played
function getParentVideo() {
    const VIDEOS_LIST = [
        ...document.querySelectorAll(VIDEOS_LIST_SELECTOR),
    ];
    const currentVideoParent = VIDEOS_LIST.find((e) => {
        return (e.hasAttribute("is-active") &&
            e.querySelector("#shorts-container video[tabindex='-1']"));
    });
    return currentVideoParent;
}
// Sets up the application with the settings from chrome storage
// Checks if the application is on and if it is, starts the application
// Creates a Interval to check for new shorts every 100ms
(function initiate() {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
        if (result["applicationIsOn"] == null) {
            return startAutoScrolling();
        }
        if (result["applicationIsOn"])
            startAutoScrolling();
    });
    checkForNewShort();
    checkApplicationState();
    setInterval(checkForNewShort, 100);
    setInterval(() => {
        checkApplicationState();
    }, 2000);
    function checkApplicationState() {
        chrome.storage.local.get(["applicationIsOn"], (result) => {
            if (applicationIsOn && result["applicationIsOn"] == false) {
                if (!result["applicationIsOn"])
                    stopAutoScrolling();
            }
            else if (result["applicationIsOn"] == true) {
                startAutoScrolling();
            }
        });
    }
    (function getAllSettings() {
        chrome.storage.sync.get([
            "shortCutKeys",
            "shortCutInteractKeys",
            "scrollDirection",
            "amountOfPlaysToSkip",
            "filterByMinLength",
            "filterByMaxLength",
            "filterByMinViews",
            "filterByMaxViews",
            "filterByMinLikes",
            "filterByMaxLikes",
            "filterByMinComments",
            "filterByMaxComments",
            "filteredAuthors",
            "filteredTags",
            "scrollOnComments",
        ], (result) => {
            if (result["shortCutKeys"])
                shortCutToggleKeys = [...result["shortCutKeys"]];
            if (result["shortCutInteractKeys"])
                shortCutInteractKeys = [...result["shortCutInteractKeys"]];
            if (result["scrollDirection"]) {
                if (result["scrollDirection"] === "up")
                    scrollDirection = -1;
                else
                    scrollDirection = 1;
            }
            if (result["amountOfPlaysToSkip"])
                amountOfPlaysToSkip = result["amountOfPlaysToSkip"];
            if (result["scrollOnComments"])
                scrollOnCommentsCheck = result["scrollOnComments"];
            if (result["filterByMinLength"])
                filterMinLength = result["filterByMinLength"];
            if (result["filterByMaxLength"])
                filterMaxLength = result["filterByMaxLength"];
            if (result["filterByMinViews"])
                filterMinViews = result["filterByMinViews"];
            if (result["filterByMaxViews"])
                filterMaxViews = result["filterByMaxViews"];
            if (result["filterByMinLikes"])
                filterMinLikes = result["filterByMinLikes"];
            if (result["filterByMaxLikes"])
                filterMaxLikes = result["filterByMaxLikes"];
            if (result["filterByMinComments"])
                filterMinComments = result["filterByMinComments"];
            if (result["filterByMaxComments"])
                filterMaxComments = result["filterByMaxComments"];
            if (result["filteredAuthors"])
                blockedCreators = [...result["filteredAuthors"]];
            if (result["filteredTags"])
                blockedTags = [...result["filteredTags"]];
            if (result["whitelistedAuthors"])
                whitelistedCreators = [...result["whitelistedAuthors"]];
            shortCutListener();
        });
        chrome.storage.onChanged.addListener((result) => {
            let newShortCutKeys = result["shortCutKeys"]?.newValue;
            if (newShortCutKeys != undefined) {
                shortCutToggleKeys = [...newShortCutKeys];
            }
            let newShortCutInteractKeys = result["shortCutInteractKeys"]?.newValue;
            if (newShortCutInteractKeys != undefined) {
                shortCutInteractKeys = [...newShortCutInteractKeys];
            }
            let newScrollDirection = result["scrollDirection"]?.newValue;
            if (newScrollDirection != undefined) {
                if (newScrollDirection === "up")
                    scrollDirection = -1;
                else
                    scrollDirection = 1;
            }
            let newAmountOfPlaysToSkip = result["amountOfPlaysToSkip"]?.newValue;
            if (newAmountOfPlaysToSkip) {
                amountOfPlaysToSkip = newAmountOfPlaysToSkip;
            }
            let newScrollOnComments = result["scrollOnComments"]?.newValue;
            if (newScrollOnComments !== undefined) {
                scrollOnCommentsCheck = newScrollOnComments;
            }
            let newFilterMinLength = result["filterByMinLength"]?.newValue;
            if (newFilterMinLength != undefined) {
                filterMinLength = newFilterMinLength;
            }
            let newFilterMaxLength = result["filterByMaxLength"]?.newValue;
            if (newFilterMaxLength != undefined) {
                filterMaxLength = newFilterMaxLength;
            }
            let newFilterMinViews = result["filterByMinViews"]?.newValue;
            if (newFilterMinViews != undefined) {
                filterMinViews = newFilterMinViews;
            }
            let newFilterMaxViews = result["filterByMaxViews"]?.newValue;
            if (newFilterMaxViews != undefined) {
                filterMaxViews = newFilterMaxViews;
            }
            let newFilterMinLikes = result["filterByMinLikes"]?.newValue;
            if (newFilterMinLikes != undefined) {
                filterMinLikes = newFilterMinLikes;
            }
            let newFilterMaxLikes = result["filterByMaxLikes"]?.newValue;
            if (newFilterMaxLikes != undefined) {
                filterMaxLikes = newFilterMaxLikes;
            }
            let newFilterMinComments = result["filterByMinComments"]?.newValue;
            if (newFilterMinComments != undefined) {
                filterMinComments = newFilterMinComments;
            }
            let newFilterMaxComments = result["filterByMaxComments"]?.newValue;
            if (newFilterMaxComments != undefined) {
                filterMaxComments = newFilterMaxComments;
            }
            let newBlockedCreators = result["filteredAuthors"]?.newValue;
            if (newBlockedCreators != undefined) {
                blockedCreators = [...newBlockedCreators];
            }
            let newBlockedTags = result["filteredTags"]?.newValue;
            if (newBlockedTags != undefined) {
                blockedTags = [...result["filteredTags"]?.newValue];
            }
            let newWhiteListedCreators = result["whitelistedAuthors"]?.newValue;
            if (newWhiteListedCreators != undefined) {
                whitelistedCreators = [...newWhiteListedCreators];
            }
        });
    })();
})();
function shortCutListener() {
    let pressedKeys = [];
    // Web Dev Simplifed Debounce
    function debounce(cb, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                cb(...args);
            }, delay);
        };
    }
    const checkKeys = (keysToCheck, waitDebounce = true, delay = 700) => {
        return new Promise((resolve) => {
            function debounceCB() {
                if (pressedKeys.length == keysToCheck.length) {
                    let match = true;
                    for (let i = 0; i < pressedKeys.length; i++) {
                        if (pressedKeys[i] != keysToCheck[i]) {
                            match = false;
                            break;
                        }
                    }
                    resolve(match);
                }
                else
                    resolve(false);
            }
            if (waitDebounce)
                debounce(debounceCB, delay)();
            else
                debounceCB();
        });
    };
    document.addEventListener("keydown", async (e) => {
        if (!e.key)
            return;
        pressedKeys.push(e.key.toLowerCase());
        // Shortcut for toggle application on/off
        if (await checkKeys(shortCutToggleKeys)) {
            if (applicationIsOn) {
                stopAutoScrolling();
            }
            else {
                startAutoScrolling();
            }
        }
        else if (await checkKeys(shortCutInteractKeys, false)) {
            // Shortcut for like/dislike
            const likeBtn = document.querySelector(LIKE_BUTTON_SELECTOR);
            const dislikeBtn = document.querySelector(DISLIKE_BUTTON_SELECTOR);
            if (likeBtn?.getAttribute("aria-pressed") === "true" ||
                dislikeBtn?.getAttribute("aria-pressed") === "true") {
                dislikeBtn.click();
            }
            else {
                likeBtn.click();
            }
        }
        pressedKeys = [];
    });
}
// Listens for toggle application from the popup
chrome.runtime.onMessage.addListener(({ toggle }, _, sendResponse) => {
    if (toggle) {
        chrome.storage.local.get(["applicationIsOn"], async (result) => {
            if (!result["applicationIsOn"])
                startAutoScrolling();
            if (result["applicationIsOn"])
                stopAutoScrolling();
            sendResponse({ success: true });
        });
    }
    return true;
});
