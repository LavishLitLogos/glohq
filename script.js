const navLinks = [...document.querySelectorAll(".top-nav a, .mobile-dock a")];
const sections = [...new Set(navLinks.map((link) => link.getAttribute("href")))]
  .map((href) => document.querySelector(href))
  .filter(Boolean);

const approvedAdmins = new Set(["deckcadence52@gmail.com", "rawwaymg@gmail.com"]);
const mascotLines = [
  "First came hip hop... then came the collection!",
  "How many MixKeys in your collection?",
  "You hear these tunes tho...",
  "Check out the Co-Lab, never know who's cookin!",
  "I thought you came here to explore, don't leave yet!",
  "Another tape in the deck!",
  "Every artist deserves to shine. That's what the GLO is all about.",
  "The GLO-Brary is filling up pretty quick. We gonna need a bigger vault!",
  "Might be some new packs in the shop!",
  "Ay, tap in, never tap out!",
  "You stumbled onto something too dope to not share.",
  "We always need more heat in the vault. You should think about joining."
];

let mascotTimer;
let builderStep = "locked";

const $ = (selector) => document.querySelector(selector);

const setActiveLink = () => {
  const current = sections
    .map((section) => ({ id: section.id, top: Math.abs(section.getBoundingClientRect().top - 92) }))
    .sort((a, b) => a.top - b.top)[0];

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${current?.id}`);
  });
};

const showMascot = (line) => {
  const mascot = $("#mascotGuide");
  const mascotLine = $("#mascotLine");
  if (!mascot || !mascotLine) return;
  mascotLine.textContent = line || mascotLines[Math.floor(Math.random() * mascotLines.length)];
  mascot.classList.add("is-visible");
  mascot.setAttribute("aria-hidden", "false");
  clearTimeout(mascotTimer);
  mascotTimer = setTimeout(() => {
    mascot.classList.remove("is-visible");
    mascot.setAttribute("aria-hidden", "true");
  }, 4600);
};

const runSplash = () => {
  const splash = $("#vaultSplash");
  const root = document.documentElement;
  if (!splash) return;

  let visits = 0;
  try {
    visits = Number(localStorage.getItem("glohqSplashVisits") || "0");
    localStorage.setItem("glohqSplashVisits", String(visits + 1));
  } catch {}

  const duration = visits > 0 ? 3000 : 5600;
  setTimeout(() => {
    splash.hidden = true;
    root.classList.remove("splash-pending", "splash-quick");
    showMascot("First came hip hop... then came the collection!");
  }, duration);
};

const focusComposerEnd = (composer) => {
  composer.focus();
  const range = document.createRange();
  range.selectNodeContents(composer);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};

const normalizeTag = (tag) => tag.replace(/[^a-z0-9-]/gi, "").trim();

const openClubTagFeed = (tag) => {
  const cleanTag = normalizeTag(tag);
  if (!cleanTag) return;
  const feedStatus = $("#feedStatus");
  const results = $("#clubtagResults");
  if (feedStatus) feedStatus.textContent = `Filtered discovery feed: ClubTag ${cleanTag}`;
  if (results) {
    results.hidden = false;
    results.innerHTML = `
      <strong>ClubTag ${cleanTag}</strong>
      <span>Posts, rooms, creator spaces, GLO-Tapes, packs, and live discussions connected to this ClubTag appear here.</span>
    `;
  }
  history.replaceState(null, "", `#clubtag-${encodeURIComponent(cleanTag)}`);
  showMascot("ClubTags move different. Same discovery power, DC52 language.");
};

const insertClubTag = () => {
  const composer = $("#clubtagComposer");
  if (!composer) return;
  focusComposerEnd(composer);
  const image = document.createElement("img");
  image.className = "clubtag-inline";
  image.src = "./assets/icons/clubtag.png";
  image.alt = "ClubTag";
  image.dataset.token = "clubtag";

  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  range.insertNode(image);
  range.setStartAfter(image);
  range.setEndAfter(image);
  selection.removeAllRanges();
  selection.addRange(range);
};

const getComposerTag = () => {
  const composer = $("#clubtagComposer");
  if (!composer) return "";
  const text = composer.textContent || "";
  return normalizeTag(text.split(/\s+/).find(Boolean) || "");
};

const floatReaction = (button) => {
  const img = button.querySelector("img");
  if (!img) return;
  const floater = document.createElement("img");
  floater.className = "floating-reaction";
  floater.src = img.src;
  floater.alt = "";
  const rect = button.getBoundingClientRect();
  floater.style.left = `${rect.left + rect.width / 2}px`;
  floater.style.top = `${rect.top + window.scrollY}px`;
  document.body.appendChild(floater);
  setTimeout(() => floater.remove(), 1300);
};

const setupSignup = () => {
  const form = $("#famzSignupForm");
  const status = $("#signupStatus");
  const otherToggle = $("#interestOther");
  const otherField = $("#otherInterest");
  if (!form) return;

  otherToggle?.addEventListener("change", () => {
    if (otherField) otherField.hidden = !otherToggle.checked;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const displayName = String(data.get("displayName") || "").trim();
    const username = String(data.get("username") || "").trim().replace(/^@/, "");
    const email = String(data.get("email") || "").trim();
    const interests = data.getAll("interests");
    const profile = {
      email,
      username,
      displayName,
      profilePhoto: data.get("profilePhoto"),
      bannerImage: data.get("bannerImage"),
      bio: data.get("bio"),
      instagram: data.get("instagram"),
      interests,
      otherInterest: data.get("otherInterest"),
      type: "FAMZ",
      createdAt: new Date().toISOString()
    };
    try {
      localStorage.setItem("glohqFamzProfile", JSON.stringify(profile));
    } catch {}
    if (status) status.textContent = `${displayName || username || "FAMZ"} is tapped in. Profile saved on this device.`;
    showMascot("Ay, tap in, never tap out!");

    if (data.get("creatorWaitlist") === "on") {
      const subject = encodeURIComponent("GLOHQ Creator Waiting List");
      const body = encodeURIComponent(`Profile: ${displayName}\nHandle: @${username}\nEmail: ${email}\nInterests: ${interests.join(", ")}`);
      window.location.href = `mailto:deckcadence52@gmail.com?subject=${subject}&body=${body}`;
    }
  });
};

const setupAdmin = () => {
  const form = $("#adminLoginForm");
  const status = $("#adminStatus");
  const matchupStatus = $("#matchupStatus");
  if (!form) return;

  const activateAdmin = (email) => {
    document.body.classList.add("admin-mode");
    builderStep = "ready";
    try {
      localStorage.setItem("glohqAdminMode", "active");
      localStorage.setItem("glohqAdminEmail", email);
    } catch {}
    if (status) status.textContent = "Owner/Admin HQ unlocked on this device.";
    if (matchupStatus) matchupStatus.textContent = "Admin controls ready. Use Edit, Save, then Confirm.";
    showMascot("Owner controls unlocked. Move clean.");
  };

  try {
    if (localStorage.getItem("glohqAdminMode") === "active") activateAdmin(localStorage.getItem("glohqAdminEmail") || "");
  } catch {}

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = String(new FormData(form).get("adminEmail") || "").trim().toLowerCase();
    if (approvedAdmins.has(email)) {
      activateAdmin(email);
    } else if (status) {
      status.textContent = "Admin access not available for this email.";
      showMascot("That door needs the right key.");
    }
  });
};

const setupGoatRoom = () => {
  const countdown = $("#arenaCountdown");
  const form = $("#matchupBuilder");
  const status = $("#matchupStatus");
  const chatForm = $("#goatChatForm");
  const chatFeed = $("#goatChatFeed");

  const updateCountdown = () => {
    if (!countdown) return;
    const now = Date.now();
    const end = now + 24 * 60 * 60 * 1000;
    const remaining = Math.max(0, end - now);
    const hours = String(Math.floor(remaining / 3600000)).padStart(2, "0");
    const mins = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, "0");
    countdown.textContent = `${hours}:${mins}`;
  };
  updateCountdown();
  setInterval(updateCountdown, 60000);

  document.querySelectorAll("[data-react]").forEach((button) => {
    button.addEventListener("click", () => {
      floatReaction(button);
      showMascot(button.dataset.react === "rocket" ? "Rocket counts double. Choose wisely." : "We always need more heat in the vault.");
    });
  });

  document.querySelectorAll("[data-share-room]").forEach((button) => {
    button.addEventListener("click", async () => {
      const title = `${button.dataset.shareRoom} - GLOHQ`;
      const text = "Tap into GLOHQ.";
      if (navigator.share) {
        await navigator.share({ title, text, url: location.href }).catch(() => {});
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(location.href).catch(() => {});
      }
      showMascot("You stumbled onto something too dope to not share.");
    });
  });

  form?.addEventListener("click", (event) => {
    const action = event.target.closest("[data-builder-action]")?.dataset.builderAction;
    if (!action) return;
    if (!document.body.classList.contains("admin-mode")) {
      if (status) status.textContent = "Admin login required before matchup edits.";
      return;
    }
    if (action === "edit") {
      builderStep = "editing";
      if (status) status.textContent = "Editing enabled. Save before confirm.";
    }
    if (action === "save" && builderStep === "editing") {
      builderStep = "saved";
      if (status) status.textContent = "Matchup saved locally. Confirm when ready.";
    }
    if (action === "confirm" && builderStep === "saved") {
      builderStep = "confirmed";
      if (status) status.textContent = "Matchup queued for the GOAT Conversations room.";
      showMascot("Battle taking place. Don't miss it!");
    }
  });

  chatForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = chatForm.querySelector("input");
    const message = input?.value.trim();
    if (!message || !chatFeed) return;
    const article = document.createElement("article");
    article.innerHTML = `<strong>FAMZ</strong><span>${message.replace(/[<>]/g, "")}</span>`;
    chatFeed.appendChild(article);
    input.value = "";
  });
};

$("#insertClubTag")?.addEventListener("click", insertClubTag);
$("#clubtagComposer")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    openClubTagFeed(getComposerTag());
  }
});

document.querySelectorAll("[data-clubtag]").forEach((button) => {
  button.addEventListener("click", () => openClubTagFeed(button.dataset.clubtag));
});

window.addEventListener("hashchange", () => {
  const tag = decodeURIComponent(location.hash.replace("#clubtag-", ""));
  if (location.hash.startsWith("#clubtag-")) openClubTagFeed(tag);
});

setActiveLink();
runSplash();
setupSignup();
setupAdmin();
setupGoatRoom();

window.addEventListener("scroll", () => {
  setActiveLink();
  const current = sections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.45 && rect.bottom > window.innerHeight * 0.45;
  });
  if (current && Math.random() < 0.006) showMascot();
}, { passive: true });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
