// ------------------------------
// CONSTANT SELECTORS VARIABLES
// ------------------------------
const VIDEOS_LIST_SELECTOR = ".reel-video-in-sequence";
const LIKE_BUTTON_SELECTOR = "#like-button button";
const DISLIKE_BUTTON_SELECTOR = "#dislike-button button";
const COMMENTS_SELECTOR =
  "ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-comments-section']";
const LIKES_COUNT_SELECTOR =
  "#factoids > factoid-renderer:nth-child(1) > div > span.ytwFactoidRendererValue > span";
const VIEW_COUNT_SELECTOR =
  "#factoids > view-count-factoid-renderer > factoid-renderer > div > span.ytwFactoidRendererValue > span";
const COMMENTS_COUNT_SELECTOR =
  "#comments-button > ytd-button-renderer > yt-button-shape > label > div > span";
const DESCRIPTION_TAGS_SELECTOR = "#title > yt-formatted-string > a";
const AUTHOUR_NAME_SELECTOR =
  "#metapanel > yt-reel-metapanel-view-model > div:nth-child(1) > yt-reel-channel-bar-view-model > span > a";
const AUTHOUR_NAME_SELECTOR_2 =
  "#metapanel > yt-reel-metapanel-view-model > div:nth-child(2) > yt-reel-channel-bar-view-model > span > a";
const NEXT_BUTTON_SELECTOR =
  "#navigation-button-down > ytd-button-renderer > yt-button-shape > button";
const PREVIOUS_BUTTON_SELECTOR =
  "#navigation-button-up > ytd-button-renderer > yt-button-shape > button";

// ------------------------------
// APP VARIABLES
// ------------------------------
let shortCutToggleKeys = [];
let shortCutInteractKeys = [];
let scrollOnCommentsCheck = false;
let scrollDirection = 1;
let amountOfPlays = 0;
let amountOfPlaysToSkip = 1;
let filterMinLength = "none";
let filterMaxLength = "none";
let filterMinViews = "none";
let filterMaxViews = "none";
let filterMinLikes = "none";
let filterMaxLikes = "none";
let filterMinComments = "none";
let filterMaxComments = "none";
let blockedCreators = [];
let whitelistedCreators = [];
let blockedTags = [];
let scrollOnNoTags = false;
let additionalScrollDelay = 0;

const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 300;

// ------------------------------
// STATE VARIABLES
// ------------------------------
let currentShortId = null;
let currentVideoElement = null;
let applicationIsOn = false;
let lastVideo = null;
let scrollTimeout: any;

// ------------------------------
// MAIN FUNCTIONS
// ------------------------------
function startAutoScrolling() {
  if (!applicationIsOn) {
    applicationIsOn = true;
    amountOfPlays = 0;
    currentShortId = null;
    currentVideoElement = null;
    lastVideo = null;
  }
  checkForNewShort();
}

function stopAutoScrolling() {
  applicationIsOn = false;
  amountOfPlays = 0;
  if (currentVideoElement) {
    // Adds back the loop attribute to the video element
    currentVideoElement.setAttribute("loop", "true");
    currentVideoElement.removeEventListener("ended", shortEnded);
  }
}

async function checkForNewShort() {
  if (!applicationIsOn) return;
  const currentShort = findShortContainer();

  // Checks if the current short is the same as the last one
  if (currentShort?.id != currentShortId) {
    if (scrollTimeout) clearTimeout(scrollTimeout);

    currentShortId = parseInt(currentShort.id);
    currentVideoElement = currentShort.querySelector("video");

    // Check if the current short has a video element
    if (currentVideoElement == null) {
      let l = 0;
      while (currentVideoElement == null) {
        currentVideoElement = currentShort.querySelector("video");
        if (l > MAX_RETRIES) {
          // If the video element is not found, scroll to the next short
          let prevShortId = currentShortId;
          currentShortId = null;
          return scrollToNextShort(prevShortId);
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        l++;
      }
    }

    // Check if the current short is an ad
    if (currentShort.querySelector("ytd-ad-slot-renderer")) {
      console.log("[Auto Youtube Shorts Scroller] Ad detected, skipping...");
      return scrollToNextShort(currentShortId, true);
    }

    console.log(
      "[Auto Youtube Shorts Scroller] Current ID of Short: ",
      currentShortId
    );

    if (currentShort.querySelector(AUTHOUR_NAME_SELECTOR) == null) {
      let l = 0;
      // If the creator name is not found, wait for it to load (A long with other data)
      while (currentShort.querySelector(AUTHOUR_NAME_SELECTOR) == null) {
        if (currentShort.querySelector(AUTHOUR_NAME_SELECTOR_2)) break;
        if (l > 15) {
          // If after time not found, scroll to next short
          let prevShortId = currentShortId;
          currentShortId = null;
          return scrollToNextShort(prevShortId);
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        l++;
      }
    }

    // Check if short meets the filter settings
    const isValidShort = await checkShortValidity(currentShort);
    // Otherwise scroll to the next short
    if (!isValidShort) return scrollToNextShort(currentShortId, true);

    // Set shortEnded function to ended event
    if (currentVideoElement)
      currentVideoElement.addEventListener("ended", shortEnded);
  }

  // Force removal of the loop attribute if it exists
  if (currentVideoElement?.hasAttribute("loop")) {
    currentVideoElement.removeAttribute("loop");
  }
}

function shortEnded(e: Event) {
  e.preventDefault();
  if (!applicationIsOn) return stopAutoScrolling();
  amountOfPlays++;

  // Checks amount of plays to skip the short
  if (amountOfPlays >= amountOfPlaysToSkip) {
    // If its same or exceeded the amount of plays, scroll to the next short
    amountOfPlays = 0;
    currentVideoElement.removeEventListener("ended", shortEnded);
    scrollToNextShort(currentShortId);
  } else {
    // Otherwise, play the video again
    currentVideoElement.play();
  }
}

async function scrollToNextShort(
  prevShortId: number = null,
  noAdditionalDelay = false
) {
  if (!applicationIsOn) return stopAutoScrolling();

  const comments = document.querySelector(COMMENTS_SELECTOR);

  // Check if comments is open, and settings are set to scroll on comments
  if (!scrollOnCommentsCheck && comments) {
    if (
      comments.attributes["VISIBILITY"]?.value ===
      "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"
    ) {
      // If the comments are open, wait till they are closed (if the setting is set to scroll on comments)
      while (
        !scrollOnCommentsCheck &&
        comments.attributes["VISIBILITY"]?.value ===
          "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  if (scrollTimeout) clearTimeout(scrollTimeout);
  if (additionalScrollDelay > 0 && !noAdditionalDelay)
    // If the additional scroll delay is set, wait for it, and allow loop while delaying
    currentVideoElement.play();
  scrollTimeout = setTimeout(
    async () => {
      if (prevShortId != null && currentShortId != prevShortId) return;

      const nextShortContainer = await waitForNextShort();
      if (nextShortContainer == null) return window.location.reload();

      // If next short container is found, remove the current video element end event listener
      currentVideoElement.removeEventListener("ended", shortEnded);

      // Scroll to the next short container
      nextShortContainer.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
      // Then check the new short
      checkForNewShort();
      // Sets the additional scroll delay from settings
    },
    !noAdditionalDelay ? additionalScrollDelay : 0
  );
}

function findShortContainer(id = null) {
  const shorts = [...document.querySelectorAll(VIDEOS_LIST_SELECTOR)];
  if (id != null) {
    const short = shorts.find((short) => short.id == id.toString());
    if (short) return short as HTMLDivElement;
  }
  if (shorts.length === 0) return;
  // If no id is provided, find the first short with the is-active attribute
  // If id is provided, return short with id index from shorts list selector
  return id > 1
    ? (shorts[id] as HTMLDivElement)
    : ((shorts.find((short) => short.hasAttribute("is-active")) ||
        shorts[0]) as HTMLDivElement);
}

async function waitForNextShort(retries = 5, delay = 500) {
  for (let i = 0; i < retries; i++) {
    // Find the next short container
    const nextShort = findShortContainer(currentShortId + scrollDirection);
    if (nextShort) return nextShort;

    // If none found, little slight screen shake to trigger hydration of new shorts
    window.scrollBy(0, 100);
    await new Promise((r) => setTimeout(r, delay));
    window.scrollBy(0, -100);
    await new Promise((r) => setTimeout(r, delay));
  }
  return null;
}

async function checkShortValidity(currentShort: HTMLDivElement) {
  const videoLength = currentVideoElement?.duration;
  const viewCount = document.querySelector(
    VIEW_COUNT_SELECTOR
  ) as HTMLSpanElement;
  const likeCount = document.querySelector(
    LIKES_COUNT_SELECTOR
  ) as HTMLSpanElement;
  const commentCount = currentShort.querySelector(
    COMMENTS_COUNT_SELECTOR
  ) as HTMLSpanElement;
  const tags = document.querySelectorAll(
    DESCRIPTION_TAGS_SELECTOR
  ) as NodeListOf<HTMLAnchorElement>;
  const creatorName = (currentShort.querySelector(AUTHOUR_NAME_SELECTOR) ||
    currentShort.querySelector(AUTHOUR_NAME_SELECTOR_2)) as HTMLAnchorElement;

  console.log("[Auto Youtube Shorts Scroller]", {
    filters: [
      { videoLength, filterMinLength, filterMaxLength },
      { viewCount, filterMinViews, filterMaxViews },
      { likeCount, filterMinLikes, filterMaxLikes },
      { commentCount, filterMinComments, filterMaxComments },
      { tags, blockedTags },
      { creatorName, blockedCreators, whitelistedCreators },
    ],
  });

  if (!creatorName || !viewCount || !likeCount || !commentCount) return false;

  // Ignores all checks if whitelisted creator
  if (whitelistedCreators.length > 0) {
    const creator = creatorName.innerText.trim().toLowerCase();
    if (
      whitelistedCreators.map((cr) => cr.toLowerCase()).includes(creator) ||
      whitelistedCreators
        .map((cr) => cr.toLowerCase())
        .includes(creator.replace("@", ""))
    ) {
      return true;
    }
  }

  if (!checkValidVideoLength(videoLength)) return false;
  if (!checkValidViewCount(viewCount)) return false;
  if (!checkValidLikeCount(likeCount)) return false;
  if (!checkValidCommentCount(commentCount)) return false;
  if (!checkValidTags(tags)) return false;
  if (!checkValidCreator(creatorName)) return false;

  function checkValidVideoLength(videoLength: number) {
    if (filterMinLength !== "none" && videoLength < parseInt(filterMinLength))
      return false;
    if (filterMaxLength !== "none" && videoLength > parseInt(filterMaxLength))
      return false;
    return true;
  }

  function checkValidViewCount(viewCount: HTMLSpanElement) {
    if (
      filterMinViews !== "none" &&
      parseInt(viewCount.innerText) < parseInt(filterMinViews)
    )
      return false;
    if (
      filterMaxViews !== "none" &&
      parseInt(viewCount.innerText) > parseInt(filterMaxViews)
    )
      return false;
    return true;
  }

  function checkValidLikeCount(likeCount: HTMLSpanElement) {
    const likeNum = parseLikeTextToNumber(likeCount.innerText);
    if (filterMinLikes !== "none" && likeNum < parseInt(filterMinLikes))
      return false;
    if (filterMaxLikes !== "none" && likeNum > parseInt(filterMaxLikes))
      return false;
    return true;
  }

  function checkValidCommentCount(commentCount: HTMLSpanElement) {
    const commentNum = parseLikeTextToNumber(commentCount.innerText);
    if (
      filterMinComments !== "none" &&
      commentNum < parseInt(filterMinComments)
    )
      return false;
    if (
      filterMaxComments !== "none" &&
      commentNum > parseInt(filterMaxComments)
    )
      return false;
    return true;
  }

  function checkValidTags(tags: NodeListOf<HTMLAnchorElement>) {
    if (tags.length === 0 && scrollOnNoTags) return false;
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i].innerText.toLowerCase();
      if (
        blockedTags.map((bTag) => bTag.toLowerCase()).includes(tag) ||
        blockedTags
          .map((bTag) => bTag.toLowerCase())
          .includes(tag.replace("#", ""))
      )
        return false;
    }
    return true;
  }

  function checkValidCreator(creatorName: HTMLAnchorElement) {
    const creator = creatorName.innerText.trim().toLowerCase();
    if (
      blockedCreators.map((cr) => cr.toLowerCase()).includes(creator) ||
      blockedCreators
        .map((cr) => cr.toLowerCase())
        .includes(creator.replace("@", ""))
    )
      return false;
    return true;
  }

  // If all checks pass, return true
  return true;
}

async function shortVideoElementLoaded(currentShort: HTMLDivElement) {
  let l = 0;
  // If the video element is not found, wait for it to load
  while (currentVideoElement == null) {
    currentVideoElement = currentShort.querySelector("video");
    if (l > 15) return scrollToNextShort(currentShortId);
    await new Promise((resolve) => setTimeout(resolve, 100));
    l++;
  }
}

// ------------------------------
// INITIATION AND SETTINGS FETCH
// ------------------------------
(function initiate() {
  chrome.storage.local.get(["applicationIsOn"], (result) => {
    if (result["applicationIsOn"] == null) return startAutoScrolling();
    if (result["applicationIsOn"]) startAutoScrolling();
  });

  checkForNewShort();
  checkApplicationState();

  setInterval(checkForNewShort, 400);

  function checkApplicationState() {
    chrome.storage.local.get(["applicationIsOn"], (result) => {
      if (applicationIsOn && result["applicationIsOn"] === false) {
        stopAutoScrolling();
      } else if (result["applicationIsOn"] === true) {
        startAutoScrolling();
      }
    });
  }

  (function onApplicationChange() {
    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes["applicationIsOn"]?.newValue) {
        startAutoScrolling();
      } else if (changes["applicationIsOn"]?.newValue === false) {
        stopAutoScrolling();
      }
    });
  })();

  (function getAllSettings() {
    chrome.storage.local.get(
      [
        "shortCutKeys",
        "shortCutInteractKeys",
        "scrollDirection",
        "amountOfPlaysToSkip",
        "filterByMinLength",
        "filterByMaxLength",
        "filterByMinViews",
        "filterByMaxViews",
        "filterByMinLikes",
        "filterByMaxLikes",
        "filterByMinComments",
        "filterByMaxComments",
        "filteredAuthors",
        "filteredTags",
        "scrollOnComments",
        "scrollOnNoTags",
        "whitelistedAuthors",
        "additionalScrollDelay",
      ],
      (result) => {
        console.log("[Auto Youtube Shorts Scroller]", {
          AutoYTScrollerSettings: result,
        });
        if (result["shortCutKeys"])
          shortCutToggleKeys = [...result["shortCutKeys"]];
        if (result["shortCutInteractKeys"])
          shortCutInteractKeys = [...result["shortCutInteractKeys"]];
        if (result["scrollDirection"]) {
          if (result["scrollDirection"] === "up") scrollDirection = -1;
          else scrollDirection = 1;
        }
        if (result["amountOfPlaysToSkip"])
          amountOfPlaysToSkip = result["amountOfPlaysToSkip"];
        if (result["scrollOnComments"])
          scrollOnCommentsCheck = result["scrollOnComments"];
        if (result["filterByMinLength"])
          filterMinLength = result["filterByMinLength"];
        if (result["filterByMaxLength"])
          filterMaxLength = result["filterByMaxLength"];
        if (result["filterByMinViews"])
          filterMinViews = result["filterByMinViews"];
        if (result["filterByMaxViews"])
          filterMaxViews = result["filterByMaxViews"];
        if (result["filterByMinLikes"])
          filterMinLikes = result["filterByMinLikes"];
        if (result["filterByMaxLikes"])
          filterMaxLikes = result["filterByMaxLikes"];
        if (result["filterByMinComments"])
          filterMinComments = result["filterByMinComments"];
        if (result["filterByMaxComments"])
          filterMaxComments = result["filterByMaxComments"];
        if (result["filteredAuthors"])
          blockedCreators = [...result["filteredAuthors"]];
        if (result["filteredTags"]) blockedTags = [...result["filteredTags"]];
        if (result["whitelistedAuthors"])
          whitelistedCreators = [...result["whitelistedAuthors"]];
        if (result["scrollOnNoTags"]) scrollOnNoTags = result["scrollOnNoTags"];
        if (result["additionalScrollDelay"])
          additionalScrollDelay = result["additionalScrollDelay"];

        shortCutListener();
      }
    );
    chrome.storage.onChanged.addListener(async (result) => {
      let newShortCutKeys = result["shortCutKeys"]?.newValue;
      if (newShortCutKeys != undefined) {
        shortCutToggleKeys = [...newShortCutKeys];
      }
      let newShortCutInteractKeys = result["shortCutInteractKeys"]?.newValue;
      if (newShortCutInteractKeys != undefined) {
        shortCutInteractKeys = [...newShortCutInteractKeys];
      }
      let newScrollDirection = result["scrollDirection"]?.newValue;
      if (newScrollDirection != undefined) {
        if (newScrollDirection === "up") scrollDirection = -1;
        else scrollDirection = 1;
      }
      let newAmountOfPlaysToSkip = result["amountOfPlaysToSkip"]?.newValue;
      if (newAmountOfPlaysToSkip) {
        amountOfPlaysToSkip = newAmountOfPlaysToSkip;
      }
      let newScrollOnComments = result["scrollOnComments"]?.newValue;
      if (newScrollOnComments !== undefined) {
        scrollOnCommentsCheck = newScrollOnComments;
      }
      let newFilterMinLength = result["filterByMinLength"]?.newValue;
      if (newFilterMinLength != undefined) {
        filterMinLength = newFilterMinLength;
      }
      let newFilterMaxLength = result["filterByMaxLength"]?.newValue;
      if (newFilterMaxLength != undefined) {
        filterMaxLength = newFilterMaxLength;
      }
      let newFilterMinViews = result["filterByMinViews"]?.newValue;
      if (newFilterMinViews != undefined) {
        filterMinViews = newFilterMinViews;
      }
      let newFilterMaxViews = result["filterByMaxViews"]?.newValue;
      if (newFilterMaxViews != undefined) {
        filterMaxViews = newFilterMaxViews;
      }
      let newFilterMinLikes = result["filterByMinLikes"]?.newValue;
      if (newFilterMinLikes != undefined) {
        filterMinLikes = newFilterMinLikes;
      }
      let newFilterMaxLikes = result["filterByMaxLikes"]?.newValue;
      if (newFilterMaxLikes != undefined) {
        filterMaxLikes = newFilterMaxLikes;
      }
      let newFilterMinComments = result["filterByMinComments"]?.newValue;
      if (newFilterMinComments != undefined) {
        filterMinComments = newFilterMinComments;
      }
      let newFilterMaxComments = result["filterByMaxComments"]?.newValue;
      if (newFilterMaxComments != undefined) {
        filterMaxComments = newFilterMaxComments;
      }
      let newBlockedCreators = result["filteredAuthors"]?.newValue;
      if (newBlockedCreators != undefined) {
        blockedCreators = [...newBlockedCreators];
      }
      let newBlockedTags = result["filteredTags"]?.newValue;
      if (newBlockedTags != undefined) {
        blockedTags = [...result["filteredTags"]?.newValue];
      }
      let newWhiteListedCreators = result["whitelistedAuthors"]?.newValue;
      if (newWhiteListedCreators != undefined) {
        whitelistedCreators = [...newWhiteListedCreators];
      }
      let newScrollOnNoTags = result["scrollOnNoTags"]?.newValue;
      if (newScrollOnNoTags !== undefined) {
        scrollOnNoTags = newScrollOnNoTags;
      }
      let newAdditionalScrollDelay = result["additionalScrollDelay"]?.newValue;
      if (newAdditionalScrollDelay !== undefined) {
        additionalScrollDelay = newAdditionalScrollDelay;
      }
      if (!(await checkShortValidity(findShortContainer(currentShortId)))) {
        scrollToNextShort(currentShortId);
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
        chrome.storage.local.set({
          applicationIsOn: false,
        });
      } else {
        startAutoScrolling();
        chrome.storage.local.set({
          applicationIsOn: true,
        });
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

function parseLikeTextToNumber(text: string): number {
  text = text.trim().toLowerCase();

  if (text.endsWith("k")) {
    return parseFloat(text) * 1_000;
  }
  if (text.endsWith("m")) {
    return parseFloat(text) * 1_000_000;
  }

  return parseInt(text.replace(/,/g, "")) || 0; // Handle normal numbers like "933"
}
