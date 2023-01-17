const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
// -------
let applicationIsOn = true;
let currentVideoIndex = null;
let scrollingIsDone = true;
let lastVideo = null;

document.addEventListener("keydown", (e) => {
  if (!e.isTrusted) return;
  if (e.key.toLowerCase() === "s" && e.shiftKey) {
    e.preventDefault();
    applicationIsOn ? stopAutoScrolling() : startAutoScrolling();
  }
});

function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
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
  }
  const currentVideo = document.querySelector(
    "#shorts-container video[tabindex='-1']"
  );
  // Lets the video loop again
  if (currentVideo) currentVideo.setAttribute("loop", "");
}

function checkForNewShort() {
  const currentVideo = document.querySelector(
    "#shorts-container video[tabindex='-1']"
  );
  // Check to see if the video has loaded
  if (isNaN(currentVideo?.duration) || currentVideo?.duration == null) return;
  // Checks if the appliaction is on. If not, lets the video loop again
  if (!applicationIsOn) return currentVideo.setAttribute("loop", "");
  else currentVideo.removeAttribute("loop");
  const newCurrentShortsIndex = Array.from(
    document.querySelectorAll(VIDEOS_LIST_SELECTOR)
  ).findIndex((v) => v.querySelector("video[tabindex='-1']"));
  if (scrollingIsDone /*to prevent double scrolls*/) {
    if (newCurrentShortsIndex !== currentVideoIndex) {
      lastVideo?.removeEventListener("ended", videoFinished);
      lastVideo = currentVideo;
      currentVideoIndex = newCurrentShortsIndex;
      amountOfPlays = 0;
    }

    scrollToNextShort();

    currentVideo.addEventListener("ended", videoFinished);
  }
}
function videoFinished() {
  if (!applicationIsOn) return;
  scrollToNextShort();
}

async function scrollToNextShort() {
  amountOfPlays = 0;
  scrollingIsDone = false;
  const currentVideoParent = getParentVideo();
  const nextVideoParent = document.getElementById(
    `${Number(currentVideoParent?.id) + 1}`
  );
  if (!nextVideoParent) return;
  nextVideoParent?.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });
  setTimeout(() => {
    // Hardcoded timeout to make sure the video is scrolled before other scrolls are allowed
    scrollingIsDone = true;
  }, 700);
}

(function loop() {
  checkForNewShort();
  sleep(100).then(loop);
})();

function showShortCutsOnStartUp() {
  const rawHtmlString = `<div style="margin: 1vw; position: absolute; border: 2px soild black;width: 500px;height: fit-content;background-color: rgb(238, 167, 167);box-shadow: 10px 10px 5px lightblue; z-index: 9999;" class="autoTikTok-shortcuts-popup">
      <h1>Auto Youtube Shorts Scroller Shortcuts&nbsp;</h1>
      <p style="font-size: small"><i>Won't work properly if Auto YT Short Scroller Chrome Extension is installed</i></p>
      <h3><i>${applicationIsOn ? "Scroller Status: On" : "Status: Off"}</i></h3>
      <div style='margin-left: 3vw' class="autoTikTok-commands">
        <h2>Toggle Scroller: <code style="background-color: rgba(20,20,20, 0.2);" class="autoTikTok-command">shift + s</code></h2>
      </div>

    </div>`;
  let parsedHtml = new DOMParser().parseFromString(rawHtmlString, "text/html");
  document.body.prepend(...parsedHtml.body.children);
  setTimeout(
    () => document.querySelector(".autoTikTok-shortcuts-popup")?.remove(),
    5000
  );
}
