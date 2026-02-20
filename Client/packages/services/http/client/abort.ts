export function createAbortManager() {
  const controllers = new Set<AbortController>();

  const abortAll = () => {
    controllers.forEach((controller) => controller.abort());
    controllers.clear();
  };

  const withAbort = async <T>(
    fn: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> => {
    const controller = new AbortController();
    controllers.add(controller);
    try {
      return await fn(controller.signal);
    } finally {
      controllers.delete(controller);
    }
  };

  return { abortAll, withAbort };
}
