import { Account, Profile, Group, CoFeed, CoMap, CoList, co } from "jazz-tools";
import type { Cursor, Camera, TerrainSample } from "./types";
import { generatePlanetName, getRandomSpheremap } from "./utils";

export class CursorFeed extends CoFeed.Of(co.json<Cursor>()) {}
export class CameraFeed extends CoFeed.Of(co.json<Camera>()) {}
export class ListOfTerrainEdits extends CoList.Of(co.json<TerrainSample>()) {}

export class CosmosRoot extends CoMap {
  camera = co.ref(CameraFeed);
}

export class World extends CoMap {
  name = co.string;
  deepSpaceMap = co.string;
  cursor = co.ref(CursorFeed);
  edits = co.ref(ListOfTerrainEdits);
}

export class CosmosProfile extends Profile {
  world = co.ref(World);
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
          world: World.create(
            {
              name: generatePlanetName(),
              deepSpaceMap: getRandomSpheremap(),
              cursor: CursorFeed.create([], { owner: group }),
              edits: ListOfTerrainEdits.create([], { owner: group }),
            },
            group,
          ),
        },
        group,
      );
    }
  }
}
