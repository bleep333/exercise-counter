import cv2
import numpy as np
import mediapipe as mp
from collections import deque
import time

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

def angle_3pt(a, b, c) -> float:
    """Returns angle ABC (in degrees) where points are (x, y)."""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    denom = (np.linalg.norm(ba) * np.linalg.norm(bc)) + 1e-9
    cosang = np.dot(ba, bc) / denom
    cosang = np.clip(cosang, -1.0, 1.0)
    return float(np.degrees(np.arccos(cosang)))

def get_point(landmarks, idx):
    lm = landmarks[idx]
    return (lm.x, lm.y)

def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam.")

    # Thresholds (tune per person/camera)
    DOWN_ANGLE = 90     # when below -> "down"
    UP_ANGLE = 160      # when above -> "up"
    VIS_MIN = 0.5       # landmark visibility threshold

    # Smoothing
    window = deque(maxlen=7)

    # Rep counting state
    state = "UP"        # start assuming you're up
    count = 0
    last_rep_time = 0.0
    MIN_REP_GAP = 0.4   # seconds, avoids double counts on jitter

    # Choose which arm to use (will auto pick the more visible one each frame)
    left_idxs = (mp_pose.PoseLandmark.LEFT_SHOULDER,
                 mp_pose.PoseLandmark.LEFT_ELBOW,
                 mp_pose.PoseLandmark.LEFT_WRIST)
    right_idxs = (mp_pose.PoseLandmark.RIGHT_SHOULDER,
                  mp_pose.PoseLandmark.RIGHT_ELBOW,
                  mp_pose.PoseLandmark.RIGHT_WRIST)

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,          # 0=faster, 2=slightly better
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as pose:

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            # Mirror for natural selfie view (optional). If you prefer true view, comment out.
            frame = cv2.flip(frame, 1)

            h, w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = pose.process(rgb)

            elbow_angle = None
            used_side = None

            if res.pose_landmarks:
                lms = res.pose_landmarks.landmark

                # Visibility check for left vs right arm
                l_vis = min(lms[left_idxs[0].value].visibility,
                            lms[left_idxs[1].value].visibility,
                            lms[left_idxs[2].value].visibility)
                r_vis = min(lms[right_idxs[0].value].visibility,
                            lms[right_idxs[1].value].visibility,
                            lms[right_idxs[2].value].visibility)

                if max(l_vis, r_vis) >= VIS_MIN:
                    if r_vis >= l_vis:
                        s, e, wr = right_idxs
                        used_side = "RIGHT"
                    else:
                        s, e, wr = left_idxs
                        used_side = "LEFT"

                    shoulder = get_point(lms, s.value)
                    elbow = get_point(lms, e.value)
                    wrist = get_point(lms, wr.value)

                    elbow_angle = angle_3pt(shoulder, elbow, wrist)

                    # Smooth
                    window.append(elbow_angle)
                    smooth_angle = float(np.mean(window))

                    # State machine with hysteresis
                    now = time.time()
                    if state == "UP":
                        if smooth_angle < DOWN_ANGLE:
                            state = "DOWN"
                    else:  # state == "DOWN"
                        if smooth_angle > UP_ANGLE and (now - last_rep_time) > MIN_REP_GAP:
                            count += 1
                            last_rep_time = now
                            state = "UP"

                    # Draw landmarks
                    mp_drawing.draw_landmarks(
                        frame, res.pose_landmarks, mp_pose.POSE_CONNECTIONS
                    )

                    # Put angle text near elbow
                    ex, ey = int(elbow[0] * w), int(elbow[1] * h)
                    cv2.putText(frame, f"{smooth_angle:.1f} deg",
                                (ex + 10, ey - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            # UI overlay
            cv2.rectangle(frame, (10, 10), (280, 110), (0, 0, 0), -1)
            cv2.putText(frame, f"Pushups: {count}", (20, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
            cv2.putText(frame, f"State: {state}", (20, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            if used_side:
                cv2.putText(frame, f"Arm: {used_side}", (300, 50),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            cv2.imshow("Pushup Counter (Side View)", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            if key == ord('r'):
                count = 0
                state = "UP"
                window.clear()

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()