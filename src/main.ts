import Phaser = require("phaser");
import GameScene from "./scenes/game";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 200 },
    },
  },
  scene: GameScene,
};

export default new Phaser.Game(config);
