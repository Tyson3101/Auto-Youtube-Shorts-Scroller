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
const filterByMaxLength = document.querySelector(
  "#filterByMaxLength"
) as HTMLSelectElement;
const filterByMinLength = document.querySelector(
  "#filterByMinLength"
) as HTMLSelectElement;
const shortCutDisplay = document.querySelector(
  "#shortCutDisplay"
) as HTMLSpanElement;
const nextSettings = document.querySelector("#nextSettings") as HTMLDivElement;
const backSettings = document.querySelector("#backSettings") as HTMLDivElement;
const pageNumber = document.querySelector("#pageNumber") as HTMLDivElement;

chrome.storage.local.get(["shortCutKeys"], async ({ shortCutKeys }) => {
  if (shortCutKeys == undefined) {
    await chrome.storage.local.set({ shortCutKeys: ["shift", "s"] });
    return (shortCutInput.value = "shift+s");
  }
  shortCutInput.value = shortCutKeys.join("+");
  shortCutDisplay.innerText = shortCutKeys.join(" + ");
  shortCutInput.addEventListener("change", (e) => {
    const value = (e.target as HTMLSelectElement).value.trim().split("+");
    if (!value.length) return;
    chrome.storage.local.set({
      shortCutKeys: value,
    });
    shortCutInput.value = value.join("+");
    shortCutDisplay.innerText = value.join(" + ");
  });
});

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

chrome.storage.onChanged.addListener((result) => {
  if (result.applicationIsOn?.newValue != undefined)
    changeToggleButton(result.applicationIsOn.newValue);
  if (result.shortCutKeys?.newValue != undefined)
    shortCutDisplay.innerText = result.shortCutKeys.newValue.join(" + ");
});

chrome.storage.local.get(["applicationIsOn"], (result) => {
  if (result.applicationIsOn == null) {
    changeToggleButton(true);
  } else changeToggleButton(result.applicationIsOn);
});

document.onclick = (e: Event) => {
  if ((e.target as HTMLButtonElement).classList.contains("toggleBtn"))
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (validUrls.some((url) => tabs[0]?.url?.includes(url)))
        chrome.tabs.sendMessage(tabs[0].id, { toggle: true });
      else errMsg.innerText = "Only works for Youtube!";
    });
  if ((e.target as HTMLButtonElement).id === "shortCutBtn")
    document.querySelector(".shortCut").classList.toggle("remove");
};

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

function changeToggleButton(result: boolean) {
  toggleBtn.innerText = result ? "Stop" : "Start";
  toggleBtn.classList.remove(result ? "start" : "stop");
  toggleBtn.classList.add(result ? "stop" : "start");
}
