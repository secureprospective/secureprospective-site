# build-silver-logo-v2.py
# Round 2: HDRI-lit cast-sterling-silver render of the SecureProspective lockup.
#
# Derived from build-silver-logo.py (round 1) — geometry, layout, camera and compositing
# are unchanged. What is new:
#   * the procedural two-stop gradient world is replaced by a Poly Haven studio HDRI
#     (Environment Texture + Mapping, so the world rotation is a real parameter),
#   * the key/fill/rim rig is retuned down now that the environment carries real light,
#   * an optional anisotropy + fine secondary roughness noise pass ("variant B").
#
# Run:  flatpak run org.blender.Blender -b -noaudio -P build-silver-logo-v2.py -- <job>
#   <job> = sweep   low-res HDRI x rotation contact sheet, for picking the environment
#           levels  low-res exposure ladder for the retuned light rig
#           final   the deliverable A/B plates at 1080 + the 4K pick
#
# All tweakable parameters are in the PARAMS block below.

import bpy, os, math, sys, time
from mathutils import Vector

# ----------------------------------------------------------------------------- PARAMS
GRAFIX   = "/home/chris/work/secureprospective-advisor-os/grafix"
SVG_SRC  = os.path.join(GRAFIX, "secure prospective Logo Symbol Transparent bg.svg")
SVG      = os.path.join(GRAFIX, "render", "sp-symbol-flat.svg")
INNER_VIEWBOX = "-0.025064963847398758 0.005594849586486816 157.9252166748047 161.54493713378906"
FONT     = os.path.join(GRAFIX, "Primal.otf")
OUTDIR   = os.path.join(GRAFIX, "render")
HDRIDIR  = os.path.join(GRAFIX, "hdri")

# Geometry (unchanged from round 1)
EXTRUDE        = 0.025
BEVEL_DEPTH    = 0.0060
BEVEL_RES      = 4

SYM_H          = 1.0
GAP            = 49.0/434.0
WM_W           = 1362.0/434.0
WM_H           = 344.0/434.0
LINE1_H        = 199.0/434.0
LINE2_H        = 112.0/434.0
LINE_GAP       = 32.0/434.0

# Material (unchanged from round 1)
BASE_COLOR     = (0.972, 0.960, 0.915, 1.0)
ROUGHNESS      = 0.18
ROUGH_VAR      = 0.030
NOISE_SCALE    = 2.2

# --- NEW in round 2: variant-B surface tweaks -------------------------------
ANISOTROPY       = 0.30    # Principled "Anisotropic", tangent aligned to the extrude axis (Z)
ANISO_ROTATION   = 0.0
FINE_NOISE_SCALE = 12.0    # finer secondary roughness break-up, layered on the broad one
FINE_ROUGH_VAR   = 0.010   # +/- roughness contributed by the fine noise

# --- NEW in round 2: HDRI environment ---------------------------------------
HDRI_NAME        = "brown_photostudio_02_4k.hdr"   # Poly Haven, CC0
HDRI_ROTATION_Z  = 315.0   # degrees. Picked from a 4-HDRI x 8-rotation sweep, then a
                           # 15-degree refinement pass: 315 puts the softbox reflection
                           # across the letter faces as a structured band rather than the
                           # flat white wash that 0/345 give.
HDRI_STRENGTH    = 1.2

# Lights (Watts). Round-1 values kept as comments for the report.
KEY_ENERGY     =   60.0   # round 1: 1100.0
FILL_ENERGY    =   20.0   # round 1:  220.0
RIM_ENERGY     =  300.0   # round 1:  700.0  (kept high relative to key: it is what
                          #                   defines the top bevel against the backdrop)
SOFTBOX_EMIT   =    0.8   # round 1:    3.0

# Render
SAMPLES        = 220
RES_4K         = (3840, 2160)
RES_HD         = (1920, 1080)
BOOT_BG = (10 / 255.0, 10 / 255.0, 12 / 255.0)
# -----------------------------------------------------------------------------


def log(*a):
    print("[silver2]", *a); sys.stdout.flush()


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


K_AUTO = [1.0]


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
    if not new:
        raise RuntimeError("SVG import produced no objects")
    for o in new:
        set_curve_geo(o, 0.0)
    bpy.context.view_layer.update()
    mn, mx = bbox_world(new)
    k = (mx.y - mn.y) / SYM_H
    K_AUTO[0] = k
    if k_override is not None:
        k = k_override
    for o in new:
        set_curve_geo(o, k)
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
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    mn, mx = bbox_world([ob])
    s = target_h / (mx.y - mn.y)
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
    bpy.context.view_layer.update()
    mn, mx = bbox_world([ob])
    ob.data.size = ob.data.size * (target_h / (mx.y - mn.y))
    bpy.context.view_layer.update()
    for _ in range(8):
        mn, mx = bbox_world([ob])
        w = mx.x - mn.x
        if abs(w - target_w) < 1e-4:
            break
        k = ob.data.space_character
        ob.data.space_character = max(0.05, k + (target_w - w) / max(w, 1e-6) * 0.9)
        bpy.context.view_layer.update()
    return ob


def center_mesh(ob):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    mn, mx = bbox_world([ob])
    ob.location.x -= (mn.x + mx.x) / 2.0
    ob.location.y -= (mn.y + mx.y) / 2.0
    ob.location.z -= (mn.z + mx.z) / 2.0
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    return ob


# ----------------------------------------------------------------- material
MAT_NODES = {}


def silver_material():
    """Round-1 silver, plus two dormant additions (fine roughness noise, anisotropy)
    whose contribution is set to zero here and switched on by set_variant()."""
    mat = bpy.data.materials.new("Sterling_Silver")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (900, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (560, 0)
    bsdf.inputs["Base Color"].default_value = BASE_COLOR
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = ROUGHNESS
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.5
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.5

    tc = nt.nodes.new("ShaderNodeTexCoord"); tc.location = (-820, -180)

    # broad break-up (round 1, unchanged)
    noise = nt.nodes.new("ShaderNodeTexNoise"); noise.location = (-620, -120)
    noise.inputs["Scale"].default_value = NOISE_SCALE
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.55
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])

    mr = nt.nodes.new("ShaderNodeMapRange"); mr.location = (-400, -120)
    mr.inputs["From Min"].default_value = 0.35
    mr.inputs["From Max"].default_value = 0.65
    mr.inputs["To Min"].default_value = max(0.02, ROUGHNESS - ROUGH_VAR)
    mr.inputs["To Max"].default_value = ROUGHNESS + ROUGH_VAR
    mr.clamp = True
    nt.links.new(noise.outputs["Fac"], mr.inputs["Value"])

    # fine secondary break-up (new; amplitude 0 until set_variant turns it on)
    fine = nt.nodes.new("ShaderNodeTexNoise"); fine.location = (-620, -420)
    fine.inputs["Scale"].default_value = FINE_NOISE_SCALE
    fine.inputs["Detail"].default_value = 4.0
    fine.inputs["Roughness"].default_value = 0.5
    nt.links.new(tc.outputs["Object"], fine.inputs["Vector"])

    fmr = nt.nodes.new("ShaderNodeMapRange"); fmr.location = (-400, -420)
    fmr.inputs["From Min"].default_value = 0.35
    fmr.inputs["From Max"].default_value = 0.65
    fmr.inputs["To Min"].default_value = 0.0
    fmr.inputs["To Max"].default_value = 0.0
    fmr.clamp = True
    nt.links.new(fine.outputs["Fac"], fmr.inputs["Value"])

    add = nt.nodes.new("ShaderNodeMath"); add.location = (-160, -240)
    add.operation = 'ADD'
    add.use_clamp = True
    nt.links.new(mr.outputs["Result"], add.inputs[0])
    nt.links.new(fmr.outputs["Result"], add.inputs[1])
    nt.links.new(add.outputs["Value"], bsdf.inputs["Roughness"])

    # anisotropy, tangent along the extrude axis (Z) so the grain reads as machined
    # Tangent grain spun about the extrude axis (Z). Blender's Tangent node only offers
    # RADIAL / UV_MAP; RADIAL about Z is the axis-aligned option and gives the turned,
    # machined-from-billet grain rather than a flat smear.
    tan = nt.nodes.new("ShaderNodeTangent"); tan.location = (200, -520)
    tan.direction_type = 'RADIAL'
    tan.axis = 'Z'
    for nm in ("Anisotropic", "Anisotropy"):
        if nm in bsdf.inputs:
            bsdf.inputs[nm].default_value = 0.0
            MAT_NODES["aniso_input"] = nm
            break
    for nm in ("Anisotropic Rotation", "Anisotropy Rotation"):
        if nm in bsdf.inputs:
            bsdf.inputs[nm].default_value = 0.0
            MAT_NODES["aniso_rot_input"] = nm
            break
    if "Tangent" in bsdf.inputs:
        nt.links.new(tan.outputs["Tangent"], bsdf.inputs["Tangent"])

    # micro-bump (round 1, unchanged)
    bump = nt.nodes.new("ShaderNodeBump"); bump.location = (300, -320)
    bump.inputs["Strength"].default_value = 0.006
    bump.inputs["Distance"].default_value = 0.0015
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    MAT_NODES.update(mat=mat, bsdf=bsdf, fmr=fmr, fine=fine)
    return mat


def set_variant(v):
    """'a' = round-1 surface settings; 'b' = + anisotropy + fine roughness noise."""
    bsdf = MAT_NODES["bsdf"]; fmr = MAT_NODES["fmr"]; fine = MAT_NODES["fine"]
    on = (v == 'b')
    fine.inputs["Scale"].default_value = FINE_NOISE_SCALE
    fmr.inputs["To Min"].default_value = (-FINE_ROUGH_VAR if on else 0.0)
    fmr.inputs["To Max"].default_value = ( FINE_ROUGH_VAR if on else 0.0)
    ai = MAT_NODES.get("aniso_input")
    if ai:
        bsdf.inputs[ai].default_value = (ANISOTROPY if on else 0.0)
    ar = MAT_NODES.get("aniso_rot_input")
    if ar:
        bsdf.inputs[ar].default_value = (ANISO_ROTATION if on else 0.0)
    log("variant %s: anisotropy=%.2f fine_noise=+/-%.4f @ scale %.1f"
        % (v.upper(), (ANISOTROPY if on else 0.0),
           (FINE_ROUGH_VAR if on else 0.0), FINE_NOISE_SCALE))


# -------------------------------------------------------------------- world
WORLD_NODES = {}


def build_world_hdri(hdri=None, rot_z=None, strength=None):
    """Environment Texture world. The Mapping node's Z rotation is the main artistic
    control: it slides the reflected softbox across the flat faces of the lockup."""
    hdri = hdri or HDRI_NAME
    rot_z = HDRI_ROTATION_Z if rot_z is None else rot_z
    strength = HDRI_STRENGTH if strength is None else strength

    w = bpy.data.worlds.get("SP_World_HDRI") or bpy.data.worlds.new("SP_World_HDRI")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    if "env" not in WORLD_NODES:
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        out = nt.nodes.new("ShaderNodeOutputWorld"); out.location = (500, 0)
        bg  = nt.nodes.new("ShaderNodeBackground");  bg.location  = (300, 0)
        env = nt.nodes.new("ShaderNodeTexEnvironment"); env.location = (0, 0)
        mapn = nt.nodes.new("ShaderNodeMapping"); mapn.location = (-280, 0)
        tc  = nt.nodes.new("ShaderNodeTexCoord"); tc.location = (-500, 0)
        nt.links.new(tc.outputs["Generated"], mapn.inputs["Vector"])
        nt.links.new(mapn.outputs["Vector"], env.inputs["Vector"])
        nt.links.new(env.outputs["Color"], bg.inputs["Color"])
        nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
        WORLD_NODES.update(env=env, bg=bg, mapn=mapn)

    env, bg, mapn = WORLD_NODES["env"], WORLD_NODES["bg"], WORLD_NODES["mapn"]
    path = os.path.join(HDRIDIR, hdri)
    if not os.path.isfile(path):
        raise RuntimeError("HDRI missing: " + path)
    key = "img:" + hdri
    if key not in WORLD_NODES:
        img = bpy.data.images.load(path, check_existing=True)
        if tuple(img.size) == (0, 0):
            raise RuntimeError("HDRI loaded but has zero size: " + path)
        WORLD_NODES[key] = img
        log("HDRI loaded %s %dx%d depth=%d (%.1f MB on disk)"
            % (hdri, img.size[0], img.size[1], img.depth,
               os.path.getsize(path) / 1e6))
    env.image = WORLD_NODES[key]
    mapn.inputs["Rotation"].default_value = (0.0, 0.0, math.radians(rot_z))
    bg.inputs["Strength"].default_value = strength
    log("world: %s rot_z=%.0fdeg strength=%.2f" % (hdri, rot_z, strength))


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


RIG = {}


def set_energies(key_e, fill_e, rim_e, softbox_e=None):
    S = RIG["S"]
    RIG["key"].data.energy  = key_e  * S * S
    RIG["fill"].data.energy = fill_e * S * S
    RIG["rim"].data.energy  = rim_e  * S * S
    if softbox_e is not None:
        RIG["softbox_emit"].inputs["Strength"].default_value = softbox_e
    log("lights: key=%.0f fill=%.0f rim=%.0f softbox=%.2f"
        % (key_e, fill_e, rim_e,
           RIG["softbox_emit"].inputs["Strength"].default_value))


def composite_dark(src_path, dst_path):
    src = bpy.data.images.load(src_path)
    src.colorspace_settings.name = 'Non-Color'
    w, h = src.size
    px = list(src.pixels)
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
    vt = bpy.context.scene.view_settings.view_transform
    bpy.context.scene.view_settings.view_transform = 'Standard'
    out.save_render(dst_path)
    bpy.context.scene.view_settings.view_transform = vt
    sc.color_mode = 'RGBA'
    bpy.data.images.remove(out)
    bpy.data.images.remove(src)
    log("wrote %s" % os.path.basename(dst_path))


def render_to(path, res, samples=None):
    scn = bpy.context.scene
    scn.render.resolution_x, scn.render.resolution_y = res
    scn.render.resolution_percentage = 100
    scn.cycles.samples = samples or SAMPLES
    scn.render.filepath = path
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    log("wrote %s (%dx%d, %d spp) in %.1fs"
        % (os.path.basename(path), res[0], res[1], scn.cycles.samples, time.time() - t0))


def build_scene():
    clear_scene()
    scn = bpy.context.scene

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
        log("symbol pass %d: depth=%.4f (target %.4f)" % (it, depth, target_depth))
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

    total_w = sym_w + GAP + WM_W
    sym.location.x = -total_w / 2.0 + sym_w / 2.0
    cx = -total_w / 2.0 + sym_w + GAP + WM_W / 2.0
    l1.location.x = cx
    l2.location.x = cx
    l1.location.y = WM_H / 2.0 - LINE1_H / 2.0
    l2.location.y = -WM_H / 2.0 + LINE2_H / 2.0

    objs = [sym, l1, l2]
    mat = silver_material()
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(mat)

    grp = bpy.data.objects.new("SP_Lockup", None)
    bpy.context.collection.objects.link(grp)
    for o in objs:
        o.parent = grp
        o.matrix_parent_inverse = grp.matrix_world.inverted()
    grp.rotation_euler = (math.radians(7.0), math.radians(-5.0), 0.0)
    bpy.context.view_layer.update()

    mn, mx = bbox_world(objs)
    W = mx.x - mn.x; H = mx.y - mn.y
    cxx = (mn.x + mx.x) / 2.0; cyy = (mn.y + mx.y) / 2.0
    log("lockup bbox W=%.4f H=%.4f" % (W, H))

    cam_d = bpy.data.cameras.new("Cam")
    cam_d.lens = 135.0
    cam_d.sensor_width = 36.0
    cam = bpy.data.objects.new("Cam", cam_d)
    bpy.context.collection.objects.link(cam)
    scn.camera = cam
    ar = RES_4K[0] / RES_4K[1]
    need_w = W * 1.10
    need_h = H * 1.10 * 2.4
    if need_w / need_h < ar:
        need_w = need_h * ar
    dist = (need_w / 2.0) / math.tan(math.atan((cam_d.sensor_width / 2.0) / cam_d.lens))
    cam.location = (cxx, cyy, dist)
    cam.rotation_euler = (0.0, 0.0, 0.0)

    S = max(W, 1.0)
    RIG["S"] = S
    RIG["key"]  = add_area("Key",  (-1.15*S,  0.85*S, 1.15*S), (0,0,0), 2.2*S, 0.0,
                           color=(1.0, 0.985, 0.96))
    RIG["fill"] = add_area("Fill", ( 1.10*S, -0.75*S, 0.95*S), (0,0,0), 2.6*S, 0.0,
                           color=(0.94, 0.96, 1.0))
    RIG["rim"]  = add_area("Rim",  ( 0.25*S,  1.30*S, -0.85*S), (0,0,0), 1.4*S, 0.0,
                           color=(0.97, 0.98, 1.0))
    for L in (RIG["key"], RIG["fill"], RIG["rim"]):
        aim(L, (cxx, cyy, 0.0))

    bpy.ops.mesh.primitive_plane_add(size=6.0*S, location=(cxx, 1.9*S, 1.6*S))
    sb = bpy.context.active_object
    sb.name = "Softbox"
    sb.rotation_euler = (math.radians(62.0), 0.0, 0.0)
    m2 = bpy.data.materials.new("SoftboxEmit"); m2.use_nodes = True
    nt2 = m2.node_tree
    em = nt2.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    em.inputs["Strength"].default_value = SOFTBOX_EMIT
    nt2.links.new(em.outputs["Emission"], nt2.nodes["Material Output"].inputs["Surface"])
    sb.data.materials.append(m2)
    sb.visible_camera = False
    RIG["softbox_emit"] = em

    set_energies(KEY_ENERGY, FILL_ENERGY, RIM_ENERGY)
    build_world_hdri()

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
    # The HDRI must light and reflect in the metal but must NOT show up as a backdrop.
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
    return scn


# ------------------------------------------------------------------------ jobs
def job_sweep():
    """Low-res contact sheet: every downloaded HDRI x a spread of world rotations."""
    d = os.path.join(OUTDIR, "sweep")
    os.makedirs(d, exist_ok=True)
    set_variant('a')
    set_energies(KEY_ENERGY * 0.45, FILL_ENERGY * 0.5, RIM_ENERGY * 0.7)
    hdris = sorted(f for f in os.listdir(HDRIDIR) if f.endswith(".hdr"))
    for h in hdris:
        for rot in (0, 45, 90, 135, 180, 225, 270, 315):
            build_world_hdri(h, rot, HDRI_STRENGTH)
            render_to(os.path.join(d, "%s_r%03d.png" % (h.replace("_4k.hdr", ""), rot)),
                      (960, 540), samples=64)


def job_levels():
    """Exposure ladder for the retuned rig, on the chosen HDRI/rotation."""
    d = os.path.join(OUTDIR, "levels")
    os.makedirs(d, exist_ok=True)
    set_variant('a')
    build_world_hdri(HDRI_NAME, HDRI_ROTATION_Z, HDRI_STRENGTH)
    ladders = [
        ("k000",   0.0,   0.0,   0.0, 0.0),   # HDRI alone, for reference
        ("k000sb",  0.0,   0.0,   0.0, 3.0),  # HDRI + softbox only
        ("k150", 150.0,  40.0, 250.0, 1.0),
        ("k300", 300.0,  60.0, 300.0, 1.5),
        ("k450", 450.0, 100.0, 420.0, 1.5),
        ("k600", 600.0, 130.0, 500.0, 2.0),
        ("k1100_r1", 1100.0, 220.0, 700.0, 3.0),   # round-1 energies, for reference
    ]
    for nm, k, f, r, sb in ladders:
        set_energies(k, f, r, sb)
        render_to(os.path.join(d, "lvl_%s.png" % nm), (1280, 720), samples=128)
    for st in (0.6, 1.0, 1.5, 2.0):
        set_energies(450.0, 100.0, 420.0, 1.5)
        build_world_hdri(HDRI_NAME, HDRI_ROTATION_Z, st)
        render_to(os.path.join(d, "str_%0.1f.png" % st), (1280, 720), samples=128)


def job_grid():
    """Iteration harness: renders whatever combinations are listed in _grid.txt, one per
    line as  name key fill rim softbox hdri rot strength variant width height samples.
    Used to pick the HDRI, the rotation and the retuned light energies; not a deliverable."""
    d = os.path.join(OUTDIR, "grid")
    os.makedirs(d, exist_ok=True)
    for line in open(os.path.join(OUTDIR, "_grid.txt")):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        nm, k, f, r, sb, hd, rot, st, var, w, h, sp = line.split()
        set_variant(var)
        set_energies(float(k), float(f), float(r), float(sb))
        build_world_hdri(hd, float(rot), float(st))
        render_to(os.path.join(d, nm + ".png"), (int(w), int(h)), samples=int(sp))


def job_final():
    build_world_hdri(HDRI_NAME, HDRI_ROTATION_Z, HDRI_STRENGTH)
    set_energies(KEY_ENERGY, FILL_ENERGY, RIM_ENERGY, SOFTBOX_EMIT)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTDIR, "sp-silver-v2.blend"))
    for v, stem in (('a', "sp-silver-v2a-hdri"), ('b', "sp-silver-v2b-hdri-aniso")):
        set_variant(v)
        tp = os.path.join(OUTDIR, stem + "-transparent.png")
        render_to(tp, RES_HD)
        composite_dark(tp, os.path.join(OUTDIR, stem + "-dark.png"))


def job_final4k():
    v = (ARGS[1] if len(ARGS) > 1 else 'b')
    build_world_hdri(HDRI_NAME, HDRI_ROTATION_Z, HDRI_STRENGTH)
    set_energies(KEY_ENERGY, FILL_ENERGY, RIM_ENERGY, SOFTBOX_EMIT)
    set_variant(v)
    render_to(os.path.join(OUTDIR, "sp-silver-v2-final-4k-transparent.png"), RES_4K)


ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["final"]

if __name__ == "__main__":
    t_start = time.time()
    build_scene()
    {"sweep": job_sweep, "levels": job_levels, "grid": job_grid,
     "final": job_final, "final4k": job_final4k}[ARGS[0]]()
    log("TOTAL %.1fs" % (time.time() - t_start))
