import os
import zlib
import struct

# Colors
BRAND_RED = "#F02814"
BRAND_RED_RGB = (240, 40, 20)
WHITE_RGB = (255, 255, 255)

# Dot definitions for 9-dot high uppercase letters (height=9, width=5)
# Coordinates in [row][col], 0-indexed: row 0..8, col 0..4
def get_letter_dots(char):
    dots = set()
    c = char.upper()
    if c == 'A':
        # Top rounded bar
        dots.update([(0, 1), (0, 2), (0, 3)])
        # Sides
        for r in range(1, 9):
            dots.add((r, 0))
            dots.add((r, 4))
        # Crossbar at row 4
        dots.update([(4, 1), (4, 2), (4, 3)])
    elif c == 'B':
        # Left spine
        for r in range(0, 9):
            dots.add((r, 0))
        # Top bar
        dots.update([(0, 1), (0, 2), (0, 3)])
        # Top loop right
        dots.update([(1, 4), (2, 4), (3, 4)])
        # Mid bar
        dots.update([(4, 1), (4, 2), (4, 3)])
        # Bottom loop right
        dots.update([(5, 4), (6, 4), (7, 4)])
        # Bottom bar
        dots.update([(8, 1), (8, 2), (8, 3)])
    elif c == 'H':
        # Left and right spines
        for r in range(0, 9):
            dots.add((r, 0))
            dots.add((r, 4))
        # Mid bar
        dots.update([(4, 1), (4, 2), (4, 3)])
    elif c == 'I':
        # Top and bottom serifs (5 dots each)
        for c_idx in range(0, 5):
            dots.add((0, c_idx))
            dots.add((8, c_idx))
        # Center stem
        for r in range(1, 8):
            dots.add((r, 2))
    elif c == 'J':
        # Top bar
        for c_idx in range(0, 5):
            dots.add((0, c_idx))
        # Stem at col 3 (or 4)
        for r in range(1, 7):
            dots.add((r, 3))
        # Hook
        dots.update([(6, 0), (7, 0), (8, 1), (8, 2), (7, 3)])
    elif c == 'O':
        # Top and bottom
        dots.update([(0, 1), (0, 2), (0, 3)])
        dots.update([(8, 1), (8, 2), (8, 3)])
        # Left and right sides
        for r in range(1, 8):
            dots.add((r, 0))
            dots.add((r, 4))
    elif c == 'S':
        # Top bar
        dots.update([(0, 1), (0, 2), (0, 3), (0, 4)])
        dots.update([(1, 0), (2, 0), (3, 0)])
        dots.update([(4, 1), (4, 2), (4, 3)])
        dots.update([(5, 4), (6, 4), (7, 4)])
        dots.update([(8, 0), (8, 1), (8, 2), (8, 3)])
    elif c == ' ':
        pass
    return dots

# Tagline dot definitions (height=7 for caps, 5 for lowercase, 1 for period)
def get_tagline_dots(char):
    dots = set()
    # 7 rows total: 0..6. Lowercase starts at row 2..6.
    if char == 'D':
        for r in range(0, 7):
            dots.add((r, 0))
        dots.update([(0, 1), (0, 2), (0, 3)])
        dots.update([(1, 4), (2, 4), (3, 4), (4, 4), (5, 4)])
        dots.update([(6, 1), (6, 2), (6, 3)])
        return dots, 5
    elif char == 'A':
        dots.update([(0, 1), (0, 2), (0, 3)])
        for r in range(1, 7):
            dots.add((r, 0))
            dots.add((r, 4))
        dots.update([(3, 1), (3, 2), (3, 3)])
        return dots, 5
    elif char == 'G':
        dots.update([(0, 1), (0, 2), (0, 3), (0, 4)])
        for r in range(1, 6):
            dots.add((r, 0))
        dots.update([(6, 1), (6, 2), (6, 3), (6, 4)])
        dots.update([(3, 2), (3, 3), (3, 4), (4, 4), (5, 4)])
        return dots, 5
    elif char == 'i':
        dots.add((0, 1)) # dot of i
        for r in range(2, 7):
            dots.add((r, 1))
        dots.update([(2, 0), (6, 0), (6, 2)])
        return dots, 3
    elif char == 's':
        dots.update([(2, 1), (2, 2), (2, 3)])
        dots.add((3, 0))
        dots.update([(4, 1), (4, 2)])
        dots.add((5, 3))
        dots.update([(6, 0), (6, 1), (6, 2)])
        return dots, 4
    elif char == 'c':
        dots.update([(2, 1), (2, 2), (2, 3)])
        for r in range(3, 6):
            dots.add((r, 0))
        dots.update([(6, 1), (6, 2), (6, 3)])
        return dots, 4
    elif char == 'o':
        dots.update([(2, 1), (2, 2)])
        dots.update([(6, 1), (6, 2)])
        for r in range(3, 6):
            dots.add((r, 0))
            dots.add((r, 3))
        return dots, 4
    elif char == 'v':
        dots.update([(2, 0), (3, 0), (4, 0)])
        dots.update([(2, 3), (3, 3), (4, 3)])
        dots.update([(5, 1), (5, 2), (6, 1), (6, 2)])
        return dots, 4
    elif char == 'e':
        dots.update([(2, 1), (2, 2), (2, 3)])
        dots.update([(3, 0), (3, 3)])
        dots.update([(4, 0), (4, 1), (4, 2), (4, 3)])
        dots.add((5, 0))
        dots.update([(6, 1), (6, 2), (6, 3)])
        return dots, 4
    elif char == 'r':
        for r in range(2, 7):
            dots.add((r, 0))
        dots.update([(3, 1), (2, 2), (2, 3)])
        return dots, 4
    elif char == 'p':
        for r in range(2, 8): # descender
            dots.add((r, 0))
        dots.update([(2, 1), (2, 2), (2, 3)])
        dots.update([(3, 3), (4, 3)])
        dots.update([(5, 1), (5, 2), (5, 3)])
        return dots, 4
    elif char == 'l':
        for r in range(0, 6):
            dots.add((r, 0))
        dots.add((6, 1))
        return dots, 2
    elif char == 'y':
        dots.update([(2, 0), (3, 0)])
        dots.update([(2, 3), (3, 3)])
        dots.update([(4, 1), (4, 2)])
        for r in range(5, 8):
            dots.add((r, 2))
        dots.add((7, 1))
        return dots, 4
    elif char == 'w':
        for r in range(2, 6):
            dots.add((r, 0))
            dots.add((r, 4))
        dots.update([(6, 1), (5, 2), (6, 3)])
        return dots, 5
    elif char == '.':
        dots.add((6, 0))
        return dots, 1
    elif char == ' ':
        return set(), 2
    return dots, 4

def generate_svg(color=BRAND_RED, bg="transparent", include_bg=False, is_white=False):
    # Figures paths
    # Left figure (taller jumping with V arms, backpack, kicking legs)
    # Right figure (shorter jumping companion with backpack, arms outstretched)
    fg_color = "#FFFFFF" if is_white else color

    svg_parts = []
    svg_parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 320" width="100%" height="100%">')
    if include_bg:
        svg_parts.append(f'  <rect width="680" height="320" fill="{bg}"/>')

    # ================= 1. JUMPING FIGURES (LEFT) =================
    svg_parts.append(f'  <g id="jumping-figures" fill="{fg_color}">')
    
    # --- Figure 1 (Left, Taller student/candidate) ---
    # Head
    svg_parts.append(f'    <circle cx="106" cy="118" r="15"/>')
    # Torso
    svg_parts.append(f'    <path d="M96 137 C96 134 102 133 108 133 C114 133 120 135 120 139 L120 174 C116 179 108 182 101 178 L96 174 Z"/>')
    # Backpack on back (left side)
    svg_parts.append(f'    <path d="M92 144 C88 144 86 148 86 156 C86 166 89 172 93 173 C95 173 96 170 96 166 L96 148 C96 145 94 144 92 144 Z"/>')
    # Left arm (raised high in victory)
    svg_parts.append(f'    <path d="M97 140 L70 113 C67 110 69 105 74 107 L102 135 Z"/>')
    # Right arm (raised high in victory)
    svg_parts.append(f'    <path d="M116 140 L141 113 C144 110 148 114 145 118 L119 143 Z"/>')
    # Left leg (bent back/up joyfully)
    svg_parts.append(f'    <path d="M98 174 C94 178 88 185 82 192 C74 201 69 207 68 212 C67 217 72 219 76 215 C82 209 89 199 97 186 Z"/>')
    # Right leg (kicking down/forward)
    svg_parts.append(f'    <path d="M107 175 C109 184 113 194 115 204 C117 212 113 220 106 226 C100 231 93 234 91 230 C89 226 95 218 99 210 C103 202 103 192 102 181 Z"/>')

    # --- Figure 2 (Right, Joyful companion) ---
    # Head
    svg_parts.append(f'    <circle cx="166" cy="138" r="13"/>')
    # Torso
    svg_parts.append(f'    <path d="M157 155 C157 152 163 151 168 151 C173 151 178 153 178 156 L175 186 C172 190 165 192 159 189 L156 186 Z"/>')
    # Backpack
    svg_parts.append(f'    <path d="M153 160 C150 160 148 163 148 170 C148 178 151 183 155 184 C156 184 157 181 157 178 L157 164 Z"/>')
    # Left arm (waving toward companion)
    svg_parts.append(f'    <path d="M158 157 L133 148 C129 146 128 141 133 141 C137 141 146 144 160 152 Z"/>')
    # Right arm (waving out)
    svg_parts.append(f'    <path d="M176 157 L200 151 C205 150 206 155 201 158 L177 165 Z"/>')
    # Left leg (jumping leap)
    svg_parts.append(f'    <path d="M159 186 C155 192 151 199 147 205 C143 211 147 216 152 214 C156 212 161 204 165 194 Z"/>')
    # Right leg (jumping leap)
    svg_parts.append(f'    <path d="M172 186 C175 194 177 201 180 208 C182 213 177 217 172 215 C168 212 167 203 167 194 Z"/>')

    svg_parts.append('  </g>')

    # ================= 2. WORDMARK: ABHI JOBS =================
    # Dot matrix rendering: dot radius = 3.6, spacing = 8.5
    dot_r = 3.6
    spacing = 8.4
    start_x = 230
    start_y = 138

    svg_parts.append(f'  <g id="wordmark-abhi-jobs" fill="{fg_color}">')

    words = ["ABHI", "JOBS"]
    curr_x = start_x

    for w_idx, word in enumerate(words):
        for ch in word:
            dots = get_letter_dots(ch)
            for r, c in dots:
                cx = curr_x + c * spacing
                cy = start_y + r * spacing
                svg_parts.append(f'    <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{dot_r}"/>')
            curr_x += 5 * spacing + 14 # Letter width + kerning
        if w_idx == 0:
            curr_x += 20 # Space between ABHI and JOBS

    svg_parts.append('  </g>')

    # ================= 3. TAGLINE: Discover. Apply. Grow. =================
    tag_dot_r = 2.1
    tag_spacing = 5.2
    tag_start_x = 250
    tag_start_y = 230

    svg_parts.append(f'  <g id="tagline-discover-apply-grow" fill="{fg_color}">')

    tagline = "Discover. Apply. Grow."
    t_curr_x = tag_start_x

    for ch in tagline:
        dots, width = get_tagline_dots(ch)
        for r, c in dots:
            cx = t_curr_x + c * tag_spacing
            cy = tag_start_y + r * tag_spacing
            svg_parts.append(f'    <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{tag_dot_r}"/>')
        t_curr_x += width * tag_spacing + (8 if ch == ' ' else 4)

    svg_parts.append('  </g>')
    svg_parts.append('</svg>')

    return '\n'.join(svg_parts)

# Write SVGs
with open('public/abhi-jobs-logo.svg', 'w') as f:
    f.write(generate_svg(BRAND_RED, is_white=False))

with open('public/abhi-jobs-logo-white.svg', 'w') as f:
    f.write(generate_svg(BRAND_RED, is_white=True))

# Favicon: Just the jumping figures in a rounded square
favicon_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="{BRAND_RED}"/>
  <g transform="translate(-50, -85) scale(1.15)" fill="#FFFFFF">
    <circle cx="106" cy="118" r="14"/>
    <path d="M96 137 C96 134 102 133 108 133 C114 133 120 135 120 139 L120 174 C116 179 108 182 101 178 L96 174 Z"/>
    <path d="M92 144 C88 144 86 148 86 156 C86 166 89 172 93 173 C95 173 96 170 96 166 L96 148 C96 145 94 144 92 144 Z"/>
    <path d="M97 140 L70 113 C67 110 69 105 74 107 L102 135 Z"/>
    <path d="M116 140 L141 113 C144 110 148 114 145 118 L119 143 Z"/>
    <path d="M98 174 C94 178 88 185 82 192 C74 201 69 207 68 212 C67 217 72 219 76 215 C82 209 89 199 97 186 Z"/>
    <path d="M107 175 C109 184 113 194 115 204 C117 212 113 220 106 226 C100 231 93 234 91 230 C89 226 95 218 99 210 C103 202 103 192 102 181 Z"/>
    <circle cx="166" cy="138" r="12"/>
    <path d="M157 155 C157 152 163 151 168 151 C173 151 178 153 178 156 L175 186 C172 190 165 192 159 189 L156 186 Z"/>
    <path d="M153 160 C150 160 148 163 148 170 C148 178 151 183 155 184 C156 184 157 181 157 178 L157 164 Z"/>
    <path d="M158 157 L133 148 C129 146 128 141 133 141 C137 141 146 144 160 152 Z"/>
    <path d="M176 157 L200 151 C205 150 206 155 201 158 L177 165 Z"/>
    <path d="M159 186 C155 192 151 199 147 205 C143 211 147 216 152 214 C156 212 161 204 165 194 Z"/>
    <path d="M172 186 C175 194 177 201 180 208 C182 213 177 217 172 215 C168 212 167 203 167 194 Z"/>
  </g>
</svg>'''
with open('public/favicon.svg', 'w') as f:
    f.write(favicon_svg)

print("Generated public/abhi-jobs-logo.svg and favicon.svg successfully")
