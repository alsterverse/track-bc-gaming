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
  playerName: string = "";
  playerNameTag: any;

  init(data: any) {
    console.log(data);
    this.playerName = data.name;
  }

  updateScoreBoard() {
    let ids = [] as string[];
    ids.push(`players`);
    this.otherPlayers.forEach((player) => {
      player.id !== partySocket.id
        ? ids.push(`${player.id}`)
        : ids.push(`${this.playerName}`);
    });
    this.scoreBoard.setText(ids);
  }

  updatePlayerNameTag() {
    this.playerNameTag.destroy();
    this.playerNameTag = this.add.text(
      this.player.x - this.playerName.length * 5,
      this.player.y + -40,
      this.playerName
    );
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
            "man"
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
            new Audio("assets/game-over.mp3").play();
            setTimeout(() => this.scene.start("game"), 2000);
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

    this.load.spritesheet("man", "assets/player_animation.png", {
      frameWidth: 66,
      frameHeight: 69,
    });
  }

  create() {
    // add shake camera effect when something cool happens ISSUE 10
    // see here https://labs.phaser.io/edit.html?src=src/camera/shake.js&v=3.60.0
    partySocket.addEventListener("message", (e) => {
      const message = JSON.parse(e.data) as Message;
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
    this.player = this.physics.add.sprite(375, 70, "man");
    this.player.setCollideWorldBounds(true);

    // this.cameras.main.setSize(200, 300);
    // this.cameras.main.startFollow(this.player);

    // refactor player movement, add mobile device movement.  ISSUE 2
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("man", { start: 0, end: 16 }),
      frameRate: 24,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "man", frame: 17 }],
      frameRate: 24,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("man", { start: 19, end: 35 }),
      frameRate: 24,
      repeat: -1,
    });

    this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNumbers("man", { start: 36, end: 52 }),
      frameRate: 48,
      repeat: -1,
    });

    this.scoreText = this.add.text(16, 16, "score: 0");
    this.scoreBoard = this.add.text(16, 32, "players");
    this.playerNameTag = this.add.text(this.player.x, this.player.y, "");

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
        new Audio("assets/peow.mp3").play();
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
      this.player.setVelocityX(-325);

      this.direction = "left";
    } else if (this.cursors.right.isDown || this.moveRight) {
      this.player.setVelocityX(325);

      this.direction = "right";
    } else {
      this.player.setVelocityX(0);
    }
    if (
      (this.cursors.up.isDown || this.moveUp) &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(-650).setGravityY(300);
      new Audio("assets/jump.mp3").play();
    }

    if (!this.player.body.touching.down) {
      this.player.anims.play("jump", true);
    } else if (this.cursors.left.isDown || this.moveLeft) {
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown || this.moveRight) {
      this.player.anims.play("right", true);
    } else {
      this.player.anims.play("turn");
    }

    this.updateScoreBoard();
    this.updatePlayerNameTag();
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
