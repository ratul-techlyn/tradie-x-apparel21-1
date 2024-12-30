import React from "react";
import { useNavigate } from "@remix-run/react";
import { FullscreenBar, Text } from "@shopify/polaris";

export default function Topbar() {
  const navigate = useNavigate();

  const handleActionClick = () => {
    navigate("/");
  };
  
  return (
    <FullscreenBar onAction={handleActionClick}>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        }}
      >
        <div style={{ marginLeft: "1rem", flexGrow: 1 }}>
          <Text variant="headingSm" as="p">
            Page title
          </Text>
        </div>
      </div>
    </FullscreenBar>
  );
}
