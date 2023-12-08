import { FaBus, FaCity, FaLongArrowAltRight, FaMap, FaBiking } from "react-icons/fa";

export default S =>
  S.list()
    .title("Transit site")
    .items([
      // Sitewide settings
      S.listItem().title("Transit agencies").icon(FaMap).child(S.documentTypeList("agency")),
      S.listItem()
        .title("Routes by agency")
        .icon(FaBus)
        .child(
          S.documentTypeList("agency")
            .title("Routes by agency")
            .child((agencyId) =>
              S.documentList()
                .title("Routes")
                .filter('_type == "route" && $agencyId == agency._ref')
                .params({ agencyId })
                .defaultOrdering([{field: 'mapPriority', direction: 'asc'}, {field: "shortName", direction: "asc"}])
            )
        ),
      S.divider(),
      S.listItem()
        .title("Bikeshare systems")
        .icon(FaBiking)
        .child(S.documentTypeList("bikeshare")),
      S.divider(),
      // S.listItem().title("Destinations").icon(FaCity).child(S.documentTypeList("destination")),
      // S.listItem()
      //   .title("Journey Parts")
      //   .icon(FaLongArrowAltRight)
      //   .child(S.documentTypeList("journeyPart")),
      // S.divider(),
      S.listItem().title("Homepage content").child(
        S.editor().id("indexPage").schemaType("indexPage").title("Site content").documentId("index-page-content")
      ),
    ]);
