export const normalizeStoreQueryQuestion = (question: string): string =>
  question.trim()

export const hasStoreQueryQuestion = (question: string): boolean =>
  normalizeStoreQueryQuestion(question).length > 0
