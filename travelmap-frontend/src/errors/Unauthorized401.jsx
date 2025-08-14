import React from "react";
import ErrorPage from "./ErrorPage";
export default function Unauthorized401() {
  return <ErrorPage code={401} hint="Connectez-vous pour accéder à cette page." />;
}
