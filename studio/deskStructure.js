import S from "@sanity/desk-tool/structure-builder";
import { FaBus, FaCity, FaLongArrowAltRight, FaMap } from "react-icons/fa";

export default () =>
  S.list()
    .title("Document types")
    .items([
      // Sitewide settings
      S.listItem().title("Agencies").icon(FaMap).child(S.documentTypeList("agency")),
      S.listItem()
        .title("Routes by Agency")
        .icon(FaBus)
        .child(
          S.documentTypeList("agency")
            .title("Routes by Agency")
            .child((agencyId) =>
              S.documentList()
                .title("Routes")
                .filter('_type == "route" && $agencyId == agency._ref')
                .params({ agencyId })
            )
        ),
      S.divider(),
      S.listItem().title("Destinations").icon(FaCity).child(S.documentTypeList("destination")),
      S.listItem()
        .title("Journey Parts")
        .icon(FaLongArrowAltRight)
        .child(S.documentTypeList("journeyPart")),
      S.divider(),
      S.listItem().title("Homepage content").child(
        S.editor().id("indexPage").schemaType("indexPage").title("Site content").documentId("index-page-content")
      ),
    ]);
