import axios from "axios";
import Products from "../components/products";
import { XMLParser } from "fast-xml-parser";
import { dummyXml } from "../helper/dumyXml";
import { authenticate } from "../shopify.server";
import { executeGraphQL } from "../graphql/graphql";
import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  getAllProductsQuery,
  getInventoryQuery,
  inventoryUpdateMutation,
} from "../graphql/query";
import {
  filterProductsByBarcode,
  transformShopProductData,
} from "../helper/helper";

// loader =======
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

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

  // env
  const baseUrl = process.env.BASE_URL;
  const acceptVersion = process.env.ACCEPT_VERSION;
  const encodedToken = process.env.ENCODED_TOKEN;

  // get backend products start
  async function getProducts(CountryCode) {
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

  const productsXml = await getProducts("AU");
  // const productsXml = dummyXml();

  // get backend products end

  return { productsXml, shopProductArray };
};

// action =======
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const method = request.method;

  switch (method) {
    case "POST": {
      const formCreateData = new URLSearchParams(await request.text());
      const payloadJson = formCreateData.get("products");
      const { shopProductArray, inventoryUpdates } = JSON.parse(payloadJson);

      async function updateInventoryQuantity(
        shopProductArray,
        inventoryUpdates,
      ) {
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

              if (
                !inventoryItem ||
                !inventoryItem.inventoryLevels.edges.length
              ) {
                console.error(
                  `No inventory levels found for variant ${barcode}`,
                );
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

      await updateInventoryQuantity(shopProductArray, inventoryUpdates);

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    default:
      return new Response("Method not allowed", { status: 405 });
  }
};

export default function productsPage() {
  const { productsXml, shopProductArray } = useLoaderData();
  const fetcher = useFetcher();
  const parser = new XMLParser();

  const [productsJson, setProductsJson] = useState(
    parser.parse(`${productsXml}`),
  );

  const [tableProducts, setTableProducts] = useState([]);

  useEffect(() => {
    // filter backend products
    let wereHouseProducts = productsJson?.Products?.Product || [];

    const { tableProductsNew, inventoryUpdates } = filterProductsByBarcode(
      wereHouseProducts,
      shopProductArray,
    );

    const sendInventoryData = async (shopProductArray, inventoryUpdates) => {
      // Prepare the data payload
      const payload = {
        shopProductArray,
        inventoryUpdates,
      };

      // Use the given function to send the data
      await fetcher.submit(
        {
          products: JSON.stringify(payload),
        },
        { method: "post" },
      );
    };

    sendInventoryData(shopProductArray, inventoryUpdates);
    setTableProducts(tableProductsNew);
    console.log("tableProductsNew", tableProductsNew);
    shopify.loading(false);
  }, []);

  return <Products tableProducts={tableProducts} />;
}
