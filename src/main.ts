import Phaser = require("phaser");
import GameScene from "./scenes/game";
import StartScene from "./scenes/start";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1500,
  height: 700,
  dom: {
    createContainer: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "phaser-example",
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1500,
    height: 800,
  },
  scene: [StartScene, GameScene],
  input: {
    activePointers: 3, // 2 is default for mouse + pointer, +1 is required for dual touch
  },
};

// Maybe put websockets functionality here? ISSUE 7

export default new Phaser.Game(config);
