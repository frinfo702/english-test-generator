export type StudentGender = "male" | "female";

/** Face photos under public/images/students/{id}.jpg, by gender. */
export const STUDENT_PHOTOS: Record<StudentGender, readonly string[]> = {
  male: ["m1", "m2", "m3"],
  female: ["f1", "f2", "f3"],
};

/**
 * Photo URL for a discussion student. Only the gender has to match, so the
 * face is picked from the problem number; a male/female pair never repeats.
 */
export function studentPhotoUrl(
  gender: StudentGender,
  problemNumber: number,
): string {
  const photos = STUDENT_PHOTOS[gender];
  const id = photos[(problemNumber - 1) % photos.length];
  return `/images/students/${id}.jpg`;
}
