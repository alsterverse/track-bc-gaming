export default class GameScene extends Phaser.Scene {
  platforms: Phaser.Physics.Arcade.StaticGroup;
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  stars: Phaser.Physics.Arcade.Group;
  bombs: Phaser.Physics.Arcade.Group;
  score: number;
  gameOver: boolean;
  scoreText: any;
  playerSpeed: number;

  constructor() {
    super("game");
    this.score = 0;
    this.stars;
    this.scoreText;
    this.playerSpeed = 350;
  }

  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.spritesheet("dude", "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    //BG
    this.add.image(400, 300, "sky");

    //FG
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();
    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
      collideWorldBounds: true,
      allowDrag: true,
    });

    this.stars.children.iterate((child) => {
      child.body.gameObject.setBounce(0, Phaser.Math.FloatBetween(0.1, 0.5));
      child.body.gameObject.setVelocityX(Phaser.Math.FloatBetween(-100, 100));
      return true;
    });

    //PLAYER
    this.player = this.physics.add.sprite(100, 450, "dude");
    this.player.setBounce(0.2);
    this.player.setDrag(1000, 0);
    this.player.setGravityY(350);
    this.player.setCollideWorldBounds(true);

    //COLLISION
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.bombs = this.physics.add.group();

    //INPUT
    this.cursors = this.input.keyboard.createCursorKeys();

    //ANIMATION
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

    //UI
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
    });
  }

  update() {
    //INPUT
    const speed =
      this.cursors.shift.isDown && this.player.body.touching.down
        ? this.playerSpeed * 2
        : this.playerSpeed;

    if (this.cursors.left.isDown) {
      this.player.setAccelerationX(-speed);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setAccelerationX(speed);

      this.player.anims.play("right", true);
    } else {
      this.player.setAccelerationX(0);
      this.player.anims.play("turn");
    }

    if (
      (this.cursors.up.isDown || this.cursors.space.isDown) &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(-550);
    }
    if (this.cursors.down.isDown && !this.player.body.touching.down) {
      this.player.setAccelerationY(50);
    }

    //ROLL STARS
    this.stars.children.iterate((star: Phaser.GameObjects.GameObject) => {
      // Check if the star has a physics body
      if (star) {
        // Get the X and Y velocity components of the star
        const velocityX: number = star.body.velocity.x;

        // Do something with the velocity values if needed
        star.body.gameObject.rotation += 0.001 * velocityX;
      }

      return true;
    });

    //COLLECT STARS
    const collectStar = (player: any, star: any) => {
      star.disableBody(true, true);
      this.score += 100;
      this.scoreText.setText("Score: " + this.score);

      if (this.stars.countActive(true) === 0) {
        this.stars.children.iterate((child) => {
          child.body.gameObject.enableBody(
            true,
            child.body.gameObject.x,
            0,
            true,
            true
          );
          return true;
        });
      }

      var x =
        player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      var bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    };

    this.physics.add.overlap(this.player, this.stars, collectStar, null, this);

    //BOMB COLLISION
    this.physics.add.collider(this.bombs, this.platforms);
    const hitBomb: any = (player: any, bomb: any) => {
      this.physics.pause();
      this.player.setTint(0xff0000);
      player.anims.play("turn");

      this.add.text(150, 150, "YOU DEAD :)", {
        fontSize: "64px",
      });

      this.gameOver = true;
    };

    this.physics.add.collider(this.player, this.bombs, hitBomb, null, this);
  }
}
