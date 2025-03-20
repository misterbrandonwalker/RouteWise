import React from "react";

const AuthModal = ({ onLogin }) => {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2>AICP Network Visualizer Login</h2>
        <p>Authenticate using your OIDC provider.</p>
        <button onClick={onLogin}>Login</button>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "5px",
    textAlign: "center",
  },
};

export default AuthModal;
