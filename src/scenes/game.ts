import { Game } from "phaser";
import GameOverScene from "./gameover";

export default class GameScene extends Phaser.Scene {
	constructor() {
		super("game");
	}

	// add types to variables ISSUE 14
	platforms: any;
	player: any;
	cursors: any;
	gifts: any;
	score: any = 0;
	scoreText: any = "";
	bombs: any;
	gameOver: Boolean = false;

	preload() {
		// load music and sounds ISSUE 11
		// this.load.audio("music", "assets/music.mp3");

		this.load.image("sky", "assets/sky.png");
		this.load.image("ground", "assets/platform.png");
		this.load.image("gift", "assets/christmas-gift.png");
		this.load.image("bomb", "assets/bomb.png");
		this.load.spritesheet("dude", "assets/dude.png", {
			frameWidth: 32,
			frameHeight: 48,
		});
	}

	create() {
		// add shake camera effect when something cool happens ISSUE 10
		// see here https://labs.phaser.io/edit.html?src=src/camera/shake.js&v=3.60.0

		// game scene and platsforms
		this.add.image(400, 300, "sky");

		//add new graphics ISSUE 9
		this.platforms = this.physics.add.staticGroup();
		this.platforms.create(400, 568, "ground").setScale(2).refreshBody();
		this.platforms.create(600, 400, "ground");
		this.platforms.create(50, 250, "ground");
		this.platforms.create(750, 220, "ground");

		// add socket.io / partykit for multiplayer, I guess you have to say that this.player should be pushed to some kind of service/server/thing
		// ISSUE 7

		// player dude
		this.player = this.physics.add.sprite(375, 100, "dude");
		this.player.setBounce(0.3);
		this.player.setCollideWorldBounds(true);

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

		// player and platform collider check
		this.physics.add.collider(this.player, this.platforms);

		// implementing player moves functionality
		this.cursors = this.input.keyboard.createCursorKeys();

		this.gifts = this.physics.add.group({
			key: "gift",
			repeat: 11,
			setXY: { x: 12, y: 0, stepX: 70 },
		});

		this.gifts.children.iterate(function (child: any) {
			child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.5));
		});

		// gift and platform collider check
		this.physics.add.collider(this.gifts, this.platforms);

		// check if player hits gift - if yes trigger collectGift
		this.physics.add.overlap(this.player, this.gifts, collectGift, null, this);

		// example arrow function, from Robin's branch

		//  const collectGift = (player: any, gift: any) => {
		// 	  gift.disableBody(true, true);
		// 	  this.score += 100;
		// 	  this.scoreText.setText("Score: " + this.score);
		//     ...
		//	   ...
		//  };
		function collectGift(player: any, gift: any) {
			gift.disableBody(true, true);
			this.score += 10;
			this.scoreText.setText("Score: " + this.score);
			console.log(this.gifts.countActive(true));

			var x =
				player.x < 400
					? Phaser.Math.Between(400, 800)
					: Phaser.Math.Between(0, 400);

			var bomb = this.bombs.create(x, 16, "bomb");
			bomb.setBounce(1);
			bomb.setCollideWorldBounds(true);
			bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
			if (this.gifts.countActive(true) === 0) {
				this.gifts.children.iterate(function (child: any) {
					child.enableBody(true, child.x, 0, true, true);
				});
			}
		}

		// Create bombs and trigger hitBomb if player collides with gift
		this.bombs = this.physics.add.group();
		this.physics.add.collider(this.bombs, this.platforms);
		this.physics.add.collider(this.player, this.bombs, hitBomb, null, this);

		function hitBomb(player: any, bomb: any) {
			this.physics.pause();
			player.setTint(0xff0000);
			player.anims.play("turn");
			this.gameOver = true;

			// PLAY GAMEOVERSCENE ISSUE 13
			// add more scenes?
		}
	}

	update() {
		if (this.cursors.left.isDown) {
			this.player.setVelocityX(-160);
			this.player.anims.play("left", true);
		} else if (this.cursors.right.isDown) {
			this.player.setVelocityX(160);
			this.player.anims.play("right", true);
		} else {
			this.player.setVelocityX(0);
			this.player.anims.play("turn");
		}
		if (this.cursors.up.isDown && this.player.body.touching.down) {
			this.player.setVelocityY(-330);
		}
	}
}
