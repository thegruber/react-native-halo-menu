/**
 * @file callbacks.ts
 * @description Small guards for optional integration callbacks such as haptics.
 */

export type OptionalCallback = () => void | Promise<void>;

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "unknown error";
}

function isPromiseLike(value: unknown): value is PromiseLike<void> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export function callOptionalCallback(
  name: string,
  callback: OptionalCallback | undefined,
  onWarn: (message: string) => void,
  warnedNames: Set<string>,
) {
  if (!callback) return;

  const warnOnce = (error: unknown) => {
    if (warnedNames.has(name)) return;
    warnedNames.add(name);
    onWarn(`${name} callback failed: ${formatError(error)}`);
  };

  try {
    const result = callback();
    if (isPromiseLike(result)) {
      void Promise.resolve(result).catch(warnOnce);
    }
  } catch (error) {
    warnOnce(error);
  }
}
