export default {
  name: "fareAttribute",
  title: "Fare type details",
  type: "document",
  fields: [
    {
      name: "price",
      title: "Price",
      description: "The regular cost of the fare",
      type: "number",
    },
    {
      name: "currencyType",
      title: "Currency code",
      description: "Type of currency used to pay the fare",
      type: "string",
    },
    {
      name: "transfers",
      title: "Number of transfers",
      description: "The number of times a transfer ticket can be used before it's exhausted. Leave blank for unlimited uses",
      type: "number"
    },
    {
      name: "transferDuration",
      title: "Transfer duration",
      description: "The time in seconds that a transfer ticket is valid for. Set to 0 for unlimited duration",
      type: "number"
    }
  ],
  preview: {
    select: {
      price: "price",
      currencyType: "currencyType",
    },
    prepare({ price, currencyType }) {
      return {
        title: `${price} ${currencyType}`,
      };
    },
  },
};
