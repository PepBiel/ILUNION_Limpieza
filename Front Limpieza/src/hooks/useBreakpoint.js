import { useEffect, useState } from "react";

export function useBreakpoint(maxWidth) {
  const getValue = () =>
    typeof window !== "undefined" ? window.innerWidth <= maxWidth : false;

  const [matches, setMatches] = useState(getValue);

  useEffect(() => {
    const onResize = () => setMatches(getValue());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [maxWidth]);

  return matches;
}
