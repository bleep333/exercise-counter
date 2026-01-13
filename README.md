# Pushup Counter

A real-time pushup counter using MediaPipe pose estimation and OpenCV for computer vision. This application uses your webcam to track your body posture and count pushups automatically.

## Features

- **Real-time pose detection** using MediaPipe
- **Automatic pushup counting** based on arm angle detection
- **Visual feedback** with pose landmarks and angle display
- **Smooth counting** with state machine to prevent false positives
- **Mirror mode** for natural selfie view
- **Session tracking** - automatically saves workout sessions to JSON files
- **Interactive controls** (reset counter, quit)

## Requirements

- Python 3.7+
- Webcam/camera
- Required packages (see `requirements.txt`)

## Installation

1. Clone or download this repository
2. Install the required dependencies:

```bash
pip install -r requirements.txt --no-deps
```

## Usage

1. Run the pushup counter:

```bash
python pushup_counter.py
```

2. Position yourself so your side profile is visible to the camera (side view works best)
3. Start doing pushups!
4. The counter will automatically detect and count your pushups

### Controls

- **'q'** - Quit the application
- **'r'** - Reset the counter to 0

## How It Works

The application uses MediaPipe's pose estimation to detect key body landmarks (shoulders, elbows, wrists). It calculates the angle of your elbow joint and uses a state machine to track when you go down and come back up:

- **DOWN state**: When your elbow angle goes below 90°
- **UP state**: When your elbow angle goes above 160°
- A pushup is counted when you transition from DOWN → UP

The counter uses smoothing and timing constraints to prevent false counts from jittery movements.

### Session Tracking

Each workout session is automatically saved to the `sessions/` directory as a JSON file. The session data includes:
- Total pushup count
- Session start and end times
- Duration
- Timestamps of each individual rep

This data can be used for analytics and progress tracking in future web application versions.

## Tips for Best Results

1. **Camera position**: Place the camera to capture your side profile
2. **Lighting**: Ensure good lighting so the camera can see your body clearly
3. **Background**: Use a contrasting background (avoid similar colors to your body)
4. **Distance**: Stay at a reasonable distance so your full upper body is visible
5. **Form**: Maintain proper pushup form for accurate detection

## Future Enhancements

This application is designed to be extended into a web application with:
- User accounts and authentication
- Session history and analytics (daily/weekly averages)
- Goal setting and progress tracking
- Multiple exercise types
- Cloud storage for workout data

## Troubleshooting

- **Camera not opening**: Make sure no other application is using your webcam
- **Not detecting pushups**: Adjust lighting, check camera angle, ensure side profile is visible
- **False counts**: You may need to adjust the `DOWN_ANGLE` and `UP_ANGLE` thresholds in the code based on your form

## License

MIT License