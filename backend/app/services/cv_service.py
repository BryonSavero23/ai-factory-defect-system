import random

def predict_defect(filename: str) -> dict:
    """
    Temporary fake AI prediction.
    Later, this will be replaced with YOLO/OpenCV prediction.
    """

    possible_defects = [
        "scratch",
        "crack",
        "missing_component",
        "contamination",
        "no_defect"
    ]

    defect_type = random.choice(possible_defects)

    if defect_type == "no_defect":
        confidence = round(random.uniform(0.90, 0.99), 2)
        status = "PASS"
    else:
        confidence = round(random.uniform(0.75, 0.98), 2)
        status = "DEFECT"

    return {
        "filename": filename,
        "defect_type": defect_type,
        "confidence": confidence,
        "status": status
    }