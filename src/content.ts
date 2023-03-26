// CONSTANT SELECTORS VARIBLES
const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const LIKE_BUTTON_SELECTOR =
  "ytd-reel-video-renderer[is-active] #like-button > yt-button-shape > label > button";
const DISLIKE_BUTTON_SELECTOR =
  "ytd-reel-video-renderer[is-active] #dislike-button > yt-button-shape > label > button";
const COMMENTS_SELECTOR =
  "body > ytd-app > ytd-popup-container > tp-yt-paper-dialog > ytd-engagement-panel-section-list-renderer > div";

// APP VARIABLES
let shortCutToggleKeys = [];
let shortCutInteractKeys = [];
let scrollOnCommentsCheck = false;
let amountOfPlays = 0;
let amountOfPlaysToSkip = 1;
let filterMinLength = "none";
let filterMaxLength = "none";
let blockedCreators = [];

// STATE VARIABLES
let currentShortsID: string = null;
let applicationIsOn = false;
let scrollingIsDone = true;

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
  const currentVideo = document.querySelector(
    "#shorts-container video[tabindex='-1']"
  ) as HTMLVideoElement;
  // Lets the video loop again
  if (currentVideo) currentVideo.setAttribute("loop", "");
}

function checkForNewShort() {
  const currentVideo = document.querySelector(
    "#shorts-container video[tabindex='-1']"
  ) as HTMLVideoElement;
  const newCurrentShortsID = window.location.href.split("shorts/")[1];

  // Check to see if the video has loaded
  if (isNaN(currentVideo?.duration) || currentVideo?.duration == null) return;
  // Check to see if the page is a short video
  if (!newCurrentShortsID) return;
  // Checks if the appliaction is on. If not, lets the video loop again
  if (!applicationIsOn) return currentVideo.setAttribute("loop", "");
  else currentVideo.removeAttribute("loop");

  if (scrollingIsDone /*to prevent double scrolls*/) {
    if (newCurrentShortsID !== currentShortsID) {
      currentShortsID = newCurrentShortsID;
      amountOfPlays = 0;
    }
    if (!checkIfVaildVideo()) {
      scrollToNextShort();
      return;
    }
    currentVideo.addEventListener("ended", videoFinished);
  }
}

function videoFinished() {
  if (!applicationIsOn) return;
  amountOfPlays++;

  if (amountOfPlays >= amountOfPlaysToSkip) {
    // If the video is finished and is equal to the amount of plays needed to skip,
    // check if the comments are open. If they are, wait for them to close and then scroll to the next short
    const comments = document.querySelector(COMMENTS_SELECTOR);
    if (
      comments &&
      !scrollOnCommentsCheck &&
      comments.getBoundingClientRect().x > 0
    ) {
      let intervalComments = setInterval(() => {
        if (!comments.getBoundingClientRect().x) {
          scrollToNextShort();
          clearInterval(intervalComments);
        }
      }, 100);
      return;
    }
    scrollToNextShort();
  } else {
    // If the video hasn't been played enough times, play it again
    const currentVideo = document.querySelector(
      "#shorts-container video[tabindex='-1']"
    ) as HTMLVideoElement;
    currentVideo.play();
  }
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

function checkIfVaildVideo() {
  const currentVideoParent = getParentVideo();
  const currentVideo = currentVideoParent?.querySelector("video");
  if (!currentVideo) return false;
  // Check if the video is from a blocked creator and if it is, skip it (FROM SETTINGS)
  const authorOfVideo = currentVideoParent
    ?.querySelector(".ytd-channel-name")
    ?.querySelector("a")
    ?.innerText?.toLowerCase()
    .replace("@", "");
  if (
    authorOfVideo &&
    blockedCreators
      .map((c) => c.toLowerCase().replace("@", ""))
      .includes(authorOfVideo)
  ) {
    return false;
  }

  // Check if the video is within the length filter (FROM SETTINGS)
  if (filterMaxLength != "none" || filterMinLength != "none") {
    if (
      currentVideo.duration < parseInt(filterMinLength) ||
      currentVideo.duration > parseInt(filterMaxLength)
    ) {
      return false;
    }
  }
  return true;
}

// Helper function to get the parent of the current short playing/played
function getParentVideo() {
  const VIDEOS_LIST = [
    ...(document.querySelectorAll(
      VIDEOS_LIST_SELECTOR
    ) as NodeListOf<HTMLDivElement>),
  ];
  const currentVideoParent = VIDEOS_LIST.find((e) => {
    return e.hasAttribute("is-active");
  });
  return currentVideoParent;
}

// Sets up the application with the settings from chrome storage
// Checks if the application is on and if it is, starts the application
// Creates a Interval to check for new shorts every 100ms
(function initiate() {
  chrome.storage.local.get(["applicationIsOn"], (result) => {
    if (result.applicationIsOn == null) {
      return startAutoScrolling();
    }
    if (result.applicationIsOn) startAutoScrolling();
  });

  setInterval(checkForNewShort, 100);

  (function getAllSettings() {
    chrome.storage.local.get(
      [
        "shortCutKeys",
        "shortCutInteractKeys",
        "amountOfPlaysToSkip",
        "filterByMinLength",
        "filterByMaxLength",
        "filteredAuthors",
        "scrollOnComments",
      ],
      (result) => {
        if (result.shortCutKeys)
          shortCutToggleKeys = [...result["shortCutKeys"]];
        if (result.shortCutInteractKeys)
          shortCutInteractKeys = [...result["shortCutInteractKeys"]];
        if (result.amountOfPlaysToSkip)
          amountOfPlaysToSkip = result["amountOfPlaysToSkip"];
        if (result.scrollOnComments)
          scrollOnCommentsCheck = result["scrollOnComments"];
        if (result.filterByMinLength)
          filterMinLength = result.filterByMinLength;
        if (result.filterByMaxLength)
          filterMaxLength = result.filterByMaxLength;
        if (result.filteredAuthors)
          blockedCreators = [...result.filteredAuthors];
        shortCutListener();
      }
    );
    chrome.storage.onChanged.addListener((result) => {
      let newShortCutKeys = result["shortCutKeys"]?.newValue;
      if (newShortCutKeys != undefined) {
        shortCutToggleKeys = [...newShortCutKeys];
      }
      let newShortCutInteractKeys = result["shortCutInteractKeys"]?.newValue;
      if (newShortCutInteractKeys != undefined) {
        shortCutInteractKeys = [...newShortCutInteractKeys];
      }
      let newAmountOfPlaysToSkip = result["amountOfPlaysToSkip"]?.newValue;
      if (newAmountOfPlaysToSkip) {
        amountOfPlaysToSkip = result.amountOfPlaysToSkip.newValue;
      }
      let newScrollOnComments = result["scrollOnComments"]?.newValue;
      if (newScrollOnComments !== undefined) {
        scrollOnCommentsCheck = result.scrollOnComments.newValue;
      }
      let newFilterMinLength = result["filterByMinLength"]?.newValue;
      if (newFilterMinLength != undefined) {
        filterMinLength = newFilterMinLength;
      }
      let newFilterMaxLength = result["filterByMaxLength"]?.newValue;
      if (newFilterMaxLength != undefined) {
        filterMaxLength = newFilterMaxLength;
      }
      let newBlockedCreators = result["filteredAuthors"]?.newValue;
      if (newBlockedCreators != undefined) {
        blockedCreators = [...newBlockedCreators];
      }
    });
  })();
})();

function shortCutListener() {
  let pressedKeys = [];
  // Web Dev Simplifed Debounce
  function debounce(cb: Function, delay: number) {
    let timeout: number;

    return (...args: any) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        cb(...args);
      }, delay);
    };
  }

  const checkKeys = (
    keysToCheck: string[],
    waitDebounce: boolean = true,
    delay: number = 700
  ): Promise<boolean> => {
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
      const likeBtn = document.querySelector(
        LIKE_BUTTON_SELECTOR
      ) as HTMLButtonElement;
      const dislikeBtn = document.querySelector(
        DISLIKE_BUTTON_SELECTOR
      ) as HTMLButtonElement;
      if (
        likeBtn?.ariaPressed === "true" ||
        dislikeBtn?.ariaPressed === "true"
      ) {
        dislikeBtn.click();
      } else {
        likeBtn.click();
      }
    }
    pressedKeys = [];
  });
}

// Listens for toggle application from the popup
chrome.runtime.onMessage.addListener(({ toggle }: { toggle: boolean }) => {
  if (toggle) {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
      if (!result.applicationIsOn) startAutoScrolling();
      if (result.applicationIsOn) stopAutoScrolling();
    });
  }
  return true;
});
