'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { saveGuestExercise } from '@/lib/guest'

interface RepTime {
  timestamp: number
  count: number
}

// Helper to load scripts only once
const loadedScripts = new Set<string>()

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (loadedScripts.has(src)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      loadedScripts.add(src)
      resolve()
    }
    script.onerror = () => {
      reject(new Error(`Failed to load script: ${src}`))
    }
    document.head.appendChild(script)
  })
}

export function PoseCounter() {
  const { data: session } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const cancelledRef = useRef(false)
  const runningRef = useRef(false)
  
  const [count, setCount] = useState(0)
  const [state, setState] = useState<'UP' | 'DOWN'>('UP')
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const sessionActiveRef = useRef(false)
  const sessionStartRef = useRef<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [repTimes, setRepTimes] = useState<RepTime[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  // Angle calculation and state tracking
  const angleWindowRef = useRef<number[]>([])
  const lastRepTimeRef = useRef<number>(0)
  const stateRef = useRef<'UP' | 'DOWN'>('UP')

  const DOWN_ANGLE = 90
  const UP_ANGLE = 160
  const MIN_REP_GAP = 400 // milliseconds
  const VIS_MIN = 0.5

  const calculateAngle = (
    point1: { x: number; y: number },
    point2: { x: number; y: number },
    point3: { x: number; y: number }
  ): number => {
    const radians =
      Math.atan2(point3.y - point2.y, point3.x - point2.x) -
      Math.atan2(point1.y - point2.y, point1.x - point2.x)
    let angle = Math.abs((radians * 180.0) / Math.PI)
    if (angle > 180.0) {
      angle = 360 - angle
    }
    return angle
  }

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return

    cancelledRef.current = false
    runningRef.current = false

    const initializePose = async () => {
      try {
        // Load MediaPipe scripts in order
        // Using versions that exist on CDN
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js')
        if (cancelledRef.current) return

        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js')
        if (cancelledRef.current) return

        // Use a version that exists on CDN - 0.5.1675469404 is the latest 0.5.x
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js')
        if (cancelledRef.current) return

        // Access MediaPipe APIs from window
        const Pose = (window as any).Pose
        const Camera = (window as any).Camera
        const drawConnectors = (window as any).drawConnectors
        const drawLandmarks = (window as any).drawLandmarks
        const POSE_CONNECTIONS = (window as any).POSE_CONNECTIONS

        if (!Pose || !Camera || !drawConnectors || !drawLandmarks || !POSE_CONNECTIONS) {
          throw new Error('MediaPipe APIs not available on window object')
        }

        if (cancelledRef.current) return

        const pose = new Pose({
          locateFile: (file: string) => {
            // Use jsDelivr for assets - files should be in the same directory as pose.js
            // Match the version used for loading the script
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
          },
        })

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        // Create onResults handler that uses the loaded functions
        const onResultsHandler = (results: any) => {
          if (cancelledRef.current || !canvasRef.current || !videoRef.current) return

          const canvasCtx = canvasRef.current.getContext('2d')
          if (!canvasCtx) return

          canvasCtx.save()
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          
          // Draw video frame - prefer results.image, fallback to video element
          const video = videoRef.current
          if (results.image) {
            try {
              canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height)
            } catch (e) {
              // Fallback to video element if results.image fails
              if (video && video.readyState >= 2) {
                canvasCtx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height)
              }
            }
          } else if (video && video.readyState >= 2) {
            canvasCtx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height)
          }

          if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks

            // Get left and right arm landmarks
            const leftShoulder = landmarks[11]
            const leftElbow = landmarks[13]
            const leftWrist = landmarks[15]
            const rightShoulder = landmarks[12]
            const rightElbow = landmarks[14]
            const rightWrist = landmarks[16]

            // Check visibility and choose arm
            const leftVis = Math.min(
              leftShoulder.visibility,
              leftElbow.visibility,
              leftWrist.visibility
            )
            const rightVis = Math.min(
              rightShoulder.visibility,
              rightElbow.visibility,
              rightWrist.visibility
            )

            let elbowAngle: number | null = null
            let usedSide: 'LEFT' | 'RIGHT' | null = null
            let currentElbow: { x: number; y: number } | null = null

            if (Math.max(leftVis, rightVis) >= VIS_MIN) {
              if (rightVis >= leftVis) {
                elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
                usedSide = 'RIGHT'
                currentElbow = rightElbow
              } else {
                elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
                usedSide = 'LEFT'
                currentElbow = leftElbow
              }

              if (elbowAngle !== null && currentElbow) {
                // Smooth the angle
                angleWindowRef.current.push(elbowAngle)
                if (angleWindowRef.current.length > 7) {
                  angleWindowRef.current.shift()
                }
                const smoothAngle =
                  angleWindowRef.current.reduce((a, b) => a + b, 0) /
                  angleWindowRef.current.length

                // State machine with hysteresis
                const now = Date.now()
                if (stateRef.current === 'UP') {
                  if (smoothAngle < DOWN_ANGLE) {
                    stateRef.current = 'DOWN'
                    setState('DOWN')
                  }
                } else {
                  if (
                    smoothAngle > UP_ANGLE &&
                    now - lastRepTimeRef.current > MIN_REP_GAP
                  ) {
                    // Always transition state back to UP
                    lastRepTimeRef.current = now
                    stateRef.current = 'UP'
                    setState('UP')
                    
                    // Only count if session is active (use ref to get current value)
                    if (sessionActiveRef.current) {
                      setCount((prevCount) => {
                        const newCount = prevCount + 1
                        setRepTimes((prev) => [
                          ...prev,
                          { timestamp: now, count: newCount },
                        ])
                        return newCount
                      })
                    }
                  }
                }

                // Draw angle text
                const elbowX = currentElbow.x * canvasRef.current.width
                const elbowY = currentElbow.y * canvasRef.current.height
                canvasCtx.fillStyle = '#00FF00'
                canvasCtx.font = '20px Arial'
                canvasCtx.fillText(
                  `${smoothAngle.toFixed(1)}°`,
                  elbowX + 10,
                  elbowY - 10
                )
              }
            }

            // Draw pose landmarks
            drawConnectors(canvasCtx, landmarks, POSE_CONNECTIONS, {
              color: '#00FF00',
              lineWidth: 2,
            })
            drawLandmarks(canvasCtx, landmarks, {
              color: '#FF0000',
              lineWidth: 1,
              radius: 3,
            })
          }

          canvasCtx.restore()
        }

        pose.onResults(onResultsHandler)

        // Ensure video element is ready
        const video = videoRef.current!
        if (!video) {
          throw new Error('Video element not available')
        }

        // Wait a bit for video element to be ready
        await new Promise(resolve => setTimeout(resolve, 100))

        const camera = new Camera(video, {
          onFrame: async () => {
            if (cancelledRef.current || !poseRef.current || !video) return
            await pose.send({ image: video })
          },
          width: 640,
          height: 480,
        })

        if (cancelledRef.current) {
          pose.close()
          return
        }

        poseRef.current = pose
        cameraRef.current = camera
        runningRef.current = true
        
        await camera.start()
        
        // Wait for video stream to be ready and ensure it's playing
        await new Promise((resolve) => {
          const checkReady = () => {
            if (cancelledRef.current) {
              resolve(undefined)
              return
            }
            if (video.readyState >= 2) {
              video.play().catch((e) => {
                console.warn('Video play failed:', e)
                // Fallback: try to get user media manually
                navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
                  .then((stream) => {
                    if (!cancelledRef.current && video) {
                      video.srcObject = stream
                      video.play().catch(console.error)
                    }
                  })
                  .catch(console.error)
              })
              resolve(undefined)
            } else {
              setTimeout(checkReady, 50)
            }
          }
          checkReady()
        })
        
        if (!cancelledRef.current) {
          setIsInitialized(true)
        }
      } catch (err) {
        console.error('Error initializing pose detection:', err)
        if (!cancelledRef.current) {
          setError('Failed to initialize camera. Please check permissions and try again.')
        }
      }
    }

    initializePose()

    return () => {
      cancelledRef.current = true
      runningRef.current = false

      // Stop camera
      if (cameraRef.current) {
        try {
          cameraRef.current.stop()
        } catch (e) {
          console.error('Error stopping camera:', e)
        }
        cameraRef.current = null
      }

      // Stop all video tracks as fallback
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => {
          track.stop()
        })
        videoRef.current.srcObject = null
      }

      // Clear pose reference
      if (poseRef.current) {
        try {
          poseRef.current.close()
        } catch (e) {
          console.error('Error closing pose:', e)
        }
        poseRef.current = null
      }
    }
  }, [])

  // Timer effect - updates elapsed time when session is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (sessionActive && sessionStartRef.current) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - sessionStartRef.current!)
      }, 100)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [sessionActive])

  const startStopSession = () => {
    if (!sessionActive) {
      // Start session
      sessionStartRef.current = Date.now()
      sessionActiveRef.current = true
      setSessionActive(true)
      setElapsedTime(0)
      setSaved(false)
    } else {
      // Stop session
      sessionActiveRef.current = false
      setSessionActive(false)
    }
  }

  const saveSession = async () => {
    if (count === 0 || saved || !sessionStartRef.current) return

    try {
      setIsSaving(true)
      const duration = elapsedTime || (Date.now() - sessionStartRef.current)
      const exerciseData = {
        exerciseType: 'pushups',
        count,
        duration,
        completedAt: new Date().toISOString(),
      }

      if (session?.user) {
        // User is logged in - save to database
        const response = await fetch('/api/exercises', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exerciseData),
        })

        if (!response.ok) {
          throw new Error('Failed to save exercise')
        }

        setSaved(true)
      } else {
        // Guest user - save to localStorage
        saveGuestExercise(exerciseData)
        setSaved(true)
      }
    } catch (err) {
      console.error('Error saving session:', err)
      alert('Failed to save session. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl max-w-md shadow-lg">
        <p className="text-red-500 text-xl mb-8">{error}</p>
        <Link href="/" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 hover:-translate-y-0.5 transition-all">
          Go Back
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-5xl">
      <div className="relative w-full max-w-[500px] max-h-[375px] rounded-2xl overflow-hidden shadow-2xl bg-black">
        <video
          ref={videoRef}
          className="w-full h-auto block invisible absolute"
          style={{ visibility: 'hidden', position: 'absolute' }}
          playsInline
          autoPlay
          muted
        />
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          width={640}
          height={480}
        />
        {!isInitialized && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white bg-black/70 p-8 rounded-xl">
            <p className="text-lg">Initializing camera...</p>
            <p className="text-sm text-gray-300 mt-2">
              Please allow camera access when prompted
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 sm:gap-6 justify-center w-full">
        <div className="bg-white rounded-2xl px-6 py-4 text-center shadow-lg min-w-[120px]">
          <div className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wide">Pushups</div>
          <div className="text-3xl font-bold text-purple-600">{count}</div>
        </div>
        <div className="bg-white rounded-2xl px-6 py-4 text-center shadow-lg min-w-[120px]">
          <div className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wide">State</div>
          <div className="text-3xl font-bold text-purple-600">{state}</div>
        </div>
        <div className="bg-white rounded-2xl px-6 py-4 text-center shadow-lg min-w-[120px]">
          <div className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wide">Time</div>
          <div className="text-3xl font-bold text-purple-600">
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 justify-center">
        <button 
          onClick={startStopSession} 
          className={`px-6 py-3 rounded-full font-semibold text-sm sm:text-base transition-all shadow-lg ${
            sessionActive
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl hover:-translate-y-0.5'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl hover:-translate-y-0.5'
          } ${!isInitialized ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={!isInitialized}
        >
          {sessionActive ? 'Stop' : 'Start Session'}
        </button>
        <button 
          onClick={saveSession} 
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          disabled={count === 0 || saved || isSaving || sessionActive}
        >
          {isSaving ? 'Saving...' : saved ? '✓ Saved' : 'Save Session'}
        </button>
        <button 
          onClick={() => setShowInstructions(!showInstructions)} 
          className="px-6 py-3 text-purple-600 bg-white border-2 border-purple-600 rounded-full font-semibold text-sm sm:text-base shadow-md hover:bg-purple-600 hover:text-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
      </div>

      {showInstructions && (
        <div className="bg-white rounded-2xl p-6 max-w-2xl shadow-lg text-sm">
          <h3 className="text-gray-800 mb-4 text-xl font-bold">Instructions:</h3>
          <ul className="list-none p-0 space-y-2">
            <li className="text-gray-600 pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-purple-600 before:font-bold">
              Position yourself so your side profile is visible to the camera
            </li>
            <li className="text-gray-600 pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-purple-600 before:font-bold">
              Ensure good lighting and a clear background
            </li>
            <li className="text-gray-600 pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-purple-600 before:font-bold">
              Click 'Start Session' to begin tracking
            </li>
            <li className="text-gray-600 pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-purple-600 before:font-bold">
              Start doing pushups - the counter will track automatically
            </li>
            <li className="text-gray-600 pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-purple-600 before:font-bold">
              Click 'Stop' when you're done, then 'Save Session' to save your workout
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
