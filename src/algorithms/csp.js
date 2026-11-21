export function isConsistent(assignment, constraints) {
  for (const constraint of constraints) {
    const scope = Array.isArray(constraint.vars) ? constraint.vars : null;
    if (scope) {
      let ready = true;
      for (const v of scope) {
        if (!(v in assignment)) {
          ready = false;
          break;
        }
      }
      if (!ready) {
        continue;
      }
    }
    const fn = typeof constraint === "function" ? constraint : constraint.check;
    if (typeof fn === "function" && !fn(assignment)) {
      return false;
    }
  }
  return true;
}

export function solveCSP({ variables = [], domains = {}, constraints = [], maxSolutions = Infinity } = {}) {
  const solutions = [];
  let checks = 0;
  let backtracks = 0;

  if (!Array.isArray(variables) || variables.length === 0) {
    return { solutions, checks, backtracks };
  }

  for (const variable of variables) {
    if (!Array.isArray(domains[variable]) || domains[variable].length === 0) {
      return { solutions, checks, backtracks };
    }
  }

  const assignment = {};

  function backtrack(index) {
    if (solutions.length >= maxSolutions) {
      return;
    }

    if (index === variables.length) {
      solutions.push({ ...assignment });
      return;
    }

    const variable = variables[index];
    const values = domains[variable];

    for (const value of values) {
      assignment[variable] = value;
      checks += 1;

      if (isConsistent(assignment, constraints)) {
        const before = solutions.length;
        backtrack(index + 1);
        if (solutions.length === before && solutions.length < maxSolutions) {
          backtracks += 1;
        }
      } else {
        backtracks += 1;
      }

      delete assignment[variable];

      if (solutions.length >= maxSolutions) {
        return;
      }
    }
  }

  backtrack(0);

  return {
    solutions,
    checks,
    backtracks
  };
}
