import { Account, CoFeed, CoMap, co } from "jazz-tools";

export class Vec3 {
  x = co.number;
  y = co.number;
  z = co.number;
}

export class Vec2 {
  x = co.number;
  y = co.number;
}

export class Camera extends CoFeed.Of(co.json<Vec3>()) {}

// --- Account ---

export class AccountRoot extends CoMap {
  camera = co.ref(Camera);
}

export class CosmosAccount extends Account {
  root = co.ref(AccountRoot);

  async migrate(this: CosmosAccount) {
    if (this.root === undefined) {
      this.root = AccountRoot.create({
        camera: Camera.create([]),
      });
    }
  }
}
