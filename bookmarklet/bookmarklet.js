const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const LIKE_BUTTON_SELECTOR =
  "ytd-reel-video-renderer[is-active] #like-button > yt-button-shape > label > button";
const DISLIKE_BUTTON_SELECTOR =
  "ytd-reel-video-renderer[is-active] #dislike-button > yt-button-shape > label > button";
const COMMENTS_SELECTOR =
  "body > ytd-app > ytd-popup-container > tp-yt-paper-dialog > ytd-engagement-panel-section-list-renderer > div";
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
// -------
let applicationIsOn = true;
let scrollOnComments = false;

let currentVideoIndex = null;
let scrollingIsDone = true;
let lastVideo = null;

const shortCutToggleKeys = ["shift", "s"];
const shortCutInteractKeys = ["shift", "f"];
const shortCutScrollOnCommentsKeys = ["shift", "d"];

shortCutListener();
showShortCutsOnStartUp();
startAutoScrolling();
console.log("Starting...");

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
  ).findIndex((e) => e.hasAttribute("is-active"));
  if (scrollingIsDone /*to prevent double scrolls*/) {
    if (newCurrentShortsIndex !== currentVideoIndex) {
      lastVideo?.removeEventListener("ended", videoFinished);
      lastVideo = currentVideo;
      currentVideoIndex = newCurrentShortsIndex;
    }
    currentVideo.addEventListener("ended", videoFinished);
  }
}
function videoFinished() {
  if (!applicationIsOn) return;
  const comments = document.querySelector(COMMENTS_SELECTOR);
  if (comments && comments.getBoundingClientRect().x > 0) {
    if (!scrollOnComments) {
      let intervalComments = setInterval(() => {
        if (!comments.getBoundingClientRect().x) {
          scrollToNextShort();
          clearInterval(intervalComments);
        }
      }, 100);
      return;
    } else {
      // If the comments are open and the user wants to scroll on comments, close the comments
      const closeCommentsButton = document.querySelector(
        "#visibility-button > ytd-button-renderer > yt-button-shape > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill"
      );
      if (closeCommentsButton) closeCommentsButton.click();
      scrollToNextShort();
    }
  } else {
    scrollToNextShort();
  }
}

async function scrollToNextShort() {
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

function getParentVideo() {
  const VIDEOS_LIST = [...document.querySelectorAll(VIDEOS_LIST_SELECTOR)];
  const currentVideoParent = VIDEOS_LIST.find((e) => {
    return (
      e.hasAttribute("is-active") &&
      e.querySelector("#shorts-container video[tabindex='-1']")
    );
  });
  return currentVideoParent;
}

setInterval(checkForNewShort, 100);

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
        } else resolve(false);
      }
      if (waitDebounce) debounce(debounceCB, delay)();
      else debounceCB();
    });
  };

  document.addEventListener("keydown", async (e) => {
    if (!e.key) return;
    pressedKeys.push(e.key.toLowerCase());
    // Shortcut for toggle application on/off
    if (await checkKeys(shortCutToggleKeys)) {
      if (applicationIsOn) {
        stopAutoScrolling();
      } else {
        startAutoScrolling();
      }
    } else if (await checkKeys(shortCutInteractKeys, false)) {
      // Shortcut for like/dislike
      const likeBtn = document.querySelector(LIKE_BUTTON_SELECTOR);
      const dislikeBtn = document.querySelector(DISLIKE_BUTTON_SELECTOR);
      if (
        likeBtn?.getAttribute("aria-pressed") === "true" ||
        dislikeBtn?.getAttribute("aria-pressed") === "true"
      ) {
        dislikeBtn.click();
      } else {
        likeBtn.click();
      }
    } else if (await checkKeys(shortCutScrollOnCommentsKeys, false)) {
      if (scrollOnComments) {
        scrollOnComments = false;
      } else {
        scrollOnComments = true;
      }
    }

    pressedKeys = [];
  });
}

function showShortCutsOnStartUp() {
  const rawHtmlString = `<div style="margin: 1vw; position: absolute; border: 2px soild black;width: 500px;height: fit-content;background-color: rgb(238, 167, 167);box-shadow: 10px 10px 5px lightblue; z-index: 9999;" class="autoTikTok-shortcuts-popup">
      <h1>Auto Youtube Shorts Scroller Shortcuts&nbsp;</h1>
      <p style="font-size: small"><i>Won't work properly if Auto YT Short Scroller Chrome Extension is installed</i></p>
      <h3><i>${
        applicationIsOn ? "Scroller Status: On" : "Scroller Status: Off"
      }</i></h3>
      <h3><i>${
        scrollOnComments
          ? "Scroll on Comments Status: On"
          : "Scroll on Comments Status Status: Off"
      }</i></h3>
      <div style='margin-left: 3vw' class="autoTikTok-commands">
        <h2>Toggle Scroller: <code style="background-color: rgba(20,20,20, 0.2);" class="autoTikTok-command">shift + s</code></h2>
        <h2>Toggle Scroll on Comments: <code style="background-color: rgba(20,20,20, 0.2);" class="autoTikTok-command">shift + d</code></h2>
        <h2>Toggle Like/Dislike: <code style="background-color: rgba(20,20,20, 0.2);" class="autoTikTok-command">shift + f</code></h2>
      </div>

    </div>`;
  let parsedHtml = new DOMParser().parseFromString(rawHtmlString, "text/html");
  document.body.prepend(...parsedHtml.body.children);
  setTimeout(
    () => document.querySelector(".autoTikTok-shortcuts-popup")?.remove(),
    5000
  );
}
