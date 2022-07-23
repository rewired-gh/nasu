import pactum from "pactum";
import { like } from "pactum-matchers";
import config from "./config.js";

const { spec } = pactum;

it("should not be a teapot", async () => {
  await spec().post(`http://localhost:${config.portHttp}/`).expectStatus(418);
});

it("should return session ID", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/new-session`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15",
      "X-Forwarded-For": "114.113.112.111",
    })
    .withJson({ inviter: "Nasu" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
      id: like("9999"),
    })
    .stores("Id", ".id");
});

it("should return inviter description", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/get-inviter`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
      inviter: "Nasu",
    });
});

it("should set invitee description", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/set-invitee`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}", invitee: "Suna" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
    });
});

it("should return invitee description", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/get-invitee`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
      invitee: "Suna",
    });
});

it("should remove session", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/delete-session`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
    });
});

it("should return trickle session ID", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/trickle/new-session`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({})
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
      id: like("9999"),
    })
    .stores("Id", ".id");
});

it("should set trickle inviter description 1", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/trickle/set`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}", inviter: "Nasu1" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
    });
});

it("should set trickle inviter description 2", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/trickle/set`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}", inviter: "Nasu2" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
    });
});

it("should set trickle invitee description", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/trickle/set`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}", invitee: "Suna" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
    });
});

it("should return trickle inviter description 1", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/trickle/get-inviter`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
      inviter: "Nasu1",
    });
});

it("should return trickle inviter description 1", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/trickle/get-inviter`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
      inviter: "Nasu2",
    });
});

it("should return trickle invitee description", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/trickle/get-invitee`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
      invitee: "Suna",
    });
});

it("should remove session", async () => {
  await spec()
    .post(`http://localhost:${config.portHttp}/trickle/delete-session`)
    .withHeaders({
      Origin: "https://nasu.hopp.top",
    })
    .withJson({ id: "$S{Id}" })
    .expectStatus(200)
    .expectJsonMatch({
      ok: true,
    });
});
