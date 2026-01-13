# Pushup Counter

A real-time pushup counter using MediaPipe pose estimation. Available as both a Python desktop application and a Next.js web application.

## Features

- **Real-time pose detection** using MediaPipe
- **Automatic pushup counting** based on arm angle detection
- **Visual feedback** with pose landmarks and angle display
- **Smooth counting** with state machine to prevent false positives
- **Session tracking** - automatically saves workout sessions
- **Web application** - run in your browser with `npm run dev`
- **Desktop application** - run locally with Python

## Web Application (Next.js)

### Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Click "Start Counting Pushups" and allow camera access when prompted

### Web App Features

- Beautiful landing page with feature overview
- Real-time camera feed with pose detection overlay
- Live pushup counter with state tracking
- Session timer
- Reset functionality
- Responsive design for mobile and desktop

## Python Desktop Application

### Requirements

- Python 3.7+
- Webcam/camera
- Required packages (see `requirements.txt`)

### Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Run the pushup counter:

```bash
python pushup_counter.py
```

### Controls

- **'q'** - Quit the application
- **'r'** - Reset the counter to 0

## How It Works

The application uses MediaPipe's pose estimation to detect key body landmarks (shoulders, elbows, wrists). It calculates the angle of your elbow joint and uses a state machine to track when you go down and come back up:

- **DOWN state**: When your elbow angle goes below 90°
- **UP state**: When your elbow angle goes above 160°
- A pushup is counted when you transition from DOWN → UP

The counter uses smoothing and timing constraints to prevent false counts from jittery movements.

### Session Tracking (Python Version)

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

- User accounts and authentication
- Session history and analytics (daily/weekly averages)
- Goal setting and progress tracking
- Multiple exercise types
- Cloud storage for workout data
- Web-based analytics dashboard

## Troubleshooting

### Web Application

- **Camera not opening**: Make sure to allow camera access in your browser settings
- **MediaPipe not loading**: Check your internet connection (MediaPipe loads from CDN)
- **Not detecting pushups**: Adjust lighting, check camera angle, ensure side profile is visible

### Python Application

- **Camera not opening**: Make sure no other application is using your webcam
- **Not detecting pushups**: Adjust lighting, check camera angle, ensure side profile is visible
- **False counts**: You may need to adjust the `DOWN_ANGLE` and `UP_ANGLE` thresholds in the code based on your form

## Project Structure

```
pushup-counter/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── counter/           # Counter page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── PoseCounter.tsx    # Main counter component
├── pushup_counter.py      # Python desktop version
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
└── README.md             # This file
```

## License

MIT License
