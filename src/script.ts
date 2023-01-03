// VARIBLES
const YOUTUBE_LINK = "youtube.com";
const errMsg = document.querySelector("#error") as HTMLParagraphElement;
const toggleBtn = document.querySelector(".toggleBtn") as HTMLButtonElement;
const validUrls = [`${YOUTUBE_LINK}/shorts`, `${YOUTUBE_LINK}/hashtag/shorts`];
const filteredAuthors = document.querySelector(
  "#filterAuthors"
) as HTMLInputElement;
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
const amountOfPlaysInput = document.querySelector(
  "#amountOfPlaysInput"
) as HTMLInputElement;
const scrollOnCommentsInput = document.querySelector(
  "#scrollOnComments"
) as HTMLInputElement;
const nextSettings = document.querySelector("#nextSettings") as HTMLDivElement;
const backSettings = document.querySelector("#backSettings") as HTMLDivElement;
const pageNumber = document.querySelector("#pageNumber") as HTMLDivElement;

getAllSettingsForPopup();

// Listens to toggle button click
document.onclick = (e: Event) => {
  if ((e.target as HTMLButtonElement).classList.contains("toggleBtn"))
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (validUrls.some((url) => tabs[0]?.url?.includes(url)))
        chrome.tabs.sendMessage(tabs[0].id, { toggle: true }).catch(() => {
          errMsg.innerText = "Please refresh the page and try again!";
        });
      else errMsg.innerText = "Only works for Youtube!";
    });
};

function changeToggleButton(result: boolean) {
  toggleBtn.innerText = result ? "Stop" : "Start";
  toggleBtn.classList.remove(result ? "start" : "stop");
  toggleBtn.classList.add(result ? "stop" : "start");
}

// Settings Page and functions for back and forward buttons
nextSettings.onclick = () => {
  const settingPage = document.querySelectorAll(
    ".settingsPage"
  ) as NodeListOf<HTMLDivElement>;
  const active = [...settingPage].find((page) =>
    page.classList.contains("active")
  );
  const next = (() => {
    const nextIndex = parseInt(active.dataset["settingindex"]) + 1;
    if (nextIndex >= settingPage.length) return settingPage[0];
    return settingPage[nextIndex];
  })();
  pageNumber.innerText = `${parseInt(next.dataset["settingindex"]) + 1}/${
    settingPage.length
  }`;
  active.classList.remove("active");
  next.classList.add("active");
};

backSettings.onclick = () => {
  const settingPage = document.querySelectorAll(
    ".settingsPage"
  ) as NodeListOf<HTMLDivElement>;
  const active = [...settingPage].find((page) =>
    page.classList.contains("active")
  );
  const last = (() => {
    const lastIndex = parseInt(active.dataset["settingindex"]) - 1;
    console.log({ lastIndex });
    if (lastIndex < 0) {
      pageNumber.innerText = `5/${settingPage.length}`;
      return settingPage[settingPage.length - 1];
    } else {
      pageNumber.innerText = `${parseInt(active.dataset["settingindex"])}/${
        settingPage.length
      }`;
      return settingPage[lastIndex];
    }
  })();
  active.classList.remove("active");
  last.classList.add("active");
};

function getAllSettingsForPopup() {
  // Get Settings and show them on the popup (and check for updates and reflect them)
  chrome.storage.local.get(
    ["shortCutKeys", "shortCutInteractKeys"],
    async ({ shortCutKeys, shortCutInteractKeys }) => {
      console.log({ shortCutKeys, shortCutInteractKeys });
      if (shortCutKeys == undefined) {
        await chrome.storage.local.set({ shortCutKeys: ["shift", "s"] });
        shortCutInput.value = "shift+s";
      } else {
        console.log({ shortCutKeys });
        shortCutInput.value = shortCutKeys.join("+");
      }
      shortCutInput.addEventListener("change", () => {
        const value = shortCutInput.value.trim().split("+");
        if (!value.length) return;
        chrome.storage.local.set({
          shortCutKeys: value,
        });
        shortCutInput.value = value.join("+");
      });
      if (shortCutInteractKeys == undefined) {
        await chrome.storage.local.set({
          shortCutInteractKeys: ["shift", "f"],
        });
        shortCutInteractInput.value = "shift+f";
      } else {
        shortCutInteractInput.value = shortCutInteractKeys.join("+");
      }
      shortCutInteractInput.addEventListener("change", (e) => {
        const value = (e.target as HTMLSelectElement).value.trim().split("+");
        if (!value.length) return;
        chrome.storage.local.set({
          shortCutInteractKeys: value,
        });
        shortCutInteractInput.value = value.join("+");
      });
    }
  );

  chrome.storage.local.get("filteredAuthors", (result) => {
    let value = result["filteredAuthors"];
    if (value == undefined) {
      chrome.storage.local.set({
        filteredAuthors: ["Tyson3101"],
      });
      value = ["Tyson3101"];
    }
    filteredAuthors.value = value.join(",");
  });

  filteredAuthors.addEventListener("input", () => {
    const value = filteredAuthors.value.split(",").filter((v) => v);
    chrome.storage.local.set({
      filteredAuthors: value,
    });
  });

  chrome.storage.local.get(["filterByMaxLength"], async (result) => {
    let value = result["filterByMaxLength"];
    if (value == undefined) {
      await chrome.storage.local.set({ filterByMaxLength: "none" });
      return (filterByMaxLength.value = "none");
    }
    filterByMaxLength.value = value;
  });
  chrome.storage.local.get(["filterByMinLength"], async (result) => {
    let value = result["filterByMinLength"];
    if (value == undefined) {
      await chrome.storage.local.set({ filterByMinLength: "none" });
      return (filterByMinLength.value = "none");
    }
    filterByMinLength.value = value;
  });

  filterByMaxLength.addEventListener("change", (e) => {
    chrome.storage.local.set({
      filterByMaxLength: (e.target as HTMLSelectElement).value,
    });
  });

  filterByMinLength.addEventListener("change", (e) => {
    chrome.storage.local.set({
      filterByMinLength: (e.target as HTMLSelectElement).value,
    });
  });

  chrome.storage.local.get(["amountOfPlaysToSkip"], async (result) => {
    let value = result["amountOfPlaysToSkip"];
    if (value == undefined) {
      await chrome.storage.local.set({ amountOfPlaysToSkip: 1 });
      amountOfPlaysInput.value = "1";
    }
    amountOfPlaysInput.value = value;
  });

  amountOfPlaysInput.addEventListener("change", (e) => {
    chrome.storage.local.set({
      amountOfPlaysToSkip: parseInt((e.target as HTMLSelectElement).value),
    });
  });
  chrome.storage.local.get(["scrollOnComments"], async (result) => {
    let value = result["scrollOnComments"];
    if (value == undefined) {
      await chrome.storage.local.set({ scrollOnComments: true });
      scrollOnCommentsInput.checked = true;
    }
    scrollOnCommentsInput.checked = value;
  });

  scrollOnCommentsInput.addEventListener("change", (e) => {
    chrome.storage.local.set({
      scrollOnComments: (e.target as HTMLInputElement).checked,
    });
  });

  chrome.storage.onChanged.addListener((result) => {
    if (result.applicationIsOn?.newValue != undefined)
      changeToggleButton(result.applicationIsOn.newValue);
  });

  chrome.storage.local.get(["applicationIsOn"], (result) => {
    if (result.applicationIsOn == null) {
      changeToggleButton(true);
    } else changeToggleButton(result.applicationIsOn);
  });
}
