import { solveCSP } from "../algorithms/csp.js";

// Код замка: три цифры. Единственное решение - 1, 2, 4.
export const prisonLock = {
    id: "LOCK-CSP-01",
    title: "Логический замок QAMAL",
    description: [
        "Три разные цифры A, B, C от 1 до 4.",
        "B равно 2.",
        "A меньше C.",
        "Сумма трёх цифр равна 7."
    ],
    variables: ["A", "B", "C"],
    domains: { A: [1, 2, 3, 4], B: [1, 2, 3, 4], C: [1, 2, 3, 4] },
    constraints: [
        { type: "allDifferent", variables: ["A", "B", "C"] },
        { type: "equals", variable: "B", value: 2 },
        { type: "lessThan", left: "A", right: "C" },
        { type: "sumEquals", variables: ["A", "B", "C"], value: 7 }
    ]
};

export function solvePrisonLock(puzzle = prisonLock) {
    return solveCSP({ ...puzzle });
}

// Не изменяет тревогу: ответственность за штрафы у модуля миссии.
export function checkPrisonLock(attempt, puzzle = prisonLock) {
    const values = Array.isArray(attempt)
        ? Object.fromEntries(puzzle.variables.map((key, i) => [key, Number(attempt[i])]))
        : Object.fromEntries(puzzle.variables.map((key) => [key, Number(attempt?.[key])]));

    const validInput = puzzle.variables.every((key) => Number.isInteger(values[key])
        && puzzle.domains[key].includes(values[key]));
    if (!validInput) {
        return { success: false, feedback: "Введите три допустимые целые цифры." };
    }

    const { solutions, checks, backtracks } = solvePrisonLock(puzzle);
    const success = solutions.some((solution) =>
        puzzle.variables.every((key) => solution[key] === values[key]));
    return {
        success,
        feedback: success ? "Замок открыт! Все ограничения выполнены."
            : "Код не подходит: проверьте сумму, порядок и разные цифры.",
        stats: { checks, backtracks }
    };
}
