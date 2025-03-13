import { Account, CoMap, Group, Profile, co } from "jazz-tools";

export class CameraPosition extends CoMap {
  x = co.number;
  y = co.number;
  z = co.number;
}
export class JazzProfile extends Profile {
  name = co.string;
}

export class AccountRoot extends CoMap {
  cameraPosition = co.ref(CameraPosition);
}

export class JazzAccount extends Account {
  profile = co.ref(JazzProfile);
  root = co.ref(AccountRoot);

  migrate(this: JazzAccount) {
    if (this.root === undefined) {
      const group = Group.create();
      
      // Create with default camera position
      this.root = AccountRoot.create({
        cameraPosition: CameraPosition.create({ x: 5, y: 2, z: 5 })
      }, group);
    }
  }
}
