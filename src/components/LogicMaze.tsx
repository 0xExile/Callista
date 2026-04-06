import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Text, Float, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Brain, Loader2, Trophy, Timer, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Compass, Map as MapIcon, Play, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { cn } from '@/src/lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Maze Generation Logic ---
type Cell = {
  x: number;
  z: number;
  isWall: boolean;
};

const generateMaze = (size: number): Cell[][] => {
  const grid: Cell[][] = [];
  for (let x = 0; x < size; x++) {
    grid[x] = [];
    for (let z = 0; z < size; z++) {
      grid[x][z] = { x, z, isWall: true };
    }
  }

  const stack: [number, number][] = [];
  const start: [number, number] = [1, 1];
  grid[start[0]][start[1]].isWall = false;
  stack.push(start);

  while (stack.length > 0) {
    const [cx, cz] = stack[stack.length - 1];
    const neighbors: [number, number, number, number][] = [];

    const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]];
    for (const [dx, dz] of dirs) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (nx > 0 && nx < size - 1 && nz > 0 && nz < size - 1 && grid[nx][nz].isWall) {
        neighbors.push([nx, nz, cx + dx / 2, cz + dz / 2]);
      }
    }

    if (neighbors.length > 0) {
      const [nx, nz, mx, mz] = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[nx][nz].isWall = false;
      grid[mx][mz].isWall = false;
      stack.push([nx, nz]);
    } else {
      stack.pop();
    }
  }

  // Ensure the center is open for the trophy and connected to the maze
  const mid = Math.floor(size / 2);
  for (let x = mid - 1; x <= mid + 1; x++) {
    for (let z = mid - 1; z <= mid + 1; z++) {
      if (x >= 0 && x < size && z >= 0 && z < size) {
        grid[x][z].isWall = false;
      }
    }
  }
  
  // Create a guaranteed entrance to the center
  grid[mid][mid - 2].isWall = false;
  grid[mid][mid - 1].isWall = false;

  return grid;
};

// --- Pathfinding (BFS) ---
const findPath = (grid: Cell[][], start: [number, number], end: [number, number]) => {
  const queue: [number, number, [number, number][]][] = [[start[0], start[1], [start]]];
  const visited = new Set<string>();
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [x, z, path] = queue.shift()!;
    if (x === end[0] && z === end[1]) return path;

    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dz] of dirs) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx >= 0 && nx < grid.length && nz >= 0 && nz < grid[0].length && !grid[nx][nz].isWall && !visited.has(`${nx},${nz}`)) {
        visited.add(`${nx},${nz}`);
        queue.push([nx, nz, [...path, [nx, nz]]]);
      }
    }
  }
  return null;
};

// --- 3D Components ---
const Wall = ({ position }: { position: [number, number, number] }) => (
  <mesh position={[position[0] * 4, 2, position[2] * 4]} castShadow receiveShadow>
    <boxGeometry args={[3.9, 4, 3.9]} />
    <meshStandardMaterial 
      color="#ffffff" 
      roughness={0.1} 
      metalness={0.1}
      emissive="#ffffff"
      emissiveIntensity={0.2}
    />
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(3.9, 4, 3.9)]} />
      <lineBasicMaterial color="#374151" linewidth={1} />
    </lineSegments>
  </mesh>
);

const Floor = ({ size }: { size: number }) => (
  <group position={[(size * 4) / 2 - 2, -0.01, (size * 4) / 2 - 2]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size * 4 + 40, size * 4 + 40]} />
      <meshStandardMaterial color="#1a202c" roughness={0.8} />
    </mesh>
    {/* Grid helper should be on the floor, not vertical */}
    <gridHelper args={[size * 4 + 40, size + 10, "#374151", "#1f2937"]} position={[0, 0.02, 0]} />
  </group>
);

const TrophyModel = ({ position }: { position: [number, number, number] }) => (
  <Float speed={3} rotationIntensity={1} floatIntensity={1}>
    <group position={position}>
      {/* Base */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1, 0.4, 32]} />
        <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Cup */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1, 0.5, 1.5, 32]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Handles */}
      <mesh position={[1, 0.8, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.5, 0.1, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1, 0.8, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <torusGeometry args={[0.5, 0.1, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Ethereal Glow */}
      <pointLight intensity={50} color="#fbbf24" distance={50} />
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
    </group>
  </Float>
);

const LogicNode = ({ position, active, reached }: { position: [number, number], active: boolean, reached: boolean }) => (
  <group position={[position[0] * 4, 0, position[1] * 4]}>
    <mesh position={[0, 2, 0]}>
      <cylinderGeometry args={[0.8, 0.8, 4, 16]} />
      <meshBasicMaterial 
        color={active ? "#3b82f6" : reached ? "#10b981" : "#374151"} 
        transparent
        opacity={active ? 0.4 : 0.1}
      />
    </mesh>
    {active && (
      <>
        <pointLight color="#3b82f6" intensity={15} distance={15} />
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      </>
    )}
  </group>
);

const PlayerCamera = ({ 
  position, 
  targetPosition, 
  isGlimpse, 
  mazeSize, 
  isMoving,
  destination,
  onMove,
  maze,
  gameState
}: { 
  position: [number, number, number], 
  targetPosition: [number, number, number], 
  isGlimpse: boolean, 
  mazeSize: number, 
  isMoving: boolean,
  destination?: [number, number, number],
  onMove?: (newPos: [number, number], rawPos: THREE.Vector3) => void,
  maze: Cell[][],
  gameState: string
}) => {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(targetPosition[0] * 4, 1.8, targetPosition[2] * 4));
  const keys = useRef<{ [key: string]: boolean }>({});
  const lastGridPos = useRef<string>("");

  // Snap camera to player position when starting to play
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'waiting-to-move') {
      camera.position.set(position[0] * 4, 1.8, position[2] * 4);
      lastGridPos.current = `${position[0]},${position[2]}`;
    }
  }, [gameState === 'playing']);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const handleUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);
  
  useFrame((state, delta) => {
    if (isGlimpse) {
      const center = (mazeSize * 4) / 2;
      const targetCamPos = new THREE.Vector3(center, mazeSize * 8, center);
      camera.position.lerp(targetCamPos, delta * 2);
      camera.lookAt(center, 0, center);
    } else {
      // Manual Movement Logic
      if (gameState === 'playing' && onMove) {
        const moveSpeed = 12 * delta;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const sideDirection = new THREE.Vector3();
        sideDirection.crossVectors(camera.up, direction).normalize();

        const moveDelta = new THREE.Vector3();
        if (keys.current['w'] || keys.current['arrowup']) moveDelta.addScaledVector(direction, moveSpeed);
        if (keys.current['s'] || keys.current['arrowdown']) moveDelta.addScaledVector(direction, -moveSpeed);
        if (keys.current['a'] || keys.current['arrowleft']) moveDelta.addScaledVector(sideDirection, moveSpeed);
        if (keys.current['d'] || keys.current['arrowright']) moveDelta.addScaledVector(sideDirection, -moveSpeed);

        if (moveDelta.length() > 0) {
          const padding = 0.4; // Tighter padding
          
          // Try moving X
          const nextPosX = camera.position.clone();
          nextPosX.x += moveDelta.x;
          
          let collisionX = false;
          const checkX = nextPosX.x + (moveDelta.x > 0 ? padding : -padding);
          const gx = Math.round(checkX / 4);
          const gz = Math.round(camera.position.z / 4);
          if (gx < 0 || gx >= mazeSize || gz < 0 || gz >= mazeSize || maze[gx][gz].isWall) {
            collisionX = true;
          }
          
          if (!collisionX) camera.position.x = nextPosX.x;

          // Try moving Z
          const nextPosZ = camera.position.clone();
          nextPosZ.z += moveDelta.z;
          
          let collisionZ = false;
          const checkZ = nextPosZ.z + (moveDelta.z > 0 ? padding : -padding);
          const gzx = Math.round(camera.position.x / 4);
          const gzz = Math.round(checkZ / 4);
          if (gzx < 0 || gzx >= mazeSize || gzz < 0 || gzz >= mazeSize || maze[gzx][gzz].isWall) {
            collisionZ = true;
          }
          
          if (!collisionZ) camera.position.z = nextPosZ.z;

          // Update grid position for logic
          const gridX = Math.round(camera.position.x / 4);
          const gridZ = Math.round(camera.position.z / 4);
          const posKey = `${gridX},${gridZ}`;
          
          // Always notify parent of position for gate detection
          onMove([gridX, gridZ], camera.position);
          lastGridPos.current = posKey;
        }
      } else if (isMoving) {
        // Position lerping for automated turns
        const targetPos = destination ? destination : position;
        const targetVec = new THREE.Vector3(targetPos[0] * 4, 1.8, targetPos[2] * 4);
        const dist = camera.position.distanceTo(targetVec);
        const speed = Math.max(6, dist * 2);
        camera.position.lerp(targetVec, delta * speed);
      }

      // LookAt lerping
      const lookAtVec = new THREE.Vector3(targetPosition[0] * 4, 1.8, targetPosition[2] * 4);
      currentTarget.current.lerp(lookAtVec, delta * 6);
      camera.lookAt(currentTarget.current);

      if (isMoving || (gameState === 'playing' && (keys.current['w'] || keys.current['s'] || keys.current['a'] || keys.current['d']))) {
        camera.position.y = 1.8 + Math.sin(state.clock.elapsedTime * 12) * 0.08;
      }
    }
  });

  return null;
};

// --- Main Component ---
interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface LogicMazeProps {
  topic: string;
  grade?: string;
  limit?: number;
  onPlayAgain?: () => void;
  onExit?: () => void;
  onComplete?: (score: number, total: number) => void;
}

export const LogicMaze: React.FC<LogicMazeProps> = ({ topic, grade = 'Grade 10', limit = 5, onPlayAgain, onExit, onComplete }) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'glimpse' | 'playing' | 'waiting-to-move' | 'moving' | 'finished' | 'loading'>('idle');
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerPosition, setPlayerPosition] = useState<[number, number]>([1, 1]);
  const [targetPosition, setTargetPosition] = useState<[number, number]>([1, 1]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [glimpseTimer, setGlimpseTimer] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [answeredGatesCount, setAnsweredGatesCount] = useState(0);
  const [activeGate, setActiveGate] = useState<[number, number] | null>(null);
  const [lastTriggeredGateIdx, setLastTriggeredGateIdx] = useState(-1);

  useEffect(() => {
    if (topic && gameState === 'idle') {
      // Default to medium for auto-start
      startLevel('medium');
    }
  }, [topic]);

  const mazeSize = useMemo(() => {
    if (difficulty === 'easy') return 11;
    if (difficulty === 'medium') return 15;
    if (difficulty === 'hard') return 21;
    return 11;
  }, [difficulty]);

  const targetPos: [number, number] = useMemo(() => [Math.floor(mazeSize / 2), Math.floor(mazeSize / 2)], [mazeSize]);

  const gates = useMemo(() => {
    const path = findPath(maze, [1, 1], targetPos);
    if (!path) return [];
    const g: [number, number][] = [];
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i-1];
      const curr = path[i];
      const next = path[i+1];
      if (prev[0] !== next[0] && prev[1] !== next[1]) {
        g.push(curr as [number, number]);
      }
    }
    
    // Add a final gate 3 steps before the trophy to ensure a final challenge
    if (path.length > 4) {
      const finalGate = path[path.length - 3] as [number, number];
      if (!g.some(existing => existing[0] === finalGate[0] && existing[1] === finalGate[1])) {
        g.push(finalGate);
      }
    }
    
    // Fallback: If no turns, add gates every 4 steps
    if (g.length === 0) {
      for (let i = 4; i < path.length - 2; i += 4) {
        g.push(path[i] as [number, number]);
      }
    }
    
    // Final fallback: Ensure at least one gate
    if (g.length === 0 && path.length > 4) {
      g.push(path[Math.floor(path.length / 2)] as [number, number]);
    }
    
    return g;
  }, [maze, targetPos]);

  const nextGatePos = useMemo(() => {
    return gates[answeredGatesCount] || null;
  }, [gates, answeredGatesCount]);

  const startLevel = React.useCallback(async (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    setGameState('loading');
    setError(null);

    const finalLimit = limit;

    try {
      const newMaze = generateMaze(mazeSize);
      setMaze(newMaze);
      setPlayerPosition([1, 1]);
      setLastTriggeredGateIdx(-1);

      const randomSeed = Math.floor(Math.random() * 1000000);
      const prompt = `Generate ${finalLimit} unique, creative, and highly varied multiple-choice questions about "${topic}" for ${grade} level students. 
      The difficulty should be ${diff}. 
      If "${topic}" is a specific place, include questions about its geography, landmarks, and culture.
      IMPORTANT: Ensure questions are diverse, cover a wide range of sub-topics, and do not repeat concepts.
      Random seed for variety: ${randomSeed}.
      Return as a JSON array of objects with fields: text, options (array of 4 strings), correctAnswer (index 0-3), and an "explanation" field (string) explaining why the answer is correct.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ["text", "options", "correctAnswer", "explanation"],
            },
          },
        },
      });

      const data = JSON.parse(response.text);
      console.log("Generated Questions:", data);
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Empty questions array");
      }
      
      setQuestions(data);
      setGameState('glimpse');
      setGlimpseTimer(5);
      setTimer(0);
      setCurrentQuestionIndex(0);
      setScore(0);
      setAnsweredGatesCount(0);
      setActiveGate(null);
      setLastTriggeredGateIdx(-1);
    } catch (err) {
      console.error("AI Generation failed, using fallback questions:", err);
      const allFallbacks: Question[] = [
        { text: "What is 15 + 27?", options: ["32", "42", "52", "62"], correctAnswer: 1, explanation: "15 + 27 = 42." },
        { text: "Which logic gate returns TRUE only if both inputs are TRUE?", options: ["OR", "XOR", "AND", "NOT"], correctAnswer: 2, explanation: "The AND gate requires all inputs to be TRUE to output TRUE." },
        { text: "What is the binary representation of 5?", options: ["100", "101", "110", "111"], correctAnswer: 1, explanation: "5 in binary is 101 (4*1 + 2*0 + 1*1)." },
        { text: "Which of these is a primary color?", options: ["Green", "Orange", "Red", "Purple"], correctAnswer: 2, explanation: "Red, Yellow, and Blue are the traditional primary colors." },
        { text: "What is 12 * 8?", options: ["86", "96", "106", "116"], correctAnswer: 1, explanation: "12 * 8 = 96." },
        { text: "What does CPU stand for?", options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Central Processor Utility"], correctAnswer: 1, explanation: "The CPU is the 'brain' of the computer, standing for Central Processing Unit." },
        { text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: 1, explanation: "Mars is called the Red Planet due to iron oxide on its surface." },
        { text: "What is the square root of 144?", options: ["10", "11", "12", "13"], correctAnswer: 2, explanation: "12 * 12 = 144." },
        { text: "In programming, what does 'dry' stand for?", options: ["Don't Repeat Yourself", "Do Repeat Yourself", "Data Retrieval Yield", "Digital Real-time Yield"], correctAnswer: 0, explanation: "DRY is a principle aimed at reducing repetition of software patterns." },
        { text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3, explanation: "The Pacific Ocean is the largest and deepest of Earth's oceanic divisions." }
      ];
      // Shuffle fallbacks
      const shuffled = [...allFallbacks].sort(() => Math.random() - 0.5).slice(0, finalLimit);
      setQuestions(shuffled);
      setGameState('glimpse');
      setGlimpseTimer(5);
      setTimer(0);
      setCurrentQuestionIndex(0);
      setScore(0);
      setAnsweredGatesCount(0);
      setActiveGate(null);
      setLastTriggeredGateIdx(-1);
    }
  }, [topic, grade, limit, mazeSize]);

  useEffect(() => {
    let interval: any;
    if (gameState === 'glimpse') {
      interval = setInterval(() => {
        setGlimpseTimer(prev => {
          if (prev <= 1) {
            setGameState('playing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (['playing', 'waiting-to-move', 'moving'].includes(gameState)) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const handleAnswer = React.useCallback((index: number) => {
    if (isAnswering) return;
    setIsAnswering(true);

    const isCorrect = index === questions[currentQuestionIndex].correctAnswer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
  }, [isAnswering, questions, currentQuestionIndex]);

  const proceedAfterAnswer = React.useCallback(() => {
    if (feedback === 'correct') {
      setScore(s => s + 1);
      const gateIdx = answeredGatesCount;
      setAnsweredGatesCount(prev => prev + 1);
      
      const currentPath = findPath(maze, [1, 1], targetPos);
      const gate = gates[gateIdx];
      
      if (currentPath && gate) {
        const idxInPath = currentPath.findIndex(p => p[0] === gate[0] && p[1] === gate[1]);
        let nextStep = currentPath[idxInPath + 2] || currentPath[idxInPath + 1] || targetPos;
        
        if (nextStep[0] === targetPos[0] && nextStep[1] === targetPos[1]) {
          nextStep = currentPath[idxInPath + 1] || currentPath[idxInPath];
        }
        
        setTargetPosition(nextStep as [number, number]);
        setGameState('moving');
        
        setTimeout(() => {
          setPlayerPosition(nextStep as [number, number]);
          setFeedback(null);
          setIsAnswering(false);
          setGameState('playing');
          setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
        }, 500);
      } else {
        setFeedback(null);
        setIsAnswering(false);
        setGameState('playing');
        setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
      }
    } else {
      setFeedback(null);
      setIsAnswering(false);
      setGameState('playing');
      setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
    }
  }, [feedback, answeredGatesCount, maze, targetPos, gates, questions.length]);

  const handleManualMove = (newPos: [number, number], rawPos: THREE.Vector3) => {
    if (gameState !== 'playing') return;
    
    setPlayerPosition(newPos);

    if (nextGatePos && answeredGatesCount > lastTriggeredGateIdx) {
      const gateWorldX = nextGatePos[0] * 4;
      const gateWorldZ = nextGatePos[1] * 4;
      const dist = new THREE.Vector2(rawPos.x, rawPos.z).distanceTo(new THREE.Vector2(gateWorldX, gateWorldZ));
      const inCell = newPos[0] === nextGatePos[0] && newPos[1] === nextGatePos[1];
      
      // Trigger if within 4.0 units of the center OR if we are in the exact grid cell
      if (dist < 4.0 || inCell) {
        console.log(`Gate ${answeredGatesCount} triggered! Dist: ${dist.toFixed(2)}, InCell: ${inCell}`);
        setLastTriggeredGateIdx(answeredGatesCount);
        setActiveGate(nextGatePos);
        setGameState('waiting-to-move');
        return;
      }
    }

    // Check for Trophy Win (Manual only)
    const distToTrophy = new THREE.Vector2(rawPos.x, rawPos.z).distanceTo(new THREE.Vector2(targetPos[0] * 4, targetPos[1] * 4));
    if (distToTrophy < 1.5) {
      setGameState('finished');
      if (onComplete) {
        onComplete(score, questions.length);
      }
      return;
    }
  };

  // Determine where the camera should look at (next step in path)
  const lookAtTarget = useMemo(() => {
    const path = findPath(maze, playerPosition, targetPos);
    
    if (gameState === 'moving') {
      // When moving, look at the destination (the turn)
      return [targetPosition[0], 1.8, targetPosition[1]] as [number, number, number];
    }

    // When idle/playing, look at the immediate next step in the path
    if (path && path.length > 1) {
      return [path[1][0], 1.8, path[1][1]] as [number, number, number];
    }
    return [targetPos[0], 1.8, targetPos[1]] as [number, number, number];
  }, [maze, playerPosition, targetPos, targetPosition, gameState]);

  if (gameState === 'idle') {
    return (
      <div className="bg-white/60 backdrop-blur-md p-12 rounded-[40px] border border-beige-200 text-center space-y-8">
        <div className="w-20 h-20 bg-beige-100 rounded-2xl flex items-center justify-center mx-auto">
          <Brain className="w-10 h-10 text-beige-400" />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-serif font-bold text-beige-900">3D Logic Maze</h3>
          <p className="text-beige-600 max-w-md mx-auto">
            Navigate through a 3D maze by answering questions about <strong>{topic}</strong>. Correct answers lead you to the trophy!
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">Select Difficulty</p>
          <div className="flex justify-center gap-4">
            {(['easy', 'medium', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => startLevel(diff)}
                className="px-8 py-4 bg-white border-2 border-beige-100 rounded-2xl font-bold uppercase tracking-widest hover:border-beige-800 hover:bg-beige-50 transition-all text-beige-600 hover:text-beige-800"
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {!topic.trim() && (
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-50 py-2 px-4 rounded-xl inline-block">
            Please enter a topic in the generator above first!
          </p>
        )}
        {error && (
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest bg-red-50 py-2 px-4 rounded-xl inline-block">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <Loader2 className="w-16 h-16 text-beige-400 animate-spin" />
        <p className="text-beige-600 font-bold uppercase tracking-widest animate-pulse">Constructing the 3D Maze...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-[40px] overflow-hidden border-4 border-white shadow-2xl bg-black">
      <Canvas shadows camera={{ fov: 75 }}>
          <PlayerCamera 
            position={[playerPosition[0], 1.8, playerPosition[1]]} 
            targetPosition={lookAtTarget}
            isGlimpse={gameState === 'glimpse'} 
            mazeSize={mazeSize}
            isMoving={gameState === 'moving'}
            destination={gameState === 'moving' ? [targetPosition[0], 1.8, targetPosition[1]] : undefined}
            onMove={handleManualMove}
            maze={maze}
            gameState={gameState}
          />
          
          <ambientLight intensity={1.5} />
          <hemisphereLight intensity={1} groundColor="#000000" color="#ffffff" />
          <directionalLight 
            position={[20, 40, 20]} 
            intensity={2.5} 
            castShadow 
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          <pointLight position={[targetPos[0] * 4, 15, targetPos[1] * 4]} intensity={10} color="#fbbf24" distance={100} />
          <pointLight position={[playerPosition[0] * 4, 5, playerPosition[1] * 4]} intensity={4} color="#ffffff" distance={30} />
          
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

          <group>
            {maze.map((row, x) => 
              row.map((cell, z) => 
                cell.isWall ? <Wall key={`${x}-${z}`} position={[x, 0, z]} /> : null
              )
            )}
            <Floor size={mazeSize} />
            <TrophyModel position={[targetPos[0] * 4, 0.5, targetPos[1] * 4]} />
            
            {gates.map((g, i) => (
              <LogicNode 
                key={`gate-${i}`} 
                position={g} 
                active={nextGatePos?.[0] === g[0] && nextGatePos?.[1] === g[1]} 
                reached={i < answeredGatesCount}
              />
            ))}

            {gameState === 'glimpse' && (
              <mesh position={[playerPosition[0] * 4, 0.5, playerPosition[1] * 4]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={2} />
              </mesh>
            )}
          </group>
      </Canvas>

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
        <div className="space-y-2">
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white flex items-center gap-3">
            <Timer className="w-4 h-4 text-beige-300" />
            <span className="font-mono font-bold text-lg">{timer}s</span>
          </div>
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white flex items-center gap-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-bold">{score} Correct</span>
          </div>
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white flex items-center gap-3">
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="font-bold">Gate {answeredGatesCount + 1}/{gates.length}</span>
          </div>
        </div>

        {gameState === 'glimpse' && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-beige-800 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest shadow-xl flex items-center gap-3 animate-bounce">
              <MapIcon className="w-5 h-5" />
              Memorize the Path! ({glimpseTimer}s)
            </div>
            <button 
              onClick={() => setGameState('playing')}
              className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/30 transition-all pointer-events-auto"
            >
              Skip Glimpse
            </button>
          </div>
        )}

        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white flex items-center gap-3">
          <Compass className="w-4 h-4 text-beige-300" />
          <span className="text-xs font-bold uppercase tracking-widest">{difficulty}</span>
        </div>
      </div>

      {/* Question Overlay */}
      <AnimatePresence>
        {(gameState === 'playing' || gameState === 'waiting-to-move') && (
          <motion.div
            key={gameState === 'playing' ? 'manual-ui' : `question-${currentQuestionIndex}-${answeredGatesCount}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-2xl p-8 rounded-[32px] border border-white shadow-2xl space-y-6 z-50 pointer-events-auto"
          >
            {gameState === 'playing' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-beige-100 rounded-xl flex items-center justify-center">
                    <Compass className="w-6 h-6 text-beige-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif font-bold text-beige-900">Manual Exploration</h4>
                    <p className="text-xs text-beige-500 font-bold uppercase tracking-widest">Use WASD or Arrows to find the next Logic Gate</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-beige-50 rounded-lg text-[10px] font-bold text-beige-400 border border-beige-100">W/A/S/D</div>
                  <div className="px-3 py-1 bg-beige-50 rounded-lg text-[10px] font-bold text-beige-400 border border-beige-100">ARROWS</div>
                </div>
              </div>
            ) : (
              <>
                {questions.length > 0 && questions[currentQuestionIndex] ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-beige-400 uppercase tracking-widest">Logic Gate Reached</span>
                        <span className="text-[10px] font-bold text-beige-800 bg-beige-100 px-2 py-1 rounded-full uppercase tracking-widest">Question {currentQuestionIndex + 1}</span>
                      </div>
                      <h4 className="text-xl font-serif font-bold text-beige-900 leading-tight">
                        {questions[currentQuestionIndex].text}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {questions[currentQuestionIndex].options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          disabled={isAnswering}
                          className={cn(
                            "p-4 rounded-xl border-2 text-left text-sm font-bold transition-all flex items-center justify-between group",
                            feedback === null ? "bg-white border-beige-100 text-beige-600 hover:border-beige-800 hover:bg-beige-50" :
                            (questions[currentQuestionIndex] && idx === questions[currentQuestionIndex].correctAnswer) ? "bg-green-100 border-green-500 text-green-700" :
                            "bg-red-50 border-red-200 text-red-400 opacity-50"
                          )}
                        >
                          <span>{option}</span>
                          {feedback !== null && idx === questions[currentQuestionIndex].correctAnswer && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                      ))}
                    </div>

                    {feedback !== null && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-4 border-t border-beige-100"
                      >
                        <div className={cn(
                          "p-4 rounded-xl text-sm font-medium leading-relaxed",
                          feedback === 'correct' ? "bg-green-50 text-green-800 border border-green-100" : "bg-red-50 text-red-800 border border-red-100"
                        )}>
                          <div className="font-bold uppercase tracking-widest text-[10px] mb-1 opacity-70">
                            {feedback === 'correct' ? 'Correct!' : 'Not quite...'}
                          </div>
                          {questions[currentQuestionIndex]?.explanation}
                        </div>
                        <button
                          onClick={proceedAfterAnswer}
                          className="w-full py-4 bg-beige-800 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-beige-900 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                          Next Challenge
                          <Play className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Loader2 className="w-8 h-8 text-beige-400 animate-spin" />
                    <p className="text-beige-600 font-bold uppercase tracking-widest">Loading Question...</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {gameState === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-beige-900/90 backdrop-blur-xl flex items-center justify-center p-12 text-center"
          >
            <div className="space-y-8 max-w-md">
              <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-yellow-400/20">
                <Trophy className="w-12 h-12 text-beige-900" />
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-serif font-bold text-white">Maze Conquered!</h3>
                <p className="text-beige-300">You reached the trophy in {timer} seconds with {score} correct answers.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onPlayAgain}
                  className="w-full py-4 bg-white text-beige-900 rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-100 transition-all shadow-xl"
                >
                  Play Again
                </button>
                {onExit && (
                  <button
                    onClick={onExit}
                    className="w-full py-4 bg-beige-800 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-beige-700 transition-all shadow-xl"
                  >
                    Exit to Hub
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
