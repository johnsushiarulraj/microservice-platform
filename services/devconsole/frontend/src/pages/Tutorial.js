import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    id: 'prerequisites',
    title: 'Prerequisites',
    content: [
      { type: 'text', value: 'Before you start, make sure you have the following installed on your machine:' },
      { type: 'list', items: [
        'Docker Desktop — running with at least 8GB RAM allocated',
        'Kind — Kubernetes in Docker (brew install kind or choco install kind)',
        'kubectl — Kubernetes CLI (comes with Docker Desktop)',
        'Helm — Kubernetes package manager (brew install helm or choco install kubernetes-helm)',
        'Java 11+ — for building services (brew install openjdk@11)',
        'Maven 3.8+ — for building services (brew install maven)',
        'jq — JSON processor, used by deploy scripts (brew install jq or choco install jq)',
        'Git — for cloning the repo',
      ]},
      { type: 'tip', value: 'On macOS: brew install kind kubectl helm openjdk@11 maven jq git. On Windows: choco install kind kubernetes-cli kubernetes-helm jq maven git' },
    ],
  },
  {
    id: 'clone',
    title: 'Clone the Repository',
    content: [
      { type: 'text', value: 'Clone the microservice-platform repository from GitHub:' },
      { type: 'code', value: 'git clone https://github.com/johnsushiarulraj/microservice-platform.git\ncd microservice-platform' },
      { type: 'text', value: 'The repository contains everything: infrastructure configs, the DevConsole, API Gateway, service template, and scripts.' },
      { type: 'heading', value: 'Repository Structure' },
      { type: 'code', value: `microservice-platform/
├── services/
│   ├── devconsole/         # Management console (this UI)
│   ├── api-gateway/        # Spring Cloud Gateway
│   └── template/           # Service template + rename script
├── infrastructure/
│   ├── helm/               # Helm charts for all services
│   ├── kubernetes/         # K8s manifests (Keycloak, Kafka, etc.)
│   └── kind/               # Kind cluster configuration
├── scripts/
│   ├── start-infra.sh      # Start everything
│   └── stop-infra.sh       # Stop everything
└── PLAN.md` },
    ],
  },
  {
    id: 'start',
    title: 'Start the Infrastructure',
    content: [
      { type: 'text', value: 'Run the start script. It creates a 3-node Kubernetes cluster and deploys all infrastructure services:' },
      { type: 'code', value: './scripts/start-infra.sh' },
      { type: 'text', value: 'This takes about 5-10 minutes on first run. The script:' },
      { type: 'list', items: [
        'Creates a Kind cluster with 3 nodes (1 control plane + 2 workers)',
        'Installs PostgreSQL, Redis via Helm',
        'Deploys Kafka via Strimzi operator',
        'Deploys LocalStack (S3, SQS, DynamoDB)',
        'Deploys OpenSearch for full-text search',
        'Deploys Keycloak for authentication',
        'Installs Prometheus + Grafana + Loki for observability',
        'Deploys the API Gateway and DevConsole',
        'Re-deploys any previously deployed user services',
        'Sets up port-forwards so everything is accessible on localhost',
      ]},
      { type: 'heading', value: 'Verify Everything is Running' },
      { type: 'code', value: 'kubectl get pods -n payments' },
      { type: 'text', value: 'All pods should show Running or Completed status. The platform is ready when you can access:' },
      { type: 'code', value: `# DevConsole (this UI)
http://localhost:18090/devconsole/

# Direct service access (for debugging)
http://localhost:18081    # Keycloak Admin
http://localhost:13000    # Grafana
http://localhost:18002    # Kafka UI` },
      { type: 'warning', value: 'Port-forwards can die. If something stops working, restart them with: kubectl port-forward -n payments svc/api-gateway 18090:8090' },
    ],
  },
  {
    id: 'create-service',
    title: 'Create Your First Service',
    content: [
      { type: 'text', value: 'Now create a microservice. Go to the Create Service page and follow the 3-step wizard:' },
      { type: 'heading', value: 'Step 1: Configure' },
      { type: 'list', items: [
        'Artifact — e.g. order, payment, inventory (this sets your Java package, context path, and Kafka topics)',
        'Service Name — auto-generated from artifact (e.g. order-service)',
        'Description — optional, for your reference',
      ]},
      { type: 'heading', value: 'Step 2: Dependencies' },
      { type: 'text', value: 'Select the infrastructure your service needs. All 11 are pre-selected by default and pre-configured to work with the platform:' },
      { type: 'list', items: [
        'PostgreSQL + Liquibase — relational database with schema migrations',
        'Redis Cache — in-memory caching with TTL',
        'Kafka — event streaming (Spring Cloud Stream)',
        'SQS — task queues (AWS SDK via LocalStack)',
        'S3 — file storage (AWS SDK via LocalStack)',
        'DynamoDB — NoSQL key-value store (via LocalStack)',
        'OpenSearch — full-text search',
        'Keycloak OAuth2 — JWT authentication with auto-provisioned realm',
        'Prometheus + Grafana — metrics export and dashboards',
        'Distributed Tracing + Loki — centralized logging',
        'Circuit Breaker — Resilience4j retry and fallback',
      ]},
      { type: 'tip', value: 'Keep all dependencies selected for the full experience. The scaffold removes unused source files and Maven dependencies for anything you deselect.' },
      { type: 'heading', value: 'Step 3: Review & Download' },
      { type: 'text', value: 'Review your configuration and click "Download ZIP". You\'ll get a complete Spring Boot project with:' },
      { type: 'list', items: [
        'Java source code with CRUD endpoints, Kafka consumers, Saga pattern, and outbox',
        'Liquibase migrations for your database schema',
        'deploy.sh / deploy.bat — one-command build + provision + deploy',
        'provision.yml — declares all infrastructure your service needs',
        'Dockerfile, build scripts, test scripts, and README',
      ]},
      { type: 'code', value: `# Extract the downloaded ZIP
unzip order-service.zip
cd order-service` },
    ],
  },
  {
    id: 'build-deploy',
    title: 'Build & Deploy',
    content: [
      { type: 'text', value: 'Deploy your service with a single command. The deploy script handles everything:' },
      { type: 'heading', value: 'One-Command Deploy' },
      { type: 'code', value: `# macOS / Linux / Git Bash
./deploy.sh 1.0.0

# Windows (Command Prompt or PowerShell)
deploy.bat 1.0.0` },
      { type: 'text', value: 'The deploy script runs 4 steps automatically:' },
      { type: 'list', items: [
        '[1/4] Build JAR — runs mvn clean package (compiles your Java code)',
        '[2/4] Build Docker image — packages the JAR into a container',
        '[3/4] Load into Kind — makes the image available to Kubernetes',
        '[4/4] Deploy — provisions all infrastructure from provision.yml and starts the service via Helm',
      ]},
      { type: 'heading', value: 'What Gets Provisioned' },
      { type: 'text', value: 'Based on your provision.yml, the platform automatically creates:' },
      { type: 'list', items: [
        'A PostgreSQL database with its own user and password',
        'Kafka topics (e.g. order-events, order-events-dlq)',
        'SQS queues, S3 buckets, DynamoDB tables (via LocalStack)',
        'OpenSearch indices for full-text search',
        'A Keycloak realm with a client, roles, and a test user (testuser / 1Johnsushil)',
        'A gateway route so your service is reachable at http://localhost:18090/<context-path>',
      ]},
      { type: 'heading', value: 'Verify Deployment' },
      { type: 'text', value: 'After the deploy script finishes, check the DevConsole:' },
      { type: 'list', items: [
        'Sign in to the DevConsole (testuser / 1Johnsushil)',
        'Go to Services — your service should appear under "Your Services" with a green DEPLOYED badge',
        'Go to Logs — select your service from the dropdown to see live Spring Boot logs',
        'Or check via CLI:',
      ]},
      { type: 'code', value: `# Check your service is running
kubectl get pods -n payments | grep order

# Health check through the gateway
curl http://localhost:18090/order/actuator/health` },
      { type: 'tip', value: 'The service takes 60-90 seconds to start (Spring Boot boot time). The health endpoint returns {"status":"UP"} with database and Redis status once ready.' },
    ],
  },
  {
    id: 'test-api',
    title: 'Test Your API',
    content: [
      { type: 'text', value: 'Your service comes with working CRUD endpoints secured by Keycloak JWT. Here\'s how to test them — just like you would in Postman.' },
      { type: 'heading', value: '1. Get a Bearer Token' },
      { type: 'text', value: 'The deploy script created a Keycloak realm for your service with a test user. Get a token:' },
      { type: 'code', value: `# Replace "order" with your artifact name throughout
TOKEN=$(curl -s -X POST http://localhost:18081/auth/realms/order/protocol/openid-connect/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=password" \\
  -d "client_id=order-service" \\
  -d "client_secret=order-service-secret" \\
  -d "username=testuser" \\
  -d "password=1Johnsushil" | jq -r .access_token)

echo $TOKEN` },
      { type: 'text', value: 'In Postman, create a POST request to the token URL above with Body type "x-www-form-urlencoded" and the same fields. Copy the access_token from the response and use it as a Bearer token.' },
      { type: 'heading', value: '2. Health Check (no auth needed)' },
      { type: 'code', value: 'curl http://localhost:18090/order/actuator/health' },
      { type: 'heading', value: '3. Create an Item' },
      { type: 'code', value: `curl -X POST http://localhost:18090/order/api/v1/templates \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My First Item", "description": "Created from the tutorial", "amount": 29.99, "currency": "USD"}'` },
      { type: 'heading', value: '4. List Items' },
      { type: 'code', value: `curl -H "Authorization: Bearer $TOKEN" \\
  http://localhost:18090/order/api/v1/templates` },
      { type: 'heading', value: '5. Swagger UI' },
      { type: 'text', value: 'Your service includes OpenAPI documentation. Open in your browser:' },
      { type: 'code', value: 'http://localhost:18090/order/swagger-ui.html' },
      { type: 'heading', value: 'Postman Setup' },
      { type: 'text', value: 'To set up Postman for your service:' },
      { type: 'list', items: [
        'Create a new collection for your service',
        'Add an "Authorization" tab → Type: Bearer Token',
        'Set up a Pre-request Script to auto-fetch the token (or paste it manually)',
        'Token URL: http://localhost:18081/auth/realms/<your-artifact>/protocol/openid-connect/token',
        'Client ID: <your-service-name> (e.g. order-service)',
        'Client Secret: <your-service-name>-secret (e.g. order-service-secret)',
        'Username: testuser, Password: 1Johnsushil',
      ]},
      { type: 'tip', value: 'Tokens expire after 5 minutes. If you get a 401, request a fresh token. The client secret follows the pattern: {service-name}-secret.' },
    ],
  },
  {
    id: 'devconsole-tools',
    title: 'DevConsole Tools',
    content: [
      { type: 'text', value: 'The DevConsole gives you visibility into your service and the platform infrastructure:' },
      { type: 'heading', value: 'Dashboard' },
      { type: 'text', value: 'Shows infrastructure health (PostgreSQL, Redis, Kafka, LocalStack, Keycloak, OpenSearch) and all deployed services at a glance. Green means healthy.' },
      { type: 'heading', value: 'Services Page' },
      { type: 'text', value: 'Shows your deployed services with pod status (green/yellow/red), version tag, and action buttons:' },
      { type: 'list', items: [
        'Logs — jump to the Logs page filtered to this service',
        'Refresh — re-check pod status',
        'Destroy — remove the service and optionally deprovision all infrastructure',
      ]},
      { type: 'heading', value: 'Logs Page' },
      { type: 'text', value: 'Live log viewer with a terminal-style display. Select a service from the dropdown, set the number of tail lines, and optionally filter by keyword. Auto-refresh keeps it live.' },
      { type: 'heading', value: 'Infrastructure Tools' },
      { type: 'text', value: 'Quick links in the sidebar connect you to:' },
      { type: 'list', items: [
        'SQS Queues — view and manage your task queues',
        'S3 Storage — browse buckets and objects',
        'Grafana — dashboards, metrics, and log queries',
        'Prometheus — raw metrics and alerting rules',
        'pgAdmin — PostgreSQL admin UI for browsing your database',
        'Kafka UI — inspect topics, messages, and consumer groups',
        'OpenSearch — full-text search management',
        'DynamoDB — NoSQL table browser',
        'Keycloak — manage realms, users, and clients',
      ]},
      { type: 'tip', value: 'Each deployed service gets its own database, Kafka topics, SQS queues, and Keycloak realm — fully isolated, just like production.' },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure Overview',
    content: [
      { type: 'text', value: 'Here\'s what each component does and how your service connects to it:' },
      { type: 'table', headers: ['Service', 'Purpose', 'Your Service Uses It For'],
        rows: [
          ['PostgreSQL', 'Relational database', 'Storing data, JPA entities, Liquibase migrations'],
          ['Redis', 'In-memory cache', 'Caching hot data, session storage, rate limiting'],
          ['Kafka (Strimzi)', 'Event streaming', 'Publishing domain events, async communication between services'],
          ['LocalStack (S3)', 'Object storage', 'File uploads, document storage'],
          ['LocalStack (SQS)', 'Message queues', 'Task processing, async job queues'],
          ['LocalStack (DynamoDB)', 'NoSQL database', 'High-throughput key-value data'],
          ['OpenSearch', 'Search engine', 'Full-text search, log analytics'],
          ['Keycloak', 'Identity & auth', 'JWT tokens, OAuth2, user management'],
          ['Spring Cloud Gateway', 'API gateway', 'Routing, rate limiting, circuit breaking'],
          ['Prometheus', 'Metrics collection', 'Application metrics, JVM stats, custom counters'],
          ['Grafana', 'Dashboards', 'Visualizing metrics, logs, traces'],
          ['Loki', 'Log aggregation', 'Centralized logging from all services'],
        ]
      },
      { type: 'heading', value: 'How Services Connect' },
      { type: 'text', value: 'All services run in the "payments" Kubernetes namespace. Your service connects to infrastructure using internal DNS names (e.g., postgres-postgresql.payments.svc.cluster.local). The service template has all connection strings pre-configured — you don\'t need to change anything.' },
      { type: 'heading', value: 'Provisioning' },
      { type: 'text', value: 'When you run deploy.sh, the platform reads your provision.yml and creates exactly the infrastructure your service needs. Each service gets isolated resources:' },
      { type: 'code', value: `# Example provision.yml (auto-generated from the wizard)
service: order-service
context-path: /order

database:
  name: order

kafka:
  topics:
    - order-events
    - order-events-dlq

keycloak:
  realm: order
  client: order-service
  roles:
    - ORDER_USER
    - ORDER_ADMIN` },
      { type: 'tip', value: 'External access goes through the API Gateway on port 18090. Internal service-to-service calls use Kubernetes DNS. This mirrors how production environments work.' },
    ],
  },
  {
    id: 'destroy',
    title: 'Destroy & Clean Up',
    content: [
      { type: 'text', value: 'When you\'re done, clean up your resources:' },
      { type: 'heading', value: 'Destroy a Service' },
      { type: 'text', value: 'From the DevConsole, go to Services, find your service, and click Destroy. This:' },
      { type: 'list', items: [
        'Removes the Helm release and running pods',
        'Deprovisions all infrastructure — drops the database, deletes Kafka topics, SQS queues, S3 buckets, DynamoDB tables, OpenSearch indices',
        'Removes the Keycloak realm',
        'Removes the gateway route',
      ]},
      { type: 'text', value: 'You can also destroy via CLI:' },
      { type: 'code', value: `curl -X DELETE "http://localhost:18090/devconsole/api/services/order-service?deprovision=true"` },
      { type: 'heading', value: 'Stop the Platform' },
      { type: 'code', value: `# Stop everything (preserves data for next time)
./scripts/stop-infra.sh

# Stop and delete ALL data (fresh start)
./scripts/stop-infra.sh --clean` },
      { type: 'text', value: 'Without --clean, your PostgreSQL data, Kafka topics, and deployed services are preserved across restarts. With --clean, everything is wiped for a fresh start.' },
      { type: 'heading', value: 'Restart the Platform' },
      { type: 'code', value: `# Start again — data is still there, services auto-redeploy
./scripts/start-infra.sh

# If port-forwards die (they do sometimes)
kubectl port-forward -n payments svc/api-gateway 18090:8090` },
      { type: 'tip', value: 'Previously deployed services are automatically redeployed when you restart the platform. Your data persists across restarts.' },
    ],
  },
  {
    id: 'credentials',
    title: 'Default Credentials',
    content: [
      { type: 'text', value: 'The platform comes with default credentials so you can log in immediately.' },
      { type: 'heading', value: 'DevConsole (this UI)' },
      { type: 'table', headers: ['Field', 'Value'],
        rows: [
          ['URL', 'http://localhost:18090/devconsole/login'],
          ['Username', 'testuser'],
          ['Password', '1Johnsushil'],
        ]
      },
      { type: 'heading', value: 'Your Service\'s Keycloak Realm' },
      { type: 'text', value: 'Each deployed service gets its own Keycloak realm with a pre-created test user:' },
      { type: 'table', headers: ['Field', 'Value'],
        rows: [
          ['Token URL', 'http://localhost:18081/auth/realms/<artifact>/protocol/openid-connect/token'],
          ['Client ID', '<service-name> (e.g. order-service)'],
          ['Client Secret', '<service-name>-secret (e.g. order-service-secret)'],
          ['Username', 'testuser'],
          ['Password', '1Johnsushil'],
          ['Grant Type', 'password'],
        ]
      },
      { type: 'heading', value: 'Keycloak Admin Console' },
      { type: 'table', headers: ['Field', 'Value'],
        rows: [
          ['URL', 'http://localhost:18081/auth/admin/'],
          ['Username', 'admin'],
          ['Password', 'admin'],
        ]
      },
      { type: 'heading', value: 'Grafana' },
      { type: 'table', headers: ['Field', 'Value'],
        rows: [
          ['URL', 'http://localhost:13000'],
          ['Username', 'admin'],
          ['Password', 'admin'],
        ]
      },
      { type: 'heading', value: 'pgAdmin' },
      { type: 'table', headers: ['Field', 'Value'],
        rows: [
          ['URL', 'http://localhost:15050'],
          ['Email', 'admin@admin.com'],
          ['Password', 'admin'],
        ]
      },
      { type: 'text', value: 'After logging into pgAdmin, add a server connection:' },
      { type: 'table', headers: ['Field', 'Value'],
        rows: [
          ['Host', 'host.docker.internal'],
          ['Port', '15432'],
          ['Database', 'template'],
          ['Username', 'template'],
          ['Password', 'template123'],
        ]
      },
      { type: 'heading', value: 'OpenSearch Dashboards' },
      { type: 'table', headers: ['Field', 'Value'],
        rows: [
          ['URL', 'http://localhost:15601'],
          ['Username', 'admin'],
          ['Password', 'Str0ngP@ssw0rd#2026'],
        ]
      },
      { type: 'heading', value: 'Other UIs (no login required)' },
      { type: 'table', headers: ['Service', 'URL'],
        rows: [
          ['Kafka UI', 'http://localhost:18002'],
          ['DynamoDB Admin', 'http://localhost:18001'],
          ['Prometheus', 'http://localhost:19090'],
        ]
      },
      { type: 'tip', value: 'All passwords are intentionally simple — this is a local development environment, not production. Change them if you expose the platform publicly.' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    content: [
      { type: 'text', value: 'Common issues and how to fix them:' },
      { type: 'heading', value: 'Port-forwards keep dying' },
      { type: 'text', value: 'Kubernetes port-forwards are ephemeral. If a page stops loading, restart the gateway port-forward:' },
      { type: 'code', value: 'kubectl port-forward -n payments svc/api-gateway 18090:8090' },
      { type: 'heading', value: 'Service takes too long to start' },
      { type: 'text', value: 'Spring Boot services take 60-90 seconds to start in Kind. Check the logs to see if it\'s still booting:' },
      { type: 'code', value: `# Watch your service logs
kubectl logs -f deployment/order-service -n payments

# Or use the Logs page in DevConsole — select your service` },
      { type: 'heading', value: 'deploy.sh fails at step 4 (Deploy)' },
      { type: 'text', value: 'The deploy script needs jq (JSON processor) to send the provision.yml to the platform. Install it:' },
      { type: 'code', value: `# macOS
brew install jq

# Windows
choco install jq

# Linux
apt install jq` },
      { type: 'heading', value: 'LocalStack keeps restarting' },
      { type: 'text', value: 'LocalStack needs memory. If S3/SQS/DynamoDB tests fail, check if the pod is running:' },
      { type: 'code', value: 'kubectl get pod -n payments -l app=localstack\n# If it\'s restarting, increase Docker Desktop memory to 10GB+' },
      { type: 'heading', value: 'Kafka entity operator in CrashLoopBackOff' },
      { type: 'text', value: 'The entity operator manages Kafka topics. It sometimes needs more memory:' },
      { type: 'code', value: 'kubectl patch kafka kafka -n payments --type merge -p \'{"spec":{"entityOperator":{"topicOperator":{"resources":{"limits":{"memory":"512Mi"}}}}}}\'' },
      { type: 'heading', value: '401 Unauthorized on API calls' },
      { type: 'text', value: 'Your bearer token has expired (tokens last 5 minutes). Get a fresh one:' },
      { type: 'code', value: `# Replace "order" with your artifact name
curl -s -X POST http://localhost:18081/auth/realms/order/protocol/openid-connect/token \\
  -d "grant_type=password&client_id=order-service&client_secret=order-service-secret&username=testuser&password=1Johnsushil" | jq .access_token` },
      { type: 'heading', value: 'Service not visible in DevConsole after deploy' },
      { type: 'text', value: 'Refresh the Services page. If still not visible, check that deploy.sh completed successfully and look for errors in the output.' },
    ],
  },
];

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative group my-4">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[13px] leading-relaxed overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      <button onClick={copy}
        className="absolute top-2.5 right-2.5 px-2 py-1 text-xs rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-all">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function StepContent({ step }) {
  return (
    <div>
      {step.content.map((block, i) => {
        if (block.type === 'text') return <p key={i} className="text-[15px] leading-relaxed text-slate-600 mb-4">{block.value}</p>;
        if (block.type === 'heading') return <h3 key={i} className="text-base font-semibold text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-100">{block.value}</h3>;
        if (block.type === 'code') return <CodeBlock key={i} code={block.value} />;
        if (block.type === 'list') return (
          <ul key={i} className="space-y-1.5 mb-4 ml-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-[15px] text-slate-600">
                <span className="w-1 h-1 rounded-full bg-slate-400 mt-2.5 flex-shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        );
        if (block.type === 'table') return (
          <div key={i} className="my-4 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                {block.headers.map((h, j) => <th key={j} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {block.rows.map((row, j) => (
                  <tr key={j} className="hover:bg-slate-50/50">
                    {row.map((cell, k) => <td key={k} className="px-4 py-2.5 text-sm text-slate-700">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        if (block.type === 'tip') return (
          <div key={i} className="flex gap-3 my-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">{block.value}</p>
          </div>
        );
        if (block.type === 'warning') return (
          <div key={i} className="flex gap-3 my-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="text-sm text-amber-800 leading-relaxed">{block.value}</p>
          </div>
        );
        return null;
      })}
    </div>
  );
}

export default function Tutorial() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Tutorial</p>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Getting Started with JavaBackend</h1>
        <p className="mt-3 text-lg text-slate-500">From clone to deployed service in 10 minutes. Follow each step.</p>
      </div>

      <div className="flex gap-10">
        {/* Sidebar */}
        <nav className="w-56 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24">
            {STEPS.map((step, i) => (
              <button key={step.id} onClick={() => setActiveStep(i)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeStep === i ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  activeStep > i ? 'bg-emerald-100 text-emerald-700' :
                  activeStep === i ? 'bg-slate-900 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {activeStep > i ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </span>
                {step.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <article className="flex-1 min-w-0">
          {/* Mobile step selector */}
          <div className="lg:hidden mb-6">
            <select value={activeStep} onChange={e => setActiveStep(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm">
              {STEPS.map((step, i) => <option key={step.id} value={i}>{i + 1}. {step.title}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                {activeStep + 1}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{STEPS[activeStep].title}</h2>
            </div>

            <StepContent step={STEPS[activeStep]} />

            <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
              {activeStep > 0 ? (
                <button onClick={() => setActiveStep(activeStep - 1)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                  Previous
                </button>
              ) : <div />}
              {activeStep < STEPS.length - 1 ? (
                <button onClick={() => setActiveStep(activeStep + 1)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  Next Step
                </button>
              ) : (
                <Link to="/create"
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  Create Your Service
                </Link>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
