import {
  Form,
  FormLayout,
  Select,
  TextField,
  Button,
  Text,
  Card,
} from "@shopify/polaris";
import { useState, useEffect } from "react";

export default function Settings() {
  //Mode
  const [selectedMode, setSelectedMode] = useState("today");

  const handleSelectModeChange = (value) => setSelectedMode(value);

  const modeOptions = [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
  ];

  //Name
  const [name, setName] = useState("");
  const handleNameChange = (value) => setName(value);

  //Password
  const [password, setPassword] = useState("");
  const handlePasswordChange = (value) => setPassword(value);

  //Store
  const [selectedStore, setSelectedStore] = useState("today");

  const handleSelectStoreChange = (value) => setSelectedStore(value);

  const storeOptions = [
    { label: "Retail", value: "retail" },
    { label: "Wholesale", value: "wholesale" },
  ];

  //StoreId
  const [storeId, setStoreId] = useState("");
  const handleStoreIdChange = (value) => setStoreId(value);

  // country code
  const [selectedCountryCode, setSelectedCountryCode] = useState("AU");
  const handleSelectedCountryCodeChange = (value) =>
    setSelectedCountryCode(value);

  const countryCodeOptions = [
    { label: "AU", value: "AU" },
    { label: "US", value: "US" },
    { label: "UK", value: "UK" },
  ];

  //submit

  const handleSubmit = () => {
    let formData = {
      selectedMode,
      name,
      password,
      selectedStore,
      storeId,
      selectedCountryCode,
    };

    localStorage.setItem("country-code", selectedCountryCode);
    console.log("submit : ", formData);
  };
  
  useEffect(() => {
    shopify.loading(false);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "auto" }}>
      <Card title="settings-card">
        <div style={{ marginBottom: "20px" }}>
          <Text variant="headingXl" as="h2" paddingBottom="400">
            Settings
          </Text>
        </div>

        {/* form */}
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <Select
              label="SandBox Mode"
              options={modeOptions}
              onChange={handleSelectModeChange}
              value={selectedMode}
            />

            <TextField
              value={name}
              onChange={handleNameChange}
              label="Name"
              type="text"
            />

            <TextField
              value={password}
              onChange={handlePasswordChange}
              label="Password"
              type="password"
            />

            <Select
              label="Store"
              options={storeOptions}
              onChange={handleSelectStoreChange}
              value={selectedStore}
            />

            <TextField
              value={storeId}
              onChange={handleStoreIdChange}
              label="Store Id"
              type="number"
            />

            <Select
              label="Country code"
              options={countryCodeOptions}
              onChange={handleSelectedCountryCodeChange}
              value={selectedCountryCode}
            />

            <Button variant="primary" submit>
              Submit
            </Button>
          </FormLayout>
        </Form>
      </Card>
    </div>
  );
}
