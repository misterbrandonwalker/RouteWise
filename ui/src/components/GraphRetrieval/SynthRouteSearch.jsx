import React, { useState, useContext } from "react";
import {
  Form,
  Input,
  Slider,
  Button,
  Popover,
  Select,
  Alert,
  Modal,
  Typography,
  Divider,
  InputNumber
} from "antd";
import { EditOutlined, SettingOutlined } from "@ant-design/icons";
import { MainContext } from "../../contexts/MainContext";
import {
  mapGraphDataToCytoscape,
  mapGraphWithSmiles,
  isSMILESorInChIKey,
} from "../../helpers/commonHelpers";
import { moleculeSmilesToInchikey } from "../../helpers/apiHelpers";
import KetcherModal from "../KetcherModal/KetcherModal";

const { Text } = Typography;

const SynthRouteSearch = () => {
  const [formData, setFormData] = useState({
    target_molecule_inchikey: "",
    reaction_steps: 2,
    query_type: "shortest_path",
    leaves_as_sm: true,
    evidence_number_of_routes: 3,
    prediction_number_of_routes: 3,
    prediction_source: "ASKCOS v2",
  });
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [targetInput, setTargetInput] = useState("");
  const {
    setAicpGraph,
    appSettings,
    updateCytoscapeGraph,
    setSelectedEntity,
    setPreviewEntity,
    setShowKetcher,
  } = useContext(MainContext);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
    setSelectedEntity(null);
    setPreviewEntity(null);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleTargetChange = (e) => {
    const { value } = e.target;
    const trimmedValue = value.trim();
    
    setTargetInput(trimmedValue);
    setIsSubmitDisabled(trimmedValue === "");
  };

  const handleSliderChange = (value) => {
    setFormData({ ...formData, reaction_steps: value });
  };

  const handleSelectChange = (value) => {
    setFormData({ ...formData, query_type: value });
  };

  const handleNumberChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    if (isSMILESorInChIKey(targetInput) === "inchikey") {
      const updatedFormData = {
        ...formData,
        target_molecule_inchikey: targetInput,
        target_molecule_smiles: null
      };
      setFormData(updatedFormData);
      fetchRoutes(updatedFormData);
    } else if (isSMILESorInChIKey(targetInput) === "smiles") {
      const updatedFormData = {
        ...formData,
        target_molecule_smiles: targetInput,
        target_molecule_inchikey: null
      };
      setFormData(updatedFormData);
      fetchRoutes(updatedFormData);
    } else {
      console.error("Invalid input: ", targetInput);
      setErrorMessage(
        "Unable to determine input string as 'SMILES' or 'InChIKey'"
      );
      setAlertVisible(true);
    }
  };

  // Fetch routes
  const fetchRoutes = async (inputForm) => {
    setResponse(null);
    setLoading(true);
    setErrorMessage("");
    setAlertVisible(false);
    try {
      const response = await fetch(
        appSettings.apiUrl + "/api/v1/prediction/synthesis_routes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_molecule_inchikey: inputForm.target_molecule_inchikey,
            target_molecule_smiles: inputForm.target_molecule_smiles,
            reaction_steps: inputForm.reaction_steps,
            evidence_options: {
              deg_cutoff: 0,
              query_type: inputForm.query_type,
              top_n_routes: inputForm.evidence_number_of_routes,
            },
            prediction_options: {
              max_routes: inputForm.prediction_number_of_routes,
              source: inputForm.prediction_source,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error: ${response.status}. ${errorBody.detail}`);
      }

      const data = await response.json();

      if (!data["routes"]) {
        setErrorMessage("No routes found in response");
        setAlertVisible(true);
      } else {
        setResponse(JSON.stringify(data, null, 2));
        handleRoutesChange(data["routes"]);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle routes change
  const handleRoutesChange = (value) => {
    setRoutes(value);
    setSelectedRoute(0);
    setCurrentRoute(value[0]);
  }

  // Set current route
  const setCurrentRoute = (route) => {
    setSelectedEntity(null);
    setPreviewEntity(null);
    setAicpGraph(route['route_candidate_json']);
    const mappedData = mapGraphDataToCytoscape(route['route_candidate_json'], route['predicted']);
    updateCytoscapeGraph(mappedData);
  };

  const settingsContent = (
    <div>
      {/* General Search Settings Section */}

      <div>
        <h3>General Search Settings</h3>
        <Form.Item label="Reaction Steps" style={{ marginRight: "10px" }}>
          <Slider
            min={1}
            max={5}
            value={formData.reaction_steps}
            onChange={handleSliderChange}
            style={{ width: "100px" }}
          />
        </Form.Item>
      </div>
      {/* Evidence Based Settings Section */}
      <div>
        <h3>Evidence Based Settings</h3>
        <Form.Item
          label="Number of Evidence Based Routes"
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          labelAlign="left"
        >
          <InputNumber
            name="evidenceNumberOfRoutes"
            min={0}
            max={10}
            defaultValue={formData.evidence_number_of_routes}
            onChange={(value) => handleNumberChange("evidenceNumberOfRoutes", value)}
            style={{ width: "200px" }}
          />
        </Form.Item>
        <Form.Item
          label="Query Type"
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          labelAlign="left"
        >
          <Select
            name="queryType"
            defaultValue={formData.query_type}
            onChange={handleSelectChange}
            style={{ width: "200px" }}
            options={[
              { value: "shortest_path", label: "shortest_path" },
              { value: "full_graph", label: "full_graph" },
            ]}
          />
        </Form.Item>
      </div>

      <Divider style={{ margin: "20px 0" }} />

      {/* Prediction Settings Section */}
      <div>
        <h3>Prediction Settings</h3>
        <Form.Item
          label="Number of Predicted Routes"
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          labelAlign="left"
        >
          <InputNumber
            name="predictionNumberOfRoutes"
            min={0}
            max={10}
            defaultValue={formData.prediction_number_of_routes}
            onChange={(value) => handleNumberChange("predictionNumberOfRoutes", value)}
            style={{ width: "200px" }}
          />
        </Form.Item>
        <Form.Item
          label="Prediction Source"
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          labelAlign="left"
        >
          <Select
            name="predictionSource"
            defaultValue={formData.prediction_source || "ASKCOS v2"}
            onChange={handleSelectChange}
            style={{ width: "200px" }}
            disabled={true}
            options={[
              { value: "ASKCOS v2", label: "ASKCOS v2" },
            ]}
          />
        </Form.Item>
      </div>
    </div>
  );

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
        <Form.Item style={{ marginRight: "10px" }}>
          <Input
            name="textField"
            placeholder="Target Molecule SMILES/InChIKey"
            value={targetInput}
            onChange={handleTargetChange}
            style={{ width: "400px" }}
            suffix={
              <Button
                icon={<EditOutlined />}
                onClick={() => setShowKetcher(true)}
              >
                Draw
              </Button>
            }
          />
        </Form.Item>
        <Popover content={settingsContent} title="Settings" trigger="click">
          <Button icon={<SettingOutlined />} style={{ marginRight: "10px" }} />
        </Popover>
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
        <Form.Item label="Select Route" style={{ marginRight: "10px" }}>
          <Select
            disabled={!routes || routes.length === 0}
            style={{ width: "200px" }}
            value={selectedRoute}
            onChange={(value) => {
              setSelectedRoute(value);
              setCurrentRoute(routes[value]);
            }}
            options={routes.map((route, index) => ({
              value: index,
              label: `Route ${index + 1} - ${route["predicted"] ? "Predicted" : "Evidence"}`,
            }))}
          />
        </Form.Item>
      </Form>
      <Modal
        title={
          <Text strong copyable={{ text: response }}>
            Response JSON
          </Text>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={1200}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        <pre>{response}</pre>
      </Modal>
      <KetcherModal handleInput={handleTargetChange} />
    </div>
  );
};

export default SynthRouteSearch;
