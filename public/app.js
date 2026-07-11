const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const icons = {
  home: "/assets/icons/home.png",
  discover: "/assets/icons/discover.png",
  sound: "/assets/icons/dc52tapedecklogo.png",
  mixkeys: "/assets/icons/mixkeyicon.png",
  famz: "/assets/icons/famz.png",
  profile: "/assets/icons/profile.png",
  clubtag: "/assets/icons/clubtag.png",
  fire: "/assets/icons/glofirereact.png",
  rocket: "/assets/icons/rocketreaction.png",
  save: "/assets/icons/collection.png",
  glotape: "/assets/icons/glotapeicon.png",
  instrumental: "/assets/icons/gloradio.png",
  wallet: "/assets/icons/glometawallet.png",
  tools: "/assets/icons/tools.png",
  vault: "/assets/icons/thevaultforumlogo.png"
};

const ripkanosLines = [
  "First came hip hop...then came the collection!",
  "How many MixKeys in your collection?",
  "You hear these tunes tho...",
  "Check out the Co-Lab, never know who's cookin!",
  "I thought you came here to explore, don't leave yet!",
  "I came to restore balance, to a game...that lost its way.",
  "Another tape in the deck!",
  "We always need more heat in the vault, you should think about joining.",
  "You got rewards waiting.",
  "It's a gift in the giftbox fam.",
  "Ay, tap in, never tap out!",
  "Every artist deserves to shine, that's what the GLO is all about.",
  "The GLO-Brary is filling up pretty quick...we need a bigger vault!",
  "Might be some new packs in the shop!",
  "You stumbled onto something too dope to not share.",
  "Public rooms are open. The power tools stay behind the vault door.",
  "Collectibles are cool, but the beat is the heartbeat.",
  "If the tape knocks, fire it up.",
  "ClubTags are keys. Tap one and follow the signal."
];

const state = {
  user: null,
  content: null,
  route: "home",
  authMode: "login",
  deferredInstall: null,
  activeMedia: null,
  queue: [],
  queueIndex: 0,
  clubResults: null
};

const els = {
  frame: $("#screenFrame"),
  sessionButton: $("#sessionButton"),
  installButton: $("#installButton"),
  authDialog: $("#authDialog"),
  authSubmit: $("#authSubmit"),
  authStatus: $("#authStatus"),
  signupFields: $("#signupFields"),
  playerDock: $("#playerDock"),
  audio: $("#audioPlayer"),
  video: $("#videoPlayer"),
  nowPlaying: $("#nowPlaying"),
  nowMeta: $("#nowMeta"),
  playPause: $("#playPause"),
  scrubber: $("#scrubber"),
  nextTrack: $("#nextTrack"),
  muteTrack: $("#muteTrack"),
  mediaDialog: $("#mediaDialog"),
  mediaDialogBody: $("#mediaDialogBody"),
  ripkanos: $("#ripkanos"),
  ripkanosLine: $("#ripkanosLine"),
  splash: $("#splash")
};

const api = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "GLOHQ request failed.");
  return data;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const routeFromHash = () => location.hash.replace(/^#\/?/, "") || "home";

const bootSplash = () => {
  const seen = localStorage.getItem("glohq_seen_splash") === "1";
  localStorage.setItem("glohq_seen_splash", "1");
  const delay = seen ? 3000 : 5600;
  window.setTimeout(() => els.splash.classList.add("is-hidden"), delay);
};

const mascot = (line) => {
  els.ripkanosLine.textContent = line || ripkanosLines[Math.floor(Math.random() * ripkanosLines.length)];
  els.ripkanos.setAttribute("aria-hidden", "false");
  els.ripkanos.classList.add("is-visible");
  window.clearTimeout(mascot.timer);
  mascot.timer = window.setTimeout(() => {
    els.ripkanos.classList.remove("is-visible");
    els.ripkanos.setAttribute("aria-hidden", "true");
  }, 4200);
};

const syncNav = () => {
  $$("[data-route]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === state.route);
  });
  els.sessionButton.textContent = state.user ? `@${state.user.username}` : "Login";
};

const navigate = (route) => {
  state.route = route;
  if (location.hash !== `#${route}`) location.hash = route;
  render();
};

const requireAuth = (line = "Tap in first, then the room opens up.") => {
  if (state.user) return true;
  openAuth("signup");
  mascot(line);
  return false;
};

const card = ({ icon, title, body, action, extra = "" }) => `
  <article class="card ${action ? "is-action" : ""}" ${action || ""}>
    ${icon ? `<img class="card-icon" src="${icon}" alt="">` : ""}
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(body)}</p>
    ${extra}
  </article>
`;

const renderHome = () => `
  <section class="screen hero-screen">
    <p class="eyebrow">GLOHQ public headquarters</p>
    <h1>Welcome To The Deck.</h1>
    <p class="lead">Hip-hop is the foundation. The collectibles, comics, anime, games, cards, tools, and rooms grew around it into one living DC52 experience.</p>
    <div class="tag-row">
      <button class="primary-action" data-route="sound">Enter Sound</button>
      <button class="ghost-action" data-route="discover">Explore Rooms</button>
      <button class="ghost-action" data-account-action>Tap In</button>
    </div>
    <div class="room-grid">
      ${state.content.rooms
        .map((room) =>
          card({
            icon: icons[room.id] || icons.vault,
            title: room.name,
            body: room.description,
            action: `data-route="${room.id === "vault" ? "famz" : room.id === "mixkeys" ? "mixkeys" : room.id === "sound" ? "sound" : "discover"}"`
          })
        )
        .join("")}
    </div>
  </section>
`;

const tagMarkup = (tag) => `
  <button class="clubtag" data-clubtag="${escapeHtml(tag)}">
    <img src="${icons.clubtag}" alt="">${escapeHtml(tag)}
  </button>
`;

const renderDiscover = () => `
  <section class="screen stack">
    <div class="section-head">
      <p class="eyebrow">Discovery</p>
      <h2 class="screen-title">ClubTags open the signal.</h2>
      <p class="lead">ClubTags behave like hashtags inside GLOHQ. Tap a tag to pull matching rooms, tapes, comments, and collectibles.</p>
    </div>
    <div class="card stack">
      <label class="muted">Search ClubTag
        <input class="club-input" id="clubSearch" placeholder="HipHop" value="${escapeHtml(state.clubResults?.tag || "")}">
      </label>
      <div class="tag-row">
        ${["HipHop", "GLOTape", "MixKey", "Cards", "Community", "Games"].map(tagMarkup).join("")}
      </div>
      <div id="clubResults">
        ${renderClubResults()}
      </div>
    </div>
  </section>
`;

const renderClubResults = () => {
  if (!state.clubResults) return `<p class="muted">Tap a ClubTag or search to open its feed.</p>`;
  const media = state.clubResults.media || [];
  const rooms = state.clubResults.rooms || [];
  const comments = state.clubResults.comments || [];
  return `
    <div class="stack">
      <p class="state-line"><img src="${icons.clubtag}" alt="" style="width:18px;vertical-align:middle"> ${escapeHtml(state.clubResults.tag.toUpperCase())} feed loaded.</p>
      <div class="media-grid">
        ${[...rooms.map((room) => ({ title: room.name, body: room.description, icon: icons[room.id] || icons.vault })), ...media.map((item) => ({ title: `${item.artist} - ${item.title}`, body: item.collection, icon: icons[item.type] || icons.sound }))]
          .map(card)
          .join("") || `<p class="muted">No public items connected to this ClubTag yet.</p>`}
      </div>
      ${comments.length ? `<h3>Community mentions</h3>${comments.map((item) => `<p class="card">${escapeHtml(item.text)}</p>`).join("")}` : ""}
    </div>
  `;
};

const renderSound = () => {
  const tracks = state.content.media.filter((item) => item.type === "glotape" || item.type === "instrumental");
  state.queue = tracks;
  return `
    <section class="screen stack">
      <div class="section-head">
        <p class="eyebrow">Sound</p>
        <h2 class="screen-title">DC52 Artist Room.</h2>
        <p class="lead">GLOTapes live inside the deck. Home instrumentals and artist tracks use one clean player, so audio never overlaps.</p>
      </div>
      <div class="media-grid">
        ${tracks.map(mediaCard).join("")}
      </div>
      ${commentBlock("sound-room")}
    </section>
  `;
};

const mediaCard = (item) => `
  <button class="media-card" data-play-media="${item.id}">
    <img src="${icons[item.type] || icons.sound}" alt="">
    <strong>${escapeHtml(item.artist)} - ${escapeHtml(item.title)}</strong>
    <span>${escapeHtml(item.collection)}</span>
    <span class="${item.available ? "eyebrow" : "muted"}">${item.available ? "Ready" : "Source offline on this machine"}</span>
  </button>
`;

const renderMixKeys = () => {
  const items = state.content.media.filter((item) => item.type === "mixkey");
  return `
    <section class="screen stack">
      <div class="section-head">
        <p class="eyebrow">MixKeys</p>
        <h2 class="screen-title">Square collectibles. Living motion.</h2>
        <p class="lead">MixKeys open as motion collectibles when approved media is available.</p>
      </div>
      <div class="media-grid">
        ${items.map((item) => `
          <button class="media-card" data-open-mixkey="${item.id}">
            <img src="${icons.mixkeys}" alt="">
            <strong>${escapeHtml(item.artist)} - ${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.collection)}</span>
            <span class="${item.available ? "eyebrow" : "muted"}">${item.available ? "Open MixKey" : "Source offline on this machine"}</span>
          </button>
        `).join("")}
      </div>
      ${commentBlock("mixkeys")}
    </section>
  `;
};

const renderFamz = () => `
  <section class="screen stack">
    <div class="section-head">
      <p class="eyebrow">FAMZ</p>
      <h2 class="screen-title">Tap in across the platform.</h2>
      <p class="lead">FAMZ means Family Appreciated MotivationZ. Public visitors can explore; signed-in FAMZ can react, comment, save, vote, collect, message, and tap into creators or rooms.</p>
    </div>
    <div class="split">
      <div class="card stack">
        <img class="card-icon" src="${icons.famz}" alt="">
        <h3>Platform Support Signal</h3>
        <p>Tap In is the GLOHQ connection action. Tap Out is always open and never needs approval.</p>
        <button class="primary-action" data-tap-famz="official-dc52">Tap In With FAMZ</button>
      </div>
      <div class="card stack">
        <h3>Live actions</h3>
        <div class="reactions" data-target-actions="famz-room">
          ${reactionButton("fire")}
          ${reactionButton("rocket")}
          ${reactionButton("save")}
        </div>
        ${commentBlock("famz-room")}
      </div>
    </div>
  </section>
`;

const reactionButton = (action) => `
  <button class="reaction-button" data-social="${action}" aria-label="${action}">
    <img src="${icons[action]}" alt="">
  </button>
`;

const commentBlock = (targetId) => {
  const comments = (state.content.comments || []).filter((item) => item.targetId === targetId);
  return `
    <div class="card stack" data-comments="${targetId}">
      <h3>Chat Feed</h3>
      <p class="muted">Mentions with @handles and ClubTags are active in the feed.</p>
      <div class="stack">
        ${comments.map((item) => `<p><strong>@${escapeHtml(item.username)}</strong> ${linkClubTags(escapeHtml(item.text))}</p>`).join("") || `<p class="muted">No messages yet.</p>`}
      </div>
      <textarea class="club-input" rows="3" placeholder="Tap in. Use [ClubTag]HipHop or mention @famz" data-comment-input="${targetId}"></textarea>
      <div class="tag-row">
        <button class="mini-action" data-insert-clubtag="${targetId}"><img src="${icons.clubtag}" alt="" style="width:16px"> ClubTag</button>
        <button class="primary-action" data-post-comment="${targetId}">Post</button>
      </div>
    </div>
  `;
};

const linkClubTags = (text) =>
  text.replace(/\[ClubTag\]([a-z0-9_]+)/gi, (_, tag) => `<button class="clubtag" data-clubtag="${tag}"><img src="${icons.clubtag}" alt="">${tag}</button>`);

const renderProfile = () => {
  if (!state.user) {
    return `
      <section class="screen stack">
        <div class="section-head">
          <p class="eyebrow">Profile</p>
          <h2 class="screen-title">Create your GLOHQ identity.</h2>
          <p class="lead">Public browsing stays open. Profiles unlock FAMZ participation, reactions, comments, saves, collecting, voting, and room engagement.</p>
        </div>
        <button class="primary-action" data-open-auth="signup">Sign Up</button>
      </section>
    `;
  }
  return `
    <section class="screen stack">
      <div class="section-head">
        <p class="eyebrow">Profile System</p>
        <h2 class="screen-title">One handle. One profile. Your GLO path.</h2>
      </div>
      <div class="split">
        <form class="card form-stack" id="profileForm">
          <label>@ Handle<input value="@${escapeHtml(state.user.username)}" disabled></label>
          <label>Display Name<input name="displayName" maxlength="18" value="${escapeHtml(state.user.displayName)}"></label>
          <label>Profile Image<input name="profilePhoto" value="${escapeHtml(state.user.profilePhoto || "")}" placeholder="Paste an approved image URL for now"></label>
          <label>Optional Bio<textarea name="bio" rows="4">${escapeHtml(state.user.bio || "")}</textarea></label>
          <div class="toggle-grid">
            ${profileType("Listener", "Guest profile, view only.")}
            ${profileType("Collector", "Guest profile, view only.")}
            ${profileType("GLO-Q Contributor", "Verified creative applicant working toward official DC52 artist status.")}
            ${profileType("FAMZ", "Active supporter who taps into rooms and creator spaces.")}
          </div>
          <button class="primary-action" type="submit">Save Profile</button>
          <p class="status-line" id="profileStatus"></p>
        </form>
        <div class="card stack">
          <img class="card-icon" src="${state.user.profilePhoto || icons.profile}" alt="">
          <h3>${escapeHtml(state.user.displayName)}</h3>
          <p>@${escapeHtml(state.user.username)}</p>
          <p class="muted">Wallet setup is optional. GLO-Wallet connect is coming soon and stays limited to wallet functions only.</p>
          <img class="card-icon" src="${icons.wallet}" alt="">
        </div>
      </div>
    </section>
  `;
};

const profileType = (title, body) => `
  <label class="toggle-card">
    <input type="checkbox" ${state.user.type === title ? "checked" : ""}>
    <span><strong>${escapeHtml(title)}</strong><br>${escapeHtml(body)}</span>
  </label>
`;

const renderAdmin = () => {
  if (!state.user || state.user.role !== "admin") return renderHome();
  return `
    <section class="screen stack">
      <div class="section-head">
        <p class="eyebrow">Protected Owner/Admin</p>
        <h2 class="screen-title">Control room.</h2>
        <p class="lead">Owner controls stay private and only appear after verified owner login.</p>
      </div>
      <div class="admin-grid" id="adminOverview">
        <p class="state-line">Loading protected overview...</p>
      </div>
      <form class="card form-stack" id="adminNoticeForm">
        <h3>Send HQ update</h3>
        <label>Title<input name="title" maxlength="80"></label>
        <label>Message<textarea name="message" rows="4" maxlength="280"></textarea></label>
        <button class="primary-action" type="submit">Publish Notice</button>
        <p class="status-line" id="adminStatus"></p>
      </form>
    </section>
  `;
};

const render = () => {
  if (!state.content) {
    els.frame.innerHTML = `<section class="screen"><p class="state-line">Loading GLOHQ...</p></section>`;
    return;
  }
  syncNav();
  const routes = {
    home: renderHome,
    discover: renderDiscover,
    sound: renderSound,
    mixkeys: renderMixKeys,
    famz: renderFamz,
    profile: renderProfile,
    admin: renderAdmin
  };
  els.frame.innerHTML = (routes[state.route] || routes.home)();
  wireScreen();
  els.frame.focus({ preventScroll: true });
  if (state.route === "admin" && state.user?.role === "admin") loadAdminOverview();
};

const wireScreen = () => {
  $$("[data-route]", els.frame).forEach((button) => button.addEventListener("click", () => navigate(button.dataset.route)));
  $$("[data-account-action]", els.frame).forEach((button) => button.addEventListener("click", () => requireAuth("Make an account and the deeper rooms light up.")));
  $$("[data-open-auth]", els.frame).forEach((button) => button.addEventListener("click", () => openAuth(button.dataset.openAuth)));
  $$("[data-clubtag]", els.frame).forEach((button) => button.addEventListener("click", () => searchClubTag(button.dataset.clubtag)));
  $("#clubSearch", els.frame)?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchClubTag(event.currentTarget.value);
  });
  $$("[data-play-media]", els.frame).forEach((button) => button.addEventListener("click", () => playMedia(button.dataset.playMedia)));
  $$("[data-open-mixkey]", els.frame).forEach((button) => button.addEventListener("click", () => openMixKey(button.dataset.openMixkey)));
  $$("[data-social]", els.frame).forEach((button) => button.addEventListener("click", (event) => socialAction(button.dataset.social, button.closest("[data-target-actions]")?.dataset.targetActions || "general", event)));
  $$("[data-tap-famz]", els.frame).forEach((button) => button.addEventListener("click", () => tapFamz(button.dataset.tapFamz)));
  $$("[data-insert-clubtag]", els.frame).forEach((button) => button.addEventListener("click", () => insertClubTag(button.dataset.insertClubtag)));
  $$("[data-post-comment]", els.frame).forEach((button) => button.addEventListener("click", () => postComment(button.dataset.postComment)));
  $("#profileForm", els.frame)?.addEventListener("submit", saveProfile);
  $("#adminNoticeForm", els.frame)?.addEventListener("submit", publishNotice);
};

const openAuth = (mode = "login") => {
  state.authMode = mode;
  $$("[data-auth-mode]").forEach((button) => button.classList.toggle("is-active", button.dataset.authMode === mode));
  els.signupFields.hidden = mode !== "signup";
  els.authStatus.textContent = "";
  if (!els.authDialog.open) els.authDialog.showModal();
};

const submitAuth = async () => {
  const payload = {
    email: $("#authEmail").value,
    password: $("#authPassword").value,
    username: $("#authUsername").value,
    displayName: $("#authDisplayName").value
  };
  try {
    const data = await api(`/api/auth/${state.authMode}`, { method: "POST", body: JSON.stringify(payload) });
    state.user = data.user;
    els.authDialog.close();
    mascot(state.user.role === "admin" ? "Owner access confirmed. Keep the control room clean." : "Welcome to the vault, fam.");
    await loadContent();
  } catch (error) {
    els.authStatus.textContent = error.message;
  }
};

const logout = async () => {
  await api("/api/auth/logout", { method: "POST", body: "{}" });
  state.user = null;
  navigate("home");
  await loadContent();
};

const loadContent = async () => {
  const [session, content] = await Promise.all([api("/api/session"), api("/api/content")]);
  state.user = session.user;
  state.content = content;
  render();
};

const searchClubTag = async (raw) => {
  const tag = String(raw || "").replace(/\[ClubTag\]/gi, "").replace(/[^a-z0-9_]/gi, "");
  if (!tag) return;
  state.clubResults = await api(`/api/clubtags/${encodeURIComponent(tag)}`);
  if (state.route !== "discover") state.route = "discover";
  render();
  mascot("ClubTags are keys. Follow the signal.");
};

const playMedia = async (id) => {
  const item = state.content.media.find((entry) => entry.id === id);
  if (!item || !item.available) {
    mascot("That source is not available on this machine yet.");
    return;
  }
  state.activeMedia = item;
  state.queueIndex = Math.max(0, state.queue.findIndex((entry) => entry.id === id));
  els.video.pause();
  els.video.hidden = true;
  els.audio.hidden = false;
  els.audio.src = item.streamUrl;
  els.audio.volume = 0.68;
  els.nowPlaying.textContent = `${item.artist} - ${item.title}`;
  els.nowMeta.textContent = item.type === "instrumental" ? `${item.collection} - Prod. by ${item.artist}` : `${item.collection} - Available as a Drop Key soon`;
  els.playerDock.hidden = false;
  await els.audio.play().catch(() => mascot("Tap play if the browser wants a manual start."));
  setPlayIcon();
};

const openMixKey = async (id) => {
  const item = state.content.media.find((entry) => entry.id === id);
  if (!item || !item.available) {
    mascot("That MixKey source is offline on this machine.");
    return;
  }
  els.audio.pause();
  setPlayIcon();
  els.mediaDialogBody.innerHTML = `
    <video src="${item.streamUrl}" controls autoplay playsinline></video>
    <h3>${escapeHtml(item.artist)} - ${escapeHtml(item.title)}</h3>
    <p class="muted">${escapeHtml(item.collection)}</p>
  `;
  els.mediaDialog.showModal();
  mascot("How many MixKeys in your collection?");
};

const setPlayIcon = () => {
  $("img", els.playPause).src = els.audio.paused ? "/assets/icons/play-icon.svg" : "/assets/icons/pause-icon.svg";
};

const nextTrack = () => {
  if (!state.queue.length) return;
  const next = state.queue[(state.queueIndex + 1) % state.queue.length];
  playMedia(next.id);
};

const socialAction = async (action, targetId, event) => {
  if (!requireAuth("Reactions count after you tap in.")) return;
  await api("/api/social/action", { method: "POST", body: JSON.stringify({ action, targetId }) });
  floatReaction(event, action);
  mascot(action === "rocket" ? "Rocket counts double. You really meant that one." : "If the tape knocks, fire it up.");
  await loadContent();
};

const floatReaction = (event, action) => {
  const img = document.createElement("img");
  img.className = "float-react";
  img.src = icons[action] || icons.fire;
  img.alt = "";
  img.style.left = `${event.clientX - 18}px`;
  img.style.top = `${event.clientY - 18}px`;
  document.body.append(img);
  window.setTimeout(() => img.remove(), 1300);
};

const tapFamz = async (targetId) => {
  if (!requireAuth("FAMZ is a real account connection.")) return;
  const result = await api("/api/famz/tap", { method: "POST", body: JSON.stringify({ targetId }) });
  mascot(result.tappedIn ? "Ay, tap in, never tap out!" : "Tap Out is clean. No approvals needed.");
};

const insertClubTag = (targetId) => {
  const input = $(`[data-comment-input="${targetId}"]`, els.frame);
  if (!input) return;
  const insert = "[ClubTag]";
  const start = input.selectionStart || input.value.length;
  input.value = `${input.value.slice(0, start)}${insert}${input.value.slice(start)}`;
  input.focus();
  input.setSelectionRange(start + insert.length, start + insert.length);
};

const postComment = async (targetId) => {
  if (!requireAuth("Chat opens after signup.")) return;
  const input = $(`[data-comment-input="${targetId}"]`, els.frame);
  await api("/api/comments", { method: "POST", body: JSON.stringify({ targetId, text: input.value }) });
  input.value = "";
  await loadContent();
};

const saveProfile = async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    displayName: form.get("displayName"),
    profilePhoto: form.get("profilePhoto"),
    bio: form.get("bio")
  };
  const data = await api("/api/profile", { method: "PATCH", body: JSON.stringify(payload) });
  state.user = data.user;
  $("#profileStatus", els.frame).textContent = "Profile saved.";
  mascot("Profile locked in.");
};

const loadAdminOverview = async () => {
  try {
    const data = await api("/api/admin/overview");
    $("#adminOverview", els.frame).innerHTML = Object.entries(data.counts)
      .map(([key, value]) => card({ icon: icons.vault, title: key, body: `${value}` }))
      .join("");
  } catch (error) {
    $("#adminOverview", els.frame).innerHTML = `<p class="state-line error-line">${escapeHtml(error.message)}</p>`;
  }
};

const publishNotice = async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await api("/api/admin/content", { method: "POST", body: JSON.stringify({ title: form.get("title"), message: form.get("message") }) });
  $("#adminStatus", els.frame).textContent = "Notice published.";
  mascot("Update sent. Clean and official.");
};

const wireGlobal = () => {
  $$("[data-route]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.route)));
  $$("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => openAuth(button.dataset.authMode)));
  els.authSubmit.addEventListener("click", submitAuth);
  els.sessionButton.addEventListener("click", () => (state.user ? (state.user.role === "admin" ? navigate("admin") : navigate("profile")) : openAuth("login")));
  els.playPause.addEventListener("click", async () => {
    if (!els.audio.src) return nextTrack();
    if (els.audio.paused) await els.audio.play();
    else els.audio.pause();
    setPlayIcon();
  });
  els.nextTrack.addEventListener("click", nextTrack);
  els.mediaDialog.addEventListener("close", () => {
    els.video.pause();
    els.video.removeAttribute("src");
    els.mediaDialogBody.innerHTML = "";
  });
  els.muteTrack.addEventListener("click", () => {
    els.audio.muted = !els.audio.muted;
    $("img", els.muteTrack).src = els.audio.muted ? "/assets/icons/onswitch.png" : "/assets/icons/offswitch.png";
  });
  els.audio.addEventListener("timeupdate", () => {
    if (Number.isFinite(els.audio.duration) && els.audio.duration > 0) {
      els.scrubber.value = String((els.audio.currentTime / els.audio.duration) * 100);
    }
  });
  els.audio.addEventListener("play", setPlayIcon);
  els.audio.addEventListener("pause", setPlayIcon);
  els.audio.addEventListener("ended", nextTrack);
  els.scrubber.addEventListener("input", () => {
    if (Number.isFinite(els.audio.duration)) els.audio.currentTime = (Number(els.scrubber.value) / 100) * els.audio.duration;
  });
  els.installButton.addEventListener("click", async () => {
    if (!state.deferredInstall) return;
    state.deferredInstall.prompt();
    state.deferredInstall = null;
    els.installButton.hidden = true;
  });
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstall = event;
    els.installButton.hidden = false;
  });
  window.addEventListener("hashchange", () => {
    state.route = routeFromHash();
    render();
  });
};

const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
};

const init = async () => {
  bootSplash();
  wireGlobal();
  state.route = routeFromHash();
  await registerServiceWorker();
  try {
    await loadContent();
    window.setTimeout(() => mascot(), 1800);
  } catch (error) {
    els.frame.innerHTML = `<section class="screen"><p class="state-line error-line">${escapeHtml(error.message)}</p></section>`;
  }
};

init();
