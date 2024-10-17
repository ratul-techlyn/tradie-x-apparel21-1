import { useState, useCallback, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Page, Tabs, Card } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import Home from "../components/home";
import Settings from "../components/settings";
import Products from "../components/products";
import Orders from "../components/orders";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { createDate } from "../helper/helper";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // env
  const baseUrl = process.env.BASE_URL;
  const CountryCode = process.env.COUNTRY_CODE;
  const acceptVersion = process.env.ACCEPT_VERSION;
  const encodedToken = process.env.ENCODED_TOKEN;

  let getProductsConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${baseUrl}/ProductsSimple?countryCode=${CountryCode}`,
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

  let getOrdersConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: `${baseUrl}/Orders/?countryCode=${CountryCode}&UpdatedAfter=2023-02-07T09:40:00`,
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

  return json({ productsXml, ordersXml });
};

export const action = async ({ request }) => {
  return json({});
};

export default function Index() {
  const { productsXml, ordersXml } = useLoaderData();

  const parser = new XMLParser();

  // products
  const [productsJson, setProductsJson] = useState(
    parser.parse(`${productsXml}`),
  );
  const [filterdProducts, setFilterdProducts] = useState([]);

  // orders
  const [ordersJson, setOrdersJson] = useState(parser.parse(`${ordersXml}`));
  const [filterdOrders, setFilterdOrders] = useState([]);

  // tabs
  const tabs = [
    {
      id: "home",
      content: "Home",
      panelID: "home",
    },
    {
      id: "settings",
      content: "Settings",
      panelID: "settings",
    },
    {
      id: "product-management",
      content: "Product Management",
      panelID: "product-management",
    },
    {
      id: "order-management",
      content: "Order Management",
      panelID: "order-management",
    },
  ];

  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelected(selectedTabIndex),
    [],
  );

  useEffect(() => {
    let newProducts = [];
    let newOrders = [];

    productsJson.ProductsSimple.ProductSimple.forEach((product) => {
      newProducts.push({
        id: product.Id,
        variantId: product.Code,
        name: product.Name,
        barcode: "undefined",
        sku: "undefined",
      });
    });

    ordersJson.Orders.Order.forEach((order) => {
      newOrders.push({
        orderNumber: JSON.stringify(order.OrderNumber),
        orderId: JSON.stringify(order.Id),
        shipToName: order.Addresses.Delivery.ContactName,
        billToName: order.Addresses.Billing.ContactName,
        orderStatus: "Paid",
        ap21Status: "Success",
        createdAt: createDate(order.OrderDateTime),
      });
    });

    setFilterdProducts(newProducts);
    setFilterdOrders(newOrders);
  }, []);

  return (
    <Page>
      <Card padding="100">
        <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}></Tabs>
      </Card>

      <div style={{ marginTop: "20px" }}>
        {selected == 0 ? <Home /> : null}
        {selected == 1 ? <Settings /> : null}
        {selected == 2 ? <Products allProducts={filterdProducts} /> : null}
        {selected == 3 ? <Orders allOrders={filterdOrders} /> : null}
      </div>
    </Page>
  );
}
