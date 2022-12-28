import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import { colorInput } from "@sanity/color-input";
import { table } from "@sanity/table";
import schemas from "./schemas/schema";
import deskStructure from "./deskStructure";

export default defineConfig({
    name: "default",
    title: "multi-gtfs-gatsby",
    projectId: "lvgeynh2",
    dataset: "production",
    plugins: [
        deskTool({ structure: deskStructure }),
        visionTool(),
        colorInput(),
        table()
    ],
    schema: {
        types: schemas,
    },
});