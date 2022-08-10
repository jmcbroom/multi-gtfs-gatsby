export default {
  name: "journeyPartDestTime",
  title: "Journey Part Destination Time",
  type: "object",
  fields: [
    {
      name: "journeyPartDest",
      title: "The destination being arrived at",
      type: "reference",
      to: [{type: "destination"}],
      options: {
        disableNew: true
      }
    },
    {
      name: "journeyPartTime",
      title: "The time of arrival at the destination",
      type: "richDate",
      options: {
        inputDate: false,
        timeStep: 1,
      }
    }
  ],
  preview: {
    select: {
      destination: "journeyPartDest.name",
      time: "journeyPartTime",
    },
    prepare({ destination, time }) {
      return {
        // hacking together and 
        title: `${destination}: ${time}`,
      };
    },
  },
}