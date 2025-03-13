# Example app 6: A task management app that helps users organize their to-dos with categories, tags, due dates, and priority levels

```typescript
import { Account, CoList, CoMap, Group, Profile, co } from "jazz-tools";

// Task priority levels
export type PriorityLevel = "Low" | "Medium" | "High";

// Represents a tag that can be associated with tasks
export class Tag extends CoMap {
  name = co.string;
  deleted = co.boolean;
}

export class TagList extends CoList.Of(co.ref(Tag)) {}

// Represents a category that can group tasks
export class Category extends CoMap {
  name = co.string;
  deleted = co.boolean;
}

export class CategoryList extends CoList.Of(co.ref(Category)) {}

// Represents a single task in the todo app
export class Task extends CoMap {
  title = co.string;
  description = co.optional.string;
  dueDate = co.optional.Date;
  isCompleted = co.boolean;
  priority = co.literal("Low", "Medium", "High");
  tags = co.ref(TagList);
  category = co.optional.ref(Category);
  deleted = co.boolean;
}

export class TaskList extends CoList.Of(co.ref(Task)) {}

// Container for organizing tasks, categories and tags
export class Container extends CoMap {
  tasks = co.ref(TaskList);
  categories = co.ref(CategoryList);
  tags = co.ref(TagList);
}

// Root structure holding all data
export class AccountRoot extends CoMap {
  container = co.ref(Container);
  version = co.optional.number;
}

export class UserProfile extends Profile {
  name = co.string;

  static validate(data: { name?: string; other?: Record<string, unknown> }) {
    const errors: string[] = [];
    if (!data.name?.trim()) {
      errors.push("Please enter a name.");
    }
    return { errors };
  }
}

// Main account class that handles data initialization
export class JazzAccount extends Account {
  profile = co.ref(UserProfile);
  root = co.ref(AccountRoot);

  async migrate(creationProps?: {
    name: string;
    other?: Record<string, unknown>;
  }) {
    if (!this._refs.root && creationProps) {
      await this.initialMigration(creationProps);
      return;
    }

    // uncomment this to add migrations
    // const currentVersion = this.root?.version || 0;
    // if (currentVersion < 1) {
    //   await this.migrationV1();
    // }
    // if (currentVersion < 2) {
    //   await this.migrationV2();
    // }
  }

  private async initialMigration(
    creationProps: {
      name: string;
      other?: Record<string, unknown>;
    }
  ) {
    const { name, other } = creationProps;
    const profileErrors = UserProfile.validate({ name, ...other });
    if (profileErrors.errors.length > 0) {
      throw new Error(
        "Invalid profile data: " + profileErrors.errors.join(", "),
      );
    }

    const publicGroup = Group.create({ owner: this });
    publicGroup.addMember("everyone", "reader");

    this.profile = UserProfile.create(
      {
        name,
        ...other,
      },
      { owner: publicGroup },
    );

    const privateGroup = Group.create({ owner: this });

    // Create default container with empty lists
    const defaultContainer = Container.create(
      {
        tasks: TaskList.create([], privateGroup),
        categories: CategoryList.create([], privateGroup),
        tags: TagList.create([], privateGroup),
      },
      privateGroup,
    );

    // Initialize root structure with version
    this.root = AccountRoot.create({
      container: defaultContainer,
      version: 0, // Set initial version
      // here owner is always "this" Account
    }, { owner: this });
  }

  // uncomment this to add migrations
  // private async migrationV1() {
  //   if (this.root) {
  //     // Add migration logic here
  //     this.root.version = 1;
  //   }
  // }

  // private async migrationV2() {
  //   if (this.root) {
  //     // Future migration logic here
  //     this.root.version = 2;
  //   }
  // }
}
```
