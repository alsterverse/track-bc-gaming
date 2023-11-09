import type * as Party from "partykit/server";

type Player = {
  x: number;
  y: number;
  id: string;
  direction: string;
  dead?: boolean;
};
let players: Player[] = [];

export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    players.push({ x: 100, y: 400, id: conn.id, direction: "turn" });
    console.log(
      `Connected:
        id: ${conn.id}
        room: ${this.party.id}
        url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onClose(conn: Party.Connection) {
    players = players.filter((player) => player.id !== conn.id);
    console.log(`Disconnected: ${conn.id}`);
  }

  onMessage(message: string, sender: Party.Connection) {
    // let's log the messages we receive
    // console.log(`connection ${sender.id} sent message: ${message}`);
    // as well as broadcast it to all the other connections in the room...

    players.forEach((player) => {
      if (player.id === sender.id) {
        const playa = JSON.parse(message) as Player;
        player.x = playa.x;
        player.y = playa.y;
        player.direction = playa.direction;
      }
    });

    this.party.broadcast(JSON.stringify(players));
  }
}

Server satisfies Party.Worker;
