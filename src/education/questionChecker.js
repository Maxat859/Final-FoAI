// Проверка заранее подготовленных упражнений. Код Python/Go НЕ выполняется.
function normalizeAnswer(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function checkAnswer(question, userAnswer) {
    if (!question || !["multiple_choice", "short_text"].includes(question.type)) {
        throw new Error("Неизвестный тип учебного вопроса");
    }
    const expected = Array.isArray(question.answer) ? question.answer : [question.answer];
    const correct = expected.some((answer) =>
        normalizeAnswer(answer) === normalizeAnswer(userAnswer));

    return {
        correct,
        questionId: question.id,
        feedback: correct
            ? "Верно! " + (question.explanation ?? "")
            : "Неверно. " + (question.hint ?? "Проверьте ответ и попробуйте снова."),
        explanation: correct ? (question.explanation ?? "") : null
    };
}

export function gradeQuiz(questions, answersById) {
    if (!Array.isArray(questions)) throw new Error("Нужен список вопросов");
    const results = questions.map((question) =>
        checkAnswer(question, answersById?.[question.id]));
    const correctCount = results.filter((result) => result.correct).length;
    return {
        total: results.length,
        correctCount,
        percent: results.length ? Math.round(100 * correctCount / results.length) : 0,
        results
    };
}
