/*
 * QAMAL - CSP / Backtracking.
 * Условия задаются объектами, поэтому замок можно хранить в JSON.
 *
 * {type:"allDifferent", variables:["A","B"]}
 * {type:"equals", variable:"A", value:1}
 * {type:"lessThan", left:"A", right:"B"}
 * {type:"sumEquals", variables:["A","B"], value:5}
 * {type:"notEqual", left:"A", right:"B"}
 */

function isAssigned(assignment, variable) {
    return Object.prototype.hasOwnProperty.call(assignment, variable);
}

function checkConstraint(constraint, assignment) {
    const type = constraint.type;

    if (type === "allDifferent") {
        const values = constraint.variables
            .filter((name) => isAssigned(assignment, name))
            .map((name) => assignment[name]);
        return new Set(values).size === values.length;
    }

    if (type === "equals") {
        return !isAssigned(assignment, constraint.variable)
            || assignment[constraint.variable] === constraint.value;
    }

    if (type === "notEqual" || type === "lessThan") {
        if (!isAssigned(assignment, constraint.left)
            || !isAssigned(assignment, constraint.right)) return true;
        return type === "notEqual"
            ? assignment[constraint.left] !== assignment[constraint.right]
            : assignment[constraint.left] < assignment[constraint.right];
    }

    if (type === "sumEquals") {
        const ready = constraint.variables.every((name) => isAssigned(assignment, name));
        if (!ready) return true;
        return constraint.variables.reduce((sum, name) => sum + assignment[name], 0)
            === constraint.value;
    }

    throw new Error("Неизвестное ограничение CSP: " + type);
}

export function solveCSP({ variables, domains, constraints = [], maxSolutions = Infinity }) {
    if (!Array.isArray(variables) || variables.length === 0
        || new Set(variables).size !== variables.length) {
        throw new Error("variables должен быть непустым списком уникальных имён");
    }
    if (!Number.isInteger(maxSolutions) && maxSolutions !== Infinity) {
        throw new Error("maxSolutions должен быть целым числом");
    }
    if (maxSolutions < 1) throw new Error("maxSolutions должен быть больше нуля");

    const variableSet = new Set(variables);
    const allowed = {
        allDifferent: (c) => c.variables,
        equals: (c) => [c.variable],
        notEqual: (c) => [c.left, c.right],
        lessThan: (c) => [c.left, c.right],
        sumEquals: (c) => c.variables
    };

    for (const name of variables) {
        if (!Array.isArray(domains?.[name]) || domains[name].length === 0) {
            throw new Error("Пустой домен у переменной " + name);
        }
    }
    for (const constraint of constraints) {
        if (!allowed[constraint?.type]) {
            throw new Error("Неизвестное ограничение CSP: " + constraint?.type);
        }
        const affected = allowed[constraint.type](constraint);
        if (!Array.isArray(affected) || affected.length === 0
            || affected.some((name) => !variableSet.has(name))) {
            throw new Error("Ограничение ссылается на неизвестную переменную");
        }
    }

    let checks = 0;
    let backtracks = 0;
    const solutions = [];
    const assignment = {};

    function consistent() {
        for (const constraint of constraints) {
            checks++;
            if (!checkConstraint(constraint, assignment)) return false;
        }
        return true;
    }

    function search(index) {
        if (index === variables.length) {
            solutions.push({ ...assignment });
            return;
        }
        const name = variables[index];
        for (const value of domains[name]) {
            assignment[name] = value;
            if (consistent()) {
                const before = solutions.length;
                search(index + 1);
                if (solutions.length === before) backtracks++;
            } else {
                backtracks++;
            }
            delete assignment[name];
            if (solutions.length >= maxSolutions) return;
        }
    }

    search(0);
    return { solutions, checks, backtracks };
}
