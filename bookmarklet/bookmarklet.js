const NEXT_VIDEO_ARROW = "[aria-label='Next video']";
const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
// -------
let applicationIsOn = true;

document.addEventListener("keydown", (e) => {
  if (!e.isTrusted) return;
  if (e.key.toLowerCase() === "s" && e.shiftKey) {
    e.preventDefault();
    applicationIsOn ? stopAutoScrolling() : startAutoScrolling();
  }
});

startAutoScrolling();
showShortCutsOnStartUp();

function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
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
  const nextArrow = document.querySelector(NEXT_VIDEO_ARROW);
  const VIDEOS_LIST = [...document.querySelectorAll(VIDEOS_LIST_SELECTOR)];
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
    );
    try {
      currentvideo.attributes.removeNamedItem("loop");
      currentvideo.addEventListener("ended", endVideoEvent);
    } catch {}
  })();
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
