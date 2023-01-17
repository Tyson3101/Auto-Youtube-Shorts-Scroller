// CONSTANT SELECTORS VARIBLES
const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const NEXT_VIDEO_BUTTON_SELECTOR =
  "#navigation-button-down > ytd-button-renderer > yt-button-shape > button";
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
let currentVideoIndex: number = null;
let applicationIsOn = false;
let scrollingIsDone = true;
let lastVideo: HTMLVideoElement = null;

// -------

function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
    // Save state to chrome storage so it will be on next time on page load
    chrome.storage.local.set({ AUTOYT_applicationIsOn: true });
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
    chrome.storage.local.set({ AUTOYT_applicationIsOn: false });
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
    if (!checkIfVaildVideo()) {
      scrollToNextShort();
      return;
    }
    currentVideo.addEventListener("ended", videoFinished);
  }
}

function videoFinished() {
  const currentVideo = document.querySelector(
    "#shorts-container video[tabindex='-1']"
  ) as HTMLVideoElement;
  if (!applicationIsOn) return currentVideo.setAttribute("loop", "");
  amountOfPlays++;

  if (amountOfPlays >= amountOfPlaysToSkip) {
    // If the video is finished and is equal to the amount of plays needed to skip,
    // check if the comments are open. If they are, wait for them to close and then scroll to the next short
    const comments = document.querySelector(COMMENTS_SELECTOR);
    if (comments && comments.getBoundingClientRect().x > 0) {
      if (!scrollOnCommentsCheck) {
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
        ) as HTMLButtonElement;
        if (closeCommentsButton) closeCommentsButton.click();
      }
    }
    scrollToNextShort();
  } else {
    // If the video hasn't been played enough times, play it again
    currentVideo?.play();
  }
}

async function scrollToNextShort() {
  amountOfPlays = 0;
  scrollingIsDone = false;
  const currentVideoParent = getParentVideo();
  const nextVideoParent = document.getElementById(
    `${Number(currentVideoParent?.id) + 1}`
  );
  if (nextVideoParent) {
    nextVideoParent.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  } else {
    const nextButton = document.querySelector(
      NEXT_VIDEO_BUTTON_SELECTOR
    ) as HTMLAnchorElement;
    if (nextButton) nextButton.click();
  }
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
    .innerText?.toLowerCase()
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
    return e.querySelector("video")?.tabIndex === -1;
  });
  return currentVideoParent;
}

// Sets up the application with the settings from chrome storage
// Checks if the application is on and if it is, starts the application
// Creates a Interval to check for new shorts every 100ms
(function initiate() {
  chrome.storage.local.get(["AUTOYT_applicationIsOn"], (result) => {
    if (result["AUTOYT_applicationIsOn"] == null) {
      return startAutoScrolling();
    }
    if (result["AUTOYT_applicationIsOn"]) startAutoScrolling();
  });

  setInterval(checkForNewShort, 100);

  (function getAllSettings() {
    chrome.storage.local.get(
      [
        "AUTOYT_shortCutKeys",
        "AUTOYT_shortCutInteractKeys",
        "AUTOYT_amountOfPlaysToSkip",
        "AUTOYT_filterByMinLength",
        "AUTOYT_filterByMaxLength",
        "AUTOYT_filteredAuthors",
        "AUTOYT_scrollOnComments",
      ],
      (result) => {
        if (result["AUTOYT_shortCutKeys"])
          shortCutToggleKeys = [...result["AUTOYT_shortCutKeys"]];
        if (result["AUTOYT_shortCutInteractKeys"])
          shortCutInteractKeys = [...result["AUTOYT_shortCutInteractKeys"]];
        if (result["AUTOYT_amountOfPlaysToSkip"])
          amountOfPlaysToSkip = result["AUTOYT_amountOfPlaysToSkip"];
        if (result["AUTOYT_scrollOnComments"])
          scrollOnCommentsCheck = result["AUTOYT_scrollOnComments"];
        if (result["AUTOYT_filterByMinLength"])
          filterMinLength = result["AUTOYT_filterByMinLength"];
        if (result["AUTOYT_filterByMaxLength"])
          filterMaxLength = result["AUTOYT_filterByMaxLength"];
        if (result["AUTOYT_filteredAuthors"])
          blockedCreators = [...result["AUTOYT_filteredAuthors"]];
        shortCutListener();
      }
    );
    chrome.storage.onChanged.addListener((result) => {
      let newShortCutKeys = result["AUTOYT_shortCutKeys"]?.newValue;
      if (newShortCutKeys != undefined) {
        shortCutToggleKeys = [...newShortCutKeys];
      }
      let newShortCutInteractKeys =
        result["AUTOYT_shortCutInteractKeys"]?.newValue;
      if (newShortCutInteractKeys != undefined) {
        shortCutInteractKeys = [...newShortCutInteractKeys];
      }
      let newAmountOfPlaysToSkip =
        result["AUTOYT_amountOfPlaysToSkip"]?.newValue;
      if (newAmountOfPlaysToSkip) {
        amountOfPlaysToSkip = newAmountOfPlaysToSkip;
      }
      let newScrollOnComments = result["AUTOYT_scrollOnComments"]?.newValue;
      if (newScrollOnComments !== undefined) {
        scrollOnCommentsCheck = newScrollOnComments;
      }
      let newFilterMinLength = result["AUTOYT_filterByMinLength"]?.newValue;
      if (newFilterMinLength != undefined) {
        filterMinLength = newFilterMinLength;
      }
      let newFilterMaxLength = result["AUTOYT_filterByMaxLength"]?.newValue;
      if (newFilterMaxLength != undefined) {
        filterMaxLength = newFilterMaxLength;
      }
      let newBlockedCreators = result["AUTOYT_filteredAuthors"]?.newValue;
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
        likeBtn?.getAttribute("aria-pressed") === "true" ||
        dislikeBtn?.getAttribute("aria-pressed") === "true"
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
    chrome.storage.local.get(["AUTOYT_applicationIsOn"], (result) => {
      try {
        if (!result["AUTOYT_applicationIsOn"]) startAutoScrolling();
        if (result["AUTOYT_applicationIsOn"]) stopAutoScrolling();
      } catch (e) {
        console.log(e);
      }
    });
  }
  return true;
});
