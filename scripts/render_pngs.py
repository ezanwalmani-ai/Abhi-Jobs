import zlib
import struct
import math
from generate_brand_assets import get_letter_dots, get_tagline_dots

W, H = 680, 320

def create_png_from_grid(grid_rgba):
    raw_data = bytearray()
    for y in range(H):
        raw_data.append(0) # Filter byte: None
        row_offset = y * W * 4
        raw_data.extend(grid_rgba[row_offset:row_offset + W * 4])
            
    def make_chunk(chunk_type, data):
        chunk = chunk_type + data
        crc = zlib.crc32(chunk) & 0xffffffff
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', crc)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', W, H, 8, 6, 0, 0, 0)
    ihdr = make_chunk(b'IHDR', ihdr_data)
    idat = make_chunk(b'IDAT', zlib.compress(bytes(raw_data), 6))
    iend = make_chunk(b'IEND', b'')

    return header + ihdr + idat + iend

def draw_circle(grid, cx, cy, r, color):
    r_sq = r * r
    min_x = max(0, int(cx - r - 1))
    max_x = min(W - 1, int(cx + r + 1))
    min_y = max(0, int(cy - r - 1))
    max_y = min(H - 1, int(cy + r + 1))
    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            d_sq = (x - cx) ** 2 + (y - cy) ** 2
            if d_sq <= r_sq:
                idx = (y * W + x) * 4
                grid[idx:idx+4] = color
            elif d_sq <= (r + 1.0) ** 2:
                # simple antialiasing
                dist = math.sqrt(d_sq)
                alpha = max(0.0, min(1.0, r + 1.0 - dist))
                idx = (y * W + x) * 4
                orig_a = grid[idx+3]
                new_a = int(color[3] * alpha)
                if new_a > orig_a:
                    grid[idx:idx+3] = color[0:3]
                    grid[idx+3] = new_a

def draw_capsule(grid, x1, y1, x2, y2, r, color):
    dx, dy = x2 - x1, y2 - y1
    seg_len_sq = dx * dx + dy * dy
    min_x = max(0, int(min(x1, x2) - r - 1))
    max_x = min(W - 1, int(max(x1, x2) + r + 1))
    min_y = max(0, int(min(y1, y2) - r - 1))
    max_y = min(H - 1, int(max(y1, y2) + r + 1))
    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            if seg_len_sq == 0:
                d_sq = (x - x1) ** 2 + (y - y1) ** 2
            else:
                t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / seg_len_sq))
                px = x1 + t * dx
                py = y1 + t * dy
                d_sq = (x - px) ** 2 + (y - py) ** 2
            if d_sq <= r * r:
                idx = (y * W + x) * 4
                grid[idx:idx+4] = color
            elif d_sq <= (r + 1.0) ** 2:
                dist = math.sqrt(d_sq)
                alpha = max(0.0, min(1.0, r + 1.0 - dist))
                idx = (y * W + x) * 4
                orig_a = grid[idx+3]
                new_a = int(color[3] * alpha)
                if new_a > orig_a:
                    grid[idx:idx+3] = color[0:3]
                    grid[idx+3] = new_a

def render_artwork(bg_color):
    grid = bytearray()
    for _ in range(W * H):
        grid.extend(bg_color)

    fg = (240, 40, 20, 255) # #F02814

    # Figures
    # Head 1
    draw_circle(grid, 106, 118, 15, fg)
    # Head 2
    draw_circle(grid, 166, 138, 13, fg)

    # Limbs & Torso
    # Fig 1 Torso
    draw_capsule(grid, 108, 136, 109, 175, 14, fg)
    # Fig 1 Backpack
    draw_capsule(grid, 92, 146, 92, 170, 8, fg)
    # Fig 1 Left arm
    draw_capsule(grid, 104, 138, 72, 109, 6, fg)
    # Fig 1 Right arm
    draw_capsule(grid, 112, 138, 143, 115, 6, fg)
    # Fig 1 Left leg
    draw_capsule(grid, 104, 174, 73, 213, 8, fg)
    # Fig 1 Right leg
    draw_capsule(grid, 106, 175, 96, 228, 8, fg)

    # Fig 2 Torso
    draw_capsule(grid, 168, 153, 167, 186, 12, fg)
    # Fig 2 Backpack
    draw_capsule(grid, 154, 162, 154, 180, 7, fg)
    # Fig 2 Left arm
    draw_capsule(grid, 162, 156, 131, 143, 5, fg)
    # Fig 2 Right arm
    draw_capsule(grid, 172, 156, 200, 154, 5, fg)
    # Fig 2 Left leg
    draw_capsule(grid, 163, 186, 150, 212, 6.5, fg)
    # Fig 2 Right leg
    draw_capsule(grid, 170, 186, 178, 212, 6.5, fg)

    # ABHI JOBS wordmark
    dot_r = 3.6
    spacing = 8.4
    start_x = 230
    start_y = 138
    words = ["ABHI", "JOBS"]
    curr_x = start_x

    for w_idx, word in enumerate(words):
        for ch in word:
            dots = get_letter_dots(ch)
            for r, c in dots:
                cx = curr_x + c * spacing
                cy = start_y + r * spacing
                draw_circle(grid, cx, cy, dot_r, fg)
            curr_x += 5 * spacing + 14
        if w_idx == 0:
            curr_x += 20

    # Tagline dots
    tag_dot_r = 2.1
    tag_spacing = 5.2
    tag_start_x = 250
    tag_start_y = 230
    tagline = "Discover. Apply. Grow."
    t_curr_x = tag_start_x

    for ch in tagline:
        dots, width = get_tagline_dots(ch)
        for r, c in dots:
            cx = t_curr_x + c * tag_spacing
            cy = tag_start_y + r * tag_spacing
            draw_circle(grid, cx, cy, tag_dot_r, fg)
        t_curr_x += width * tag_spacing + (8 if ch == ' ' else 4)

    return grid

print("Fast rendering PNGs...")
grid_trans = render_artwork((0, 0, 0, 0))
with open('public/abhi-jobs-logo.png', 'wb') as f:
    f.write(create_png_from_grid(grid_trans))

grid_white = render_artwork((255, 255, 255, 255))
with open('public/image.png', 'wb') as f:
    f.write(create_png_from_grid(grid_white))

print("Render complete! Saved public/abhi-jobs-logo.png and public/image.png")
