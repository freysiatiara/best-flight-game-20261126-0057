[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/freysiatiara/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/freysiatiara/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

# Merpati Ridge — Ring Runner

An original 3D flight game for the [make.fun best flight game bounty](https://make.fun/bounty/best-flight-game-20261126-0057). Fly a low-poly propeller plane over a river valley: thread six glowing rings in order, mind your fuel, then bring her home for a gentle landing on the ridge runway.

- **Chase view** over procedural terrain — hills, river valley, fields, forests, runway with lights
- **Full HUD** — altitude, speed, heading, compass strip, attitude ball, throttle and fuel bars, score and mission line
- **Missions** — ring run (6 rings) then a runway landing; fuel burns with throttle, hard impacts crash
- **Feel** — bank-to-turn flight model, air brake/flaps, mouse-look camera, synthesized engine hum and ring chimes (WebAudio, no audio files)
- **Original** — all art, names and sounds are made for this game; Three.js r152 is vendored under `game/vendor/`

## Play

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static server and open `game/index.html`.

Controls: ↑/↓ pitch, ←/→ or A/D bank & turn, W/S throttle, Space air brake, drag mouse to look, P pause, R restart, Enter to start.

## Layout

- `game/index.html` — page shell + HUD layout
- `game/src/main.js` — boot, game loop, chase camera, screen states
- `game/src/config.js` — tuning numbers, ring course, runway
- `game/src/terrain.js` — heightmap, river, runway, trees, rocks
- `game/src/aircraft.js` — the propeller plane, built from primitives
- `game/src/sky.js` — gradient sky, sun, drifting clouds
- `game/src/physics.js` — arcade flight model, fuel, landing/crash rules
- `game/src/controls.js` — keyboard + mouse-look
- `game/src/hud.js` — instruments, compass, attitude ball
- `game/src/missions.js` — ring course, scoring, landing mission
- `game/src/audio.js` — synthesized engine, chimes, crash and fanfare
- `game/src/shots.js` — deterministic screenshot presets (`?shot=cover|valley|approach|ring`)
- `main.ts` — hand-in program (copies `game/` + `screenshots/`, writes `dossier.json`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
