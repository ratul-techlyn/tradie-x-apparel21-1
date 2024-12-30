import { XMLParser, XMLBuilder } from "fast-xml-parser";

// create new user xml
export function createUserXml(user) {
  const addresses = user.addresses[0];
  const newUser = `<Person>
        ${user.firstName ? `<Firstname>${user.firstName}</Firstname>` : `<Firstname/>`}
        ${user.lastName ? `<Surname>${user.lastName}</Surname>` : `<Surname/>`}
        <IsAgent>false</IsAgent>
        <Addresses>
            <Billing>
                ${addresses.name ? `<ContactName>${addresses.name}</ContactName>` : `<ContactName/>`}
                ${addresses.address1 ? `<AddressLine1>${addresses.address1}</AddressLine1>` : `<AddressLine1/>`}
                ${addresses.address2 ? `<AddressLine2>${addresses.address2}</AddressLine2>` : `<AddressLine2/>`}
                ${addresses.city ? `<City>${addresses.city}</City>` : `<City/>`}
                ${addresses.province ? `<State>${addresses.province}</State>` : `<State/>`}
                ${addresses.zip ? `<Postcode>${addresses.zip}</Postcode>` : `<Postcode/>`}
                ${addresses.country ? `<Country>${addresses.country}</Country>` : `<Country/>`}
            </Billing>
        </Addresses>
        <Contacts>
            ${user.email ? `<Email>${user.email}</Email>` : `<Email/>`}
        </Contacts>
    </Person>`;

  return newUser;
}

// create new order xml
export function createOrderXml(order) {
  const billingAddress = order.billingAddress || {};
  const shippingAddress = order.shippingAddress || {};
  const shippingLine = order.shippingLines?.edges?.[0]?.node || {};
  const transaction = order.transactions?.[0] || {};
  const paymentDetails = transaction.paymentDetails || {};

  const priceField = "discountedUnitPriceAfterAllDiscountsSet"; // originalUnitPriceSet  discountedUnitPriceAfterAllDiscountsSet

  const shippingIdMap = {
    "Australia Post Standard": 861,
    "Toll VIC and TAS": 921,
    "Toll Interstate": 922,
    "Australia Post Express": 864,
    "Mail Express": 1281,
    "Australia Post PAR ATL": 1241,
    "Australia Post International": 1361,
  };

  const stateShortFormMap = {
    "Australian Capital Territory": "ACT",
    "New South Wales": "NSW",
    Victoria: "VIC",
    "South Australia": "SA",
    Tasmania: "TAS",
    Queensland: "QLD",
    "Western Australia": "WA",
    "Northern Territory": "NT",
  };

  const createTag = (value, tag) =>
    value ? `<${tag}>${value}</${tag}>` : `<${tag}/>`;

  const createAddressXml = (address) => `
    ${createTag(address.name, "ContactName")}
    ${createTag(address.company, "CompanyName")}
    ${createTag(address.address1, "AddressLine1")}
    ${createTag(address.address2, "AddressLine2")}
    ${createTag(address.city, "City")}
    ${createTag(stateShortFormMap[address.province] || address.province, "State")}
    ${createTag(address.zip, "Postcode")}
    ${createTag(address.country, "Country")}
  `;

  // Aggregate line item values
  const totalLineItemValue = (order.lineItems?.edges || [])
    .map((edge) => {
      const lineItem = edge?.node || {};
      const quantity = lineItem.quantity || 0;
      const price = parseFloat(lineItem[priceField]?.shopMoney?.amount || 0);
      return quantity * price;
    })
    .reduce((sum, value) => sum + value, 0);

  // Handle lineItems.edges safely
  const orderDetailsXml = (order.lineItems?.edges || [])
    .map((edge) => {
      const lineItem = edge?.node || {};
      return `
        <OrderDetail>
          ${createTag(lineItem.variant?.sku_id, "SkuId")}
          ${createTag(lineItem.quantity, "Quantity")}
          ${createTag(lineItem[priceField]?.shopMoney?.amount, "Price")}
          ${
            lineItem.quantity && lineItem[priceField]?.shopMoney?.amount
              ? `<Value>${(lineItem.quantity * lineItem[priceField].shopMoney.amount).toFixed(2)}</Value>`
              : `<Value/>`
          }
        </OrderDetail>`;
    })
    .join("");

  return `
    <Order>
      ${createTag(order.customerId, "PersonId")}
      ${createTag(order.name, "OrderNumber")}
      <Addresses>
        <Billing>${createAddressXml(billingAddress)}</Billing>
        <Delivery>${createAddressXml(shippingAddress)}</Delivery>
      </Addresses>
      <Contacts>
        ${createTag(order.customer?.email, "Email")}
        ${createTag(order.customer?.phone, "Phones")}
      </Contacts>
      <OrderDetails>${orderDetailsXml}</OrderDetails>
      <SelectedFreightOption>
        ${createTag(shippingIdMap[shippingLine.title], "Id")}
        ${createTag(shippingLine.title, "Name")}
        ${createTag(order.totalShippingPriceSet?.shopMoney?.amount, "Value")}
      </SelectedFreightOption>
      <Payments>
        <PaymentDetail>
          <Origin>CreditCard</Origin>
          <CardType>PAYPAL</CardType>
          <MerchantId>PAYPAL01</MerchantId>
          <Stan/>
          <Reference/>
          <Amount>${
            parseFloat(order.totalShippingPriceSet?.shopMoney?.amount || 0) +
            totalLineItemValue
          }</Amount>
        </PaymentDetail>
      </Payments>
    </Order>`;
}
