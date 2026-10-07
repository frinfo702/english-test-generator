import { hashText } from "./voiceMapping";

export type StudentGender = "male" | "female";

/** Face photos under public/images/students/{id}.jpg, by gender. */
export const STUDENT_PHOTOS: Record<StudentGender, readonly string[]> = {
  male: ["m1", "m2", "m3"],
  female: ["f1", "f2", "f3"],
};

/**
 * Photo URL for a discussion student. Only the gender has to match, so the
 * face is picked from the problem ID; a male/female pair never repeats.
 * Numeric IDs keep the faces they had when IDs were numbers.
 */
export function studentPhotoUrl(
  gender: StudentGender,
  problemId: string,
): string {
  const photos = STUDENT_PHOTOS[gender];
  const seed = /^\d+$/.test(problemId)
    ? Number(problemId) - 1
    : hashText(problemId);
  const id = photos[seed % photos.length];
  return `/images/students/${id}.jpg`;
}
