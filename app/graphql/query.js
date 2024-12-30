// get all products
export const getAllProductsQuery = `
query GetAllProducts($after: String) {
  products(first: 250, after: $after) {
    edges {
      node {
        id
        title
        variants(first: 100) {
          edges {
            node {
              title
              price
              sku
              barcode
              updatedAt
              compareAtPrice
              inventoryQuantity
              inventoryItem {
                id
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

// get 250 products query
export const getProductsQuery = `#graphql
query {
  products(first: 250) {
    edges {
      node {
        id
        title
        variants(first: 100) {
          edges {
            node {
              title
              price
              compareAtPrice
              sku
              barcode
              inventoryQuantity
              selectedOptions {
                name
                value
              }
              inventoryItem {
                id
              }
            }
          }
        }
      }
    }
  }
}`;

// get all orders
export const getAllOrdersQuery = `#graphql
query GetAllOrders($after: String) {
  orders(first: 250, after: $after) {
    edges {
      node {
        id
        name
        createdAt
        displayFulfillmentStatus
        fullyPaid
        customer {
          id
          firstName
          lastName
          email
          phone
          addresses {
            name
            company
            address1
            address2
            city
            province
            zip
            country
          }
        }
        totalPriceSet{
          shopMoney {
            amount
            currencyCode
          }
        }
        currentTotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalShippingPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        shippingAddress {
          name
          company
          address1
          address2
          city
          province
          zip
          country
        }
        billingAddress {
          name
          company
          address1
          address2
          city
          province
          zip
          country
        }
        lineItems(first: 250) {
          edges {
            node {
              id
              title
              quantity
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              discountedUnitPriceAfterAllDiscountsSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              variant {
                id
                sku
                title
                barcode
              }
            }
          }
        }
        paymentGatewayNames
        paymentTerms {
          id
          paymentTermsName
          paymentTermsType
        }
        transactions {
          id
          amountSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          paymentDetails {
            ... on CardPaymentDetails {
              name
              company
              paymentMethodName
            }
          }
        }
        shippingLines (first: 1) {
          edges {
            node {
              title
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

// get order details
export const getOrderQuery = `#graphql
  query getOrder($id: ID!){
    order(id: $id) {
      id
      customer {
        id
        addresses {
          city
          country
        }
      }
      currentTotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      currentTotalWeight
      lineItems(first: 100) {
        edges {
          node {
            id
            quantity
            originalUnitPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            product {
              id
              title
              variants(first: 100) {
                edges {
                  node {
                    title
                    price
                    compareAtPrice
                    sku
                    barcode
                    inventoryQuantity
                    selectedOptions {
                      name
                      value
                    }
                    inventoryItem {
                      id
                    }
                  }
                }
              }
            }
            variant {
              id
              barcode
              sku
            }
          }
        }
      }
    }
  }
`;

// get inventory
export const getInventoryQuery = `#graphql
  query getInventoryItem($id: ID!) {
    inventoryItem(id: $id) {
      id
      inventoryLevels(first: 10) {
        edges {
          node {
            location {
              id
            }
          }
        }
      }
    }
  }
`;

// update inventory
export const inventoryUpdateMutation = `#graphql
  mutation adjustInventory($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;


// update order
export const updateOrderMutation = `#graphql
  mutation OrderOpen($input: OrderInput!) {
    orderOpen(input: $input) {
      order {
        canMarkAsPaid
        confirmed
      }
      userErrors {
        message
        field
      }
    }
  }
`;
