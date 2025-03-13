import { Account, CoMap, Group, Profile, co } from "jazz-tools";

export class CameraPosition extends CoMap {
  x = co.number;
  y = co.number;
  z = co.number;
}
export class JazzProfile extends Profile {
  name = co.string;
  cameraPosition = co.ref(CameraPosition);
}

export class AccountRoot extends CoMap {}

export class JazzAccount extends Account {
  profile = co.ref(JazzProfile);
  root = co.ref(AccountRoot);

  migrate(this: JazzAccount) {
    if (this.root === undefined) {
      const group = Group.create();

      this.root = AccountRoot.create({}, group);
    }
  }
}
