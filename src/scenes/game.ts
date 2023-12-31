import { Game } from "phaser";
import GameOverScene from "./gameover";
import PartySocket from "partysocket";

// dev host: http://127.0.0.1:1999
// prod host: https://mother-town.alsterjim.partykit.dev

const partySocket = new PartySocket({
  host: "https://mother-town.alsterjim.partykit.dev",
  room: "my-room",
});

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

type Snowball = {
  x: number;
  y: number;
  id: string;
};

class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, position: { x: number; y: number }) {
    super(scene, position.x, position.y, "bomb");
  }
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  // add types to variables ISSUE 14
  background: any;
  frame: number = 0;
  platforms: any;
  player: any;
  cursors: any;
  gifts: any;
  score: any = 0;
  scoreText: any = "";
  scoreBoard: any = "";
  snowballs: any;
  bombs: any;
  gameOver: Boolean = false;
  left: any;
  up: any;
  right: any;
  moveLeft: Boolean = false;
  moveRight: Boolean = false;
  moveUp: Boolean = false;
  otherPlayers: Player[] = [];
  otherPlayerSprites: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  otherSnowballs: Snowball[] = [];
  otherSnowballSprites: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] =
    [];
  dead: Boolean = false;
  realSnowball: any;
  direction: string = "turn";
  canThrowSnowball: Boolean = true;

  updateScoreBoard() {
    let ids = [] as string[];
    ids.push(`players`);
    this.otherPlayers.forEach((player) => {
      player.id !== partySocket.id
        ? ids.push(`other player: ${player.id}`)
        : ids.push(`you: ${player.id}`);
    });
    this.scoreBoard.setText(ids);
  }

  throwSnowball(x: number, y: number, direction?: string) {
    const snowball = new Projectile(this, {
      x,
      y,
    });
    this.snowballs.add(snowball, true);
    this.realSnowball = snowball;
    direction === "left"
      ? snowball.setVelocityX(-500)
      : snowball.setVelocityX(500);
    this.physics.add.collider(this.snowballs, this.platforms, (snowball) => {
      snowball.destroy();
    });
  }

  sendPlayerData() {
    if (this.player)
      partySocket.send(
        JSON.stringify({
          type: "players",
          object: {
            x: this.player.x,
            y: this.player.y,
            direction: this.player.anims.currentAnim.key,
            dead: this.dead,
          },
        })
      );
  }

  sendSnowballData() {
    if (this.realSnowball)
      partySocket.send(
        JSON.stringify({
          type: "snowballs",
          object: {
            x: this.realSnowball.x,
            y: this.realSnowball.y,
          },
        })
      );
  }

  destroyAllSprites() {
    if (this.otherPlayerSprites && this.otherPlayerSprites.length) {
      this.otherPlayerSprites.forEach((sprite) => {
        sprite.destroy(true);
      });
      this.otherPlayerSprites = [];
    }
    if (this.otherSnowballSprites && this.otherSnowballSprites.length) {
      this.otherSnowballSprites.forEach((sprite) => {
        sprite.destroy(true);
      });
      this.otherSnowballSprites = [];
    }
  }

  drawOtherSprites() {
    if (this.otherPlayers) {
      for (let i = 0; i < this.otherPlayers.length; i++) {
        if (this.otherPlayers[i].id !== partySocket.id) {
          const newSprite = this.physics.add.sprite(
            this.otherPlayers[i].x,
            this.otherPlayers[i].y,
            "dude"
          );
          newSprite.anims.play(this.otherPlayers[i].direction, true);
          this.otherPlayerSprites.push(newSprite);
          this.physics.add.collider(this.player, newSprite);
          this.physics.add.collider(this.snowballs, newSprite);
        }
      }
    }
    if (this.otherSnowballs) {
      for (let i = 0; i < this.otherSnowballs.length; i++) {
        if (this.otherSnowballs[i].id !== partySocket.id) {
          const newSprite = this.physics.add.sprite(
            this.otherSnowballs[i].x,
            this.otherSnowballs[i].y,
            "bomb"
          );
          this.otherSnowballSprites.push(newSprite);
          this.physics.add.collider(this.player, newSprite, () => {
            this.dead = true;
            this.physics.pause();
            this.player.setTint(0xff0000);
            this.player.anims.play("turn");
            this.gameOver = true;
            this.dead = true;
          });
        }
      }
    }
  }

  preload() {
    // load music and sounds ISSUE 11
    // this.load.audio("music", "assets/music.mp3");

    this.load.spritesheet("snowyBackground", "assets/snow.png", {
      frameWidth: 500,
      frameHeight: 375,
    });
    this.load.image("platform", "assets/ice_platform.png");
    this.load.image("platform_small", "assets/ice_platform_small.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.image("left", "assets/left.png");
    this.load.image("right", "assets/right.png");
    this.load.image("up", "assets/up.png");

    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    // add shake camera effect when something cool happens ISSUE 10
    // see here https://labs.phaser.io/edit.html?src=src/camera/shake.js&v=3.60.0
    partySocket.addEventListener("message", (e) => {
      const message = JSON.parse(e.data) as Message;
      console.log(message);
      if (message.type === "players") {
        this.otherPlayers = message.objects as Player[];
      } else if (message.type === "snowballs") {
        this.otherSnowballs = message.objects as Snowball[];
      }
    });

    this.snowballs = this.physics.add.group({
      collideWorldBounds: true,
    });

    // game scene and platsforms
    this.background = this.add.sprite(700, 800, "snowyBackground").setScale(5);

    this.anims.create({
      key: "snow",
      frames: this.anims.generateFrameNumbers("snowyBackground", {
        start: 0,
        end: 2,
      }),
      frameRate: 4,
      repeat: 10000,
    });

    this.background.anims.play("snow", true);

    this.left = this.add.image(250, 650, "left");
    this.right = this.add.image(350, 650, "right");
    this.up = this.add.image(500, 650, "up");

    this.left.scale;
    this.up.scale;
    this.right.scale;

    const lefthitArea = new Phaser.Geom.Rectangle(
      this.left.frame.x,
      this.left.frame.y,
      this.left.frame.width,
      this.left.frame.height
    );
    const righthitArea = new Phaser.Geom.Rectangle(
      this.up.frame.x,
      this.up.frame.y,
      this.up.frame.width,
      this.up.frame.height
    );
    const uphitArea = new Phaser.Geom.Rectangle(
      this.up.frame.x,
      this.up.frame.y,
      this.up.frame.width,
      this.up.frame.height
    );

    this.left.setInteractive(lefthitArea, Phaser.Geom.Rectangle.Contains);
    this.right.setInteractive(righthitArea, Phaser.Geom.Rectangle.Contains);
    this.up.setInteractive(uphitArea, Phaser.Geom.Rectangle.Contains);

    this.left.on("pointerdown", () => {
      this.moveLeft = true;
    });
    this.left.on("pointerup", () => {
      this.moveLeft = false;
    });
    this.right.on("pointerdown", () => {
      this.moveRight = true;
    });
    this.right.on("pointerup", () => {
      this.moveRight = false;
    });
    this.up.on("pointerdown", () => {
      this.moveUp = true;
    });
    this.up.on("pointerup", () => {
      this.moveUp = false;
    });

    //add new graphics ISSUE 9

    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(630, 750, "platform").setScale(7).refreshBody();
    this.platforms.create(1000, 500, "platform");
    this.platforms.create(500, 480, "platform_small");
    this.platforms.create(1200, 200, "platform_small");
    this.platforms.create(100, 250, "platform");
    this.platforms.create(100, 530, "platform_small");
    this.platforms.create(750, 250, "platform_small");
    this.platforms.create(500, 150, "platform_small");
    this.platforms.create(1100, 350, "platform").setScale(1.5);

    // add socket.io / partykit for multiplayer, I guess you have to say that this.player should be pushed to some kind of service/server/thing
    // ISSUE 7

    // player dude
    this.player = this.physics.add.sprite(375, 100, "dude");
    this.player.setBounce(0.3);
    this.player.setCollideWorldBounds(true);

    // this.cameras.main.setSize(200, 300);
    // this.cameras.main.startFollow(this.player);

    // refactor player movement, add mobile device movement.  ISSUE 2
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.scoreText = this.add.text(16, 16, "score: 0");
    this.scoreBoard = this.add.text(16, 32, "players");

    // player and platform collider check
    this.physics.add.collider(this.player, this.platforms);

    // implementing player moves functionality
    this.cursors = this.input.keyboard.createCursorKeys();
    var spaceBar = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    spaceBar.on("down", () => {
      if (this.canThrowSnowball) {
        this.throwSnowball(this.player.x, this.player.y, this.direction);
        this.canThrowSnowball = false;
        setTimeout(() => {
          this.canThrowSnowball = true;
        }, 4000);
      }
    });
  }

  update() {
    this;
    if (this.cursors.left.isDown || this.moveLeft) {
      this.player.setVelocityX(-160);
      this.player.anims.play("left", true);
      this.direction = "left";
    } else if (this.cursors.right.isDown || this.moveRight) {
      this.player.setVelocityX(160);
      this.player.anims.play("right", true);
      this.direction = "right";
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }
    if (
      (this.cursors.up.isDown || this.moveUp) &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(-330);
    }
    this.updateScoreBoard();
    this.sendPlayerData();
    this.sendSnowballData();
    // this.frame++;
    // if (this.frame % 2 === 0) {

    this.destroyAllSprites();
    this.drawOtherSprites();

    // }
    // if (this.frame === 60) this.frame = 0;
  }
}
