'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Pose } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { POSE_CONNECTIONS } from '@mediapipe/pose'
import styles from './PoseCounter.module.css'

interface RepTime {
  timestamp: number
  count: number
}

export function PoseCounter() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const poseRef = useRef<Pose | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  
  const [count, setCount] = useState(0)
  const [state, setState] = useState<'UP' | 'DOWN'>('UP')
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionStart] = useState(Date.now())
  const [repTimes, setRepTimes] = useState<RepTime[]>([])

  // Angle calculation and state tracking
  const angleWindowRef = useRef<number[]>([])
  const lastRepTimeRef = useRef<number>(0)
  const stateRef = useRef<'UP' | 'DOWN'>('UP')

  const DOWN_ANGLE = 90
  const UP_ANGLE = 160
  const MIN_REP_GAP = 400 // milliseconds
  const VIS_MIN = 0.5

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return

    const initializePose = async () => {
      try {
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1635989137/${file}`
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

        pose.onResults(onResults)

        const camera = new Camera(videoRef.current!, {
          onFrame: async () => {
            await pose.send({ image: videoRef.current! })
          },
          width: 1280,
          height: 720,
        })

        poseRef.current = pose
        cameraRef.current = camera
        await camera.start()
        setIsInitialized(true)
      } catch (err) {
        console.error('Error initializing pose detection:', err)
        setError('Failed to initialize camera. Please check permissions and try again.')
      }
    }

    initializePose()

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
    }
  }, [])

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

  const onResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return

    const canvasCtx = canvasRef.current.getContext('2d')
    if (!canvasCtx) return

    canvasCtx.save()
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height)

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
              const newCount = count + 1
              setCount(newCount)
              lastRepTimeRef.current = now
              stateRef.current = 'UP'
              setState('UP')
              setRepTimes((prev) => [
                ...prev,
                { timestamp: now, count: newCount },
              ])
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

  const resetCounter = () => {
    setCount(0)
    setState('UP')
    stateRef.current = 'UP'
    angleWindowRef.current = []
    lastRepTimeRef.current = 0
    setRepTimes([])
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.error}>{error}</p>
        <Link href="/" className={styles.backLink}>
          Go Back
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.counterContainer}>
      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          className={styles.video}
          style={{ display: 'none' }}
          playsInline
        />
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={1280}
          height={720}
        />
        {!isInitialized && (
          <div className={styles.loadingOverlay}>
            <p>Initializing camera...</p>
            <p className={styles.loadingNote}>
              Please allow camera access when prompted
            </p>
          </div>
        )}
      </div>

      <div className={styles.statsPanel}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pushups</div>
          <div className={styles.statValue}>{count}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>State</div>
          <div className={styles.statValue}>{state}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Time</div>
          <div className={styles.statValue}>
            {formatTime(Date.now() - sessionStart)}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <button onClick={resetCounter} className={styles.resetButton}>
          Reset Counter
        </button>
      </div>

      <div className={styles.instructions}>
        <h3>Instructions:</h3>
        <ul>
          <li>Position yourself so your side profile is visible to the camera</li>
          <li>Ensure good lighting and a clear background</li>
          <li>Start doing pushups - the counter will track automatically</li>
          <li>Press 'Reset Counter' to start a new session</li>
        </ul>
      </div>
    </div>
  )
}
