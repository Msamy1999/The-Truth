import type { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";
import { userRole } from "../access/editorial";

/** Only owners may create or modify a record in the published state. */
export const enforceEditorialRole: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  req,
}) => {
  const touchesPublishedRecord =
    data?.status === "published" || originalDoc?.status === "published";
  if (touchesPublishedRecord && userRole(req.user) !== "owner") {
    throw new APIError(
      "Only an owner can publish or modify published content.",
      403,
    );
  }
  return data;
};
