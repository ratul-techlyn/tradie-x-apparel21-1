import { useState, useCallback } from "react";
import { Card, Button, Toast } from "@shopify/polaris";
import { Link, useLocation } from "react-router-dom";

export default function CustomTabs() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(null);

  const tabs = [
    { id: "home", label: "Home", path: "/app" },
    { id: "settings", label: "Settings", path: "/app/settings" },
    { id: "products", label: "Product Management", path: "/app/products" },
    { id: "orders", label: "Order Management", path: "/app/orders" },
  ];

  return (
    <div style={{ marginBottom: "20px" }}>
      <Card padding="100">
        <div
          style={{
            display: "flex",
            gap: "20px",
            padding: "5px 10px",
          }}
        >
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              style={{
                color: "#5c5f62",
              }}
              onClick={() => {
                shopify.loading(true);
                setIsLoading(tab.id);
              }}
            >
              {location.pathname === tab.path ? (
                <Button>{tab.label}</Button>
              ) : (
                <Button variant="tertiary" loading={isLoading === tab.id}>
                  {tab.label}
                </Button>
              )}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
