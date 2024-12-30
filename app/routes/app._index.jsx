import { Text } from "@shopify/polaris";
import { useEffect } from "react";
import { authenticate } from "../shopify.server";
import { useDispatch } from "react-redux";
import { setProducts } from "../features/productsSlice";
import { updateRecursion } from "../helper/recursion";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  //============ env start ===========

  const baseUrl = process.env.BASE_URL;
  const acceptVersion = process.env.ACCEPT_VERSION;
  const encodedToken = process.env.ENCODED_TOKEN;

  //============ env end ===========

  // const {tableProductsNew} = await updateRecursion(admin, baseUrl, acceptVersion, encodedToken);
  const tableProductsNew = [];

  return {tableProductsNew};
};

export default function Index() {
  const dispatch = useDispatch();
  const {tableProductsNew}  = useLoaderData();
  dispatch(setProducts(tableProductsNew));
  
  useEffect(() => {
    shopify.loading(false);
  }, []);
  return (
    <Text variant="heading2xl" as="h2" alignment="center">
      C133 AP21 Integration
    </Text>
  );
}
