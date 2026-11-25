import { createContext as createReactContext, useContext } from "react";
import { createContext } from "react-router";

/** The per-request CSP nonce, set by the root middleware and read by the server entry. */
export const nonceContext = createContext<string>("");

/** Lets the document shell put the nonce on its scripts during the server render. */
export const NonceContext = createReactContext<string | undefined>(undefined);

export const useNonce = () => useContext(NonceContext);
