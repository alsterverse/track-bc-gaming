export default class StartScene extends Phaser.Scene {
  constructor() {
    super("start");
  }

  name: string = "";

  preload() {
    this.load.html("name", "assets/form.html");
    this.load.image("star", "assets/star.png");
  }

  create() {
    const text = this.add.text(280, 400, "Enter your name to begin");
    const star = this.add.sprite(400, 300, "star").setInteractive();

    star.on("pointerup", function (pointer: any) {
      {
        this.scene.scene.start("game", {
          name: this.scene.name !== "" ? this.scene.name : "Player",
        });
      }
    });

    const element = this.add.dom(400, 600).createFromCache("name");
    element.addListener("click");
    element.on("click", function (event: any) {
      {
        if (event.target.name === "submit-button") {
          const name = this.getChildByName("name");
          if (name.value !== "") {
            this.removeListener("click");
            text.setText(`Welcome ${name.value}`);
            this.scene.name = name.value;
          }
        }
      }
    });
  }
}
