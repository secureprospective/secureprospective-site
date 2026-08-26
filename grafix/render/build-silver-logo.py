# build-silver-logo.py
# Photorealistic cast-sterling-silver render of the SecureProspective lockup.
# Run:  flatpak run org.blender.Blender -b -P build-silver-logo.py
#
# All tweakable parameters are in the PARAMS block below.

import bpy, os, math, sys, time
from mathutils import Vector

# ----------------------------------------------------------------------------- PARAMS
GRAFIX   = "/home/chris/work/secureprospective-advisor-os/grafix"
SVG_SRC  = os.path.join(GRAFIX, "secure prospective Logo Symbol Transparent bg.svg")
# The source SVG wraps its 3 paths in a nested <svg> with its own viewBox, which Blender's
# importer does not resolve. flatten_svg() rewrites just the path data into a flat SVG whose
# viewBox is the inner one, so the import lands with correct aspect and no stray <rect>.
SVG      = os.path.join(GRAFIX, "render", "sp-symbol-flat.svg")
INNER_VIEWBOX = "-0.025064963847398758 0.005594849586486816 157.9252166748047 161.54493713378906"
FONT     = os.path.join(GRAFIX, "Primal.otf")
OUTDIR   = os.path.join(GRAFIX, "render")

# Geometry (Blender units; symbol height is normalised to 1.0)
EXTRUDE        = 0.025   # curve extrude = HALF thickness -> total 0.050 = ~5% of symbol width
BEVEL_DEPTH    = 0.0060  # ~0.6% of symbol width
BEVEL_RES      = 4       # bevel resolution steps

# Layout ratios measured from "secure prospective Silver Logo.png"
# (symbol bbox 423x434 px, gap 49 px, wordmark bbox 1362x344 px,
#  SECURE cap-height 199 px, PROSPECTIVE cap-height 112 px, inter-line gap 32 px)
SYM_H          = 1.0
GAP            = 49.0/434.0
WM_W           = 1362.0/434.0
WM_H           = 344.0/434.0
LINE1_H        = 199.0/434.0
LINE2_H        = 112.0/434.0
LINE_GAP       = 32.0/434.0

# Material
BASE_COLOR     = (0.972, 0.960, 0.915, 1.0)   # sterling silver, slightly warm-neutral
ROUGHNESS      = 0.18
ROUGH_VAR      = 0.030   # +/- amount of procedural roughness break-up
NOISE_SCALE    = 2.2

# Camera
CAM_LENS       = 135.0   # long lens -> near-orthographic, keeps the lockup undistorted
CAM_MARGIN     = 1.10    # framing padding factor
TILT_X         = 7.0     # degrees: tips the top of the lockup away, revealing bottom side-wall
TILT_Y         = -5.0    # degrees: swings right edge back, revealing left side-wall

# Lights (Watts)
KEY_ENERGY     = 1100.0
FILL_ENERGY    = 220.0
RIM_ENERGY     = 700.0
SOFTBOX_EMIT   = 3.0     # emissive plane strength (out-of-frame reflection source)
WORLD_TOP      = (0.105, 0.112, 0.130, 1.0)   # dark neutral gradient, NOT black
WORLD_BOTTOM   = (0.016, 0.016, 0.021, 1.0)

# Render
SAMPLES        = 220
RES_4K         = (3840, 2160)
RES_HD         = (1920, 1080)
# #0a0a0c, the boot-splash background the transparent plate is composited over
BOOT_BG = (10 / 255.0, 10 / 255.0, 12 / 255.0)
# -----------------------------------------------------------------------------


def log(*a):
    print("[silver]", *a); sys.stdout.flush()


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def bbox_world(objs):
    mn = Vector(( 1e9,  1e9,  1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        oe = o.evaluated_get(dg)
        for c in oe.bound_box:
            w = oe.matrix_world @ Vector(c)
            for i in range(3):
                mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
    return mn, mx


def set_curve_geo(ob, k=1.0):
    """k compensates for the SVG's import scale so the final, normalised symbol ends up
    with exactly EXTRUDE / BEVEL_DEPTH in the same units as the wordmark."""
    d = ob.data
    d.dimensions = '2D'
    d.fill_mode = 'BOTH'
    d.extrude = EXTRUDE * k
    d.bevel_depth = BEVEL_DEPTH * k
    d.bevel_resolution = BEVEL_RES
    d.resolution_u = 12
    d.offset = 0.0


def flatten_svg():
    import re
    src = open(SVG_SRC).read()
    paths = re.findall(r'<path\b[^>]*?/?>', src)
    out = ('<svg xmlns="http://www.w3.org/2000/svg" width="1579.252" height="1615.449" '
           'viewBox="%s">\n' % INNER_VIEWBOX)
    for p in paths:
        d = re.search(r'd="([^"]+)"', p).group(1)
        out += '<path d="%s" fill="#000000"/>\n' % d
    out += '</svg>\n'
    os.makedirs(os.path.dirname(SVG), exist_ok=True)
    open(SVG, "w").write(out)
    log("flattened SVG: %d paths -> %s" % (len(paths), SVG))


K_AUTO = [1.0]   # records the auto-measured import-scale factor from the first pass


def import_symbol(k_override=None):
    flatten_svg()
    try:
        bpy.ops.preferences.addon_enable(module="io_curve_svg")
    except Exception as e:
        log("addon_enable io_curve_svg:", e)
    before = set(bpy.data.objects)
    ok = False
    for opname in ("import_curve.svg", "wm.svg_import"):
        try:
            mod, fn = opname.split(".")
            getattr(getattr(bpy.ops, mod), fn)(filepath=SVG)
            ok = True
            log("imported via bpy.ops." + opname)
            break
        except Exception as e:
            log("import via %s failed: %s" % (opname, e))
    if not ok:
        raise RuntimeError("no working SVG importer")
    new = [o for o in bpy.data.objects if o not in before]
    log("SVG imported objects:", [o.name for o in new])
    if not new:
        raise RuntimeError("SVG import produced no objects")
    for o in new:
        set_curve_geo(o, 0.0)          # flat first, so we can measure the true import height
    bpy.context.view_layer.update()
    mn, mx = bbox_world(new)
    k = (mx.y - mn.y) / SYM_H          # import units per final unit
    K_AUTO[0] = k
    if k_override is not None:
        k = k_override
    log("SVG import height %.5f -> thickness compensation k=%.5f" % (mx.y - mn.y, k))
    for o in new:
        set_curve_geo(o, k)
    # join into one curve object
    bpy.ops.object.select_all(action='DESELECT')
    for o in new:
        o.select_set(True)
    bpy.context.view_layer.objects.active = new[0]
    if len(new) > 1:
        bpy.ops.object.join()
    sym = bpy.context.view_layer.objects.active
    sym.name = "SP_Symbol"
    return sym


def to_mesh_smooth(ob):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(30.0))
    except Exception:
        bpy.ops.object.shade_smooth()
    m = ob.modifiers.new("WN", 'WEIGHTED_NORMAL')
    m.keep_sharp = True
    return ob


def normalise(ob, target_h, origin_to_geo=True):
    """Scale object uniformly so its Y extent == target_h, and centre it at origin in XY."""
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    mn, mx = bbox_world([ob])
    h = mx.y - mn.y
    s = target_h / h
    ob.scale = (s, s, s)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mn, mx = bbox_world([ob])
    ob.location.x -= (mn.x + mx.x) / 2.0
    ob.location.y -= (mn.y + mx.y) / 2.0
    ob.location.z -= (mn.z + mx.z) / 2.0
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    return ob


def make_text(body, name, font):
    cu = bpy.data.curves.new(name, type='FONT')
    cu.body = body
    cu.font = font
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.extrude = EXTRUDE
    cu.bevel_depth = BEVEL_DEPTH
    cu.bevel_resolution = BEVEL_RES
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    return ob


def fit_line(ob, target_w, target_h):
    """Size a text object so its cap-height == target_h, then widen letter-spacing
    (NOT a non-uniform scale, which would squash the bevel) until width == target_w."""
    bpy.context.view_layer.update()
    mn, mx = bbox_world([ob])
    ob.data.size = ob.data.size * (target_h / (mx.y - mn.y))
    bpy.context.view_layer.update()
    for _ in range(8):
        mn, mx = bbox_world([ob])
        w = mx.x - mn.x
        if abs(w - target_w) < 1e-4:
            break
        # advance width scales with space_character; glyph widths do not.
        k = ob.data.space_character
        ob.data.space_character = max(0.05, k + (target_w - w) / max(w, 1e-6) * 0.9)
        bpy.context.view_layer.update()
    mn, mx = bbox_world([ob])
    log("  line '%s': w=%.4f h=%.4f space_character=%.4f"
        % (ob.data.body, mx.x - mn.x, mx.y - mn.y, ob.data.space_character))
    return ob


def center_mesh(ob):
    """Zero a MESH object's geometry about its own origin (text can't apply location)."""
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    mn, mx = bbox_world([ob])
    ob.location.x -= (mn.x + mx.x) / 2.0
    ob.location.y -= (mn.y + mx.y) / 2.0
    ob.location.z -= (mn.z + mx.z) / 2.0
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    return ob


def silver_material():
    mat = bpy.data.materials.new("Sterling_Silver")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (600, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (280, 0)
    bsdf.inputs["Base Color"].default_value = BASE_COLOR
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = ROUGHNESS
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.5
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.5

    tc = nt.nodes.new("ShaderNodeTexCoord"); tc.location = (-620, -180)
    noise = nt.nodes.new("ShaderNodeTexNoise"); noise.location = (-420, -180)
    noise.inputs["Scale"].default_value = NOISE_SCALE
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.55
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])

    mr = nt.nodes.new("ShaderNodeMapRange"); mr.location = (-200, -180)
    mr.inputs["From Min"].default_value = 0.35
    mr.inputs["From Max"].default_value = 0.65
    mr.inputs["To Min"].default_value = max(0.02, ROUGHNESS - ROUGH_VAR)
    mr.inputs["To Max"].default_value = ROUGHNESS + ROUGH_VAR
    mr.clamp = True
    nt.links.new(noise.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], bsdf.inputs["Roughness"])

    # micro-bump: very faint cast-surface texture
    bump = nt.nodes.new("ShaderNodeBump"); bump.location = (60, -320)
    bump.inputs["Strength"].default_value = 0.006
    bump.inputs["Distance"].default_value = 0.0015
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def build_world():
    w = bpy.data.worlds.new("SP_World")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld"); out.location = (500, 0)
    bg = nt.nodes.new("ShaderNodeBackground"); bg.location = (300, 0)
    bg.inputs["Strength"].default_value = 1.0
    grad = nt.nodes.new("ShaderNodeTexGradient"); grad.location = (-150, 0)
    grad.gradient_type = 'LINEAR'
    mapn = nt.nodes.new("ShaderNodeMapping"); mapn.location = (-350, 0)
    mapn.inputs["Rotation"].default_value = (0.0, math.radians(90.0), 0.0)
    tc = nt.nodes.new("ShaderNodeTexCoord"); tc.location = (-560, 0)
    ramp = nt.nodes.new("ShaderNodeValToRGB"); ramp.location = (40, 0)
    ramp.color_ramp.elements[0].position = 0.15
    ramp.color_ramp.elements[0].color = WORLD_BOTTOM
    ramp.color_ramp.elements[1].position = 0.95
    ramp.color_ramp.elements[1].color = WORLD_TOP
    nt.links.new(tc.outputs["Generated"], mapn.inputs["Vector"])
    nt.links.new(mapn.outputs["Vector"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def add_area(name, loc, rot, size, energy, color=(1,1,1)):
    d = bpy.data.lights.new(name, type='AREA')
    d.energy = energy
    d.size = size
    d.shape = 'SQUARE'
    d.color = color
    o = bpy.data.objects.new(name, d)
    o.location = loc
    o.rotation_euler = rot
    bpy.context.collection.objects.link(o)
    return o


def aim(obj, target=(0, 0, 0)):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def composite_dark(src_path, dst_path):
    """Composite the transparent 1080 plate over near-black BOOT_BG (the boot-splash preview).
    Done with Blender's own image API so the script has no dependency outside Blender."""
    src = bpy.data.images.load(src_path)
    # Read the plate's raw stored values (Non-Color = no linearisation on read) and blend in
    # display space, because save_render() below writes these values through unchanged.
    src.colorspace_settings.name = 'Non-Color'
    w, h = src.size
    px = list(src.pixels)          # RGBA float, linear
    bg = BOOT_BG
    for i in range(0, len(px), 4):
        a = px[i + 3]
        for c in range(3):
            px[i + c] = px[i + c] * a + bg[c] * (1.0 - a)
        px[i + 3] = 1.0
    out = bpy.data.images.new("dark", width=w, height=h, alpha=False)
    out.pixels = px
    out.file_format = 'PNG'
    out.filepath_raw = dst_path
    sc = bpy.context.scene.render.image_settings
    sc.color_mode = 'RGB'
    # The plate is already view-transformed; saving it back must NOT apply AgX a second time
    # (that would crush the near-black background to pure 0,0,0).
    vt = bpy.context.scene.view_settings.view_transform
    bpy.context.scene.view_settings.view_transform = 'Standard'
    out.save_render(dst_path)
    bpy.context.scene.view_settings.view_transform = vt
    sc.color_mode = 'RGBA'
    log("wrote %s" % os.path.basename(dst_path))


def main():
    t_start = time.time()
    clear_scene()
    scn = bpy.context.scene

    # ---------------- geometry
    # Build the symbol, iterating on the extrude compensation factor until the *normalised*
    # thickness matches the wordmark's exactly. (Blender's SVG import scale and curve-extrude
    # interaction is not worth predicting analytically; two or three measured passes converge.)
    target_depth = 2.0 * EXTRUDE + 2.0 * BEVEL_DEPTH
    k = None
    sym = None
    for it in range(5):
        if sym is not None:
            bpy.ops.object.select_all(action='DESELECT')
            sym.select_set(True)
            bpy.ops.object.delete()
        sym = import_symbol(k)
        sym = to_mesh_smooth(sym)
        sym = normalise(sym, SYM_H)
        mn, mx = bbox_world([sym])
        depth = mx.z - mn.z
        log("symbol pass %d: w=%.4f h=%.4f depth=%.4f (target %.4f)"
            % (it, mx.x - mn.x, mx.y - mn.y, depth, target_depth))
        if abs(depth - target_depth) < 0.02 * target_depth:
            break
        k = (k if k is not None else K_AUTO[0]) * (target_depth / max(depth, 1e-9))
    mn, mx = bbox_world([sym])
    sym_w = mx.x - mn.x

    font = bpy.data.fonts.load(FONT)
    l1 = make_text("SECURE", "SP_Line1", font)
    l2 = make_text("PROSPECTIVE", "SP_Line2", font)
    bpy.context.view_layer.update()
    fit_line(l1, WM_W, LINE1_H)
    fit_line(l2, WM_W, LINE2_H)
    l1 = center_mesh(to_mesh_smooth(l1))
    l2 = center_mesh(to_mesh_smooth(l2))

    # place: symbol left, wordmark right, both centred on y=0
    # total lockup width = sym_w + GAP + WM_W, centred on x=0
    total_w = sym_w + GAP + WM_W
    sym.location.x = -total_w / 2.0 + sym_w / 2.0
    cx = -total_w / 2.0 + sym_w + GAP + WM_W / 2.0
    l1.location.x = cx
    l2.location.x = cx
    l1.location.y = WM_H / 2.0 - LINE1_H / 2.0
    l2.location.y = -WM_H / 2.0 + LINE2_H / 2.0

    objs = [sym, l1, l2]

    # ---------------- material
    mat = silver_material()
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(mat)

    # ---------------- group + tilt
    grp = bpy.data.objects.new("SP_Lockup", None)
    bpy.context.collection.objects.link(grp)
    for o in objs:
        o.parent = grp
        o.matrix_parent_inverse = grp.matrix_world.inverted()
    grp.rotation_euler = (math.radians(TILT_X), math.radians(TILT_Y), 0.0)
    bpy.context.view_layer.update()

    mn, mx = bbox_world(objs)
    W = mx.x - mn.x; H = mx.y - mn.y
    cxx = (mn.x + mx.x) / 2.0; cyy = (mn.y + mx.y) / 2.0
    log("lockup bbox W=%.4f H=%.4f" % (W, H))

    # ---------------- camera (long lens, near-ortho, framed to 16:9)
    cam_d = bpy.data.cameras.new("Cam")
    cam_d.lens = CAM_LENS
    cam_d.sensor_width = 36.0
    cam = bpy.data.objects.new("Cam", cam_d)
    bpy.context.collection.objects.link(cam)
    scn.camera = cam
    ar = RES_4K[0] / RES_4K[1]
    need_w = W * CAM_MARGIN
    need_h = H * CAM_MARGIN * 2.4   # keep vertical breathing room on a 16:9 plate
    if need_w / need_h < ar:
        need_w = need_h * ar
    dist = (need_w / 2.0) / math.tan(math.atan((cam_d.sensor_width / 2.0) / cam_d.lens))
    cam.location = (cxx, cyy, dist)
    cam.rotation_euler = (0.0, 0.0, 0.0)
    log("camera distance %.3f" % dist)

    S = max(W, 1.0)   # light-rig scale reference

    # ---------------- lights
    key  = add_area("Key",  (-1.15*S,  0.85*S, 1.15*S), (0,0,0), 2.2*S, KEY_ENERGY*S*S,
                    color=(1.0, 0.985, 0.96))
    fill = add_area("Fill", ( 1.10*S, -0.75*S, 0.95*S), (0,0,0), 2.6*S, FILL_ENERGY*S*S,
                    color=(0.94, 0.96, 1.0))
    rim  = add_area("Rim",  ( 0.25*S,  1.30*S, -0.85*S), (0,0,0), 1.4*S, RIM_ENERGY*S*S,
                    color=(0.97, 0.98, 1.0))
    for L in (key, fill, rim):
        aim(L, (cxx, cyy, 0.0))

    # large very-dim emissive softbox plane, out of frame above, for a broad sweep highlight
    bpy.ops.mesh.primitive_plane_add(size=6.0*S, location=(cxx, 1.9*S, 1.6*S))
    sb = bpy.context.active_object
    sb.name = "Softbox"
    sb.rotation_euler = (math.radians(62.0), 0.0, 0.0)
    m2 = bpy.data.materials.new("SoftboxEmit"); m2.use_nodes = True
    nt2 = m2.node_tree
    em = nt2.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    em.inputs["Strength"].default_value = SOFTBOX_EMIT
    o2 = nt2.nodes["Material Output"]
    nt2.links.new(em.outputs["Emission"], o2.inputs["Surface"])
    sb.data.materials.append(m2)
    sb.visible_camera = False

    build_world()

    # ---------------- render settings
    scn.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons.get("cycles")
    device = "CPU"
    if prefs:
        cp = prefs.preferences
        try:
            cp.compute_device_type = 'HIP'
            cp.get_devices()
            gpus = [d for d in cp.devices if d.type == 'HIP']
            if gpus:
                for d in cp.devices:
                    d.use = (d.type == 'HIP')
                scn.cycles.device = 'GPU'
                device = "GPU/HIP (%s)" % gpus[0].name
            else:
                raise RuntimeError("no HIP devices")
        except Exception as e:
            log("HIP unavailable (%s) -> CPU" % e)
            try:
                cp.compute_device_type = 'NONE'
            except Exception:
                pass
            scn.cycles.device = 'CPU'
    log("render device:", device)

    scn.cycles.samples = SAMPLES
    scn.cycles.use_adaptive_sampling = True
    scn.cycles.adaptive_threshold = 0.01
    scn.cycles.use_denoising = True
    try:
        scn.cycles.denoiser = 'OPENIMAGEDENOISE'
        scn.cycles.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
    except Exception as e:
        log("denoiser cfg:", e)
    scn.cycles.max_bounces = 12
    scn.cycles.glossy_bounces = 8
    scn.cycles.transmission_bounces = 8
    scn.render.film_transparent = True
    scn.render.image_settings.file_format = 'PNG'
    scn.render.image_settings.color_mode = 'RGBA'
    scn.render.image_settings.color_depth = '8'
    scn.render.image_settings.compression = 15
    try:
        scn.view_settings.view_transform = 'AgX'
    except Exception:
        scn.view_settings.view_transform = 'Filmic'
    scn.view_settings.look = 'None'

    os.makedirs(OUTDIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTDIR, "sp-silver.blend"))

    for (w, h), name in ((RES_4K, "sp-silver-3d-4k-transparent.png"),
                         (RES_HD, "sp-silver-3d-1080-transparent.png")):
        scn.render.resolution_x = w
        scn.render.resolution_y = h
        scn.render.resolution_percentage = 100
        scn.render.filepath = os.path.join(OUTDIR, name)
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        log("wrote %s in %.1fs" % (name, time.time() - t0))

    composite_dark(os.path.join(OUTDIR, "sp-silver-3d-1080-transparent.png"),
                   os.path.join(OUTDIR, "sp-silver-3d-1080-dark.png"))

    log("TOTAL %.1fs" % (time.time() - t_start))


main()
