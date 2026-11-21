// QAMAL: проверка ответов для двух версий учебных вопросов.
// Программы Python и Go не исполняются: сравниваются подготовленные ответы.
function normalizeAnswer(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function checkAnswer(question, userAnswer) {
  const knownType = ["multiple_choice", "short_text"].includes(question?.type);
  const knownMode = ["read", "complete", "fix"].includes(question?.mode);
  if (!question || (!knownType && !knownMode)) {
    throw new Error("Неизвестный тип учебного вопроса");
  }

  // v1: answer; v2: expectedAnswer + acceptedAnswers.
  const answerValues = question.acceptedAnswers ?? question.answer ?? question.expectedAnswer;
  const expected = Array.isArray(answerValues) ? answerValues : [answerValues];
  if (expected.length === 0 || expected.some(value => value === null || value === undefined)) {
    throw new Error("У вопроса отсутствует правильный ответ");
  }

  const correct = expected.some(answer =>
    normalizeAnswer(answer) === normalizeAnswer(userAnswer)
  );

  return {
    correct,
    questionId: question.id,
    feedback: correct
      ? "Верно! " + (question.explanation ?? "")
      : "Неверно. " + (question.hint ?? "Проверьте ответ и попробуйте снова."),
    explanation: correct ? (question.explanation ?? "") : null
  };
}

export function gradeQuiz(questions, answersById = {}) {
  // Можно передать обычный массив v1 или пакет { language, questions } v2.
  const items = Array.isArray(questions) ? questions : questions?.questions;
  if (!Array.isArray(items)) throw new Error("Нужен список вопросов");
  const results = items.map(question => checkAnswer(question, answersById?.[question.id]));
  const correctCount = results.filter(result => result.correct).length;
  return {
    total: results.length,
    correctCount,
    percent: results.length ? Math.round(100 * correctCount / results.length) : 0,
    results
  };
}
