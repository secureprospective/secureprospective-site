# build-sp-plus.py
# Round 3: the "SP+" lockup. Cast-sterling-silver, HDRI-lit.
#
# Derived from build-silver-logo-v2.py (round 2). What carries over untouched:
# HDRI + rotation + strength, the retuned light rig, camera, tilt, the silver material
# graph (broad + fine roughness noise, anisotropy, micro-bump), AgX view transform.
#
# What is new:
#   * the globe/arrow SVG symbol is GONE - not imported at all,
#   * "SP+" set in Primal.otf takes its place, two wordmark-lines tall,
#   * the "+" is split off as its own mesh and given a faceted, struck-plaque top:
#     repeated inset-with-depth on the top cap so the surface climbs from the outer
#     edge to a cross-shaped ridge at the centre. Flat-shaded, no auto-smooth.
#   * ROUGHNESS 0.18 -> 0.10 (round-2 recommendation), ROUGH_VAR 0.030 -> 0.020.
#
# Run:  flatpak run org.blender.Blender -b -noaudio -P build-sp-plus.py -- <job>
#   gaps   low-res GAP ladder (scratch, for the optical spacing call)
#   apex   the two apex-height plates at 1080 dark
#   final  the lockup deliverables (1080 dark + 1080 alpha + 4K alpha)
#   icon   the square standalone SP+ mark (1024/512 alpha, 1024 dark)

import bpy, os, math, sys, time
from mathutils import Vector

# ----------------------------------------------------------------------------- PARAMS
GRAFIX   = "/home/chris/work/secureprospective-advisor-os/grafix"
FONT     = os.path.join(GRAFIX, "Primal.otf")
OUTDIR   = os.path.join(GRAFIX, "render")
HDRIDIR  = os.path.join(GRAFIX, "hdri")
SCRATCH  = os.path.join(OUTDIR, "v3-scratch")

# Geometry (unchanged from round 2)
EXTRUDE        = 0.025
BEVEL_DEPTH    = 0.0060
BEVEL_RES      = 4
SLAB_THICKNESS = 2.0 * EXTRUDE + 2.0 * BEVEL_DEPTH      # 0.062 world units

# Wordmark proportions (unchanged from round 2)
GAP            = 0.320            # retuned optically for SP+; round 2 was 49/434 = 0.113
WM_W           = 1362.0/434.0
WM_H           = 344.0/434.0
LINE1_H        = 199.0/434.0
LINE2_H        = 112.0/434.0
LINE_GAP       = 32.0/434.0

# --- the "+" plaque ---------------------------------------------------------
PLUS_APEX_HEIGHT = 0.093          # preferred: 1.5x slab. 0.124 (2.0x) rendered too;
                                  # its steeper slopes go dark and pinch the silhouette.
PLUS_INSET_STEPS = 6              # facet steps from outer edge to ridge. More steps =
                                  # more facet rings; the limit is a smooth hip, so keep
                                  # this low enough that each plane still reads.
PLUS_INSET_SPAN  = 0.96           # fraction of the arm half-width consumed by the insets.
                                  # 1.0 collapses the ridge to a degenerate cross.

# Material
BASE_COLOR     = (0.972, 0.960, 0.915, 1.0)
ROUGHNESS      = 0.10             # round 2: 0.18
ROUGH_VAR      = 0.020            # round 2: 0.030
NOISE_SCALE    = 2.2
ANISOTROPY       = 0.30
ANISO_ROTATION   = 0.0
FINE_NOISE_SCALE = 12.0
FINE_ROUGH_VAR   = 0.005          # round 2 shipped 0.010; 0.005 per the round-2 note

# --- the "+" only ------------------------------------------------------------
# Round 4: the plus read brighter than S/P because its faceted pyramid top catches the
# HDRI at near-specular angles while the letter faces are flat. Geometry is unchanged;
# the plus just gets its own instance of the same silver with the base colour scaled
# down (on a metal, base colour is reflectance, so this darkens it directly) and a
# little extra roughness to spread the hot facet highlight instead of mirroring it.
PLUS_TINT        = 0.68           # picked from the plustint sweep: puts the plus within
                                  # +3.4 luma of the S/P letters (round 3 shipped +18.5).
PLUS_ROUGH_ADD   = 0.03           # added to ROUGHNESS, plus only. Spreads the facet
                                  # highlight instead of mirroring it.

# HDRI (unchanged from round 2)
HDRI_NAME        = "brown_photostudio_02_4k.hdr"
HDRI_ROTATION_Z  = 315.0
HDRI_STRENGTH    = 1.2

# Lights (unchanged from round 2)
KEY_ENERGY     =   60.0
FILL_ENERGY    =   20.0
RIM_ENERGY     =  300.0
SOFTBOX_EMIT   =    0.8

# Render
SAMPLES        = 220
RES_4K         = (3840, 2160)
RES_HD         = (1920, 1080)
BOOT_BG = (10 / 255.0, 10 / 255.0, 12 / 255.0)
# -----------------------------------------------------------------------------


def log(*a):
    print("[spplus]", *a); sys.stdout.flush()


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


def fit_height(ob, target_h):
    """Scale a FONT curve by its point size, not by object scale - so the extrude depth
    stays at EXTRUDE world units and every element keeps the same slab thickness."""
    bpy.context.view_layer.update()
    mn, mx = bbox_world([ob])
    ob.data.size = ob.data.size * (target_h / (mx.y - mn.y))
    bpy.context.view_layer.update()
    return ob


def fit_line(ob, target_w, target_h):
    fit_height(ob, target_h)
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


# ------------------------------------------------------- the SP+ group and its plaque
def split_loose(ob):
    """Split a mesh into its connected islands, returned left-to-right."""
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.separate(type='LOOSE')
    bpy.ops.object.mode_set(mode='OBJECT')
    parts = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    bpy.context.view_layer.update()
    def cx(o):
        mn, mx = bbox_world([o])
        return (mn.x + mx.x) / 2.0
    parts.sort(key=cx)
    log("split into %d islands at x = %s" % (len(parts), ", ".join("%.3f" % cx(p) for p in parts)))
    return parts


def cluster_join(parts, tol):
    """Blender's curve->mesh conversion emits the front cap, the back cap and the bevel
    tube of each glyph as separate islands, so the raw loose-part split gives 3-4 pieces
    per letter. Regroup them by x position - one cluster per glyph - and join each."""
    def cx(o):
        mn, mx = bbox_world([o])
        return (mn.x + mx.x) / 2.0
    groups = []
    for o in sorted(parts, key=cx):
        if groups and abs(cx(o) - cx(groups[-1][0])) < tol:
            groups[-1].append(o)
        else:
            groups.append([o])
    out = []
    for g in groups:
        bpy.ops.object.select_all(action='DESELECT')
        for o in g:
            o.select_set(True)
        bpy.context.view_layer.objects.active = g[0]
        if len(g) > 1:
            bpy.ops.object.join()
        out.append(bpy.context.view_layer.objects.active)
    log("clustered %d islands -> %d glyphs (%s)"
        % (len(parts), len(out), ", ".join("%.3f" % cx(o) for o in out)))
    return out


def weld(ob, dist=1e-5):
    """Weld the coincident cap/bevel-tube vertices so an inset on the cap drags the rim
    with it instead of tearing a hole between cap and wall."""
    import bmesh
    me = ob.data
    bm = bmesh.new(); bm.from_mesh(me)
    n0 = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=dist)
    bm.to_mesh(me); bm.free(); me.update()
    log("weld %s: %d -> %d verts" % (ob.name, n0, len(me.vertices)))
    return ob


def plaque_top(ob, apex, steps=None, span=None):
    """Turn the flat top face of `ob` into a faceted hipped surface rising to a ridge.

    Repeated inset-with-depth. On a plus, a uniform inward offset shrinks the cross
    until it degenerates to a cross-shaped line - i.e. the offset family IS the straight
    skeleton, so stepped insets land exactly on the hipped-roof/medal profile with crisp
    facet boundaries. No smoothing anywhere on this object."""
    import bmesh
    steps = steps or PLUS_INSET_STEPS
    span = PLUS_INSET_SPAN if span is None else span

    for m in list(ob.modifiers):
        ob.modifiers.remove(m)

    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.normal_update()

    zmax = max(v.co.z for v in bm.verts)
    cap = [f for f in bm.faces
           if f.normal.z > 0.9 and abs(f.calc_center_median().z - zmax) < 1e-4]
    if not cap:
        raise RuntimeError("no top cap found")

    capverts = set()
    for f in cap:
        capverts.update(f.verts)
    cx = sum(v.co.x for v in capverts) / len(capverts)
    cy = sum(v.co.y for v in capverts) / len(capverts)
    # On a plus outline the vertex closest to the centre line in y sits at the notch,
    # so its offset from centre is the arm half-width - the maximum useful inset.
    arm_half = min(min(abs(v.co.y - cy) for v in capverts),
                   min(abs(v.co.x - cx) for v in capverts))
    t = (arm_half * span) / steps
    d = apex / steps
    log("plaque: cap faces=%d arm_half=%.4f -> %d x (inset t=%.4f, depth=%.4f), apex=%.4f"
        % (len(cap), arm_half, steps, t, d, apex))

    for i in range(steps):
        res = bmesh.ops.inset_region(bm, faces=cap, use_boundary=True,
                                     use_even_offset=True, thickness=t, depth=d)
        # the input faces stay as the (raised, shrunken) inner region
        cap = [f for f in cap if f.is_valid]
        if not cap:
            raise RuntimeError("inset collapsed the cap at step %d" % i)

    for f in bm.faces:
        f.smooth = False
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    me.update()
    try:
        me.shade_flat()
    except Exception:
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.shade_flat()
    return ob


def build_spplus(font, height, apex):
    """"SP+" set as one text object, then split so the + can be treated separately.
    Splitting after typesetting means the S/P/+ spacing is the font's own metrics."""
    t = make_text("SP+", "SP_Plus_Text", font)
    bpy.context.view_layer.update()
    fit_height(t, height)
    t = to_mesh_smooth(t)
    parts = split_loose(t)
    parts = cluster_join(parts, tol=height * 0.25)
    if len(parts) != 3:
        raise RuntimeError("expected S, P and + - got %d glyphs" % len(parts))
    plus = parts[-1]                      # rightmost glyph
    letters = parts[:-1]
    weld(plus)
    plus.name = "SP_Plus"
    for i, o in enumerate(letters):
        o.name = "SP_Letter%d" % i
    plaque_top(plus, apex)
    return letters + [plus]


# ----------------------------------------------------------------- material (round 2)
MAT_NODES = {}


def silver_material(name="Sterling_Silver", tint=1.0, rough_add=0.0):
    rough = ROUGHNESS + rough_add
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (900, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (560, 0)
    bsdf.inputs["Base Color"].default_value = (
        BASE_COLOR[0] * tint, BASE_COLOR[1] * tint, BASE_COLOR[2] * tint, 1.0)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = rough
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.5
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.5

    tc = nt.nodes.new("ShaderNodeTexCoord"); tc.location = (-820, -180)

    noise = nt.nodes.new("ShaderNodeTexNoise"); noise.location = (-620, -120)
    noise.inputs["Scale"].default_value = NOISE_SCALE
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.55
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])

    mr = nt.nodes.new("ShaderNodeMapRange"); mr.location = (-400, -120)
    mr.inputs["From Min"].default_value = 0.35
    mr.inputs["From Max"].default_value = 0.65
    mr.inputs["To Min"].default_value = max(0.02, rough - ROUGH_VAR)
    mr.inputs["To Max"].default_value = rough + ROUGH_VAR
    mr.clamp = True
    nt.links.new(noise.outputs["Fac"], mr.inputs["Value"])

    fine = nt.nodes.new("ShaderNodeTexNoise"); fine.location = (-620, -420)
    fine.inputs["Scale"].default_value = FINE_NOISE_SCALE
    fine.inputs["Detail"].default_value = 4.0
    fine.inputs["Roughness"].default_value = 0.5
    nt.links.new(tc.outputs["Object"], fine.inputs["Vector"])

    fmr = nt.nodes.new("ShaderNodeMapRange"); fmr.location = (-400, -420)
    fmr.inputs["From Min"].default_value = 0.35
    fmr.inputs["From Max"].default_value = 0.65
    fmr.inputs["To Min"].default_value = -FINE_ROUGH_VAR
    fmr.inputs["To Max"].default_value = FINE_ROUGH_VAR
    fmr.clamp = True
    nt.links.new(fine.outputs["Fac"], fmr.inputs["Value"])

    add = nt.nodes.new("ShaderNodeMath"); add.location = (-160, -240)
    add.operation = 'ADD'
    add.use_clamp = True
    nt.links.new(mr.outputs["Result"], add.inputs[0])
    nt.links.new(fmr.outputs["Result"], add.inputs[1])
    nt.links.new(add.outputs["Value"], bsdf.inputs["Roughness"])

    tan = nt.nodes.new("ShaderNodeTangent"); tan.location = (200, -520)
    tan.direction_type = 'RADIAL'
    tan.axis = 'Z'
    for nm in ("Anisotropic", "Anisotropy"):
        if nm in bsdf.inputs:
            bsdf.inputs[nm].default_value = ANISOTROPY
            break
    for nm in ("Anisotropic Rotation", "Anisotropy Rotation"):
        if nm in bsdf.inputs:
            bsdf.inputs[nm].default_value = ANISO_ROTATION
            break
    if "Tangent" in bsdf.inputs:
        nt.links.new(tan.outputs["Tangent"], bsdf.inputs["Tangent"])

    bump = nt.nodes.new("ShaderNodeBump"); bump.location = (300, -320)
    bump.inputs["Strength"].default_value = 0.006
    bump.inputs["Distance"].default_value = 0.0015
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    MAT_NODES.setdefault("mat", mat); MAT_NODES.setdefault("bsdf", bsdf)
    MAT_NODES[name] = mat
    log("material %s: roughness=%.3f +/-%.3f  fine=+/-%.4f  aniso=%.2f  tint=%.2f"
        % (name, rough, ROUGH_VAR, FINE_ROUGH_VAR, ANISOTROPY, tint))
    return mat


# -------------------------------------------------------------------- world (round 2)
WORLD_NODES = {}


def build_world_hdri(hdri=None, rot_z=None, strength=None):
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
            % (hdri, img.size[0], img.size[1], img.depth, os.path.getsize(path) / 1e6))
    env.image = WORLD_NODES[key]
    mapn.inputs["Rotation"].default_value = (0.0, 0.0, math.radians(rot_z))
    bg.inputs["Strength"].default_value = strength
    log("world: %s rot_z=%.0fdeg strength=%.2f" % (hdri, rot_z, strength))


def add_area(name, loc, rot, size, energy, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, type='AREA')
    d.energy = energy; d.size = size; d.shape = 'SQUARE'; d.color = color
    o = bpy.data.objects.new(name, d)
    o.location = loc; o.rotation_euler = rot
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
        % (key_e, fill_e, rim_e, RIG["softbox_emit"].inputs["Strength"].default_value))


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


def configure_render(scn):
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


# ------------------------------------------------------------------------ scene
def build_scene(mode="lockup", gap=None, apex=None, aspect=None):
    """mode 'lockup' = SP+ plus the two-line wordmark.
       mode 'icon'   = SP+ alone, recomposed square."""
    gap = GAP if gap is None else gap
    apex = PLUS_APEX_HEIGHT if apex is None else apex
    clear_scene()
    # read_factory_settings() invalidates every datablock, so the node/image caches from
    # a previous build_scene() in the same process must be dropped with it.
    WORLD_NODES.clear(); MAT_NODES.clear(); RIG.clear()
    scn = bpy.context.scene
    font = bpy.data.fonts.load(FONT)

    sp = build_spplus(font, WM_H, apex)
    bpy.context.view_layer.update()
    mn, mx = bbox_world(sp)
    sp_w = mx.x - mn.x
    sp_cx = (mn.x + mx.x) / 2.0
    sp_cy = (mn.y + mx.y) / 2.0
    log("SP+ block: w=%.4f h=%.4f (top z=%.4f)" % (sp_w, mx.y - mn.y, mx.z))

    objs = list(sp)
    if mode == "lockup":
        l1 = make_text("SECURE", "SP_Line1", font)
        l2 = make_text("PROSPECTIVE", "SP_Line2", font)
        bpy.context.view_layer.update()
        fit_line(l1, WM_W, LINE1_H)
        fit_line(l2, WM_W, LINE2_H)
        l1 = center_mesh(to_mesh_smooth(l1))
        l2 = center_mesh(to_mesh_smooth(l2))

        total_w = sp_w + gap + WM_W
        dx = (-total_w / 2.0 + sp_w / 2.0) - sp_cx
        for o in sp:
            o.location.x += dx
            o.location.y -= sp_cy          # SP+ centred on the wordmark block centre,
                                           # i.e. cap line of SECURE to baseline of
                                           # PROSPECTIVE, since both are WM_H tall.
        cx = -total_w / 2.0 + sp_w + gap + WM_W / 2.0
        l1.location.x = cx; l2.location.x = cx
        l1.location.y = WM_H / 2.0 - LINE1_H / 2.0
        l2.location.y = -WM_H / 2.0 + LINE2_H / 2.0
        objs += [l1, l2]
    else:
        for o in sp:
            o.location.x -= sp_cx
            o.location.y -= sp_cy

    mat = silver_material()
    plus_mat = mat
    if PLUS_TINT != 1.0 or PLUS_ROUGH_ADD != 0.0:
        plus_mat = silver_material("Sterling_Silver_Plus",
                                   tint=PLUS_TINT, rough_add=PLUS_ROUGH_ADD)
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(plus_mat if o.name == "SP_Plus" else mat)

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
    log("%s bbox W=%.4f H=%.4f" % (mode, W, H))

    cam_d = bpy.data.cameras.new("Cam")
    cam_d.lens = 135.0
    cam_d.sensor_width = 36.0
    cam = bpy.data.objects.new("Cam", cam_d)
    bpy.context.collection.objects.link(cam)
    scn.camera = cam
    if mode == "lockup":
        ar = RES_4K[0] / RES_4K[1] if aspect is None else aspect
        need_w = W * 1.10
        need_h = H * 1.10 * 2.4        # round-2 framing, kept so the two rounds compare
    else:
        ar = 1.0 if aspect is None else aspect
        # SP+ is a ~3.3:1 horizontal element, so in a square frame the width is what
        # binds: fill it to a 10% margin and accept the vertical letterboxing.
        need_w = W * 1.10
        need_h = H * 1.10
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

    set_energies(KEY_ENERGY, FILL_ENERGY, RIM_ENERGY, SOFTBOX_EMIT)
    build_world_hdri()
    configure_render(scn)
    os.makedirs(OUTDIR, exist_ok=True)
    return scn


# ------------------------------------------------------------------------ jobs
def job_gaps():
    os.makedirs(SCRATCH, exist_ok=True)
    # Two passes were run: 0.113/0.150/0.190/0.240, then 0.240/0.280/0.320/0.380.
    # The font's own S->P ink gap is 0.134 world units, so anything at or below that
    # made "SP+SECURE" read as a single word. 0.320 (~2.4x the letter gap) was the pick.
    for g in (0.113, 0.150, 0.190, 0.240, 0.280, 0.320, 0.380):
        build_scene("lockup", gap=g)
        render_to(os.path.join(SCRATCH, "gap_%0.3f.png" % g), (1280, 720), samples=90)


def job_apexcheck():
    os.makedirs(SCRATCH, exist_ok=True)
    for a in (0.062, 0.093, 0.124, 0.160):
        build_scene("icon", apex=a)
        render_to(os.path.join(SCRATCH, "apex_%0.3f.png" % a), (700, 700), samples=90)


def job_apex():
    for a in (0.093, 0.124):
        build_scene("lockup", apex=a)
        tmp = os.path.join(SCRATCH, "apex_plate_%0.3f.png" % a)
        os.makedirs(SCRATCH, exist_ok=True)
        render_to(tmp, RES_HD)
        composite_dark(tmp, os.path.join(OUTDIR, "sp-plus-apex-%0.3f-dark.png" % a))


def job_roughcmp():
    """Controlled A/B of the one material change, identical layout and framing:
    round-2 roughness against round-3 roughness. Scratch only, not a deliverable."""
    global ROUGHNESS, ROUGH_VAR
    os.makedirs(SCRATCH, exist_ok=True)
    for r, rv in ((0.18, 0.030), (0.10, 0.020)):
        ROUGHNESS, ROUGH_VAR = r, rv
        build_scene("lockup")
        tmp = os.path.join(SCRATCH, "rough_%0.2f.png" % r)
        render_to(tmp, RES_HD)
        composite_dark(tmp, os.path.join(SCRATCH, "rough_%0.2f_dark.png" % r))


def job_plustint():
    """Round 4 sweep: darken the + against unchanged S/P. Identical layout and framing
    every frame, so the only variable is the plus material. Scratch only."""
    global PLUS_TINT, PLUS_ROUGH_ADD
    os.makedirs(SCRATCH, exist_ok=True)
    PLUS_ROUGH_ADD = 0.03
    for t in (1.00, 0.88, 0.78, 0.68, 0.58):
        PLUS_TINT = t
        build_scene("lockup")
        tmp = os.path.join(SCRATCH, "plustint_%0.2f.png" % t)
        render_to(tmp, (1280, 720), samples=110)
        composite_dark(tmp, os.path.join(SCRATCH, "plustint_%0.2f_dark.png" % t))


def job_final():
    build_scene("lockup")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTDIR, "sp-plus.blend"))
    tp = os.path.join(OUTDIR, "sp-plus-lockup-1080-transparent.png")
    render_to(tp, RES_HD)
    composite_dark(tp, os.path.join(OUTDIR, "sp-plus-lockup-1080-dark.png"))
    render_to(os.path.join(OUTDIR, "sp-plus-lockup-4k-transparent.png"), RES_4K)


def job_icon():
    build_scene("icon")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTDIR, "sp-plus-icon.blend"))
    p1024 = os.path.join(OUTDIR, "sp-plus-icon-1024-transparent.png")
    render_to(p1024, (1024, 1024))
    composite_dark(p1024, os.path.join(OUTDIR, "sp-plus-icon-1024-dark.png"))
    render_to(os.path.join(OUTDIR, "sp-plus-icon-512-transparent.png"), (512, 512))


ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["final"]

if __name__ == "__main__":
    t_start = time.time()
    {"gaps": job_gaps, "apexcheck": job_apexcheck, "apex": job_apex,
     "roughcmp": job_roughcmp, "plustint": job_plustint,
     "final": job_final, "icon": job_icon}[ARGS[0]]()
    log("TOTAL %.1fs" % (time.time() - t_start))
