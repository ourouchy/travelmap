import React from "react";
import ErrorPage from "./ErrorPage";
export default function BadRequest400() {
  return <ErrorPage code={400} hint="La requête semble invalide." />;
}
