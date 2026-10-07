import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { STUDENT_PHOTOS } from "./studentPhotos";

const QUESTION_DIR = path.resolve(
  __dirname,
  "../../public/questions/toefl/writing/discussion",
);
const IMAGE_DIR = path.resolve(__dirname, "../../public/images");

interface DiscussionJson {
  professorPhoto?: string;
  student1: { name: string; gender: string };
  student2: { name: string; gender: string };
}

const files: string[] = JSON.parse(
  fs.readFileSync(path.join(QUESTION_DIR, "index.json"), "utf-8"),
).files;

const load = (file: string): DiscussionJson =>
  JSON.parse(fs.readFileSync(path.join(QUESTION_DIR, file), "utf-8"));

describe("TOEFL Writing: Academic Discussion JSON", () => {
  it.each(files)("%s professor photo exists when set", (file) => {
    const { professorPhoto } = load(file);
    if (professorPhoto !== undefined) {
      expect(
        fs.existsSync(
          path.join(IMAGE_DIR, "professors", `${professorPhoto}.jpg`),
        ),
      ).toBe(true);
    }
  });

  it.each(files)("%s students are one male and one female", (file) => {
    const { student1, student2 } = load(file);
    expect([student1.gender, student2.gender].sort()).toEqual([
      "female",
      "male",
    ]);
  });

  it("every student photo exists", () => {
    for (const id of Object.values(STUDENT_PHOTOS).flat()) {
      expect(fs.existsSync(path.join(IMAGE_DIR, "students", `${id}.jpg`))).toBe(
        true,
      );
    }
  });
});
