import S from "@sanity/desk-tool/structure-builder";
import { FaBus, FaCity, FaMap } from "react-icons/fa";

export default () =>
  S.list()
    .title("Document types")
    .items([
      // Sitewide settings
      S.listItem().title("Agencies").icon(FaMap).child(S.documentTypeList("agency")),
      S.listItem().title("Routes").icon(FaBus).child(S.documentTypeList("route")),
      S.divider(),
      S.listItem().title("Destinations").icon(FaCity).child(S.documentTypeList("destination")),
    ]);
