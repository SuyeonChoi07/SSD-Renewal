# Table 3D scene

`table_p.glb`, `settings.js`, `table-scene.js`, and `vendor/` come from the supplied table scene kit. `table-model.js` mounts the model in the site's shared stage. The main `script.js` sets progress to 0 in data-scene 12, interpolates during its transition, and sets progress to 1 in data-scene 13. Reverse scrolling reverses the same motion.

Edit camera, scale, lights, and final angle in `settings.js`. The 3D stage styling is in `table-scene.css`. The old standalone demo and its automatic timed scroll trigger are not used by the site.
