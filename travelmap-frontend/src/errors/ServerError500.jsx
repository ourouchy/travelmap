import React from "react";
import ErrorPage from "./ErrorPage";
export default function ServerError500() {
  return (
    <ErrorPage
      code={500}
      hint="Un souci côté serveur. Réessayez plus tard."
      showBack={false}
    />
  );
}
