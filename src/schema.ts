import { Account, Profile, Group, CoFeed, CoMap, co } from "jazz-tools";
import type { Cursor, Camera } from "./types";

export class CursorFeed extends CoFeed.Of(co.json<Cursor>()) {}
export class CameraFeed extends CoFeed.Of(co.json<Camera>()) {}

export class CursorContainer extends CoMap {
  cursorFeed = co.ref(CursorFeed);
}

export class CosmosRoot extends CoMap {
  cursors = co.ref(CursorFeed);
  camera = co.ref(CameraFeed);
}

export class CosmosProfile extends Profile {
  name = co.string;
}

export class CosmosAccount extends Account {
  profile = co.ref(CosmosProfile);
  root = co.ref(CosmosRoot);

  /* The account migration is run on account creation and on every log-in.
   ** You can use it to set up the account root and any other initial
   ** CoValues you need.
   */
  async migrate(this: CosmosAccount) {
    if (this.root === undefined) {
      this.root = CosmosRoot.create({
        cursors: CursorFeed.create([]),
        camera: CameraFeed.create([]),
      });
    }

    if (this.profile === undefined) {
      const group = Group.create();
      group.addMember("everyone", "reader");
      this.profile = CosmosProfile.create(
        {
          name: "Anonymous user",
        },
        group,
      );
    }
  }
}
