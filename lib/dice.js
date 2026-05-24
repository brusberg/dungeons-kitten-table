export function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

export function countSuccesses(dice, target) {
  return dice.filter((die) => die <= target).length;
}

export function hasTriple(dice) {
  return dice.some((die) => dice.filter((item) => item === die).length >= 3);
}

export function resolveRoll(roll) {
  const successes = countSuccesses(roll.dice, roll.target);

  return {
    ...roll,
    successes,
    passed: successes >= roll.difficulty,
    triple: hasTriple(roll.dice)
  };
}
