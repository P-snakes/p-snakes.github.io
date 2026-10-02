import metadata from "../data/catalog.json";
import type { Achievement } from "../shared/types";

const parts = import.meta.glob<Achievement[]>("../data/achievements/*.json", {
  eager: true,
  import: "default",
});

export default {
  ...metadata,
  achievements: metadata.chunkFiles.flatMap(
    (file) => parts[`../data/achievements/${file}`],
  ),
};
