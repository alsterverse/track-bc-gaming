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
  name: string;
  score?: number;
  direction: string;
  dead?: boolean;
};
let snowballs: Snowball[] = [];

export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    players.push({
      x: Math.floor(Math.random() * 1000 + 100),
      y: 0,
      id: conn.id,
      direction: "turn",
      name: "playerName",
      score: 0,
    });
    snowballs.push({
      x: 0,
      y: 0,
      id: conn.id,
      direction: "right",
      name: "snowball",
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
  }
}

Server satisfies Party.Worker;
