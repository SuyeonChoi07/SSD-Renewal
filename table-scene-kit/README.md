# Table 3D scene

`table_p.glb`, `settings.js`, `table-scene.js`, and `vendor/` come from the supplied table scene kit. `table-model.js` mounts the model in the site's shared stage. The main `script.js` keeps section 01 in data-scene 12. Entering data-scene 13 plays the entire motion to section 02 over 1.2 seconds. Returning to scene 12 plays it backward.

Edit camera, scale, lights, and final angle in `settings.js`. The 3D stage styling is in `table-scene.css`. The old standalone demo and its automatic timed scroll trigger are not used by the site.

The GLB keeps its PBR materials. `RoomEnvironment` supplies reflections; the final exposure and light levels are defined in `settings.js`. The key light uses a 2048px PCF shadow map, and a 64px radial contact shadow follows the bread and bag lift.
