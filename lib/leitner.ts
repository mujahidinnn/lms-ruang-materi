// Leitner boxes, mirrored from review_flashcard() in the database (which is
// what actually schedules). Used to label the rating buttons.

export type Rating = 1 | 2 | 3;

export const RATINGS: { rating: Rating; label: string }[] = [
  { rating: 1, label: "Lupa" },
  { rating: 2, label: "Sulit" },
  { rating: 3, label: "Bisa" },
];

// box is null for a card the learner has not reviewed yet.
export function nextBox(box: number | null, rating: Rating): number {
  if (box === null) return rating === 3 ? 2 : 1;
  if (rating === 1) return 1;
  if (rating === 2) return box;
  return Math.min(box + 1, 5);
}

// Days until a card in this box is due again: 1, 2, 4, 8, 16.
export function daysFor(box: number): number {
  return 2 ** (box - 1);
}
