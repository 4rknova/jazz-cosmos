import { Account, CoFeed, CoList, CoMap, Group, Profile, co } from "jazz-tools";

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

export class CosmosProfile extends Profile {
  camera = co.ref(Camera);
}

export class AccountRoot extends CoMap {}

export class CosmosAccount extends Account {
  profile = co.ref(CosmosProfile);
  root = co.ref(AccountRoot);

  migrate(this: CosmosAccount) {
    if (this.root === undefined) {
      const group = Group.create();

      this.root = AccountRoot.create(
        {
          profile: CosmosProfile.create({
            name: "",
            camera: Camera.create({
              position: Vec3.create({
                x: 5,
                y: 2,
                z: 5,
              }),
            }),
          }),
        },
        group,
      );
    }
  }
}
