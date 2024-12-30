import axios from "axios";
import { executeGraphQL } from "../graphql/graphql";
import {
  getAllProductsQuery,
  getInventoryQuery,
  inventoryUpdateMutation,
} from "../graphql/query";
import { transformShopProductData, filterProductsByBarcode } from "./helper";
import { XMLParser } from "fast-xml-parser";

// recursion function

export async function updateRecursion(
  admin,
  baseUrl,
  acceptVersion,
  encodedToken,
) {
  let response = await mainFunction(
    admin,
    baseUrl,
    acceptVersion,
    encodedToken,
  );

  // setInterval((admin, baseUrl, acceptVersion, encodedToken) => {
  //   (async (admin, baseUrl, acceptVersion, encodedToken) => {
  //     try {
  //       const response = await mainFunction(
  //         admin,
  //         baseUrl,
  //         acceptVersion,
  //         encodedToken,
  //       );
  //       console.log(response);
  //     } catch (error) {
  //       console.error('Error during mainFunction execution:', error);
  //     }
  //   })(admin, baseUrl, acceptVersion, encodedToken);
  // }, 600000);

  return response;
}

// main function
async function mainFunction(admin, baseUrl, acceptVersion, encodedToken) {
  //======== get shop all products start======

  let productArray = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    try {
      const response = await executeGraphQL(admin, getAllProductsQuery, {
        after: cursor,
      });
      const productsData = response.products;

      // Extract products from the response
      productArray = productArray.concat(
        productsData.edges.map((edge) => edge.node),
      );

      // Update pagination info
      hasNextPage = productsData.pageInfo.hasNextPage;
      cursor = productsData.pageInfo.endCursor;
    } catch (error) {
      console.error("Error fetching products:", error.message);
      break;
    }
  }

  const shopProductArray = transformShopProductData(productArray);

  //========= get shop all products end========

  //========= get werehouse all products start========
  const productsXml = await getProducts(
    "AU",
    baseUrl,
    acceptVersion,
    encodedToken,
  );

  const parser = new XMLParser();
  const productsJson = parser.parse(`${productsXml}`);
  const wereHouseProducts = productsJson?.Products?.Product || [];
  const { tableProductsNew, inventoryUpdates } = filterProductsByBarcode(
    wereHouseProducts,
    shopProductArray,
  );

  //========= get werehouse all products end==========

  //========= update werehouse products start=========
  updateInventoryQuantity(admin, shopProductArray, inventoryUpdates);

  //========= update werehouse products end===========

  // console

  console.log("Successfull");
  return { tableProductsNew };
}

/*=====================================
========== helper functions============
=====================================*/

// fetch werehouse products function
async function getProducts(CountryCode, baseUrl, acceptVersion, encodedToken) {
  let getProductsConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${baseUrl}/products?countryCode=${CountryCode}&updatedAfter=2024-05-01T00:00:00`, // &updatedAfter=2024-03-01T00:00:00 // &updatedAfter=2024-07-01T00:00:00&updatedBefore=2024-07-01T00:00:00
    headers: {
      Accept: `Version_${acceptVersion}`,
      Authorization: `Basic ${encodedToken}`,
    },
  };

  const productsXml = await axios
    .request(getProductsConfig)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    });

  return productsXml;
}

// update shop products function
function updateInventoryQuantity(admin, shopProductArray, inventoryUpdates) {
  async function update(admin, shopProductArray, inventoryUpdates) {
    try {
      for (const update of inventoryUpdates) {
        const { barcode, quantity } = update;

        // Find the matching product and variant using the barcode
        const product = shopProductArray.find((product) =>
          product.variants.some((variant) => variant.barcode === barcode),
        );

        if (!product) {
          console.error(`Product with barcode ${barcode} not found.`);
          continue;
        }

        const variant = product.variants.find(
          (variant) => variant.barcode === barcode,
        );

        if (!variant) {
          console.error(`Variant with barcode ${barcode} not found.`);
          continue;
        }

        try {
          const { inventoryItem } = await executeGraphQL(
            admin,
            getInventoryQuery,
            { id: variant.inventoryItem.id },
          );

          if (!inventoryItem || !inventoryItem.inventoryLevels.edges.length) {
            console.error(`No inventory levels found for variant ${barcode}`);
            continue;
          }

          const location_id =
            inventoryItem.inventoryLevels.edges[0].node.location.id;

          // Perform inventory update
          const inventoryVariables = {
            input: {
              reason: "correction",
              name: "available",
              changes: [
                {
                  inventoryItemId: variant.inventoryItem.id,
                  delta: quantity - variant.inventoryQuantity,
                  locationId: location_id,
                },
              ],
            },
          };

          const adjustmentResponse = await executeGraphQL(
            admin,
            inventoryUpdateMutation,
            inventoryVariables,
          );

          const adjustment = adjustmentResponse.inventoryAdjustQuantities;

          if (adjustment.userErrors.length) {
            console.error(
              `Error adjusting inventory for barcode ${barcode}:`,
              adjustment.userErrors,
            );
            continue;
          }

          console.log(
            `Updated inventory for barcode ${barcode} to quantity ${quantity}`,
          );
        } catch (error) {
          console.error(
            `Error updating inventory for barcode ${barcode}:`,
            error.message,
          );
        }
      }
    } catch (error) {
      console.error("Error updating inventory:", error.message);
    }
  }
  update(admin, shopProductArray, inventoryUpdates);
}
