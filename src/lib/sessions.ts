import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
  type Transaction,
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
  type Session,
  type DomainId,
  type QuizAttempt,
  QUIZ_PASS_THRESHOLD,
} from '@/types';
import { awardPoints } from './points';

/**
 * Seed initial sessions for a domain if none exist yet.
 * This lets the Learn tab be usable immediately without manual data entry.
 * Keyed by the real 7 GDG track ids — must stay in sync with DOMAINS in types.ts.
 */
const SEED_SESSIONS: Record<DomainId, Omit<Session, 'id'>[]> = {
  ml: [
    {
      title: 'Machine Learning Basics',
      domain: 'ml',
      date: '2025-01-18',
      resourceLinks: [
        { label: 'Google ML Crash Course', url: 'https://developers.google.com/machine-learning/crash-course' },
        { label: 'Scikit-learn Tutorial', url: 'https://scikit-learn.org/stable/tutorial/index.html' },
      ],
      quizQuestions: [
        { question: 'What is supervised learning?', options: ['Learning without labels', 'Learning from labeled training data', 'Learning by reinforcement', 'Learning by clustering'], correctIndex: 1 },
        { question: 'Which problem type predicts a category?', options: ['Regression', 'Classification', 'Clustering', 'Dimensionality reduction'], correctIndex: 1 },
        { question: 'What does overfitting mean?', options: ['Model performs well on training but poorly on new data', 'Model performs poorly on all data', 'Model is too simple', 'Model has too little data'], correctIndex: 0 },
        { question: 'Which metric measures classification accuracy?', options: ['MSE', 'R²', 'F1 score', 'Silhouette'], correctIndex: 2 },
        { question: 'What is gradient descent?', options: ['A clustering algorithm', 'An optimization algorithm', 'A data preprocessing step', 'A neural network architecture'], correctIndex: 1 },
      ],
    },
    {
      title: 'Neural Networks & Deep Learning Basics',
      domain: 'ml',
      date: '2025-01-25',
      resourceLinks: [
        { label: '3Blue1Brown: Neural Networks', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi' },
        { label: 'freeCodeCamp: Deep Learning', url: 'https://www.freecodecamp.org/learn/machine-learning-with-python/' },
      ],
      quizQuestions: [
        { question: 'What is a perceptron?', options: ['A type of database', 'The simplest unit of a neural network', 'A loss function', 'A data augmentation technique'], correctIndex: 1 },
        { question: 'What does an activation function do?', options: ['Stores weights', 'Introduces non-linearity into the network', 'Loads training data', 'Splits the dataset'], correctIndex: 1 },
        { question: 'What is backpropagation used for?', options: ['Data cleaning', 'Updating weights by propagating error backward', 'Visualizing data', 'Feature selection'], correctIndex: 1 },
        { question: 'Which layer type is most associated with image recognition?', options: ['Recurrent layer', 'Convolutional layer', 'Embedding layer', 'Pooling only'], correctIndex: 1 },
      ],
    },
  ],
  web: [
    {
      title: 'HTML & CSS Fundamentals',
      domain: 'web',
      date: '2025-01-15',
      resourceLinks: [
        { label: 'MDN: HTML Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML' },
        { label: 'MDN: CSS First Steps', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps' },
      ],
      quizQuestions: [
        { question: 'Which HTML tag is used to create a hyperlink?', options: ['<link>', '<a>', '<href>', '<url>'], correctIndex: 1 },
        { question: 'What CSS property controls text color?', options: ['font-color', 'text-style', 'color', 'foreground'], correctIndex: 2 },
        { question: 'Which selector targets an element with id "main"?', options: ['.main', '#main', '*main', 'main'], correctIndex: 1 },
        { question: 'What does the CSS box model consist of?', options: ['margin, border, padding, content', 'header, body, footer, sidebar', 'width, height, color, font', 'top, right, bottom, left'], correctIndex: 0 },
        { question: 'Which display value makes an element behave like a block?', options: ['inline', 'block', 'none', 'flex'], correctIndex: 1 },
      ],
    },
    {
      title: 'JavaScript Essentials',
      domain: 'web',
      date: '2025-01-22',
      resourceLinks: [
        { label: 'MDN: JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' },
        { label: 'javascript.info', url: 'https://javascript.info' },
      ],
      quizQuestions: [
        { question: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'function', 'global'], correctIndex: 1 },
        { question: 'What does === check in JavaScript?', options: ['Only value equality', 'Only type equality', 'Both value and type equality', 'Reference equality only'], correctIndex: 2 },
        { question: 'Which method adds an element to the end of an array?', options: ['push()', 'add()', 'append()', 'insert()'], correctIndex: 0 },
        { question: 'What is a Promise in JavaScript?', options: ['A callback function', 'An object representing async completion', 'A loop construct', 'A type of variable'], correctIndex: 1 },
        { question: 'Which operator is used for optional chaining?', options: ['?.', '->', '::', '?.()'], correctIndex: 0 },
      ],
    },
  ],
  app: [
    {
      title: 'Android App Development Basics',
      domain: 'app',
      date: '2025-01-25',
      resourceLinks: [
        { label: 'Android Developers', url: 'https://developer.android.com/courses' },
        { label: 'Jetpack Compose', url: 'https://developer.android.com/jetpack/compose' },
      ],
      quizQuestions: [
        { question: 'What language is recommended for modern Android development?', options: ['Java', 'Kotlin', 'Swift', 'Dart'], correctIndex: 1 },
        { question: 'What is Jetpack Compose?', options: ['A build tool', 'A declarative UI toolkit', 'A testing framework', 'A database library'], correctIndex: 1 },
        { question: 'What is an Activity in Android?', options: ['A background service', 'A single screen with a UI', 'A data model', 'A layout file'], correctIndex: 1 },
        { question: 'Which file declares app permissions?', options: ['build.gradle', 'AndroidManifest.xml', 'settings.gradle', 'strings.xml'], correctIndex: 1 },
        { question: 'What is the recommended architecture for Android apps?', options: ['MVC only', 'MVVM with Jetpack', 'Monolithic', 'No architecture'], correctIndex: 1 },
      ],
    },
    {
      title: 'Cross-Platform Apps with Flutter',
      domain: 'app',
      date: '2025-02-01',
      resourceLinks: [
        { label: 'Flutter: Get Started', url: 'https://docs.flutter.dev/get-started/install' },
        { label: 'Flutter Widget Catalog', url: 'https://docs.flutter.dev/ui/widgets' },
      ],
      quizQuestions: [
        { question: 'What language does Flutter use?', options: ['Kotlin', 'Swift', 'Dart', 'JavaScript'], correctIndex: 2 },
        { question: 'In Flutter, what is a Widget?', options: ['A database table', 'The basic building block of the UI', 'A network request', 'A build script'], correctIndex: 1 },
        { question: 'What is the difference between StatelessWidget and StatefulWidget?', options: ['No difference', 'StatefulWidget can hold mutable state that changes over time', 'StatelessWidget is faster always', 'StatefulWidget cannot rebuild'], correctIndex: 1 },
        { question: 'What is hot reload used for?', options: ['Publishing to app stores', 'Seeing code changes instantly without losing app state', 'Compiling for production', 'Running unit tests'], correctIndex: 1 },
      ],
    },
  ],
  cloud: [
    {
      title: 'Cloud Computing Foundations',
      domain: 'cloud',
      date: '2025-01-20',
      resourceLinks: [
        { label: 'Google Cloud Learn', url: 'https://cloud.google.com/learn' },
        { label: 'AWS Training', url: 'https://aws.amazon.com/training/' },
      ],
      quizQuestions: [
        { question: 'What is IaaS?', options: ['Infrastructure as a Service', 'Internet as a Service', 'Integration as a Service', 'Information as a Service'], correctIndex: 0 },
        { question: 'Which is a characteristic of cloud computing?', options: ['Fixed resource allocation', 'On-demand self-service', 'Physical hardware management', 'Limited scalability'], correctIndex: 1 },
        { question: 'What is a container in cloud computing?', options: ['A type of virtual machine', 'A lightweight package of software and dependencies', 'A storage bucket', 'A network protocol'], correctIndex: 1 },
        { question: 'Which service model provides managed platforms?', options: ['IaaS', 'PaaS', 'SaaS', 'DaaS'], correctIndex: 1 },
        { question: 'What is auto-scaling?', options: ['Manually adding servers', 'Automatically adjusting resources based on load', 'Fixed resource allocation', 'A billing model'], correctIndex: 1 },
      ],
    },
    {
      title: 'Docker & Containers Basics',
      domain: 'cloud',
      date: '2025-01-28',
      resourceLinks: [
        { label: 'Docker: Get Started', url: 'https://docs.docker.com/get-started/' },
        { label: 'freeCodeCamp: Docker Course', url: 'https://www.freecodecamp.org/news/docker-simplified-96639a35ff36/' },
      ],
      quizQuestions: [
        { question: 'What is a Docker image?', options: ['A running container', 'A read-only template used to create containers', 'A virtual machine', 'A cloud region'], correctIndex: 1 },
        { question: 'What file is used to define a Docker image?', options: ['docker.yaml', 'Dockerfile', 'container.json', 'image.config'], correctIndex: 1 },
        { question: 'How is a container different from a virtual machine?', options: ['No difference', 'Containers share the host OS kernel and are more lightweight', 'Containers always need more resources', 'VMs boot faster'], correctIndex: 1 },
        { question: 'Which command lists running containers?', options: ['docker ps', 'docker list', 'docker show', 'docker status'], correctIndex: 0 },
      ],
    },
  ],
  dsa: [
    {
      title: 'Arrays, Time & Space Complexity',
      domain: 'dsa',
      date: '2025-01-17',
      resourceLinks: [
        { label: 'freeCodeCamp: Big O Notation', url: 'https://www.freecodecamp.org/news/big-o-notation-why-it-matters-and-why-it-doesnt-1674cfa8a23c/' },
        { label: 'GeeksforGeeks: Arrays', url: 'https://www.geeksforgeeks.org/array-data-structure/' },
      ],
      quizQuestions: [
        { question: 'What is the time complexity of accessing an element by index in an array?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctIndex: 2 },
        { question: 'What does Big O notation describe?', options: ['Exact runtime in seconds', 'Worst-case growth rate of an algorithm', 'Memory address size', 'Number of variables used'], correctIndex: 1 },
        { question: 'What is the time complexity of linear search in the worst case?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctIndex: 2 },
        { question: 'What is the time complexity of binary search on a sorted array?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctIndex: 1 },
        { question: 'Space complexity measures:', options: ['CPU cycles used', 'Extra memory an algorithm uses relative to input size', 'Number of function calls', 'Disk read speed'], correctIndex: 1 },
      ],
    },
    {
      title: 'Recursion & Sorting Algorithms',
      domain: 'dsa',
      date: '2025-01-24',
      resourceLinks: [
        { label: 'GeeksforGeeks: Recursion', url: 'https://www.geeksforgeeks.org/recursion/' },
        { label: 'freeCodeCamp: Sorting Algorithms', url: 'https://www.freecodecamp.org/news/sorting-algorithms-explained/' },
      ],
      quizQuestions: [
        { question: 'What must every recursive function have to avoid infinite recursion?', options: ['A loop', 'A base case', 'A global variable', 'A return type of void'], correctIndex: 1 },
        { question: 'What is the average time complexity of Merge Sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctIndex: 1 },
        { question: 'Which sorting algorithm has the best worst-case guarantee among these?', options: ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Selection Sort'], correctIndex: 2 },
        { question: 'What data structure is commonly used to implement recursion internally?', options: ['Queue', 'Stack (call stack)', 'Heap', 'Linked list'], correctIndex: 1 },
      ],
    },
  ],
  cyber: [
    {
      title: 'Network Security Fundamentals',
      domain: 'cyber',
      date: '2025-01-19',
      resourceLinks: [
        { label: 'Google SAIF Overview', url: 'https://safety.google/cybersecurity-advancements/saif/' },
        { label: 'freeCodeCamp: Cybersecurity Basics', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/' },
      ],
      quizQuestions: [
        { question: 'What does a firewall primarily do?', options: ['Speeds up the network', 'Filters traffic based on security rules', 'Encrypts all files', 'Backs up data'], correctIndex: 1 },
        { question: 'What is the main difference between a SYN scan and a full connect scan?', options: ['No difference', 'A SYN scan never completes the TCP handshake, making it stealthier', 'A connect scan is always illegal', 'SYN scans only work on UDP'], correctIndex: 1 },
        { question: 'What is phishing?', options: ['A type of firewall', 'Tricking users into revealing sensitive information', 'A network protocol', 'An encryption algorithm'], correctIndex: 1 },
        { question: 'What does VPN stand for?', options: ['Virtual Private Network', 'Verified Public Node', 'Virtual Protected Node', 'Verified Private Network'], correctIndex: 0 },
        { question: 'What is a DDoS attack?', options: ['A type of encryption', 'Overwhelming a system with traffic to make it unavailable', 'A password cracking method', 'A firewall configuration'], correctIndex: 1 },
      ],
    },
    {
      title: 'Web Application Security Basics',
      domain: 'cyber',
      date: '2025-01-26',
      resourceLinks: [
        { label: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
        { label: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security' },
      ],
      quizQuestions: [
        { question: 'What is SQL Injection?', options: ['A CSS bug', 'Inserting malicious SQL through unvalidated input', 'A type of firewall', 'A network protocol'], correctIndex: 1 },
        { question: 'What does XSS stand for?', options: ['Extra Secure Session', 'Cross-Site Scripting', 'External Site Sync', 'X-Server Security'], correctIndex: 1 },
        { question: 'Why should passwords be hashed rather than stored in plain text?', options: ['To save storage space', 'So even if the database is breached, raw passwords are not exposed', 'To make login faster', 'It is not necessary'], correctIndex: 1 },
        { question: 'What is the purpose of input validation?', options: ['Improve UI design', 'Prevent malicious or malformed data from being processed', 'Speed up page load', 'Reduce server cost'], correctIndex: 1 },
      ],
    },
  ],
  iot: [
    {
      title: 'Introduction to IoT & Embedded Systems',
      domain: 'iot',
      date: '2025-01-21',
      resourceLinks: [
        { label: 'Arduino: Getting Started', url: 'https://docs.arduino.cc/learn/' },
        { label: 'freeCodeCamp: IoT Basics', url: 'https://www.freecodecamp.org/news/tag/iot/' },
      ],
      quizQuestions: [
        { question: 'What does IoT stand for?', options: ['Internet of Technology', 'Internet of Things', 'Integration of Tools', 'Internal Operating Terminal'], correctIndex: 1 },
        { question: 'What is a microcontroller?', options: ['A cloud server', 'A small computer on a single chip used to control devices', 'A type of router', 'A database engine'], correctIndex: 1 },
        { question: 'Which protocol is commonly used for lightweight IoT messaging?', options: ['MQTT', 'FTP', 'SMTP', 'SSH'], correctIndex: 0 },
        { question: 'What is an embedded system?', options: ['A general-purpose desktop computer', 'A dedicated computer system built into a larger device to perform specific tasks', 'A cloud database', 'A programming language'], correctIndex: 1 },
      ],
    },
    {
      title: 'Sensors, Actuators & Microcontrollers',
      domain: 'iot',
      date: '2025-01-29',
      resourceLinks: [
        { label: 'Raspberry Pi Documentation', url: 'https://www.raspberrypi.com/documentation/' },
        { label: 'Arduino: Sensors Guide', url: 'https://docs.arduino.cc/learn/electronics/sensors' },
      ],
      quizQuestions: [
        { question: 'What does a sensor do in an IoT system?', options: ['Sends power to the device', 'Detects and measures a physical property like temperature or motion', 'Stores data permanently', 'Encrypts data'], correctIndex: 1 },
        { question: 'What is an actuator?', options: ['A component that senses light', 'A component that performs a physical action based on a signal, like a motor', 'A cloud storage unit', 'A network switch'], correctIndex: 1 },
        { question: 'Which board is widely used for beginner IoT prototyping?', options: ['Arduino Uno', 'MacBook Pro', 'Cisco Router', 'Xbox Series X'], correctIndex: 0 },
        { question: 'What is GPIO on a microcontroller?', options: ['A graphics chip', 'General Purpose Input/Output pins used to connect sensors and actuators', 'A cloud API', 'A type of battery'], correctIndex: 1 },
      ],
    },
  ],
  others: [],
};

export async function fetchSessions(domain: DomainId): Promise<Session[]> {
  const q = query(
    collection(db, 'sessions'),
    where('domain', '==', domain),
    orderBy('date'),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    await seedSessions(domain);
    const reSnap = await getDocs(q);
    return reSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
  }

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
}

async function seedSessions(domain: DomainId): Promise<void> {
  const seeds = SEED_SESSIONS[domain];
  if (!seeds || seeds.length === 0) return;
  for (const s of seeds) {
    const ref = doc(collection(db, 'sessions'));
    await setDoc(ref, { ...s, createdAt: serverTimestamp() });
  }
}

/**
 * Get a quiz attempt for a user+session, if it exists.
 * Document ID is deterministic: {userId}_{sessionId}
 */
export async function getQuizAttempt(
  userId: string,
  sessionId: string,
): Promise<QuizAttempt | null> {
  const ref = doc(db, 'quizAttempts', `${userId}_${sessionId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as QuizAttempt;
}

/**
 * Submit a quiz attempt. If the user passes (>= 70%) and hasn't already
 * received points for this session, award +20 Learn points atomically.
 *
 * A failed attempt may be retried — the attempt document is only written
 * when the user passes. If they already have a passing attempt, return
 * the existing result without awarding additional points.
 */
export async function submitQuizAttempt(args: {
  userId: string;
  sessionId: string;
  domain: DomainId;
  answers: number[];
  questions: { correctIndex: number }[];
}): Promise<{
  score: number;
  passed: boolean;
  pointsAwarded: boolean;
}> {
  const { userId, sessionId, domain, answers, questions } = args;

  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].correctIndex) correct++;
  }
  const score = correct / questions.length;
  const passed = score >= QUIZ_PASS_THRESHOLD;

  if (!passed) {
    return { score, passed: false, pointsAwarded: false };
  }

  const attemptId = `${userId}_${sessionId}`;
  const attemptRef = doc(db, 'quizAttempts', attemptId);

  const result = await runTransaction(db, async (tx: Transaction) => {
    const attemptSnap = await tx.get(attemptRef);
    if (attemptSnap.exists()) {
      const existing = attemptSnap.data() as QuizAttempt;
      return {
        score: existing.score,
        passed: existing.passed,
        pointsAwarded: false,
      };
    }

    tx.set(attemptRef, {
      userId,
      sessionId,
      score,
      passed: true,
      pointsAwarded: true,
      awardedAt: serverTimestamp(),
    });

    return { score, passed: true, pointsAwarded: true };
  });

  if (result.pointsAwarded) {
    await awardPoints({
      userId,
      sourceType: 'quiz',
      sourceId: sessionId,
      category: 'learn',
      domain,
    });
  }

  return result;
}
