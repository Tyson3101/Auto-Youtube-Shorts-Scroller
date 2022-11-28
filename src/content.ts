const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const LIKE_BUTTON_SELECTOR =
  "ytd-reel-video-renderer[is-active] #like-button > yt-button-shape > label > button";
const DISLIKE_BUTTON_SELECTOR =
  "ytd-reel-video-renderer[is-active] #dislike-button > yt-button-shape > label > button";
const COMMENTS_SELECTOR =
  "body > ytd-app > ytd-popup-container > tp-yt-paper-dialog > ytd-engagement-panel-section-list-renderer > div";
let shortCutToggleKeys = [];
let shortCutInteractKeys = [];
let scrollOnCommentsCheck = false;
let amountOfPlays = 0;
let amountOfPlaysToSkip = 1;
let filterMinLength = "none";
let filterMaxLength = "none";
let blockedCreators = [];

let currentlyGoingToNextVideo = false;

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

// -------
let applicationIsOn = false;

(function initiate() {
  chrome.storage.local.get(["applicationIsOn"], (result) => {
    if (result.applicationIsOn == null) {
      return startAutoScrolling();
    }
    if (result.applicationIsOn) startAutoScrolling();
  });
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
        console.log("Pressed Keys: ", pressedKeys);
        console.log("Keys to check: ", keysToCheck);
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
    if (await checkKeys(shortCutToggleKeys)) {
      if (applicationIsOn) {
        stopAutoScrolling();
      } else {
        startAutoScrolling();
      }
    } else if (await checkKeys(shortCutInteractKeys, false)) {
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

chrome.runtime.onMessage.addListener(({ toggle }: { toggle: boolean }) => {
  if (toggle) {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
      if (!result.applicationIsOn) startAutoScrolling();
      if (result.applicationIsOn) stopAutoScrolling();
    });
  }
  return true;
});

function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
    chrome.storage.local.set({ applicationIsOn: true });
    if (window.location.href.includes("hashtag/shorts")) {
      document
        .querySelector("#thumbnail [aria-label='Shorts']")
        .parentElement.parentElement.parentElement.click();
    }
  }
}

function endVideoEvent() {
  if (!applicationIsOn)
    return document.querySelector("video").removeEventListener("ended", this);
  const VIDEOS_LIST = [
    ...(document.querySelectorAll(
      VIDEOS_LIST_SELECTOR
    ) as NodeListOf<HTMLDivElement>),
  ];
  const currentVideoParent = VIDEOS_LIST.find((e) => {
    return e.querySelector("video")?.tabIndex === -1;
  });
  const nextVideo = document.getElementById(
    `${Number(currentVideoParent?.id) + 1}`
  );
  if (amountOfPlays >= amountOfPlaysToSkip - 1 || amountOfPlays === -1) {
    const comments = document.querySelector(COMMENTS_SELECTOR);
    if (
      comments &&
      !scrollOnCommentsCheck &&
      comments.getBoundingClientRect().x > 0
    ) {
      let intervalComments = setInterval(() => {
        if (!comments.getBoundingClientRect().x) {
          goToNextVideo();
          clearInterval(intervalComments);
        }
      }, 100);
      return;
    } else {
      document.querySelector("video").play();
    }
    goToNextVideo();

    function goToNextVideo() {
      amountOfPlays = 0;
      nextVideo?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "center",
      });
      setTimeout(() => {
        currentlyGoingToNextVideo = false;
      }, 500);
    }
  } else {
    document.querySelector("video").play();
    amountOfPlays++;
  }
}

function stopAutoScrolling() {
  applicationIsOn = false;
  chrome.storage.local.set({ applicationIsOn: false });
  for (let video of Array.from(document.querySelectorAll("video"))) {
    video.setAttribute("loop", "");
  }
}

(function loop() {
  (function getCurrentVideo() {
    if (!applicationIsOn) return;
    let currentvideo = Array.from(document.querySelectorAll("video")).find(
      (video) =>
        !!(
          video.currentTime > 0 &&
          !video.paused &&
          !video.ended &&
          video.readyState > 2
        )
    ) as HTMLVideoElement;
    const VIDEOS_LIST = [
      ...(document.querySelectorAll(
        VIDEOS_LIST_SELECTOR
      ) as NodeListOf<HTMLDivElement>),
    ];
    const currentVideoParent = VIDEOS_LIST.find((e) => {
      return e.querySelector("video")?.tabIndex === -1;
    });
    if (filterMaxLength != "none" || filterMinLength != "none") {
      if (
        currentvideo?.duration < parseInt(filterMinLength) ||
        currentvideo?.duration > parseInt(filterMaxLength)
      ) {
        if (currentlyGoingToNextVideo) return;
        if (!currentVideoParent?.classList?.contains("ytd-shorts")) return;
        currentvideo.volume = 0;
        amountOfPlays = -1;
        currentlyGoingToNextVideo = true;
        endVideoEvent();
      }
    }
    const authorOfVideo = currentVideoParent
      ?.querySelector(".ytd-channel-name")
      ?.querySelector("a")
      .innerText?.toLowerCase();
    if (
      authorOfVideo &&
      !currentlyGoingToNextVideo &&
      blockedCreators.map((c) => c.toLowerCase()).includes(authorOfVideo)
    ) {
      if (!currentVideoParent?.classList?.contains("ytd-shorts")) return;
      amountOfPlays = -1;
      currentlyGoingToNextVideo = true;
      endVideoEvent();
    }

    try {
      currentvideo.attributes.removeNamedItem("loop");
      currentvideo.addEventListener("ended", endVideoEvent);
    } catch {}
  })();
  sleep(100).then(loop);
})();
