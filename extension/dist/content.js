const NEXT_VIDEO_ARROW = "[aria-label='Next video']";
const sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
// -------
let applicationIsOn = false;
chrome.runtime.onMessage.addListener(({ start, stop }) => {
    if (start) {
        startAutoScrolling();
    }
    if (stop)
        stopAutoScrolling();
});
function startAutoScrolling() {
    applicationIsOn = true;
    if (window.location.href.includes("hashtag/shorts")) {
        document
            .querySelector("#thumbnail [aria-label='Shorts']")
            .parentElement.parentElement.parentElement.click();
    }
    getCurrentVideo();
}
async function getCurrentVideo() {
    let currentvideo = Array.from(document.querySelectorAll("video")).find((video) => !!(video.currentTime > 0 &&
        !video.paused &&
        !video.ended &&
        video.readyState > 2));
    try {
        currentvideo.attributes.removeNamedItem("loop");
        currentvideo.addEventListener("ended", endVideoEvent);
    }
    catch { }
    await sleep(500);
    if (applicationIsOn)
        getCurrentVideo();
}
async function endVideoEvent() {
    console.log("Done");
    if (!applicationIsOn)
        return document.querySelector("video").removeEventListener("ended", this);
    document.querySelector(NEXT_VIDEO_ARROW)?.click();
}
function stopAutoScrolling() {
    applicationIsOn = false;
    for (let video of Array.from(document.querySelectorAll("video"))) {
        video.setAttribute("loop", "");
    }
}
