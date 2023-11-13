import type * as Party from "partykit/server";

type Message = {
  type: string;
  objects: Player[] | Snowball[];
};

type Player = {
  x: number;
  y: number;
  id: string;
  direction: string;
  dead?: boolean;
};
let players: Player[] = [];

type Snowball = {
  x: number;
  y: number;
  id: string;
};
let snowballs: Snowball[] = [];

export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    players.push({ x: 0, y: 0, id: conn.id, direction: "turn" });
    snowballs.push({ x: 800, y: 800, id: conn.id });
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
    players.forEach((player) => {
      if (player.id === sender.id) {
        const playa = JSON.parse(message) as Player;
        player.x = playa.x;
        player.y = playa.y;
        player.direction = playa.direction;
        player.dead = playa.dead;
      }
    });

    snowballs.forEach((snowball) => {
      if (snowball.id === sender.id) {
        const ball = JSON.parse(message) as Snowball;
        snowball.x = ball.x;
        snowball.y = ball.y;
      }
    });
    const playersMessage = JSON.stringify({
      type: "players",
      objects: players,
    });
    const snowballsMessage = JSON.stringify({
      type: "snowballs",
      objects: snowballs,
    });

    this.party.broadcast(JSON.stringify(playersMessage));
    this.party.broadcast(JSON.stringify(snowballsMessage));
  }
}

Server satisfies Party.Worker;
