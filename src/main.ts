import Phaser = require("phaser");
import GameScene from "./scenes/game";
import GameOverScene from "./scenes/gameover";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [GameScene, GameOverScene],
};

// Maybe put websockets functionality here? ISSUE 7

export default new Phaser.Game(config);
