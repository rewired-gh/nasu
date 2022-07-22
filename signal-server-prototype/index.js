import express from "express";
import gpc from "generate-pincode";
import cors from "cors";
import rateLimit from "express-rate-limit";

const MAX_SESSION_LENGTH = 128;
const MAX_STRING_LENGTH = 0x1000;

const portHttp = 9753;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 9000,
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.use(limiter);
app.use(express.json());

const whitelist = ["https://nasu.hopp.top", "https://nasu.netlify.app"];
app.use(
  cors({
    origin: (origin, callback) => {
      // callback(null, true)
      // return
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

let sessions = [];
let trickleSessions = [];

const stringLengthCheck = (str) => {
  return str && str.length <= MAX_STRING_LENGTH;
};

const logClient = (req) => {
  console.log(
    `IP: ${req.headers["x-forwarded-for"] || req.socket.remoteAddress}`
  );
  console.log(`User Agent: ${req.headers["user-agent"]}`)
};

// server: session id
app.post("/trickle/new-session", (req, res) => {
  console.log("\n/trickle/new-session: ");
  logClient(req);
  let id = null;
  do {
    id = gpc(4);
  } while (trickleSessions.some((session) => session.id === id));
  const session = {
    id: id,
    inviter: [],
    invitee: [],
  };
  if (trickleSessions.length >= MAX_SESSION_LENGTH) {
    trickleSessions.shift();
  }
  trickleSessions.push(session);
  console.log(session);
  res.send({
    ok: true,
    id: id,
  });
});

// client: session id
// server: inviter description
app.post("/trickle/get-inviter", (req, res) => {
  console.log("\n/trickle/get-inviter: ");
  logClient(req);
  const session = trickleSessions.find((session) => session.id === req.body.id);
  console.log(session);
  if (session && session.inviter.length > 0) {
    res.send({
      ok: true,
      inviter: session.inviter.shift(),
    });
  } else {
    console.log("not found");
    res.send({
      ok: false,
    });
  }
});

// client: session id
// server: invitee description
app.post("/trickle/get-invitee", (req, res) => {
  console.log("\n/trickle/get-invitee: ");
  logClient(req);
  const session = trickleSessions.find((session) => session.id === req.body.id);
  console.log(session);
  if (session && session.invitee.length > 0) {
    res.send({
      ok: true,
      invitee: session.invitee.shift(),
    });
  } else {
    console.log("not found");
    res.send({
      ok: false,
    });
  }
});

// client: session id, inviter description
app.post("/trickle/set", (req, res) => {
  console.log("\n/trickle/set-inviter: ");
  logClient(req);
  const session = trickleSessions.find((session) => session.id === req.body.id);
  console.log(session);
  if (session) {
    if (req.body.inviter && stringLengthCheck(req.body.inviter)) {
      session.inviter.push(req.body.inviter);
      res.send({
        ok: true,
      });
    } else if (req.body.invitee && stringLengthCheck(req.body.invitee)) {
      session.invitee.push(req.body.invitee);
      res.send({
        ok: true,
      });
    }
  } else {
    console.log("not found");
    res.send({
      ok: false,
    });
  }
});

// client: id
app.post("/trickle/delete-session", (req, res) => {
  console.log("\n/trickle/delete-session: ");
  logClient(req);
  trickleSessions = trickleSessions.filter(
    (session) => session.id !== req.body.id
  );
  console.log(trickleSessions);
  res.send({
    ok: true,
  });
});

// client: inviter description
// server: session id
app.post("/new-session", (req, res) => {
  console.log("\n/new-session: ");
  logClient(req);
  if (!(req.body.inviter && stringLengthCheck(req.body.inviter))) return;
  let id = null;
  do {
    id = gpc(4);
  } while (sessions.some((session) => session.id === id));
  const session = {
    id: id,
    inviter: req.body.inviter,
    invitee: null,
  };
  if (sessions.length >= MAX_SESSION_LENGTH) {
    sessions.shift();
  }
  sessions.push(session);
  console.log(session);
  res.send({
    ok: true,
    id: id,
  });
});

// client: id
app.post("/delete-session", (req, res) => {
  console.log("\n/delete-session: ");
  logClient(req);
  sessions = sessions.filter((session) => session.id !== req.body.id);
  console.log(sessions);
  res.send({
    ok: true,
  });
});

// client: session id
// server: inviter description
app.post("/get-inviter", (req, res) => {
  console.log("\n/get-inviter: ");
  logClient(req);
  const session = sessions.find((session) => session.id === req.body.id);
  console.log(session);
  if (session) {
    res.send({
      ok: true,
      inviter: session.inviter,
    });
  } else {
    console.log("not found");
    res.send({
      ok: false,
    });
  }
});

// client: session id, invitee description
app.post("/set-invitee", (req, res) => {
  console.log("\n/set-invitee: ");
  logClient(req);
  if (!(req.body.invitee && stringLengthCheck(req.body.invitee))) return;
  const session = sessions.find((session) => session.id === req.body.id);
  if (session) {
    session.invitee = req.body.invitee;
    console.log(session);
    res.send({
      ok: true,
    });
  } else {
    console.log("not found");
    res.send({
      ok: false,
    });
  }
});

// client: session id
// server: invitee description
app.post("/get-invitee", (req, res) => {
  console.log("\n/get-invitee: ");
  logClient(req);
  const session = sessions.find((session) => session.id === req.body.id);
  console.log(session);
  if (session) {
    res.send({
      ok: true,
      invitee: session.invitee,
    });
  } else {
    console.log("not found");
    res.send({
      ok: false,
    });
  }
});

app.listen(portHttp, () => {
  console.log(`HTTP server is listening on port ${portHttp}`);
});
