import express from "express";
import gpc from "generate-pincode";
import cors from "cors";
import rateLimit from "express-rate-limit";
import config from "./config.js";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1080,
  standardHeaders: true,
  legacyHeaders: false,
});

const logClient = (req, _res, next) => {
  console.log("\n>> New Request");
  console.log(
    `IP: ${req.headers["x-forwarded-for"] || req.socket.remoteAddress}`
  );
  console.log(`User Agent: ${req.headers["user-agent"]}`);
  next();
};

const app = express();
app.use(limiter);
app.use(express.json());
app.use(
  cors({
    origin: config.allowedOrigins,
  })
);
app.use(logClient);

let sessions = [];
let trickleSessions = [];

const stringLengthCheck = (str) => {
  return str && str.length <= config.maxStringLength;
};

const findSession = (sessions, id) => {
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].id === id) {
      return sessions[i];
    }
  }
  return null;
};

// deafult
app.post("/", (_req, res) => {
  res.status(418).send("I'm not a teapot.");
});

// server: session id
app.post("/trickle/new-session", (req, res) => {
  console.log("/trickle/new-session: ");

  let id = null;
  do {
    id = gpc(4);
  } while (trickleSessions.some((session) => session.id === id));
  const session = {
    id: id,
    inviter: [],
    invitee: [],
  };
  if (trickleSessions.length >= config.maxSessionLength) {
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
  console.log("/trickle/get-inviter: ");

  const session = findSession(trickleSessions, req.body.id);
  // const session = trickleSessions.find((session) => session.id === req.body.id);
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
  console.log("/trickle/get-invitee: ");

  const session = findSession(trickleSessions, req.body.id);
  // const session = trickleSessions.find((session) => session.id === req.body.id);
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
  console.log("/trickle/set: ");

  const session = findSession(trickleSessions, req.body.id);
  // const session = trickleSessions.find((session) => session.id === req.body.id);
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
  console.log("/trickle/delete-session: ");

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
  console.log("/new-session: ");

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
  if (sessions.length >= config.maxSessionLength) {
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
  console.log("/delete-session: ");

  sessions = sessions.filter((session) => session.id !== req.body.id);
  console.log(sessions);
  res.send({
    ok: true,
  });
});

// client: session id
// server: inviter description
app.post("/get-inviter", (req, res) => {
  console.log("/get-inviter: ");

  const session = findSession(sessions, req.body.id);
  // const session = sessions.find((session) => session.id === req.body.id);
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
  console.log("/set-invitee: ");

  if (!(req.body.invitee && stringLengthCheck(req.body.invitee))) return;
  const session = findSession(sessions, req.body.id);
  // const session = sessions.find((session) => session.id === req.body.id);
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
  console.log("/get-invitee: ");

  const session = findSession(sessions, req.body.id);
  // const session = sessions.find((session) => session.id === req.body.id);
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

app.listen(config.portHttp, () => {
  console.log(`HTTP server is listening on port ${config.portHttp}`);
});
