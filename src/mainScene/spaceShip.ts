module Core.MainScene {

  export class SpaceShip {
    private scene: Core.MainScene.Scene;

    private moveUpAnimation: BABYLON.Animation;
    private moveDownAnimation: BABYLON.Animation;
    private moveXAnimation: BABYLON.Animation;

    private bulletTrigger: Core.MainScene.BulletTrigger;
    private originalHitExplosion: BABYLON.ParticleSystem;

    public speed: number = 3; // should go from 3 to 5
    public isXMoving: boolean = false;
    public isYMoving: boolean = false;
    public isUp: boolean = false;
    public life: number = 100;

    public triggerShot: () => void;
    public moveUp: () => void;
    public moveDown: () => void;
    public spaceShipMesh: BABYLON.Mesh;
    public moveShipMeshToLane: (newLane: number, animationEndCallback: Function) => void;
    public explode: (afterDispose?: Function, damageToAdd?: number, lifeToAdd?: number) => void;

    constructor(scene: Scene, afterLoadedCallback: () => void) {
      var self = this;
      this.scene = scene;
      preloadAssets();
      createOriginalHitExplosion();

      this.moveUp = (): void => {
        if (!this.moveUpAnimation) {
          var easingFunction = new BABYLON.QuadraticEase;
          easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
          this.moveUpAnimation = new BABYLON.Animation("upSpaceshipAnimation", "position.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
          this.moveUpAnimation.setKeys([
            { frame: 0, value: this.spaceShipMesh.position.y }, { frame: 15, value: this.spaceShipMesh.position.y + 39 }
          ]);
          this.moveUpAnimation.setEasingFunction(easingFunction);
        }
        if (!this.isYMoving && !this.isUp) {
          this.isUp = true;
          this.isYMoving = true;
          Core.Audio.playSoundFromAudioLib("move");
          this.scene.scene.beginDirectAnimation(this.spaceShipMesh, [this.moveUpAnimation], 0, 15, false, 1, (): void => {
            this.isYMoving = false;
          });
        }
      };

      this.moveDown = (): void => {
        if (!this.moveDownAnimation) {
          var easingFunction = new BABYLON.QuadraticEase;
          easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
          this.moveDownAnimation = new BABYLON.Animation("downSpaceshipAnimation", "position.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
          this.moveDownAnimation.setKeys([
            { frame: 0, value: this.spaceShipMesh.position.y }, { frame: 15, value: this.spaceShipMesh.position.y - 39 }
          ]);
          this.moveDownAnimation.setEasingFunction(easingFunction);
        }
        if (!this.isYMoving && this.isUp) {
          this.isUp = false;
          this.isYMoving = true;
          Core.Audio.playSoundFromAudioLib("move");
          this.scene.scene.beginDirectAnimation(this.spaceShipMesh, [this.moveDownAnimation], 0, 15, false, 1, (): void => {
            this.isYMoving = false;
          });
        }
      };

      this.moveShipMeshToLane = (newLane: number, animationEndCallback: Function): void => {
        if (!this.isXMoving) {
          this.isXMoving = true;
          var easingFunction = new BABYLON.PowerEase();
          this.moveXAnimation = new BABYLON.Animation("moveSpaceshipAnimation", "position.x", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
          this.moveXAnimation.setKeys([
            { frame: 0, value: this.spaceShipMesh.position.x },
            { frame: 15, value: this.scene.track.roadBlocks.lanesPositionX[newLane] }
          ]);
          easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
          this.moveXAnimation.setEasingFunction(easingFunction);
          Core.Audio.playSoundFromAudioLib("move");
          this.scene.scene.beginDirectAnimation(this.spaceShipMesh, [this.moveXAnimation], 0, 15, false, 1, (): void => {
            this.isXMoving = false;
            this.moveXAnimation = undefined;
            if (animationEndCallback) { animationEndCallback(); }
          });
        }
      };

      this.triggerShot = (): void => {
        if (this.bulletTrigger) {
          this.bulletTrigger.triggerShot();
          Core.Audio.playSoundFromAudioLib("shoot");
        }
      };

      this.explode = (afterDispose?: Function, damageToAdd?: number, lifeToAdd?: number): void => {
        var newExplosion = this.originalHitExplosion.clone("hitExplosionX", this.spaceShipMesh);
        Core.Audio.playSoundFromAudioLib("hit");
        newExplosion.start();
        if (afterDispose) { newExplosion.onDispose = () => { afterDispose(); }; }
        if (damageToAdd) { addDamage(damageToAdd); }
        if (lifeToAdd) { addLife(lifeToAdd); }
      };

      function preloadAssets(): void {
        var spaceShipMeskLoaderTask = self.scene.assetsManager.addMeshTask("SpaceShip", "", "/assets/meshes/spaceShip/", "spaceShip.babylon");
        spaceShipMeskLoaderTask.onSuccess = (task: BABYLON.MeshAssetTask) => {
          self.spaceShipMesh = <BABYLON.Mesh>task.loadedMeshes[0];
          self.spaceShipMesh.receiveShadows = true;
          self.spaceShipMesh.renderingGroupId = 2;
          self.scene.shadowGenerator.getShadowMap().renderList.push(self.spaceShipMesh);
          createPropulsionAnimation();
          self.bulletTrigger = new BulletTrigger(self.scene, self.spaceShipMesh);
          afterLoadedCallback();
        };
      }

      function createPropulsionAnimation(): void {
        var particles = new BABYLON.ParticleSystem("shipPropulsion", 400, self.scene.scene);
        particles.renderingGroupId = 2;
        particles.particleTexture = new BABYLON.Texture("/assets/star.png", self.scene.scene);
        particles.emitter = self.spaceShipMesh;
        particles.minEmitBox = new BABYLON.Vector3(0, -15, 3);
        particles.maxEmitBox = new BABYLON.Vector3(0, -15, 3);
        particles.direction1 = new BABYLON.Vector3(-.3, -1, -1);
        particles.direction2 = new BABYLON.Vector3(-.3, -1, -1);
        particles.gravity = new BABYLON.Vector3(0, -.05, 0);
        particles.color1 = new BABYLON.Color4(1, 0.5, 0.8, 1);
        particles.color2 = new BABYLON.Color4(1, 0.5, 1, 1);
        particles.colorDead = new BABYLON.Color4(1, 0, 1, 0);
        particles.minSize = 3;
        particles.maxSize = 4;
        particles.minLifeTime = 0.01;
        particles.maxLifeTime = 0.04;
        particles.emitRate = 400;
        particles.minEmitPower = 2;
        particles.maxEmitPower = 2;
        particles.start();
      }

      function createOriginalHitExplosion () {
        var texture = new BABYLON.Texture("/assets/flare.png", self.scene.scene);
        var hitExplosion = new BABYLON.ParticleSystem("hitExplosion", 900, self.scene.scene);
        hitExplosion.renderingGroupId = 2;
        hitExplosion.particleTexture = texture;
        hitExplosion.emitter = self.spaceShipMesh;
        hitExplosion.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        hitExplosion.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
        hitExplosion.color1 = new BABYLON.Color4(0.5, 0.3, 0.1, 1);
        hitExplosion.color2 = new BABYLON.Color4(0.8, 0.1, 0.1, 1);
        hitExplosion.colorDead = new BABYLON.Color4(1, 0, 0, 0);
        hitExplosion.minSize = 10;
        hitExplosion.maxSize = 13;
        hitExplosion.minLifeTime = 1;
        hitExplosion.maxLifeTime = 1;
        hitExplosion.emitRate = 900;
        hitExplosion.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        hitExplosion.gravity = new BABYLON.Vector3(0, 0, 0);
        hitExplosion.direction1 = new BABYLON.Vector3(-30, 0, -30);
        hitExplosion.direction2 = new BABYLON.Vector3(30, 30, 30);
        hitExplosion.minAngularSpeed = 0;
        hitExplosion.maxAngularSpeed = Math.PI;
        hitExplosion.minEmitPower = 1;
        hitExplosion.maxEmitPower = 10;
        hitExplosion.updateSpeed = 0.005;
        hitExplosion.targetStopDuration = 0.05;
        hitExplosion.disposeOnStop = true;
        self.originalHitExplosion = hitExplosion;
      }

      function addLife(lifeToAdd: number): void {
        var shadowLife = self.life + lifeToAdd;
        if (shadowLife > 100) {
          self.life = 100;
        } else {
          self.life = shadowLife;
        }
      }

      function addDamage(damageToAdd: number): void {
        var shadowLife = self.life - damageToAdd;
        if (shadowLife > 0) {
          self.life = shadowLife;
        } else {
          self.life = 0;
          // todo: end the game
        }
      }

    }
  }
}
