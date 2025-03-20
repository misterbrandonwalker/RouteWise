import React, { useState, useContext } from "react";
import {
  Form,
  Input,
  Button,
  Alert,
  Typography,
} from "antd";
import { MainContext } from "../../contexts/MainContext";
import { mapReactionDataToGraph, mapGraphDataToCytoscape } from "../../helpers/commonHelpers";

const { Text } = Typography;

const ReactionSearch = () => {
  const [formData, setFormData] = useState({
    rxid: "",
  });
  const {
    setAicpGraph,
    appSettings,
    updateCytoscapeGraph,
    setSelectedEntity,
    setPreviewEntity,
  } = useContext(MainContext);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  const showModal = () => {
    setIsModalVisible(true);
    setSelectedEntity(null);
    setPreviewEntity(null);
  };

  const handleRxidChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      ['rxid']: value,
    }));
    setIsSubmitDisabled(!value);
  }

  const handleSubmit = (e) => {
    console.log('submit detected');
    console.log(formData);
    setFormData(formData);
    fetchReactionInformation(formData);
  };

  const fetchReactionInformation = async (inputForm) => {
    setResponse(null);
    setLoading(true);
    setErrorMessage("");
    setAlertVisible(false);
    try {
      const response = await fetch(
        appSettings.apiUrl + "/api/v1/knowledge_base/reactions/" + inputForm.rxid + "?retrieve_components=true",
        {
          method: "GET"
        }
      );

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error: ${response.status}. ${errorBody.detail}`);
      }

      const data = await response.json();

      if (!data["rxid"]) {
        setErrorMessage("No reaction found in response");
        setAlertVisible(true);
      } else {
        
        setResponse(JSON.stringify(data, null, 2));
        const rawGraph = mapReactionDataToGraph(data);
        setAicpGraph(rawGraph);
        const mappedGraph = mapGraphDataToCytoscape(rawGraph);
        updateCytoscapeGraph(mappedGraph);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div>
      {alertVisible && (
        <Alert
          message={errorMessage}
          type="error"
          showIcon
          closable
          onClose={() => setAlertVisible(false)}
          style={{
            position: "fixed",
            top: "70px", // Adjust this value based on your header height
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: "80%", // Adjust this value based on your preference
          }}
        />
      )}
      <Form
        layout="inline"
        onFinish={handleSubmit}
        style={{ display: "flex", alignItems: "center" }}
      >
        <Text style={{ marginRight: "10px" }}>Search for a reaction by RXID:</Text>
        <Form.Item style={{ marginRight: "10px" }}>
          <Input
            name="rxidField"
            placeholder="Reaction ID (RXID)"
            onChange={handleRxidChange}
            style={{ width: "400px" }}
          />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          disabled={isSubmitDisabled}
          loading={loading}
          style={{ marginRight: "10px" }}
        >
          Submit
        </Button>
        <Button
          type="default"
          htmlType="button"
          disabled={!response}
          onClick={showModal}
          style={{ marginRight: "10px" }}
        >
          View Response JSON
        </Button>
      </Form>
    </div>
  );
};

export default ReactionSearch;
