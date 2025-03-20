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

const SyntheticGraphQueryV2 = () => {
  const [formData, setFormData] = useState({
    target_molecule_inchikey: "",
    reaction_steps: 1,
    query_type: "shortest_path",
    leaves_as_sm: true,
  });
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

  const handleSubmit = (e) => {
    if (isSMILESorInChIKey(targetInput) === "inchikey") {
      const updatedFormData = {
        ...formData,
        target_molecule_inchikey: targetInput,
      };
      setFormData(updatedFormData);
      fetchSynthesisGraph(updatedFormData);
    } else if (isSMILESorInChIKey(targetInput) === "smiles") {
      moleculeSmilesToInchikey(appSettings.apiUrl, targetInput)
        .then((inchikey) => {
          const updatedFormData = {
            ...formData,
            target_molecule_inchikey: inchikey,
          };
          setFormData(updatedFormData);
          fetchSynthesisGraph(updatedFormData);
        })
        .catch((error) => {
          console.error(error);
          setErrorMessage(
            "Unable to convert SMILES to InChIKey. See console for details."
          );
          setAlertVisible(true);
        });
    } else {
      console.error("Invalid input: ", targetInput);
      setErrorMessage(
        "Unable to determine input string as 'SMILES' or 'InChIKey'"
      );
      setAlertVisible(true);
    }
  };

  // Fetch synthesis graph
  const fetchSynthesisGraph = async (inputForm) => {
    setResponse(null);
    setLoading(true);
    setErrorMessage("");
    setAlertVisible(false);
    try {
      const response = await fetch(
        appSettings.apiUrl + "/api/v1/prediction/fetch_synthesis_graph",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(inputForm),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error: ${response.status}. ${errorBody.detail}`);
      }

      const data = await response.json();

      if (!data["synthesis_graph_json"]) {
        setErrorMessage("No synthesis graph found in response");
        setAlertVisible(true);
      } else {
        const graphWithSmiles = mapGraphWithSmiles(
          data["synthesis_graph_json"],
          data["reactions"],
          data["substances"]
        );
        setResponse(JSON.stringify(data, null, 2));
        setAicpGraph(graphWithSmiles);

        const mappedData = mapGraphDataToCytoscape(graphWithSmiles);
        updateCytoscapeGraph(mappedData);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const settingsContent = (
    <div>
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

export default SyntheticGraphQueryV2;
