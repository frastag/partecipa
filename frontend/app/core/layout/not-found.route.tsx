import { data } from "react-router";

/** Every URL no other route matches: the root error boundary renders the 404 page. */
export function loader() {
  throw data(null, { status: 404 });
}

export default function NotFound() {
  return null;
}
