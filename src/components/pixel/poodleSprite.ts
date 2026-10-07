// Black toy poodle, 32×26 cells. One character per cell:
//   K coat  D curl highlight  W eye  N nose  O collar  Y tag  P tongue
// Rows may be shorter than the width; missing cells are empty. The body,
// eyelids and tail are separate layers so each can animate on its own.

export const POODLE_W = 32;
export const POODLE_H = 26;

export const POODLE_PALETTE: Record<string, string> = {
  K: "#151524",
  D: "#34344e",
  W: "#fffdfa",
  N: "#05050a",
  O: "#fa500f",
  Y: "#ffc21a",
  P: "#ff8fa3",
};

// prettier-ignore
export const POODLE_BODY = [
  "",
  "..........KKKKKK",
  "........KKKDKKKDKK",
  ".......KKDKKKKKKDKKK",
  "......KKKKKDKKKKKKKK",
  "....KKKDKKKKKKKKKDKKKK",
  "...KKDKKKKKKKKKKKKKKDKK",
  "...KKKKDKKKKKKKKKKDKKKK",
  "..KKKKKDKWWKKKKWWKDKKKKK",
  "..KDKKKDKWWKKKKWWKDKKKDK",
  "..KKKKKDKDDDDDDDDKDKKKKK",
  "..KDKKKDKDDDNNDDDKDKKKDK",
  "..KKKKKDKKDDDDDDKKDKKKKK",
  "..KKDKK..KKKKKKKK..KKDKK",
  "..KDKKK.OOOOOOOOOO.KKKDK",
  "...KKDKDKKKKYYKKKKDKDKK",
  "....KK.KKDKKKKKKDKK.KK",
  ".......KKKKKKKKKKKK",
  "......KKKKKKKKKKKKKK",
  "......KKDKKKKKKKKDKK",
  "......KKDKKKDDKKKDKK",
  "......KKDKKKDDKKKDKK",
  ".....KKKDKKKDDKKKDKKK",
  ".....KKKDKKKDDKKKDKKK",
  "....KKKKKDKDKKDKDKKKKK",
  "....KKKKKKKKKKKKKKKKKK",
];

// Eyes closed: coat over the eye, a curl line for the lid.
// prettier-ignore
export const POODLE_BLINK = [
  "", "", "", "", "", "", "", "",
  ".........KK....KK",
  ".........DD....DD",
];

// Tail poses, raised → swept out. Played back and forth for the wag.
// prettier-ignore
export const POODLE_TAILS = [
  [
    "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    "........................KK",
    ".......................KDKK",
    ".......................KKKK",
    "........................KK",
    "........................K",
    ".......................K",
    "......................K",
    ".....................K",
  ],
  [
    "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    ".........................KK",
    "........................KDKK",
    "........................KKKK",
    ".........................KK",
    ".......................KK",
    ".....................KK",
  ],
  [
    "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    "..........................KK",
    ".........................KDKK",
    ".........................KKKK",
    ".....................KKKKKKK",
  ],
];
