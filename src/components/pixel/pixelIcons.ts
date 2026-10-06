// 16×16 pixel icons, drawn in the same chunky outlined style as the poodle.
// Each icon carries its own small palette; "o" is always the outline.

export interface PixelSprite {
  palette: Record<string, string>;
  rows: string[];
}

// prettier-ignore
const university: PixelSprite = {
  palette: { o: "#044298", b: "#55b3fb", l: "#b9daff", w: "#0082e6", r: "#fa500f" },
  rows: [
    ".......o",
    ".......orr",
    ".......o",
    "......obbo",
    "....oobbbboo",
    "..oobbbbbbbboo",
    "oooooooooooooooo",
    ".olwwllwwllwwlo",
    ".olwwllwwllwwlo",
    ".olwwllwwllwwlo",
    ".olwwllwwllwwlo",
    ".olwwllwwllwwlo",
    ".olwwllwwllwwlo",
    ".oooooooooooooo",
    "oooooooooooooooo",
  ],
};

// prettier-ignore
const briefcase: PixelSprite = {
  palette: { o: "#5c2a00", b: "#b75002", l: "#ff8205", y: "#ffd800" },
  rows: [
    "",
    "",
    ".....oooooo",
    ".....o....o",
    ".oooooooooooooo",
    ".ollllllllllllo",
    ".ollllllllllllo",
    ".ollllllllllllo",
    ".obbbbbyybbbbbo",
    ".ollllyyyyllllo",
    ".ollllllllllllo",
    ".ollllllllllllo",
    ".obbbbbbbbbbbbo",
    ".oooooooooooooo",
  ],
};

// prettier-ignore
const microphone: PixelSprite = {
  palette: { o: "#2b2b3a", g: "#8a8aa0", l: "#c9c9d8", r: "#fa500f" },
  rows: [
    "",
    "......oooo",
    ".....ollllo",
    ".....olglgo",
    ".....oglglo",
    ".....olglgo",
    ".....oglglo",
    "...o.orrrro.o",
    "...o.oooooo.o",
    "...oo......oo",
    "....oo....oo",
    ".....oooooo",
    ".......oo",
    ".......oo",
    "....oooooooo",
  ],
};

// prettier-ignore
const pencil: PixelSprite = {
  palette: {
    o: "#3a2a00", y: "#ffc21a", a: "#e08a00", m: "#9aa0b4",
    p: "#ff8fa3", s: "#f1d9ae", g: "#2b2b3a",
  },
  rows: [
    "",
    "............oo",
    "...........oppo",
    "..........opppo",
    ".........ommpo",
    "........oymmo",
    ".......oyyao",
    "......oyyao",
    ".....oyyao",
    "....oyyao",
    "...osyao",
    "..ossao",
    "..ogso",
    "..oo",
  ],
};

export const PIXEL_ICONS = { university, briefcase, microphone, pencil };
export type PixelIconName = keyof typeof PIXEL_ICONS;
