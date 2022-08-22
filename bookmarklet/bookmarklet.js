const NEXT_VIDEO_ARROW = "[aria-label='Next video']";

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

// -------
let applicationIsOn = false;

function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
    if (window.location.href.includes("hashtag/shorts")) {
      document
        .querySelector("#thumbnail [aria-label='Shorts']")
        .parentElement.parentElement.parentElement.click();
    }
    getCurrentVideo();
  }
}
async function getCurrentVideo() {
  let currentvideo = Array.from(document.querySelectorAll("video")).find(
    (video) =>
      !!(
        video.currentTime > 0 &&
        !video.paused &&
        !video.ended &&
        video.readyState > 2
      )
  );
  try {
    currentvideo.attributes.removeNamedItem("loop");
    currentvideo.addEventListener("ended", endVideoEvent);
  } catch {}
  await sleep(500);
  if (applicationIsOn) getCurrentVideo();
}
async function endVideoEvent() {
  if (!applicationIsOn)
    return document.querySelector("video").removeEventListener("ended", this);
  document.querySelector(NEXT_VIDEO_ARROW)?.click();
}

function stopAutoScrolling() {
  applicationIsOn = false;
}

startAutoScrolling();

(function showShortCut() {
  const rawHtmlString = `<div style="margin: 1vw; position: absolute; border: 2px soild black;width: fit-content;height: fit-content;background-color: rgb(238, 167, 167);box-shadow: 10px 10px 5px lightblue; z-index: 1001;" class="autoYTShorts-shortcuts-popup">
      <h1>Auto Youtube Shorts Scroller Shortcuts&nbsp;</h1>
      <div style="margin-left: 3vw;" class="autoYTShorts-commands">
        <h2>Start: <code style="background-color: rgba(20,20,20, 0.2);" class="autoYTShorts-command">shift + a</code></h2>
        <h2>Stop: <code style="background-color: rgba(20,20,20, 0.2);" class="autoYTShorts-command">shift + s</code></h2>
      </div>
    </div>`;
  let parsedHtml = new DOMParser().parseFromString(rawHtmlString, "text/html");
  document.body.prepend(...parsedHtml.body.children);
  setTimeout(
    () => document.querySelector(".autoYTShorts-shortcuts-popup")?.remove(),
    5000
  );
})();

document.addEventListener("keydown", (e) => {
  if (!e.isTrusted) return;
  if (e.key.toLowerCase() === "a" && e.shiftKey) {
    e.preventDefault();
    startAutoScrolling();
  } else if (e.key.toLowerCase() === "s" && e.shiftKey) {
    e.preventDefault();
    stopAutoScrolling();
  }
});
