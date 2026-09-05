#!/usr/bin/env python3
"""Cut to each scene, let the entry motion settle, then screenshot.

The overlay is one persistent page that follows the PROGRAM scene, so a
screenshot of an inactive scene shows whichever pack is currently live. Each
scene has to be made program before it can be judged.
"""
import asyncio, base64, os, sys
sys.path.insert(0, os.path.expanduser("~/fleet/bin"))
from obsws import OBS

OUT = os.path.expanduser("~/logs/sp-plus/obs/shots")
ORDER = ["00 HOLD", "01 TALK", "02 RIG", "06 TALK+RIG",
         "04 SLATE", "05 BRB", "07 TECHNICAL", "03 OUTRO"]

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with OBS() as o:
        start = (await o.call("GetCurrentProgramScene")).get("sceneName")
        for n in ORDER:
            await o.call("SetCurrentProgramScene", {"sceneName": n})
            await asyncio.sleep(1.2)          # entry motion is 220ms; settle
            shot = await o.call("GetSourceScreenshot", {
                "sourceName": n, "imageFormat": "png",
                "imageWidth": 1920, "imageHeight": 1080,
                "imageCompressionQuality": -1})
            raw = base64.b64decode(shot["imageData"].split(",", 1)[1])
            p = os.path.join(OUT, n.replace(" ", "_").replace("+", "-") + ".png")
            open(p, "wb").write(raw)
            print("%-14s %8d bytes" % (n, len(raw)))
        await o.call("SetCurrentProgramScene", {"sceneName": start})
        print("restored:", start)

asyncio.run(main())
