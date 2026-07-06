def evaluate_qdn_requirement(prediction: dict) -> dict:
    """
    Decide whether QDN containment is needed.
    """

    if prediction["status"] == "DEFECT" and prediction["confidence"] >= 0.80:
        return {
            "qdn_required": True,
            "containment_status": "LOT_ON_HOLD",
            "reason": f"Detected {prediction['defect_type']} with confidence {prediction['confidence']}"
        }

    return {
        "qdn_required": False,
        "containment_status": "NO_ACTION_REQUIRED",
        "reason": "No high-confidence defect detected"
    }