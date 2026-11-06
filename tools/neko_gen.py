#!/usr/bin/env python3
"""Generator maskot Neko: SVG statis, frame animasi, GIF, ikon aplikasi.

Satu sumber geometri untuk semua keluaran. Warna mengikuti island.css.
Pemakaian: python3 neko_gen.py <folder_keluaran_proyek>
"""
import math
import os
import subprocess
import sys
import tempfile

from PIL import Image

S = "#ff9bbb"        # --sakura
HEAD = "#0e0d14"
BG = "#040407"       # --island
PAPER = "#eadfca"    # --paper
DROP = "#9fd8ff"
HOT = "#ff6f9c"      # bagian dalam mulut

STATES = ["idle", "sleep", "excited", "reading", "music", "shock", "sad"]
FRAMES = 24          # per loop
FPS = 12
VB = "-6 -4 60 46"   # ada ruang untuk properti di sekitar kepala


def f(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


# ---------- bagian dasar ----------

def ear_pair(el=0.0, er=0.0):
    ea = f'fill="{HEAD}" stroke="{S}" stroke-width="1.9" stroke-linejoin="round"'
    inn = f'fill="{S}" fill-opacity=".4"'
    return (
        f'<g transform="rotate({f(el)} 13 14)">'
        f'<path d="M8.5 17L9.5 3.5Q10 2 11.4 2.8L22 10.5Z" {ea}/>'
        f'<path d="M11 13.5L11.4 6.8L17 10.8Z" {inn}/></g>'
        f'<g transform="rotate({f(er)} 35 14)">'
        f'<path d="M39.5 17L38.5 3.5Q38 2 36.6 2.8L26 10.5Z" {ea}/>'
        f'<path d="M37 13.5L36.6 6.8L31 10.8Z" {inn}/></g>'
    )


def head(ry=14.5):
    return (
        f'<ellipse cx="24" cy="24" rx="18.5" ry="{f(ry)}" fill="{HEAD}" '
        f'stroke="{S}" stroke-opacity=".9" stroke-width="1.9"/>'
        # garis dahi ala referensi
        f'<path d="M21.6 10.6l-.7 3M24 10.2v3.4M26.4 10.6l.7 3" fill="none" '
        f'stroke="{S}" stroke-opacity=".6" stroke-width="1.1" stroke-linecap="round"/>'
    )


def cheeks(a=0.3):
    return (
        f'<ellipse cx="10.6" cy="29.6" rx="2.6" ry="1.5" fill="{S}" fill-opacity="{a}"/>'
        f'<ellipse cx="37.4" cy="29.6" rx="2.6" ry="1.5" fill="{S}" fill-opacity="{a}"/>'
    )


NOSE = f'<path d="M22.6 28.4h2.8l-1.4 1.7z" fill="{S}"/>'
WHISK = (
    '<path d="M5.5 27L-1.5 25.4M5.5 30L-1.5 31.8M42.5 27L49.5 25.4M42.5 30L49.5 31.8" '
    'fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1.1" stroke-linecap="round"/>'
)
MOUTH_W = (
    f'<path d="M21.4 31.8q1.3 1.7 2.6 0q1.3 1.7 2.6 0" fill="none" stroke="{S}" '
    f'stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'
)


def eye(cx, cy, rx, ry, o=1.0, hl=True):
    ryo = max(ry * o, 0.3)
    out = f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx + 1)}" ry="{f(ryo + 1)}" fill="{S}" fill-opacity=".16"/>'
    out += f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ryo)}" fill="{S}"/>'
    if hl and o > 0.6:
        out += (
            f'<circle cx="{f(cx - rx * 0.38)}" cy="{f(cy - ry * 0.38)}" r="{f(rx * 0.4)}" '
            f'fill="#fff" fill-opacity=".92"/>'
        )
    return out


def arcs(d, w=2.2):
    return (
        f'<path d="{d}" fill="none" stroke="{S}" stroke-width="{w}" '
        f'stroke-linecap="round" stroke-linejoin="round"/>'
    )


def thin(d, w=1.3):
    return (
        f'<path d="{d}" fill="none" stroke="{S}" stroke-width="{w}" '
        f'stroke-linecap="round" stroke-linejoin="round"/>'
    )


def tri(t, a, b):
    """0 -> 1 -> 0 di antara a..b, selain itu 0."""
    if t <= a or t >= b:
        return 0.0
    return math.sin(math.pi * (t - a) / (b - a))


def blink(t, at):
    return 1.0 - 0.95 * tri(t, at, at + 0.09)


def cat(eyes, mouth=MOUTH_W, el=0.0, er=0.0, ry=14.5, over="", cheek=0.3):
    return ear_pair(el, er) + head(ry) + cheeks(cheek) + eyes + NOSE + mouth + WHISK + over


def wrap(inner, dx=0.0, dy=0.0, rot=0.0):
    return f'<g transform="translate({f(dx)} {f(dy)}) rotate({f(rot)} 24 34)">{inner}</g>'


# ---------- properti ----------

def zed(x, y, s, a):
    return (
        f'<path d="M{f(x)} {f(y)}h{f(4 * s)}l{f(-4 * s)} {f(5 * s)}h{f(4 * s)}" fill="none" '
        f'stroke="{S}" stroke-opacity="{f(a)}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'
    )


def sparkle(cx, cy, s, a=1.0):
    d = (
        f"M{f(cx)} {f(cy - 4.2 * s)}L{f(cx + 1.3 * s)} {f(cy - 1.3 * s)}L{f(cx + 4.2 * s)} {f(cy)}"
        f"L{f(cx + 1.3 * s)} {f(cy + 1.3 * s)}L{f(cx)} {f(cy + 4.2 * s)}L{f(cx - 1.3 * s)} {f(cy + 1.3 * s)}"
        f"L{f(cx - 4.2 * s)} {f(cy)}L{f(cx - 1.3 * s)} {f(cy - 1.3 * s)}Z"
    )
    return f'<path d="{d}" fill="{S}" fill-opacity="{f(a)}"/>'


def note(x, y, a, tilt=0):
    return (
        f'<g transform="translate({f(x)} {f(y)}) rotate({f(tilt)})" opacity="{f(a)}">'
        f'<ellipse cx="0" cy="0" rx="1.9" ry="1.4" transform="rotate(-20)" fill="{S}"/>'
        f'<path d="M1.6 -0.6V-7.2q2.6 .4 3 3" fill="none" stroke="{S}" stroke-width="1.2" stroke-linecap="round"/>'
        f"</g>"
    )


def drop(x, y, a, s=1.0):
    return (
        f'<path d="M{f(x)} {f(y)}q{f(-2.6 * s)} {f(3.6 * s)} {f(-2.6 * s)} {f(5.3 * s)}'
        f'a{f(2.6 * s)} {f(2.6 * s)} 0 0 0 {f(5.2 * s)} 0q0 {f(-1.7 * s)} {f(-2.6 * s)} {f(-5.3 * s)}z" '
        f'fill="{DROP}" fill-opacity="{f(a)}"/>'
    )


GLASSES = (
    f'<g fill="none" stroke="{PAPER}" stroke-width="1.7" stroke-linecap="round">'
    f'<circle cx="17" cy="25" r="6.8" fill="#fff" fill-opacity=".05"/>'
    f'<circle cx="31" cy="25" r="6.8" fill="#fff" fill-opacity=".05"/>'
    f'<path d="M23.7 24.6q.3-.9.6 0M10.3 24.4L5.8 23M37.7 24.4L42.2 23"/></g>'
)
HEADPHONES = (
    f'<path d="M6.5 22Q24-8 41.5 22" fill="none" stroke="{PAPER}" stroke-width="2.5" stroke-linecap="round"/>'
    f'<rect x="2.6" y="19" width="5.8" height="10.4" rx="2.5" fill="{S}"/>'
    f'<rect x="39.6" y="19" width="5.8" height="10.4" rx="2.5" fill="{S}"/>'
)


# ---------- ekspresi ----------

def pose(state, t):
    """Mengembalikan SVG isi (tanpa <svg>) untuk ekspresi `state` pada fase t di [0,1)."""
    tau = 2 * math.pi
    if state == "idle":
        o = blink(t, 0.78)
        twitch = -9 * tri(t, 0.30, 0.42)
        dy = 0.3 * math.sin(tau * t)
        eyes = eye(17, 24, 2.7, 3.9, o) + eye(31, 24, 2.7, 3.9, o)
        return wrap(cat(eyes, er=twitch), dy=dy)

    if state == "sleep":
        k = math.sin(tau * t)
        eyes = arcs("M12.5 25q4.5 3.8 9 0M26.5 25q4.5 3.8 9 0")
        out = wrap(cat(eyes, ry=14.5 + 0.45 * k, cheek=0.36), dy=0.25 * k, rot=1.2 * math.sin(tau * t * 0.5))
        for i in range(3):
            p = (t + i / 3) % 1
            out += zed(41 + p * 5, 11 - p * 9, 0.55 + p * 0.55, math.sin(math.pi * p))
        return out

    if state == "excited":
        dy = -1.7 * abs(math.sin(tau * 2 * t))
        eyes = arcs("M12.5 26.5l4.5-5.6l4.5 5.6M26.5 26.5l4.5-5.6l4.5 5.6", 2.3)
        mouth = (
            f'<path d="M20.8 31.6q3.2 5 6.4 0z" fill="{HOT}" stroke="{S}" stroke-width="1.1" stroke-linejoin="round"/>'
        )
        out = wrap(cat(eyes, mouth, el=-3 * math.sin(tau * 2 * t), er=3 * math.sin(tau * 2 * t), cheek=0.42), dy=dy)
        out += sparkle(46.5, 7, 0.6 + 0.4 * math.sin(tau * 2 * t), 0.7 + 0.3 * math.sin(tau * 2 * t))
        out += sparkle(1.5, 8, 0.5 + 0.4 * math.sin(tau * 2 * t + 2), 0.7 + 0.3 * math.sin(tau * 2 * t + 2))
        return out

    if state == "reading":
        p = (t * 2) % 1                       # dua baris per loop
        px = -1.4 + 2.8 * min(p / 0.85, 1.0)   # menyapu kiri->kanan, lalu cepat kembali
        o = blink(t, 0.55)
        eyes = eye(17 + px, 25.4, 2.1, 2.5, o) + eye(31 + px, 25.4, 2.1, 2.5, o) + GLASSES
        return wrap(cat(eyes, thin("M22.4 31.8q1.6 1.4 3.2 0"), cheek=0.24), dy=0.2 * math.sin(tau * t))

    if state == "music":
        rot = 3.6 * math.sin(tau * 2 * t)
        dy = -0.7 * abs(math.sin(tau * 2 * t))
        eyes = arcs("M12.5 25q4.5-4.6 9 0M26.5 25q4.5-4.6 9 0")
        out = wrap(cat(eyes, cheek=0.36, over=HEADPHONES), dy=dy, rot=rot)
        for i in range(2):
            p = (t + i / 2) % 1
            out += note(44 + 3 * math.sin(tau * p), 14 - 13 * p, math.sin(math.pi * p), 12 * math.sin(tau * p))
        return out

    if state == "shock":
        burst = 1.0 if t < 0.5 else 0.0
        dx = 0.55 * math.sin(tau * 9 * t) * burst
        eyes = (
            f'<circle cx="17" cy="24" r="4.2" fill="{HEAD}" stroke="{S}" stroke-width="1.4"/>'
            f'<circle cx="31" cy="24" r="4.2" fill="{HEAD}" stroke="{S}" stroke-width="1.4"/>'
            + eye(17, 24, 1.4, 1.4, 1, False)
            + eye(31, 24, 1.4, 1.4, 1, False)
        )
        mouth = f'<ellipse cx="24" cy="33.2" rx="1.9" ry="2.4" fill="{HOT}" stroke="{S}" stroke-width="1.1"/>'
        out = wrap(cat(eyes, mouth, el=-4 * burst, er=4 * burst, cheek=0.12), dx=dx)
        p = (t * 1.0) % 1
        out += drop(46.5, 5 + 14 * p, 1 - p ** 3)
        return out

    if state == "sad":
        k = math.sin(tau * t)
        o = blink(t, 0.62)
        eyes = (
            eye(17, 25.4, 2.5, 3.5, o)
            + eye(31, 25.4, 2.5, 3.5, o)
            + thin("M11.5 20.6l9-3M36.5 20.6l-9-3", 1.2)
        )
        mouth = thin("M21 33.6q3-2.8 6 0")
        out = wrap(cat(eyes, mouth, el=-16, er=16, ry=14.5 - 0.3 * k, cheek=0.14), dy=0.4 + 0.25 * k)
        p = (t * 1.0) % 1
        out += drop(13.2, 29 + 9 * p, math.sin(math.pi * p) * 0.9, 0.6)
        return out

    raise ValueError(state)


def svg_doc(inner, vb=VB, bg=None, w=None):
    x, y, vw, vh = [float(v) for v in vb.split()]
    size = f' width="{w}" height="{int(w * vh / vw)}"' if w else ""
    rect = f'<rect x="{f(x)}" y="{f(y)}" width="{f(vw)}" height="{f(vh)}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"{size}>{rect}{inner}</svg>\n'
    )


# ---------- ikon aplikasi ----------

def icon_svg():
    eyes = eye(17, 25.4, 2.1, 2.5) + eye(31, 25.4, 2.1, 2.5) + GLASSES
    body = cat(eyes, thin("M22.4 31.8q1.6 1.4 3.2 0"), cheek=0.3)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        "<defs>"
        '<radialGradient id="g" cx="50%" cy="46%" r="55%">'
        f'<stop offset="0" stop-color="{S}" stop-opacity=".22"/>'
        f'<stop offset="1" stop-color="{S}" stop-opacity="0"/>'
        "</radialGradient></defs>"
        f'<rect width="64" height="64" rx="14" fill="{BG}"/>'
        '<rect width="64" height="64" rx="14" fill="url(#g)"/>'
        f'<rect x=".5" y=".5" width="63" height="63" rx="13.5" fill="none" stroke="#fff" stroke-opacity=".07"/>'
        f'<g transform="translate(32 34.5) scale(1.17) translate(-24 -21.5)">{body}</g>'
        "</svg>\n"
    )


# ---------- render ----------

def rsvg(svg_text, out_png, width, bg=None):
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as fh:
        fh.write(svg_text)
        tmp = fh.name
    try:
        cmd = ["rsvg-convert", "-w", str(width), "-o", out_png]
        if bg:
            cmd += ["-b", bg]
        subprocess.run(cmd + [tmp], check=True)
    finally:
        os.unlink(tmp)


def build_gif(state, out_gif, width=448):
    frames = []
    with tempfile.TemporaryDirectory() as td:
        for i in range(FRAMES):
            png = os.path.join(td, f"{i:02d}.png")
            rsvg(svg_doc(pose(state, i / FRAMES)), png, width, bg=BG)
            frames.append(Image.open(png).convert("RGB"))
    w, h = frames[0].size
    sheet = Image.new("RGB", (w * 4, h * 2))
    for n, idx in enumerate(range(0, FRAMES, FRAMES // 8)):
        sheet.paste(frames[idx], ((n % 4) * w, (n // 4) * h))
    pal = sheet.quantize(colors=40, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    q = [fr.quantize(palette=pal, dither=Image.Dither.NONE) for fr in frames]
    q[0].save(
        out_gif, save_all=True, append_images=q[1:], duration=int(1000 / FPS),
        loop=0, optimize=False, disposal=1,
    )


def main(root):
    svg_dir = os.path.join(root, "assets", "mascot", "svg")
    png_dir = os.path.join(root, "assets", "mascot", "png")
    gif_dir = os.path.join(root, "assets", "mascot", "gif")
    ico_dir = os.path.join(root, "src-tauri", "icons")
    for d in (svg_dir, png_dir, gif_dir, ico_dir):
        os.makedirs(d, exist_ok=True)

    for s in STATES:
        doc = svg_doc(pose(s, 0.0))
        with open(os.path.join(svg_dir, f"neko-{s}.svg"), "w", encoding="utf-8") as fh:
            fh.write(doc)
        rsvg(doc, os.path.join(png_dir, f"neko-{s}.png"), 512)   # transparan
        build_gif(s, os.path.join(gif_dir, f"neko-{s}.gif"))
        print("ok", s)

    icon = icon_svg()
    with open(os.path.join(root, "assets", "neko-icon.svg"), "w", encoding="utf-8") as fh:
        fh.write(icon)
    big = os.path.join(root, "assets", "neko-icon-1024.png")
    rsvg(icon, big, 1024)
    img = Image.open(big).convert("RGBA")
    for name, px in (("32x32.png", 32), ("128x128.png", 128), ("128x128@2x.png", 256), ("icon.png", 512)):
        img.resize((px, px), Image.Resampling.LANCZOS).save(os.path.join(ico_dir, name))
    img.save(os.path.join(ico_dir, "icon.ico"), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("ikon ok")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("pakai: neko_gen.py <folder_proyek>")
    main(sys.argv[1])
