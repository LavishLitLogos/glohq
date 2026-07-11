const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const DATA_FILE = path.join(ROOT, "data", "db.json");
const PORT = Number(process.env.PORT || 5252);
const ADMIN_EMAILS = new Set(
  (process.env.GLOHQ_ADMIN_EMAILS || "deckcadence52@gmail.com,rawwaymg@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

const mediaLibrary = [
  {
    id: "homecoming",
    type: "instrumental",
    title: "Homecoming",
    artist: "ThisBeatIzBananaz",
    collection: "The Vault52 Soundtrack",
    file: "D:/Media/2026 Beats/ThisBeatIzBananaz/Homecoming (prod. by ThisBeatIzBananaz).mp3",
    tags: ["HipHop", "Vault52", "Instrumental"]
  },
  {
    id: "4ize-seafood",
    type: "glotape",
    title: "Bag Full Of Seafood",
    artist: "4-Ize",
    collection: "DC52 The OG Genesis Pack Vol. 1",
    file: "D:/DC52/Deck52Radio/audio/4ize-bag-full-of-seafood.mp3",
    tags: ["HipHop", "GLOTape", "GenesisPack"]
  },
  {
    id: "beanz-we-gone",
    type: "glotape",
    title: "We Gone Make It",
    artist: "BeanzGotBarz",
    collection: "DC52 The OG Genesis Pack Vol. 1",
    file: "D:/DC52/Deck52Radio/audio/beanz-we-gone-make-it.mp3",
    tags: ["HipHop", "GLOTape", "GenesisPack"]
  },
  {
    id: "royce-get-it-back",
    type: "glotape",
    title: "Get It Back",
    artist: "Royce Ripken",
    collection: "DC52 The OG Genesis Pack Vol. 1",
    file: "D:/Music/2026 RWMG (DAPgang)/Get It Back (prod. by ThisBeatIzBananaz).mp3",
    tags: ["HipHop", "GLOTape", "DC52Artist"]
  },
  {
    id: "ken-masters",
    type: "mixkey",
    title: "Mr. Masters",
    artist: "Ken Masters",
    collection: "MixKeys",
    file: "D:/New Downloads/MixKeys/kenmk1.mp4",
    tags: ["MixKey", "Games", "Characters"]
  },
  {
    id: "rash-crash",
    type: "mixkey",
    title: "Crash the Party",
    artist: "Rash",
    collection: "MixKeys",
    file: "D:/New Downloads/MixKeys/rashmk1.mp4",
    tags: ["MixKey", "Games", "Characters"]
  },
  {
    id: "tails-mph",
    type: "mixkey",
    title: "Miles Per Hour",
    artist: "Tails",
    collection: "MixKeys",
    file: "D:/New Downloads/MixKeys/tailsmk1.mp4",
    tags: ["MixKey", "Games", "Characters"]
  }
];

const rooms = [
  { id: "home", title: "Welcome Deck", access: "public", tags: ["HipHop", "Collectibles", "Culture"] },
  { id: "sound", title: "Sound Room", access: "public", tags: ["HipHop", "GLOTape", "GLODeck"] },
  { id: "mixkeys", title: "MixKeys", access: "public", tags: ["MixKey", "Games", "Anime", "Comics"] },
  { id: "vault", title: "The Vault", access: "public", tags: ["Community", "FAMZ", "Rewards"] },
  { id: "goat", title: "GOAT Conversations", access: "famz", tags: ["HipHop", "Debate", "Polls"] }
];

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4"
};

const readDb = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const writeDb = (db) => fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
const sendJson = (res, status, payload) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
};
const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });

const getCookie = (req, name) => {
  const cookie = req.headers.cookie || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const attempt = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(attempt, "hex"));
};

const publicUser = (user) =>
  user
    ? {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        type: user.type,
        profilePhoto: user.profilePhoto,
        banner: user.banner,
        bio: user.bio,
        interests: user.interests || [],
        instagram: user.instagram || ""
      }
    : null;

const currentUser = (req, db) => {
  const token = getCookie(req, "glohq_session");
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token && new Date(item.expiresAt) > new Date());
  if (!session) return null;
  return db.users.find((user) => user.id === session.userId) || null;
};

const createSession = (res, db, user) => {
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
  });
  res.setHeader("set-cookie", `glohq_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`);
};

const requireUser = (req, res, db) => {
  const user = currentUser(req, db);
  if (!user) sendJson(res, 401, { error: "FAMZ login required." });
  return user;
};

const requireAdmin = (req, res, db) => {
  const user = requireUser(req, res, db);
  if (!user) return null;
  if (user.role !== "admin") {
    sendJson(res, 403, { error: "Protected HQ access only." });
    return null;
  }
  return user;
};

const contentSummary = (db, user) => ({
  rooms,
  media: mediaLibrary.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    artist: item.artist,
    collection: item.collection,
    tags: item.tags,
    streamUrl: `/media/${item.id}`,
    available: fs.existsSync(item.file)
  })),
  reactions: db.reactions,
  comments: db.comments,
  saves: user ? db.saves.filter((save) => save.userId === user.id) : [],
  relationships: user ? db.relationships.filter((rel) => rel.fromUserId === user.id || rel.toUserId === user.id) : []
});

const handleApi = async (req, res, pathname) => {
  const db = readDb();
  const user = currentUser(req, db);

  if (req.method === "GET" && pathname === "/api/session") {
    return sendJson(res, 200, { user: publicUser(user) });
  }

  if (req.method === "GET" && pathname === "/api/content") {
    return sendJson(res, 200, contentSummary(db, user));
  }

  if (req.method === "POST" && pathname === "/api/auth/signup") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const username = String(body.username || "").trim().replace(/^@/, "").toLowerCase();
    const displayName = String(body.displayName || "").trim().slice(0, 18);
    const password = String(body.password || "");
    if (!email || !username || !displayName || password.length < 8) {
      return sendJson(res, 400, { error: "Email, username, display name, and 8+ character password required." });
    }
    if (db.users.some((item) => item.email === email || item.username === username)) {
      return sendJson(res, 409, { error: "Email or username already exists." });
    }
    const nextUser = {
      id: crypto.randomUUID(),
      email,
      username,
      displayName,
      passwordHash: hashPassword(password),
      role: ADMIN_EMAILS.has(email) ? "admin" : "famz",
      type: "FAMZ",
      profilePhoto: "",
      banner: "",
      bio: String(body.bio || "").slice(0, 275),
      interests: Array.isArray(body.interests) ? body.interests.slice(0, 12) : [],
      instagram: String(body.instagram || "").trim(),
      createdAt: new Date().toISOString()
    };
    db.users.push(nextUser);
    createSession(res, db, nextUser);
    writeDb(db);
    return sendJson(res, 201, { user: publicUser(nextUser) });
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const found = db.users.find((item) => item.email === email);
    if (!found || !verifyPassword(password, found.passwordHash)) {
      return sendJson(res, 401, { error: "Login failed." });
    }
    found.role = ADMIN_EMAILS.has(found.email) ? "admin" : found.role;
    createSession(res, db, found);
    writeDb(db);
    return sendJson(res, 200, { user: publicUser(found) });
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    const token = getCookie(req, "glohq_session");
    const nextDb = { ...db, sessions: db.sessions.filter((item) => item.token !== token) };
    writeDb(nextDb);
    res.setHeader("set-cookie", "glohq_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "PATCH" && pathname === "/api/profile") {
    const active = requireUser(req, res, db);
    if (!active) return;
    const body = await parseBody(req);
    active.displayName = String(body.displayName || active.displayName).trim().slice(0, 18);
    active.profilePhoto = String(body.profilePhoto || active.profilePhoto).trim();
    active.banner = String(body.banner || active.banner).trim();
    active.bio = String(body.bio || active.bio || "").slice(0, 275);
    active.instagram = String(body.instagram || active.instagram || "").trim();
    active.interests = Array.isArray(body.interests) ? body.interests.slice(0, 12) : active.interests;
    writeDb(db);
    return sendJson(res, 200, { user: publicUser(active) });
  }

  if (req.method === "POST" && pathname === "/api/famz/tap") {
    const active = requireUser(req, res, db);
    if (!active) return;
    const body = await parseBody(req);
    const targetId = String(body.targetId || "");
    const existing = db.relationships.find((rel) => rel.fromUserId === active.id && rel.toUserId === targetId);
    if (existing) {
      db.relationships = db.relationships.filter((rel) => rel !== existing);
      writeDb(db);
      return sendJson(res, 200, { tappedIn: false });
    }
    db.relationships.push({ id: crypto.randomUUID(), fromUserId: active.id, toUserId: targetId, createdAt: new Date().toISOString() });
    writeDb(db);
    return sendJson(res, 200, { tappedIn: true });
  }

  if (req.method === "POST" && pathname === "/api/social/action") {
    const active = requireUser(req, res, db);
    if (!active) return;
    const body = await parseBody(req);
    const targetId = String(body.targetId || "");
    const action = String(body.action || "");
    if (!targetId || !["fire", "rocket", "save", "share", "vote"].includes(action)) {
      return sendJson(res, 400, { error: "Unsupported action." });
    }
    const bucket = action === "save" ? "saves" : "reactions";
    db[bucket].push({ id: crypto.randomUUID(), userId: active.id, targetId, action, createdAt: new Date().toISOString() });
    writeDb(db);
    return sendJson(res, 200, { ok: true, action });
  }

  if (req.method === "POST" && pathname === "/api/comments") {
    const active = requireUser(req, res, db);
    if (!active) return;
    const body = await parseBody(req);
    const text = String(body.text || "").trim().slice(0, 420);
    if (!text) return sendJson(res, 400, { error: "Comment required." });
    const comment = {
      id: crypto.randomUUID(),
      userId: active.id,
      username: active.username,
      targetId: String(body.targetId || "general"),
      parentId: body.parentId || null,
      text,
      createdAt: new Date().toISOString()
    };
    db.comments.push(comment);
    writeDb(db);
    return sendJson(res, 201, { comment });
  }

  if (req.method === "GET" && pathname.startsWith("/api/clubtags/")) {
    const tag = decodeURIComponent(pathname.split("/").pop()).toLowerCase();
    const media = mediaLibrary.filter((item) => item.tags.some((itemTag) => itemTag.toLowerCase() === tag));
    const roomMatches = rooms.filter((room) => room.tags.some((itemTag) => itemTag.toLowerCase() === tag));
    const comments = db.comments.filter((comment) => comment.text.toLowerCase().includes(`[clubtag]${tag}`));
    return sendJson(res, 200, { tag, rooms: roomMatches, media, comments });
  }

  if (req.method === "GET" && pathname === "/api/admin/overview") {
    const active = requireAdmin(req, res, db);
    if (!active) return;
    return sendJson(res, 200, {
      counts: {
        users: db.users.length,
        comments: db.comments.length,
        reactions: db.reactions.length,
        saves: db.saves.length,
        reports: db.reports.length
      }
    });
  }

  if (req.method === "POST" && pathname === "/api/admin/content") {
    const active = requireAdmin(req, res, db);
    if (!active) return;
    const body = await parseBody(req);
    db.notifications.push({
      id: crypto.randomUUID(),
      title: String(body.title || "HQ Update").slice(0, 80),
      message: String(body.message || "").slice(0, 280),
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    return sendJson(res, 201, { ok: true });
  }

  return sendJson(res, 404, { error: "Not found." });
};

const serveMedia = (req, res, id) => {
  const item = mediaLibrary.find((entry) => entry.id === id);
  if (!item || !fs.existsSync(item.file)) {
    return sendJson(res, 404, { error: "Approved media source not available on this machine." });
  }
  const ext = path.extname(item.file).toLowerCase();
  const stat = fs.statSync(item.file);
  const range = req.headers.range;
  if (range) {
    const [startRaw, endRaw] = range.replace(/bytes=/, "").split("-");
    const start = Number(startRaw);
    const end = endRaw ? Number(endRaw) : stat.size - 1;
    res.writeHead(206, {
      "content-range": `bytes ${start}-${end}/${stat.size}`,
      "accept-ranges": "bytes",
      "content-length": end - start + 1,
      "content-type": mime[ext] || "application/octet-stream"
    });
    fs.createReadStream(item.file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    "content-length": stat.size,
    "content-type": mime[ext] || "application/octet-stream",
    "accept-ranges": "bytes"
  });
  fs.createReadStream(item.file).pipe(res);
};

const serveStatic = (req, res, pathname) => {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^[/\\]+/, "");
  const filePath = path.resolve(PUBLIC, relative);
  if (!filePath.startsWith(PUBLIC)) return sendJson(res, 403, { error: "Forbidden." });
  const target = fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? filePath : path.join(PUBLIC, "index.html");
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, { "content-type": mime[ext] || "application/octet-stream" });
  fs.createReadStream(target).pipe(res);
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url.pathname);
    if (url.pathname.startsWith("/media/")) return serveMedia(req, res, decodeURIComponent(url.pathname.slice(7)));
    return serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: "GLOHQ service error." });
  }
});

server.listen(PORT, () => {
  console.log(`GLOHQ PWA running at http://localhost:${PORT}`);
});
