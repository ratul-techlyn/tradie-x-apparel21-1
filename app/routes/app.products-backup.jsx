import Products from "../components/products";
import { useEffect } from "react";
import { useSelector } from 'react-redux';


export default function productsPage() {
  const products = useSelector((state) => state.products);

  useEffect(() => {
    shopify.loading(false);
  }, []);
  return <Products tableProducts={products.data} />;
}
