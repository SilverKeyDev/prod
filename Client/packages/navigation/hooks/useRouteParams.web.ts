/**
 * Web: path params from react-router (only module outside navigation that imports useParams).
 */

import { useParams } from "react-router-dom";

export function useRouteParams<
  T extends Partial<Record<string, string | undefined>>,
>(): T {
  return useParams() as T;
}
