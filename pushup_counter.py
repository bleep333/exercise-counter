import cv2
import numpy as np
import mediapipe as mp
from collections import deque
import time
import json
import os
from datetime import datetime

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

def save_session(count, start_time, end_time, rep_times):
    """Save session data to JSON file for future analytics."""
    session_data = {
        "date": datetime.now().isoformat(),
        "pushup_count": count,
        "start_time": start_time,
        "end_time": end_time,
        "duration_seconds": end_time - start_time,
        "rep_times": rep_times
    }
    
    # Create sessions directory if it doesn't exist
    os.makedirs("sessions", exist_ok=True)
    
    # Save to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"sessions/session_{timestamp}.json"
    with open(filename, 'w') as f:
        json.dump(session_data, f, indent=2)
    
    return filename

def main():
    print("Initializing pushup counter...")
    print("Controls: 'q' to quit, 'r' to reset counter")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam. Please check your camera connection.")
        return

    # Set camera properties for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

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
    
    # Session tracking
    session_start_time = time.time()
    rep_times = []  # Store timestamps of each rep for analytics

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
                            rep_times.append(now)
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

            # Calculate session duration
            session_duration = time.time() - session_start_time
            minutes = int(session_duration // 60)
            seconds = int(session_duration % 60)
            
            # UI overlay with semi-transparent background
            overlay = frame.copy()
            cv2.rectangle(overlay, (10, 10), (320, 140), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
            
            # Display information
            cv2.putText(frame, f"Pushups: {count}", (20, 45),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
            cv2.putText(frame, f"State: {state}", (20, 75),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, f"Time: {minutes:02d}:{seconds:02d}", (20, 105),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)

            if used_side:
                cv2.putText(frame, f"Arm: {used_side}", (20, 130),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (150, 150, 255), 2)
            else:
                cv2.putText(frame, "Position yourself in view", (20, 130),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 2)

            cv2.imshow("Pushup Counter (Side View)", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            if key == ord('r'):
                count = 0
                state = "UP"
                window.clear()
                rep_times.clear()
                session_start_time = time.time()
                print("Counter reset!")

    # Cleanup and save session
    session_end_time = time.time()
    cap.release()
    cv2.destroyAllWindows()
    
    # Save session data
    if count > 0:
        filename = save_session(count, session_start_time, session_end_time, rep_times)
        print(f"\nSession completed!")
        print(f"Total pushups: {count}")
        print(f"Session saved to: {filename}")
    else:
        print("\nSession ended with no pushups recorded.")

if __name__ == "__main__":
    main()