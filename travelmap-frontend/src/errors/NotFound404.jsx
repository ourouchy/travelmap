import React from "react";
import ErrorPage from "./ErrorPage";
export default function NotFound404() {
  return <ErrorPage code={404} hint="Vérifiez l’URL ou utilisez la recherche." />;
}
