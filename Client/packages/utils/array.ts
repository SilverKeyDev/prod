/**
 * Utility functions for array comparison and state management
 */

export type Identifiable = {
  id?: string;
  mlsId?: string;
  zpid?: string | number;
  address?: string;
};

/**
 * Compare two arrays of objects by their IDs to check if they represent the same data
 * @param a - First array
 * @param b - Second array
 * @returns true if arrays have same length and same IDs in same order
 */
export function sameIds<T extends Identifiable>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    const idA =
      a[i].id || a[i].mlsId || String(a[i].zpid || "") || a[i].address;
    const idB =
      b[i].id || b[i].mlsId || String(b[i].zpid || "") || b[i].address;
    if (idA !== idB) return false;
  }

  return true;
}

/**
 * Create a state setter that only updates if the new value is actually different
 * @param setter - The state setter function
 * @returns A guarded setter that prevents redundant updates
 */
export function createGuardedSetter<T extends Identifiable>(
  setter: React.Dispatch<React.SetStateAction<T[]>>,
) {
  return (newValue: T[] | ((prev: T[]) => T[])) => {
    setter((prev) => {
      const next = typeof newValue === "function" ? newValue(prev) : newValue;
      return sameIds(prev, next) ? prev : next;
    });
  };
}
