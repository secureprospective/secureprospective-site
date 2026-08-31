/*
 * One-shot KWin script used by capture_receipts.sh.
 *
 * Fin is deliberately put in a fixed right-hand rail.  The rail is calculated
 * from the target window's panel-aware client area, so the same geometry is
 * used for all eight theme receipts and the panel is never covered.
 */
const FIN_APP_ID = "fin";
const FIN_TITLE = "Fin";
const MARGIN = 16;
const WIDTH = 560;
const HEIGHT = 580;

const managedWindows = workspace.stackingOrder;
let fin = null;

for (let i = managedWindows.length - 1; i >= 0; i -= 1) {
    const window = managedWindows[i];
    if (!window || !window.normalWindow) {
        continue;
    }
    const caption = String(window.caption || "");
    const identityMatches = (
        window.resourceClass === FIN_APP_ID ||
        window.resourceName === FIN_APP_ID
    );
    const titleMatches = (
        caption === FIN_TITLE ||
        caption.indexOf(FIN_TITLE + " ") === 0
    );
    if (identityMatches && titleMatches) {
        fin = window;
        break;
    }
}

assert(fin !== null, "SPPLUS_FIN_PLACEMENT_FAILED: Fin window not found");

fin.setMaximize(false, false);

// MaximizeArea excludes the panel/struts.  The fixed right rail and
// centered vertical coordinate are independent of the selected theme or
// whatever position the compositor chose before this script ran.
const area = workspace.clientArea(KWin.MaximizeArea, fin);
const width = Math.min(WIDTH, Math.max(1, area.width - (MARGIN * 2)));
const height = Math.min(HEIGHT, Math.max(1, area.height - (MARGIN * 2)));
const x = area.x + area.width - width - MARGIN;
const y = area.y + Math.floor((area.height - height) / 2);

fin.frameGeometry = {
    x: x,
    y: y,
    width: width,
    height: height,
};
print("SPPLUS_FIN_PLACED");
