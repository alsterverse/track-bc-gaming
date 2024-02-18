import type * as Party from "partykit/server";

type Message = {
  type: string;
  object: Player | Snowball;
};

type Player = {
  x: number;
  y: number;
  id: string;
  name: string;
  score: number;
  direction: string;
  dead?: boolean;
};
let players: Player[] = [];

type Snowball = {
  x: number;
  y: number;
  id: string;
  name: string; //this is only here because it has to be, it's not used for anything
  score: number; //this is only here because it has to be, it's not used for anything
  direction: string; //this is only here because it has to be, it's not used for anything
  dead?: boolean; //this is only here because it has to be, it's not used for anything
};
let snowballs: Snowball[] = [];

export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {}

  onStart() {
    //set first alarm
    this.party.storage.setAlarm(Date.now() + 33);
  }
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    players.push({
      x: 0,
      y: 0,
      id: conn.id,
      direction: "turn",
      name: "player",
      score: 0,
    });
    snowballs.push({
      x: 800,
      y: 800,
      id: conn.id,
      direction: "right",
      name: "snowball",
      score: 0,
    });
    console.log(
      `Connected:
        id: ${conn.id}
        room: ${this.party.id}
        url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onClose(conn: Party.Connection) {
    players = players.filter((player) => player.id !== conn.id);
    snowballs = snowballs.filter((snowball) => snowball.id !== conn.id);
    console.log(`Disconnected: ${conn.id}`);
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as Message;
    if (msg.type === "players") {
      players.forEach((player) => {
        if (player.id === sender.id) {
          player.x = msg.object.x;
          player.y = msg.object.y;
          player.direction = msg.object.direction;
          player.dead = msg.object.dead;
          player.name = msg.object.name;
          player.score = msg.object.score;
        }
      });
    } else if (msg.type === "snowballs") {
      snowballs.forEach((snowball) => {
        if (snowball.id === sender.id) {
          snowball.x = msg.object.x;
          snowball.y = msg.object.y;
        }
      });
    }
  }

  onAlarm() {
    // do something
    const playersMessage = JSON.stringify({
      type: "players",
      objects: players,
    });
    const snowballsMessage = JSON.stringify({
      type: "snowballs",
      objects: snowballs,
    });

    this.party.broadcast(playersMessage);
    this.party.broadcast(snowballsMessage);
    console.log(playersMessage);

    // (optional) schedule next alarm in 5 minutes
    this.party.storage.setAlarm(Date.now() + 33);
  }
}

Server satisfies Party.Worker;
