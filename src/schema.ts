import { Account, CoFeed, CoList, CoMap, co } from "jazz-tools";

export class Vec3 extends CoMap {
  x = co.number;
  y = co.number;
  z = co.number;
}

export class Vec2 extends CoMap {
  x = co.number;
  y = co.number;
}

export class Camera extends CoMap {
  position = co.ref(Vec3);
}

export class WeightedPoint extends CoMap {
  uv = co.ref(Vec2);
  strength = co.number;
}

export class EditCluster extends CoList.Of(co.ref(WeightedPoint)) {}

export class EditFeed extends CoFeed.Of(co.ref(EditCluster)) {}

export class Cursor extends CoMap {
  position = co.ref(Vec3);
}

export class CursorFeed extends CoFeed.Of(co.ref(Cursor)) {}

export class Simulation extends CoMap {
  cursorFeed = co.ref(CursorFeed);
  editFeed = co.ref(EditFeed);
}

export class AccountRoot extends CoMap {
  camera = co.ref(Camera);
}

export class CosmosAccount extends Account {
  root = co.ref(AccountRoot);

  migrate(this: CosmosAccount) {
    if (this.root === undefined) {
      this.root = AccountRoot.create({
        camera: Camera.create({
          position: Vec3.create({
            x: 5,
            y: 2,
            z: 5,
          }),
        }),
      });
    }
  }
}
