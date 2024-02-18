// VARIBLES
const errMsg = document.querySelector("#error") as HTMLParagraphElement;
const toggleBtn = document.querySelector(".toggleBtn") as HTMLButtonElement;
const filteredAuthors = document.querySelector(
  "#filterAuthors"
) as HTMLInputElement;
const whitelistedAuthors = document.querySelector(
  "#whitelistedAuthors"
) as HTMLInputElement;
const filteredTags = document.querySelector("#filterTags") as HTMLInputElement;
const shortCutInput = document.querySelector(
  "#shortCutInput"
) as HTMLInputElement;
const shortCutInteractInput = document.querySelector(
  "#shortCutInteractInput"
) as HTMLInputElement;
const filterByMaxLength = document.querySelector(
  "#filterByMaxLength"
) as HTMLSelectElement;
const filterByMinLength = document.querySelector(
  "#filterByMinLength"
) as HTMLSelectElement;
const filterByMinViews = document.querySelector(
  "#filterByMinViews"
) as HTMLInputElement;
const filterByMaxViews = document.querySelector(
  "#filterByMaxViews"
) as HTMLInputElement;
const filterByMinLikes = document.querySelector(
  "#filterByMinLikes"
) as HTMLInputElement;
const filterByMaxLikes = document.querySelector(
  "#filterByMaxLikes"
) as HTMLInputElement;
const filterByMinComments = document.querySelector(
  "#filterByMinComments"
) as HTMLInputElement;
const filterByMaxComments = document.querySelector(
  "#filterByMaxComments"
) as HTMLInputElement;
const scrollDirectionInput = document.querySelector(
  "#scrollDirectionInput"
) as HTMLSelectElement;
const amountOfPlaysInput = document.querySelector(
  "#amountOfPlaysInput"
) as HTMLInputElement;
const scrollOnCommentsInput = document.querySelector(
  "#scrollOnComments"
) as HTMLInputElement;
const nextSettings = document.querySelector("#nextSettings") as HTMLDivElement;
const backSettings = document.querySelector("#backSettings") as HTMLDivElement;
const nextFilter = document.querySelector("#nextFilter") as HTMLDivElement;
const backFilter = document.querySelector("#backFilter") as HTMLDivElement;
const pageList = document.querySelector(".pageList") as HTMLDivElement;

// Call Functions
getAllSettingsForPopup();
pageNavigation("settings");
pageNavigation("filter");

// Listens to toggle button click
document.onclick = (e: Event) => {
  if ((e.target as HTMLButtonElement).classList.contains("toggleBtn"))
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.url?.toLowerCase().includes("youtube.com")) {
        try {
          chrome.tabs.sendMessage(tabs[0].id, { toggle: true }, (response) => {
            if (!response?.success)
              errMsg.innerText = "Please refresh the page and try again!";
          });
        } catch {}
      } else {
        // get applicationIsOn from chrome storage
        chrome.storage.local.get(["applicationIsOn"], (result) => {
          if (!result.applicationIsOn) {
            chrome.storage.local.set({ applicationIsOn: true });
            changeToggleButton(true);
          } else {
            chrome.storage.local.set({ applicationIsOn: false });
            changeToggleButton(false);
          }
        });
      }
    });
};

function changeToggleButton(result: boolean) {
  toggleBtn.innerText = result ? "Stop" : "Start";
  toggleBtn.classList.remove(result ? "start" : "stop");
  toggleBtn.classList.add(result ? "stop" : "start");
}

function pageNavigation(pageType: "settings" | "filter") {
  let page = pageType.charAt(0).toUpperCase() + pageType.slice(1);
  const nextButton = document.getElementById(`next${page}`);
  const backButton = document.getElementById(`back${page}`);
  nextButton.onclick = () => {
    changePage(pageType, 1);
  };
  backButton.onclick = () => {
    changePage(pageType, -1);
  };
  if (pageType == "settings") {
    pageList.onclick = (e) => {
      const ele = e.target as HTMLDivElement;
      if (ele?.tagName?.toLowerCase() == "a") {
        changePage(
          "settings",
          0,
          parseInt((e.target as HTMLAnchorElement).dataset["pageindex"])
        );
      }
    };

    document
      .querySelectorAll(".configureTags")
      .forEach((ele: HTMLAnchorElement) => {
        ele.addEventListener("click", () => {
          console.log(ele.dataset["gotopageindex"]);
          changePage("settings", 0, parseInt(ele.dataset["gotopageindex"]));
        });
      });
  }
}

function changePage(
  page: "settings" | "filter",
  direction: number,
  index?: number
) {
  let pageIndex = index + 1;
  let pages: NodeListOf<HTMLDivElement>;
  const pageNumber = document.querySelector(
    `#${page}PageNumber`
  ) as HTMLDivElement;
  if (page == "settings") {
    pages = document.querySelectorAll(".settingsPage");
  }
  if (page == "filter") {
    pages = document.querySelectorAll(".filterPage");
  }
  let newPage: HTMLDivElement;
  const active = [...pages].find((page) => page.classList.contains("active"));
  if (index == null) {
    newPage = (() => {
      const changeIndex = parseInt(active.dataset["pageindex"]) + direction;
      if (changeIndex >= pages.length) return pages[0];
      if (changeIndex < 0) return pages[pages.length - 1];
      return pages[changeIndex];
    })();
    pageIndex = parseInt(newPage.dataset["pageindex"]) + 1;
  } else {
    newPage = pages[index];
  }
  pageNumber.innerText = `${pageIndex}/${pages.length}`;
  active.classList.remove("active");
  newPage.classList.add("active");
  if (page == "settings") {
    let oldActive = pageList.querySelector(".active") as HTMLDivElement;
    let newActive = pageList.querySelector(
      `[data-pageindex="${newPage.dataset["pageindex"]}"]`
    ) as HTMLDivElement;
    oldActive?.classList.remove("active");
    newActive?.classList.add("active");
  }
}

function getAllSettingsForPopup() {
  // Get Settings and show them on the popup (and check for updates and reflect them)
  chrome.storage.sync.get(
    ["shortCutKeys", "shortCutInteractKeys"],
    async ({ shortCutKeys, shortCutInteractKeys }) => {
      if (shortCutKeys == undefined) {
        await chrome.storage.sync.set({
          shortCutKeys: ["shift", "d"],
        });
        shortCutInput.value = "shift+s";
      } else {
        shortCutInput.value = shortCutKeys.join("+");
      }
      shortCutInput.addEventListener("change", () => {
        const value = shortCutInput.value.trim().split(/\s*\+\s*/);
        if (!value.length) return;
        chrome.storage.sync.set({
          shortCutKeys: value,
        });
        shortCutInput.value = value.join("+");
      });
      if (shortCutInteractKeys == undefined) {
        await chrome.storage.sync.set({
          shortCutInteractKeys: ["shift", "f"],
        });
        shortCutInteractInput.value = "shift+f";
      } else {
        shortCutInteractInput.value = shortCutInteractKeys.join("+");
      }
      shortCutInteractInput.addEventListener("change", (e) => {
        const value = (e.target as HTMLSelectElement).value
          .trim()
          .split(/\s*\+\s*/);
        if (!value.length) return;
        chrome.storage.sync.set({
          shortCutInteractKeys: value,
        });
        shortCutInteractInput.value = value.join("+");
      });
    }
  );

  chrome.storage.sync.get("filteredAuthors", (result) => {
    let value = result["filteredAuthors"];
    if (value == undefined) {
      chrome.storage.sync.set({
        filteredAuthors: ["Tyson3101"],
      });
      value = ["Tyson3101"];
    }
    filteredAuthors.value = value.join(",");
  });

  filteredAuthors.addEventListener("input", () => {
    const value = filteredAuthors.value
      .trim()
      .split(/\s*,\s*/)
      .filter((v) => v);
    chrome.storage.sync.set({
      filteredAuthors: value,
    });
  });

  chrome.storage.sync.get("whitelistedAuthors", (result) => {
    let value = result["whitelistedAuthors"];
    if (value == undefined) {
      chrome.storage.sync.set({
        whitelistedAuthors: ["Tyson3101"],
      });
      value = ["Tyson3101"];
    }
    whitelistedAuthors.value = value.join(",");
  });

  whitelistedAuthors.addEventListener("input", () => {
    const value = whitelistedAuthors.value
      .trim()
      .split(/\s*,\s*/)
      .filter((v) => v);
    chrome.storage.sync.set({
      whitelistedAuthors: value,
    });
  });

  chrome.storage.sync.get("filteredTags", (result) => {
    let value = result["filteredTags"];
    if (value == undefined) {
      chrome.storage.sync.set({
        filteredTags: ["#nsfw", "#leagueoflegends"],
      });
      value = ["#nsfw", "#leagueoflegends"];
    }
    filteredTags.value = value.join(",");
  });

  filteredTags.addEventListener("input", () => {
    const value = filteredTags.value
      .trim()
      .split(/\s*,\s*/)
      .filter((v) => v);
    chrome.storage.sync.set({
      filteredTags: value,
    });
  });

  chrome.storage.sync.get(["filterByMinLength"], async (result) => {
    let value = result["filterByMinLength"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMinLength: "none" });
      return (filterByMinLength.value = "none");
    }
    filterByMinLength.value = value;
  });
  chrome.storage.sync.get(["filterByMaxLength"], async (result) => {
    let value = result["filterByMaxLength"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMaxLength: "none" });
      return (filterByMaxLength.value = "none");
    }
    filterByMaxLength.value = value;
  });

  chrome.storage.sync.get(["filterByMaxLength"], async (result) => {
    let value = result["filterByMaxLength"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMaxLength: "none" });
      return (filterByMaxLength.value = "none");
    }
    filterByMaxLength.value = value;
  });
  chrome.storage.sync.get(["filterByMinLength"], async (result) => {
    let value = result["filterByMinLength"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMinLength: "none" });
      return (filterByMinLength.value = "");
    }
    filterByMinLength.value = value;
  });
  chrome.storage.sync.get(["filterByMinViews"], async (result) => {
    let value = result["filterByMinViews"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMinViews: "none" });
      return (filterByMinViews.value = "");
    }
    filterByMinViews.value = value === "none" ? "" : value;
  });
  chrome.storage.sync.get(["filterByMaxViews"], async (result) => {
    let value = result["filterByMaxViews"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMaxViews: "none" });
      return (filterByMaxViews.value = "");
    }
    filterByMaxViews.value = value === "none" ? "" : value;
  });
  chrome.storage.sync.get(["filterByMinLikes"], async (result) => {
    let value = result["filterByMinLikes"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMinLikes: "none" });
      return (filterByMinLikes.value = "");
    }
    filterByMinLikes.value = value === "none" ? "" : value;
  });
  chrome.storage.sync.get(["filterByMaxLikes"], async (result) => {
    let value = result["filterByMaxLikes"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMaxLikes: "none" });
      return (filterByMaxLikes.value = "");
    }
    filterByMaxLikes.value = value === "none" ? "" : value;
  });
  chrome.storage.sync.get(["filterByMinComments"], async (result) => {
    let value = result["filterByMinComments"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMinComments: "none" });
      return (filterByMinComments.value = "");
    }
    filterByMinComments.value = value === "none" ? "" : value;
  });
  chrome.storage.sync.get(["filterByMaxComments"], async (result) => {
    let value = result["filterByMaxComments"];
    if (value == undefined) {
      await chrome.storage.sync.set({ filterByMaxComments: "none" });
      return (filterByMaxComments.value = "");
    }
    filterByMaxComments.value = value === "none" ? "" : value;
  });

  filterByMinLength.addEventListener("change", (e) => {
    chrome.storage.sync.set({
      filterByMinLength: (e.target as HTMLSelectElement).value,
    });
  });

  filterByMaxLength.addEventListener("change", (e) => {
    chrome.storage.sync.set({
      filterByMaxLength: (e.target as HTMLSelectElement).value,
    });
  });

  filterByMinViews.addEventListener("change", (e) => {
    let value = (e.target as HTMLInputElement).value;
    let checkValue = value.replaceAll("_", "").replaceAll(",", "");
    if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
      value = "none";
      filterByMinViews.value = "";
    }
    chrome.storage.sync.set({
      filterByMinViews: value,
    });
  });

  filterByMaxViews.addEventListener("change", (e) => {
    let value = (e.target as HTMLInputElement).value;
    let checkValue = value.replaceAll("_", "").replaceAll(",", "");
    if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
      value = "none";
      filterByMaxViews.value = "";
    }
    chrome.storage.sync.set({
      filterByMaxViews: value,
    });
  });

  filterByMinLikes.addEventListener("change", (e) => {
    let value = (e.target as HTMLInputElement).value;
    let checkValue = value.replaceAll("_", "").replaceAll(",", "");
    if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
      value = "none";
      filterByMinLikes.value = "";
    }
    chrome.storage.sync.set({
      filterByMinLikes: value,
    });
  });

  filterByMaxLikes.addEventListener("change", (e) => {
    let value = (e.target as HTMLInputElement).value;
    let checkValue = value.replaceAll("_", "").replaceAll(",", "");
    if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
      value = "none";
      filterByMaxLikes.value = "";
    }
    chrome.storage.sync.set({
      filterByMaxLikes: value,
    });
  });

  filterByMinComments.addEventListener("change", (e) => {
    let value = (e.target as HTMLInputElement).value;
    let checkValue = value.replaceAll("_", "").replaceAll(",", "");
    if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
      value = "none";
      filterByMinComments.value = "";
    }
    chrome.storage.sync.set({
      filterByMinComments: value,
    });
  });

  filterByMaxComments.addEventListener("change", (e) => {
    let value = (e.target as HTMLInputElement).value;
    let checkValue = value.replaceAll("_", "").replaceAll(",", "");
    if (parseInt(checkValue) <= 0 || isNaN(parseInt(checkValue))) {
      value = "none";
      filterByMaxComments.value = "";
    }
    chrome.storage.sync.set({
      filterByMaxComments: value,
    });
  });

  chrome.storage.sync.get(["scrollDirection"], async (result) => {
    let value = result["scrollDirection"];
    if (value == undefined) {
      await chrome.storage.sync.set({ scrollDirection: "down" });
      scrollDirectionInput.value = "down";
    }
    scrollDirectionInput.value = value;
  });

  scrollDirectionInput.addEventListener("change", (e) => {
    chrome.storage.sync.set({
      scrollDirection: (e.target as HTMLSelectElement).value,
    });
  });

  chrome.storage.sync.get(["amountOfPlaysToSkip"], async (result) => {
    let value = result["amountOfPlaysToSkip"];
    if (value == undefined) {
      await chrome.storage.sync.set({ amountOfPlaysToSkip: 1 });
      amountOfPlaysInput.value = "1";
    }
    amountOfPlaysInput.value = value;
  });

  amountOfPlaysInput.addEventListener("change", (e) => {
    chrome.storage.sync.set({
      amountOfPlaysToSkip: parseInt((e.target as HTMLSelectElement).value),
    });
  });
  chrome.storage.sync.get(["scrollOnComments"], async (result) => {
    let value = result["scrollOnComments"];
    if (value == undefined) {
      await chrome.storage.sync.set({ crollOnComments: false });
      scrollOnCommentsInput.checked = true;
    }
    scrollOnCommentsInput.checked = value;
  });

  scrollOnCommentsInput.addEventListener("change", (e) => {
    chrome.storage.sync.set({
      scrollOnComments: (e.target as HTMLInputElement).checked,
    });
  });

  chrome.storage.onChanged.addListener((result) => {
    if (result["applicationIsOn"]?.newValue != undefined)
      changeToggleButton(result["applicationIsOn"].newValue);
  });

  chrome.storage.local.get(["applicationIsOn"], (result) => {
    if (result["applicationIsOn"] == null) {
      changeToggleButton(true);
    } else changeToggleButton(result["applicationIsOn"]);
  });
}
