import PartySocket from "partysocket";

// dev host: http://127.0.0.1:1999
// prod host: https://mother-town.alsterjim.partykit.dev

const partySocket = new PartySocket({
  host: "https://party-yo.alsterjim.partykit.dev",
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
  name: string;
  score: number;
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
  otherPlayers: Player[] = [];
  otherPlayerSprites: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  otherSnowballs: Snowball[] = [];
  otherSnowballSprites: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] =
    [];
  dead: Boolean = false;
  realSnowball: any;
  direction: string = "turn";
  canThrowSnowball: Boolean = true;
  canScore: Boolean = true;
  playerName: string = "";
  playerNameTag: any;
  otherPlayerNameTags: any[] = [];

  init(data: any) {
    this.playerName = data.name;
  }

  updateScoreBoard() {
    let ids = [] as string[];
    ids.push(`players`);
    this.otherPlayers
      .sort((a: any, b: any) => b.score - a.score)
      .forEach((player) => {
        player.id !== partySocket.id
          ? ids.push(
              `${
                player.name.length > 10
                  ? player.name.substring(0, 10)
                  : player.name
              } ${player.score}`
            )
          : ids.push(`${this.playerName} ${this.score}`);
      });
    this.scoreBoard.setText(ids);
  }

  updateScore() {
    if (this.canScore) {
      this.score++;
      new Audio("assets/ping.mp3").play();
      this.canScore = false;

      setTimeout(() => {
        this.canScore = true;
      }, 2000);
    }
  }

  updatePlayerNameTag() {
    this.playerNameTag.destroy();
    this.playerNameTag = this.add.text(
      this.player.x - this.playerName.length * 5,
      this.player.y + -48,
      this.playerName
    );
    this.playerNameTag.setTint(0x22ff22);
    if (this.otherPlayerNameTags && this.otherPlayerNameTags.length) {
      this.otherPlayerNameTags.forEach((tag) => {
        tag.destroy();
      });
    }
    if (this.otherPlayers) {
      this.otherPlayers.forEach((player) => {
        if (player.id !== partySocket.id) {
          const newTag = this.add.text(
            player.name.length >= 10
              ? player.x - 10 * 5
              : player.x - player.name.length * 5,
            player.y + -48,
            player.name.length >= 10
              ? player.name.substring(0, 10)
              : player.name
          );
          this.otherPlayerNameTags.push(newTag);
        }
      });
    }
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
      this.realSnowball.x = 0;
      this.realSnowball.y = 0;
      snowball.destroy();
      this.realSnowball.destroy();
    });
    setTimeout(() => {
      this.realSnowball.x = 0;
      this.realSnowball.y = 0;
      snowball.destroy();
      this.realSnowball.destroy();
    }, 3000);
  }

  sendPlayerData() {
    if (this.player)
      partySocket.send(
        JSON.stringify({
          type: "players",
          object: {
            x: this.player.x,
            y: this.player.y,
            name: this.playerName,
            direction: this.player.anims.currentAnim.key,
            dead: this.dead,
            score: this.score,
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
          this.physics.add.collider(this.snowballs, newSprite, () => {
            this.updateScore();
          });
          if (this.otherPlayers[i].dead) {
            newSprite.setTint(0xff0000);
          }
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
            setTimeout(() => {
              this.scene.start("game");
              this.dead = false;
            }, 2000);
          });
        }
      }
    }
  }

  preload() {
    // load music and sounds ISSUE 11
    // this.load.audio("music", "assets/music.mp3");

    this.load.spritesheet("bg", "assets/mexo.png", {
      frameWidth: 2038,
      frameHeight: 1528,
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
    this.background = this.add.sprite(800, 290, "bg").setScale(1.5);

    // this.anims.create({
    //   key: "snow",
    //   frames: this.anims.generateFrameNumbers("snowyBackground", {
    //     start: 0,
    //     end: 2,
    //   }),
    //   frameRate: 4,
    //   repeat: 10000,
    // });

    // this.background.anims.play("snow", true);

    //add new graphics ISSUE 9

    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(670, 1100, "platform").setScale(7).refreshBody();
    this.platforms.create(1350, 550, "platform");
    this.platforms.create(600, 480, "platform");
    this.platforms.create(1450, 150, "platform_small");
    this.platforms.create(100, 300, "platform");
    this.platforms.create(850, 650, "platform_small");
    this.platforms.create(900, 800, "platform_small");
    this.platforms.create(790, 250, "platform_small");
    this.platforms.create(530, 150, "platform_small");
    this.platforms.create(1200, 300, "platform");
    this.platforms.create(150, 900, "platform");
    this.platforms.create(500, 750, "platform_small");
    this.platforms.create(1600, 400, "platform_small");
    this.platforms.create(1300, 900, "platform");
    this.platforms.create(100, 600, "platform");

    // add socket.io / partykit for multiplayer, I guess you have to say that this.player should be pushed to some kind of service/server/thing
    // ISSUE 7

    // player dude
    this.player = this.physics.add.sprite(
      Math.floor(Math.random() * 1000 + 100),
      70,
      "man"
    );
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
      frames: this.anims.generateFrameNumbers("man", { start: 19, end: 34 }),
      frameRate: 24,
      repeat: -1,
    });

    this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNumbers("man", { start: 36, end: 51 }),
      frameRate: 48,
      repeat: -1,
    });

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
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-325);

      this.direction = "left";
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(325);

      this.direction = "right";
    } else {
      this.player.setVelocityX(0);
    }
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-650).setGravityY(300);
      new Audio("assets/jump.mp3").play();
    }

    if (!this.player.body.touching.down) {
      this.player.anims.play("jump", true);
    } else if (this.cursors.left.isDown) {
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.anims.play("right", true);
    } else {
      this.player.anims.play("turn");
    }

    this.frame++;
    if (this.frame % 2 === 0) {
      this.updateScoreBoard();
      this.updatePlayerNameTag();
      this.sendSnowballData();
      this.sendPlayerData();
      this.destroyAllSprites();
      this.drawOtherSprites();
    }
    if (this.frame === 60) this.frame = 0;
  }
}
