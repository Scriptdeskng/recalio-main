// One-time migration from old "quizflash_*" localStorage keys to "staysharp_*"
const KEY_MAP: [string, string][] = [
  ["quizflash_history", "staysharp_history"],
  ["quizflash_player_name", "staysharp_player_name"],
  ["quizflash_my_challenges", "staysharp_my_challenges"],
];

export function migrateLocalStorage() {
  for (const [oldKey, newKey] of KEY_MAP) {
    const oldVal = localStorage.getItem(oldKey);
    if (oldVal !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, oldVal);
    }
    localStorage.removeItem(oldKey);
  }
}
