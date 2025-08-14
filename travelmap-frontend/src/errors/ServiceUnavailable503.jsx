import React from "react";
import ErrorPage from "./ErrorPage";
export default function ServiceUnavailable503() {
  return <ErrorPage code={503} hint="Le service est en maintenance ou surchargé." />;
}
