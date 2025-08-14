import React from "react";
import ErrorPage from "./ErrorPage";
export default function Forbidden403() {
  return <ErrorPage code={403} hint="Vous n’avez pas les droits nécessaires." />;
}
