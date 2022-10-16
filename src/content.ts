const NEXT_VIDEO_ARROW = "[aria-label='Next video']";
const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";

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
})();

document.addEventListener("keydown", (e) => {
  if (!e.isTrusted) return;
  if (e.key.toLowerCase() === "s" && e.shiftKey) {
    e.preventDefault();
    applicationIsOn ? stopAutoScrolling() : startAutoScrolling();
  }
});

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
  const nextArrow = document.querySelector(
    NEXT_VIDEO_ARROW
  ) as HTMLButtonElement;
  const VIDEOS_LIST = [
    ...(document.querySelectorAll(
      VIDEOS_LIST_SELECTOR
    ) as NodeListOf<HTMLDivElement>),
  ];
  if (undefined) nextArrow.click();
  else {
    const currentVideoParent = VIDEOS_LIST.find((e) => {
      return e.querySelector("video")?.tabIndex === -1;
    });
    const nextVideo = document.getElementById(
      `${Number(currentVideoParent.id) + 1}`
    );
    nextVideo.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "center",
    });
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
    try {
      currentvideo.attributes.removeNamedItem("loop");
      currentvideo.addEventListener("ended", endVideoEvent);
    } catch {}
  })();
  sleep(100).then(loop);
})();
