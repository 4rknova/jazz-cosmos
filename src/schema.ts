import { Account, Profile, Group, CoFeed, CoMap, co } from "jazz-tools";
import type { Cursor, Camera, Edit } from "./types";

export class CursorFeed extends CoFeed.Of(co.json<Cursor>()) {}
export class EditorFeed extends CoFeed.Of(co.json<Edit>()) {}
export class CameraFeed extends CoFeed.Of(co.json<Camera>()) {}

export class CosmosRoot extends CoMap {
  camera = co.ref(CameraFeed);
}

export class CosmosProfile extends Profile {
  name = co.string;
  cursor = co.ref(CursorFeed);
  editor = co.ref(EditorFeed);
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
        camera: CameraFeed.create([]),
      });
    }

    if (this.profile === undefined) {
      const group = Group.create();
      group.addMember("everyone", "writer");
      this.profile = CosmosProfile.create(
        {
          name: "Anonymous user",
          cursor: CursorFeed.create([], { owner: group }),
          editor: EditorFeed.create([], { owner: group }),
        },
        group,
      );
    }
  }
}
