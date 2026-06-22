const BREADCRUMBS_SEL = ".prc-Breadcrumbs-BreadcrumbsBase-3Gb-B";
const BUTTONGROUP_SEL = ".prc-ButtonGroup-ButtonGroup-vFUrY";
const WRAPPER_CLASS = "gh-custom-buttons-wrapper";
const INJECTED_ATTR = "data-gh-custom-buttons";

function createButton(cfg) {
  const a = document.createElement("a");
  a.href = cfg.url;
  a.textContent = cfg.name;
  a.className = "gh-custom-btn";
  if (cfg.newTab) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  return a;
}

function injectButtons(buttons) {
  if (!buttons || !buttons.length) return;

  const breadcrumbRightBtns = buttons.filter((b) => b.placement === "breadcrumbs");
  const breadcrumbCenterBtns = buttons.filter((b) => b.placement === "breadcrumbs-center");
  const groupBtns = buttons.filter((b) => b.placement === "buttongroup");
  const bcHost = document.querySelector(BREADCRUMBS_SEL);
  if (bcHost && !bcHost.hasAttribute(INJECTED_ATTR) && (breadcrumbRightBtns.length || breadcrumbCenterBtns.length)) {
    bcHost.setAttribute(INJECTED_ATTR, "1");
    if (breadcrumbCenterBtns.length) {
      const wrapper = document.createElement("div");
      wrapper.className = WRAPPER_CLASS + " gh-custom-buttons-breadcrumbs-center hide-sm hide-md";
      breadcrumbCenterBtns.forEach((cfg) => wrapper.appendChild(createButton(cfg)));
      bcHost.appendChild(wrapper);
    }
    if (breadcrumbRightBtns.length) {
      const wrapper = document.createElement("div");
      wrapper.className = WRAPPER_CLASS + " gh-custom-buttons-breadcrumbs hide-sm hide-md";
      breadcrumbRightBtns.forEach((cfg) => wrapper.appendChild(createButton(cfg)));
      bcHost.appendChild(wrapper);
    }
  }

  if (groupBtns.length) {
    const host = document.querySelector(BUTTONGROUP_SEL);
    if (host && !host.hasAttribute(INJECTED_ATTR)) {
      host.setAttribute(INJECTED_ATTR, "1");
      const wrapper = document.createElement("div");
      wrapper.className = WRAPPER_CLASS + " gh-custom-buttons-group hide-sm hide-md";
      groupBtns.forEach((cfg) => wrapper.appendChild(createButton(cfg)));
      host.insertBefore(wrapper, host.firstChild);
    }
  }}

function isContextValid() {
  try { return !!chrome.runtime?.id; } catch { return false; }
}

let debounceTimer = null;
const HOST_SELS = [BREADCRUMBS_SEL, BUTTONGROUP_SEL];

const observer = new MutationObserver(() => {
  if (!isContextValid()) { observer.disconnect(); return; }
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const needsWork = HOST_SELS.some((sel) => {
      const host = document.querySelector(sel);
      return host && !host.hasAttribute(INJECTED_ATTR);
    });
    if (needsWork) run();
  }, 100);
});

function run() {
  if (!isContextValid()) { observer.disconnect(); return; }
  try {
    chrome.storage.local.get({ customButtons: [] }, (data) => {
      injectButtons(data.customButtons);
    });
  } catch {
    observer.disconnect();
  }
}

run();
observer.observe(document.body, { childList: true, subtree: true });