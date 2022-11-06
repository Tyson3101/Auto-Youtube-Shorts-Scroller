const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
let shortCutKeys = [];
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
        "filterByMinLength",
        "filterByMaxLength",
        "filteredAuthors",
      ],
      (result) => {
        if (result.shortCutKeys) {
          shortCutKeys = [...result["shortCutKeys"]];
          shortCutListener();
        }
        if (result.filterByMinLength)
          filterMinLength = result.filterByMinLength;
        if (result.filterByMaxLength)
          filterMaxLength = result.filterByMaxLength;
        if (result.filteredAuthors)
          blockedCreators = [...result.filteredAuthors];
      }
    );
    chrome.storage.onChanged.addListener((result) => {
      let newShortCutKeys = result["shortCutKeys"]?.newValue;
      if (newShortCutKeys != undefined) {
        shortCutKeys = [...newShortCutKeys];
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
  function debounce(cb: Function, delay = 700) {
    let timeout: number;

    return (...args: any) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        cb(...args);
      }, delay);
    };
  }

  const checkKeys = debounce(() => {
    // Github co pilot
    if (pressedKeys.length == shortCutKeys.length) {
      let match = true;
      for (let i = 0; i < pressedKeys.length; i++) {
        if (pressedKeys[i] != shortCutKeys[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        applicationIsOn ? stopAutoScrolling() : startAutoScrolling();
      }
    }
    pressedKeys = [];
  });

  document.addEventListener("keydown", (e) => {
    if (!e.key) return;
    pressedKeys.push(e.key.toLowerCase());
    checkKeys();
  });
}

chrome.runtime.onMessage.addListener(({ toggle }: { toggle: boolean }) => {
  if (toggle) {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
      if (!result.applicationIsOn) startAutoScrolling();
      if (result.applicationIsOn) stopAutoScrolling();
    });
  }
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
    `${Number(currentVideoParent.id) + 1}`
  );

  nextVideo?.scrollIntoView({
    behavior: "smooth",
    inline: "center",
    block: "center",
  });
  setTimeout(() => {
    currentlyGoingToNextVideo = false;
  }, 500);
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
    if (filterMaxLength != "none" || filterMinLength != "none") {
      if (
        currentvideo?.duration < parseInt(filterMinLength) ||
        currentvideo?.duration > parseInt(filterMaxLength)
      ) {
        if (currentlyGoingToNextVideo) return;
        currentvideo.volume = 0;
        endVideoEvent();
        currentlyGoingToNextVideo = true;
      }
    }
    const VIDEOS_LIST = [
      ...(document.querySelectorAll(
        VIDEOS_LIST_SELECTOR
      ) as NodeListOf<HTMLDivElement>),
    ];
    const currentVideoParent = VIDEOS_LIST.find((e) => {
      return e.querySelector("video")?.tabIndex === -1;
    });
    const authorOfVideo = currentVideoParent
      ?.querySelector(".ytd-channel-name")
      ?.querySelector("a")
      .innerText?.toLowerCase();
    if (
      authorOfVideo &&
      !currentlyGoingToNextVideo &&
      blockedCreators.map((c) => c.toLowerCase()).includes(authorOfVideo)
    ) {
      currentvideo.volume = 0;
      endVideoEvent();
      currentlyGoingToNextVideo = true;
    }

    try {
      currentvideo.attributes.removeNamedItem("loop");
      currentvideo.addEventListener("ended", endVideoEvent);
    } catch {}
  })();
  sleep(100).then(loop);
})();
