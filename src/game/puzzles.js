import { solveCSP } from "../algorithms/csp.js";

export function createSecurityLockPuzzle() {
  const variables = ["A", "B", "C", "D"];
  const domains = {
    A: [1, 2, 3, 4],
    B: [1, 2, 3, 4],
    C: [1, 2, 3, 4],
    D: [1, 2, 3, 4]
  };

  const constraints = [
    {
      id: "all_diff_ab",
      vars: ["A", "B"],
      description: "A и B должны быть разными",
      check: (a) => a.A !== a.B
    },
    {
      id: "all_diff_ac",
      vars: ["A", "C"],
      description: "A и C должны быть разными",
      check: (a) => a.A !== a.C
    },
    {
      id: "all_diff_ad",
      vars: ["A", "D"],
      description: "A и D должны быть разными",
      check: (a) => a.A !== a.D
    },
    {
      id: "all_diff_bc",
      vars: ["B", "C"],
      description: "B и C должны быть разными",
      check: (a) => a.B !== a.C
    },
    {
      id: "all_diff_bd",
      vars: ["B", "D"],
      description: "B и D должны быть разными",
      check: (a) => a.B !== a.D
    },
    {
      id: "all_diff_cd",
      vars: ["C", "D"],
      description: "C и D должны быть разными",
      check: (a) => a.C !== a.D
    },
    {
      id: "a_plus_b_eq_5",
      vars: ["A", "B"],
      description: "Сумма A + B должна быть равна 5",
      check: (a) => a.A + a.B === 5
    },
    {
      id: "c_gt_b",
      vars: ["B", "C"],
      description: "C должно быть строго больше B",
      check: (a) => a.C > a.B
    },
    {
      id: "d_is_even",
      vars: ["D"],
      description: "D должно быть чётным числом",
      check: (a) => a.D % 2 === 0
    },
    {
      id: "a_gt_d",
      vars: ["A", "D"],
      description: "A должно быть строго больше D",
      check: (a) => a.A > a.D
    }
  ];

  return {
    id: "csp-lock-01",
    title: "Кодовый замок контрольной точки",
    variables,
    domains,
    constraints
  };
}

export function createUnsolvableLockPuzzle() {
  return {
    id: "csp-lock-impossible",
    title: "Заблокированный терминал",
    variables: ["A", "B"],
    domains: {
      A: [1, 2],
      B: [1, 2]
    },
    constraints: [
      {
        id: "eq",
        vars: ["A", "B"],
        description: "A должно быть равно B",
        check: (a) => a.A === a.B
      },
      {
        id: "gt",
        vars: ["A", "B"],
        description: "A должно быть строго больше B",
        check: (a) => a.A > a.B
      }
    ]
  };
}

export function solvePuzzle(puzzle, maxSolutions = Infinity) {
  return solveCSP({
    variables: puzzle.variables,
    domains: puzzle.domains,
    constraints: puzzle.constraints,
    maxSolutions
  });
}

export function checkLockAttempt(puzzle, attempt) {
  if (!attempt || typeof attempt !== "object") {
    return {
      unlocked: false,
      message: "Введите комбинацию для всех ячеек замка.",
      failedConstraints: []
    };
  }

  for (const variable of puzzle.variables) {
    if (!(variable in attempt) || attempt[variable] === "" || attempt[variable] === null || attempt[variable] === undefined) {
      return {
        unlocked: false,
        message: `Не заполнено значение для ячейки ${variable}.`,
        failedConstraints: []
      };
    }

    const numericValue = Number(attempt[variable]);
    if (!puzzle.domains[variable].includes(numericValue)) {
      return {
        unlocked: false,
        message: `Значение ${attempt[variable]} для ячейки ${variable} выходит за допустимый диапазон.`,
        failedConstraints: []
      };
    }
  }

  const normalized = {};
  for (const variable of puzzle.variables) {
    normalized[variable] = Number(attempt[variable]);
  }

  const failedConstraints = [];
  for (const constraint of puzzle.constraints) {
    if (!constraint.check(normalized)) {
      failedConstraints.push(constraint.description || constraint.id);
    }
  }

  if (failedConstraints.length > 0) {
    return {
      unlocked: false,
      message: `Комбинация неверна. Нарушено ограничение: ${failedConstraints[0]}.`,
      failedConstraints
    };
  }

  return {
    unlocked: true,
    message: "Замок открыт. Доступ к следующему этапу разрешён.",
    failedConstraints: []
  };
}
