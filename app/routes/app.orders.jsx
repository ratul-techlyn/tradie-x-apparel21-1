import axios from "axios";
import Orders from "../components/orders";
import { XMLParser } from "fast-xml-parser";
import { authenticate } from "../shopify.server";
import { executeGraphQL } from "../graphql/graphql";
import { getAllOrdersQuery, getAllProductsQuery, updateOrderMutation } from "../graphql/query";
import {
  filterOrderIdAndCustomer,
  filterAndPushNewEmails,
  filterWereHouseUsersIdAndEmail,
  filterShopOrdersWithCustomerId,
  transformShopProductData,
  filterProductsByBarcode,
  filterShopOrdersByTableProducts,
  filterShippedOrders
} from "../helper/helper";
import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { createUserXml, createOrderXml } from "../helper/xmlFormate";

// loader =======
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // env
  const baseUrl = process.env.BASE_URL;
  const acceptVersion = process.env.ACCEPT_VERSION;
  const encodedToken = process.env.ENCODED_TOKEN;
  const CountryCode = "AU";

  // get shop orders
  let ordersArray = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    try {
      const response = await executeGraphQL(admin, getAllOrdersQuery, {
        after: cursor,
      });
      const ordersData = response.orders;

      // Extract orders from the response
      ordersArray = ordersArray.concat(
        ordersData.edges.map((edge) => edge.node),
      );

      // Update pagination info
      hasNextPage = ordersData.pageInfo.hasNextPage;
      cursor = ordersData.pageInfo.endCursor;
    } catch (error) {
      console.error("Error fetching orders:", error.message);
      break;
    }
  }

  const shopOrderArray = ordersArray;

  // get shop products
  let productArray = [];
  let productArrayhasNextPage = true;
  let productArraycursor = null;

  while (productArrayhasNextPage) {
    try {
      const response = await executeGraphQL(admin, getAllProductsQuery, {
        after: productArraycursor,
      });
      const productsData = response.products;

      // Extract products from the response
      productArray = productArray.concat(
        productsData.edges.map((edge) => edge.node),
      );

      // Update pagination info
      productArrayhasNextPage = productsData.pageInfo.hasNextPage;
      productArraycursor = productsData.pageInfo.endCursor;
    } catch (error) {
      console.error("Error fetching products:", error.message);
      break;
    }
  }

  const shopProductArray = transformShopProductData(productArray);

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

  // get backend products end


  const orderVariables = {
    input: {
      id: "gid://shopify/Order/5524330840108",
    },
  };
  
  // const adjustmentResponse = await executeGraphQL(
  //   admin,
  //   updateOrderMutation,
  //   orderVariables,
  // );


  // console.log("adjustmentResponse", adjustmentResponse);
  

  // get backend users start

  let getUsersConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${baseUrl}/Persons?countryCode=${CountryCode}`,
    headers: {
      Accept: `Version_${acceptVersion}`,
      Authorization: `Basic ${encodedToken}`,
    },
  };

  const usersXml = await axios
    .request(getUsersConfig)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    });

  // get backend users end

  // get backend orders start

  let getOrdersConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${baseUrl}/Orders/?countryCode=${CountryCode}&UpdatedAfter=2024-05-01T09:40:00`,
    headers: {
      Accept: `Version_${acceptVersion}`,
      Authorization: `Basic ${encodedToken}`,
    },
  };

  const ordersXml = await axios
    .request(getOrdersConfig)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
    });

  // get backend orders end

  // const ordersXml = "";

  return {
    ordersXml,
    usersXml,
    shopOrderArray,
    productsXml,
    shopProductArray,
  };
};

// action =======
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const method = request.method;

  // env
  const baseUrl = process.env.BASE_URL;
  const acceptVersion = process.env.ACCEPT_VERSION;
  const encodedToken = process.env.ENCODED_TOKEN;
  const CountryCode = "AU";

  switch (method) {
    case "POST": {
      const formCreateData = new URLSearchParams(await request.text());
      const payloadJson = formCreateData.get("orderData");
      const { newOrders } = JSON.parse(payloadJson);

      async function createNewOrders(newOrders) {
        for (const order of newOrders) {
          const orderXml = createOrderXml(order);

          // console.log(orderXml);

          try {
            const response = await axios.request({
              method: "post",
              maxBodyLength: Infinity,
              url: `${baseUrl}/Persons/${order.customerId}/Orders/?countryCode=${CountryCode}`,
              headers: {
                "Content-Type": "text/xml",
                Accept: `Version_${acceptVersion}`,
                Authorization: `Basic ${encodedToken}`,
              },
              data: orderXml,
            });

            console.log("Order created:", order.customerId);
          } catch (error) {
            const message = error.status == 400 ? "Order already created" : "Error Creating order: " + error.message;
            console.error(message);
          }
        }
      }

      await createNewOrders(newOrders);
    }

    default:
      return new Response("Method not allowed", { status: 405 });
  }
};

export default function ordersPage() {
  const fetcher = useFetcher();
  const parser = new XMLParser();

  const { ordersXml, usersXml, shopOrderArray, productsXml, shopProductArray } =
    useLoaderData();

  const [productsJson, setProductsJson] = useState(
    parser.parse(`${productsXml}`),
  );
  const [usersJson, setUsersJson] = useState(parser.parse(`${usersXml}`));
  const [ordersJson, setOrdersJson] = useState(parser.parse(`${ordersXml}`));
  const [tableOrders, setTabledOrders] = useState(shopOrderArray);

  useEffect(() => {
    const wereHouseProducts = productsJson?.Products?.Product || [];
    const werehouseUsers = usersJson?.Persons?.Person || [];
    const werehouseOrders = ordersJson.Orders.Order || [];
    const shopUsers = filterOrderIdAndCustomer(shopOrderArray);
    const newShopUsers = filterAndPushNewEmails(shopUsers, werehouseUsers);

    const { tableProductsNew } = filterProductsByBarcode(
      wereHouseProducts,
      shopProductArray,
    );

    const filterdShopOrders = filterShopOrdersByTableProducts(
      shopOrderArray,
      tableProductsNew,
    );

    const newOrders = filterShopOrdersWithCustomerId(
      filterdShopOrders,
      werehouseUsers,
    );

    const createNewUsers = async (newOrders) => {
      // Prepare the data payload
      const payload = {
        newOrders
      };

      // Use the given function to send the data
      await fetcher.submit(
        {
          orderData: JSON.stringify(payload),
        },
        { method: "post" },
      );
    };

    createNewUsers(newOrders);

    const shippedOrders = filterShippedOrders(werehouseOrders);

    // console.log("shopProductArray", shopProductArray);
    // console.log("werehouseUsers", werehouseUsers);
    // console.log("filterdShopOrders", filterdShopOrders);
    console.log("shippedOrders", shippedOrders);

    shopify.loading(false);
  }, []);

  return <Orders tableOrders={tableOrders} />;
}
