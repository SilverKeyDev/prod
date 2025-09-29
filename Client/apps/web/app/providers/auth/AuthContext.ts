import { createContext } from "react";

import type { AuthContextType } from "./AuthContext.utils";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
