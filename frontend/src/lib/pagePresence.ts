const ACTIVE_TAB_PREFIX = "qqna-active-tab:";
const ACTIVE_WINDOW_TTL_MS = 4000;
const HEARTBEAT_MS = 1500;

const tabId = crypto.randomUUID();

const getTabKey = () => `${ACTIVE_TAB_PREFIX}${tabId}`;

const markCurrentTabActive = () => {
  if (document.hidden) {
    localStorage.removeItem(getTabKey());
    return;
  }

  localStorage.setItem(getTabKey(), String(Date.now()));
};

const removeCurrentTab = () => {
  localStorage.removeItem(getTabKey());
};

const pruneInactiveTabs = (now: number) => {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);

    if (!key?.startsWith(ACTIVE_TAB_PREFIX)) continue;

    const lastSeen = Number(localStorage.getItem(key));
    if (!lastSeen || now - lastSeen > ACTIVE_WINDOW_TTL_MS) {
      localStorage.removeItem(key);
    }
  }
};

export const startPagePresenceTracking = () => {
  markCurrentTabActive();

  const intervalId = window.setInterval(markCurrentTabActive, HEARTBEAT_MS);

  window.addEventListener("focus", markCurrentTabActive);
  window.addEventListener("blur", markCurrentTabActive);
  window.addEventListener("beforeunload", removeCurrentTab);
  document.addEventListener("visibilitychange", markCurrentTabActive);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("focus", markCurrentTabActive);
    window.removeEventListener("blur", markCurrentTabActive);
    window.removeEventListener("beforeunload", removeCurrentTab);
    document.removeEventListener("visibilitychange", markCurrentTabActive);
    removeCurrentTab();
  };
};

export const hasVisibleQQNATab = () => {
  const now = Date.now();
  pruneInactiveTabs(now);

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (!key?.startsWith(ACTIVE_TAB_PREFIX)) continue;

    const lastSeen = Number(localStorage.getItem(key));
    if (lastSeen && now - lastSeen <= ACTIVE_WINDOW_TTL_MS) {
      return true;
    }
  }

  return false;
};
