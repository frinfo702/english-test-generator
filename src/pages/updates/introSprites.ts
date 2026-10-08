// Hamster poses drawn only for the introduce page, so the hero isn't the
// dashboard sprite again. Palettes come from the shared sprite so they stay
// the same hamsters. "." is transparent.
import {
  HAMSTER_PALETTE,
  PEARL_HAMSTER_PALETTE,
} from "../../components/pixel/hamsterSprite";

// Kinkuma curled into a loaf, facing left, eyes shut.
// prettier-ignore
export const LOAF_HAMSTER = [
  "......ooo",
  ".....opgo.oooooo",
  "....oddddoddddddooo",
  "...oddddddddddddddddo",
  "..offfddddddddddddddddo",
  ".offffffdddddddddddddddo",
  ".offeeffffddddddddddddddo",
  "onlffffffffffdddddddddddo",
  "olllfffffffffffffffdddddo",
  ".ollccccccfffffffffffffo",
  "..occcccccccccccfffffffo",
  "..ohhooooooooooohhooooo",
];
export const LOAF_HAMSTER_W = 25;
export const LOAF_HAMSTER_H = LOAF_HAMSTER.length;
export const LOAF_HAMSTER_PALETTE = HAMSTER_PALETTE;

// Pearl hamster lying on its side, facing left, eyes shut, pink paws out.
// prettier-ignore
export const LYING_HAMSTER = [
  "......oo......o",
  "...oooggoooooofoooooo",
  "..offffpffffdddddddddoo",
  ".offffffffffdddddddddddo",
  ".offeefffffffffdddddffffo",
  "offllffffffffffffffffffffo",
  ".nllllfffffcccccccccccfffo",
  "olllllfffffccccccccccccfo",
  ".ollllffffccccccccccccco",
  "..oofffffccccccccccccoo",
  "...hhoohhooofffffohhohh",
  "............ooooo",
];
export const LYING_HAMSTER_W = 26;
export const LYING_HAMSTER_H = LYING_HAMSTER.length;
// Pearl's eyes are all black ("w"); the shut eye uses "e" so it stays a line.
export const LYING_HAMSTER_PALETTE = PEARL_HAMSTER_PALETTE;

// prettier-ignore
export const Z = ["ooooo", "...o.", "..o..", ".o...", "ooooo"];
