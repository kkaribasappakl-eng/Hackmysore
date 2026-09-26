// src/data/mockData.js
// SignalCraft Mock Data Source - Centralized across all views

export const mockBuilderProfile = {
  name: "Rahul Sharma",
  role: "Backend Engineer",
  avatar: "RS",
  location: "Bengaluru, India",
  experience: "3 Years",
  skills: ["Java", "SQL", "REST API", "Spring Boot"],
  profileCompletion: 85,
  currentRank: "#24",
  assessmentProgress: {
    title: "Backend Engineering Challenge",
    status: "In Progress",
    step: "Assessment",
    percent: 65,
  },
  scorecardStatus: "Available", // Can be "Not Available Yet" or "Available"
  scorecardId: "SC-BE-2026-001",
  reusableNote: "Valid for 2 Years across all participating companies. Replaces preliminary coding interviews."
};

export const mockScorecardData = {
  scorecardId: "SC-BE-2026-001",
  candidateName: "Rahul Sharma",
  domain: "Backend Engineering",
  overallScore: 85,
  status: "VALID",
  issuedDate: "September 2026",
  validUntil: "September 2028",
  validityDuration: "2 Years",
  verifiedBy: "Ananya Rao",
  reviewerTitle: "Staff Systems Engineer & Certified Technical Reviewer",
  assessmentName: "Backend Engineering Challenge",
  aiPreScore: 84,
  reviewerScore: 4.3, // Out of 5
  skills: [
    { name: "Java", score: 86, benchmark: "Top 12%" },
    { name: "SQL", score: 82, benchmark: "Top 18%" },
    { name: "REST API", score: 91, benchmark: "Top 5%" },
    { name: "Debugging", score: 88, benchmark: "Top 10%" },
    { name: "Problem Solving", score: 89, benchmark: "Top 8%" }
  ],
  rubrics: [
    { name: "Correctness", score: 4.5, max: 5, notes: "Edge cases handled, idempotent token checks verified." },
    { name: "Architecture & Design", score: 4.2, max: 5, notes: "Clean layered domain model with decoupled persistence." },
    { name: "Code Quality", score: 4.0, max: 5, notes: "Idiomatic Java with clear exception hierarchies and logging." },
    { name: "Trade-off Awareness", score: 4.5, max: 5, notes: "Strong ADR justification on pessimistic vs optimistic locking." }
  ],
  evidence: {
    coding: {
      status: "Verified",
      summary: "Implemented idempotent POST /api/v1/orders with inventory decrement and transaction rollbacks.",
      repoUrl: "https://github.com/rahul-sharma/signalcraft-order-service"
    },
    debugging: {
      status: "Verified",
      summary: "Diagnosed race condition in concurrent inventory deduction and resolved timeout cascade."
    },
    sql: {
      status: "Verified",
      summary: "Authored multi-table aggregate query with composite indexing rationale for 10M+ rows."
    },
    reasoning: {
      status: "Reviewed",
      summary: "Detailed 5-point Architecture Decision Record (ADR) analyzing Redis TTL vs DB write locks."
    }
  },
  adr: {
    whatBuilt: "Built a fault-tolerant Order Management REST service with idempotent idempotency-key headers, pessimistic inventory locking, and transaction audit tables.",
    whyApproach: "Chose pessimistic reservation over optimistic retries because flash sale spikes cause >75% retry collisions, degrading database connection pools.",
    alternatives: "Considered pure optimistic concurrency with exponential backoff, and distributed 2PC via Saga orchestrator. Rejected 2PC due to 180ms latency overhead.",
    tradeOffs: "Traded slightly higher short-term memory utilization on Redis keys (24-hour TTL) for zero duplicate orders and guaranteed single-charge semantics.",
    scalePlan: "Partition order tables by region, adopt Kafka CDC with transactional outbox for async fulfillment, and deploy read-replicas for customer order history."
  },
  disclaimer: "SignalCraft is an evidence-based technical verification platform. This scorecard represents verified performance on standardized engineering challenges and is not a government or educational credential."
};

export const mockChallenges = [
  {
    id: "backend-order-api",
    title: "Backend Order Management API",
    difficulty: "Intermediate",
    skills: ["Java", "REST API", "SQL", "Debugging"],
    prerequisites: ["Java basics", "REST fundamentals", "SQL"],
    status: "Available",
    estimatedTime: "45-60 mins",
    summary: "Build an Order Management REST API capable of processing transactional flows, stock reservation, and idempotent payment webhooks.",
    problemStatement: "E-commerce transaction platforms require deterministic order lifecycles and strict stock preservation. Design and build a Spring Boot REST API for an Order Management System. The API must handle concurrent order submissions, prevent overselling through atomic stock deductions, and enforce idempotent webhooks for payment gateways.",
    deliverables: [
      "Working implementation of POST /api/v1/orders and GET /api/v1/orders/{id}",
      "Clean repository link with modular architecture and test coverage",
      "Technical explanation of concurrency handling and idempotency keys",
      "5-question Architecture Decision Record (ADR) detailing design trade-offs"
    ],
    rubrics: ["Correctness", "Architecture & Design", "Code Quality", "Trade-off Awareness"]
  },
  {
    id: "prod-api-debugging",
    title: "Production API Debugging",
    difficulty: "Advanced",
    skills: ["Java", "Debugging", "Performance"],
    prerequisites: ["Requires completion of Backend Order Management API & Intermediate SQL Verification"],
    status: "Locked",
    estimatedTime: "60 mins",
    summary: "Pinpoint thread deadlocks and query latency spikes under 10k RPS in a high-volume financial ledger service.",
    problemStatement: "A production payment settlement service is encountering thread pool starvation and heap spikes under burst traffic. Diagnose JVM thread dumps, trace leaked database connections, and patch the root concurrency bug.",
    deliverables: [
      "Root Cause Analysis (RCA) report",
      "Thread dump diagnosis findings",
      "Pull request patch resolving deadlock and connection leak",
      "ADR on thread pool isolation strategies"
    ],
    rubrics: ["Diagnostic Speed", "Root Cause Precision", "Patch Safety", "Post-mortem Quality"]
  },
  {
    id: "event-driven-inventory",
    title: "Distributed Event-Driven Inventory",
    difficulty: "Advanced",
    skills: ["Java", "Kafka", "Distributed Systems", "SQL"],
    prerequisites: ["Advanced REST & Concurrency Fundamentals"],
    status: "Available",
    estimatedTime: "60 mins",
    summary: "Architect an outbox-pattern event publisher for warehouse inventory sync across partitioned Kafka topics.",
    problemStatement: "Design a resilient event publisher using the transactional outbox pattern to guarantee exactly-once event dispatch to Kafka topics when warehouse inventory levels fluctuate across global fulfillment centers.",
    deliverables: [
      "Outbox database schema and Debezium/poller service",
      "Partitioning strategy documentation for warehouse SKUs",
      "Dead letter queue (DLQ) retry consumer logic",
      "ADR on event delivery semantics and consistency vs availability trade-offs"
    ],
    rubrics: ["Fault Tolerance", "Partitioning Logic", "Idempotent Consumption", "ADR Rigor"]
  }
];

export const mockAssessmentData = {
  title: "Backend Engineering Assessment",
  duration: "45 Minutes",
  totalSections: 4,
  skillsAssessed: ["Java", "SQL", "REST API", "Debugging", "Problem Solving"],
  sections: [
    {
      id: "section-1",
      number: 1,
      title: "Section 1 — Coding",
      skill: "Java / REST API",
      prompt: "Implement a REST API endpoint for creating an order.",
      instructions: "Implement `POST /api/v1/orders`. Validate that `customerId` exists, `items` is non-empty, and calculate total amount. Include idempotent transaction handling.",
      starterCode: `@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
        @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
        @Valid @RequestBody CreateOrderRequest request
    ) {
        // TODO: Validate request, verify idempotency, and persist order
        OrderResponse response = orderService.processOrder(idempotencyKey, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}`,
      defaultAnswer: `@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;
    
    @Autowired
    private IdempotencyService idempotencyService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
        @RequestHeader(value = "Idempotency-Key", required = true) String idempotencyKey,
        @Valid @RequestBody CreateOrderRequest request
    ) {
        if (idempotencyService.hasProcessed(idempotencyKey)) {
            return ResponseEntity.ok(idempotencyService.getCachedResponse(idempotencyKey));
        }

        OrderResponse response = orderService.processOrder(idempotencyKey, request);
        idempotencyService.cacheResponse(idempotencyKey, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}`
    },
    {
      id: "section-2",
      number: 2,
      title: "Section 2 — Debugging",
      skill: "Debugging / Concurrency",
      prompt: "Identify and fix the issue in the provided backend implementation.",
      instructions: "The code below allows inventory overselling under high concurrency and fails to rollback stock if the payment charge throws an exception. Identify all bugs and provide the corrected code.",
      buggyCode: `// Problematic Code:
public void checkoutOrder(Long orderId) {
    Order order = orderRepo.findById(orderId).get();
    for (OrderItem item : order.getItems()) {
        Product p = productRepo.findById(item.getProductId()).get();
        // BUG 1: Non-atomic read-modify-write causes race condition
        p.setStock(p.getStock() - item.getQuantity());
        productRepo.save(p);
    }
    // BUG 2: If charge fails, deducted stock is never rolled back!
    paymentGateway.charge(order.getTotal());
    order.setStatus(OrderStatus.PAID);
    orderRepo.save(order);
}`,
      defaultAnswer: `@Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
public void checkoutOrder(Long orderId) {
    Order order = orderRepo.findById(orderId)
        .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));

    // Fix 1: Pessimistic write lock or atomic DB decrement query to prevent race conditions
    for (OrderItem item : order.getItems()) {
        int updatedRows = productRepo.decrementStockIfSufficient(item.getProductId(), item.getQuantity());
        if (updatedRows == 0) {
            throw new InsufficientStockException("Insufficient stock for product ID: " + item.getProductId());
        }
    }

    try {
        paymentGateway.charge(order.getTotal());
        order.setStatus(OrderStatus.PAID);
        orderRepo.save(order);
    } catch (PaymentException ex) {
        // Fix 2: Explicit rollback trigger ensures deducted stock is returned
        throw new OrderProcessingException("Payment gateway failure, rolling back transaction", ex);
    }
}`
    },
    {
      id: "section-3",
      number: 3,
      title: "Section 3 — SQL",
      skill: "SQL / Performance",
      prompt: "Write a query to find the top 5 customers by total order value.",
      instructions: "Given tables `customers (id, name, email, created_at)` and `orders (id, customer_id, total_amount, status, created_at)`, write an optimized SQL query that retrieves customer id, customer name, total spend, and average order value for COMPLETED orders in the last 12 months, ordered by total spend descending, limited to 5.",
      starterCode: `-- Schema:
-- customers (id, name, email, created_at)
-- orders (id, customer_id, total_amount, status, created_at)

-- Write your SQL query here:
`,
      defaultAnswer: `SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    SUM(o.total_amount) AS total_spend,
    ROUND(AVG(o.total_amount), 2) AS average_order_value,
    COUNT(o.id) AS total_orders
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'COMPLETED'
  AND o.created_at >= NOW() - INTERVAL '12 months'
GROUP BY c.id, c.name
ORDER BY total_spend DESC
LIMIT 5;

-- Index recommendation for optimization:
-- CREATE INDEX idx_orders_customer_status_date ON orders(customer_id, status, created_at) INCLUDE (total_amount);`
    },
    {
      id: "section-4",
      number: 4,
      title: "Section 4 — Technical Reasoning",
      skill: "System Design & Trade-offs",
      prompt: "Explain why you selected your architecture and what trade-offs you considered.",
      instructions: "Explain the architecture chosen for order processing. Detail the trade-offs between synchronous vs asynchronous processing, database locking strategies, and consistency vs latency.",
      starterCode: `// Detail your architectural reasoning below:
1. Processing Model (Sync vs Async):
2. Concurrency Locking Strategy:
3. Consistency vs Latency Trade-offs:
`,
      defaultAnswer: `1. Processing Model (Sync vs Async):
We utilize a hybrid model. The initial order reservation and payment authorization is synchronous HTTP with a 3000ms SLA to give instant certainty to the customer. Once payment is confirmed, order fulfillment, warehouse dispatch, and email notifications are emitted asynchronously via Kafka topics.

2. Concurrency Locking Strategy:
We rejected optimistic locking with retry loops because in high-concurrency flash sale spikes (>100 checkout req/sec on limited inventory items), optimistic retries cause thrashing, connection pool exhaustion, and CPU spikes. Instead, we used atomic conditional database updates (UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty), providing lock-free serializability.

3. Consistency vs Latency Trade-offs:
We prioritized strict immediate consistency for inventory balances (CP in CAP theorem) to prevent costly overselling or physical stock discrepancies. For order tracking analytics and customer history, we accept eventual consistency (AP) via read replicas with a 500ms replication lag.`
    }
  ]
};

export const mockReviewerProfile = {
  name: "Ananya Rao",
  title: "Staff Systems Engineer & SignalCraft Verified Reviewer",
  avatar: "AR",
  organization: "Ex-Stripe / Lead Distributed Systems Architect",
  expertise: ["Java", "Backend", "System Design", "SQL"],
  pendingReviewsCount: 5,
  completedReviewsCount: 48,
  credibilityScore: 92,
  credibilityExplanation: "Reviewer credibility is a prototype metric based on consistency with later review signals and employer calibration outcomes."
};

export const mockReviewQueue = [
  {
    id: "rev-001",
    candidateName: "Rahul Sharma",
    candidateAvatar: "RS",
    challengeId: "backend-order-api",
    challengeTitle: "Backend Order Management API",
    skills: ["Java", "SQL", "REST API"],
    aiPreScore: 84,
    submittedAt: "2 hours ago",
    status: "Pending Human Review",
    integrityStatus: "Pass (99.2% Originality)",
    repoUrl: "https://github.com/rahul-sharma/signalcraft-order-service",
    demoUrl: "https://order-service-demo.signalcraft.dev",
    adr: {
      whatBuilt: "Built an Order Management REST API with idempotent transaction filters, atomic stock reservations, and event rollbacks.",
      whyApproach: "Atomic database decrement prevents thread contention while keeping database connection pool latencies below 25ms.",
      alternatives: "Evaluated Redis Lua scripts for stock tracking vs PostgreSQL atomic updates. Chose PostgreSQL to maintain ACID guarantees with billing.",
      tradeOffs: "Chose strong consistency over distributed horizontal sharding for the inventory table to eliminate reconciliation overhead.",
      scalePlan: "Scale via tenant-based schema sharding and Kafka transactional outbox for fulfillment services."
    },
    aiAnalysis: {
      summary: "High code modularity with well-structured controllers and service layers. Idempotency filter correctly catches duplicate tokens.",
      testCoverage: "88% unit test coverage detected across order services.",
      flaggedItems: "None. No known boilerplate copy-paste patterns detected.",
      advisoryScore: 84
    }
  },
  {
    id: "rev-002",
    candidateName: "Priya Nair",
    candidateAvatar: "PN",
    challengeId: "event-driven-inventory",
    challengeTitle: "Distributed Event-Driven Inventory",
    skills: ["Java", "Kafka", "SQL"],
    aiPreScore: 90,
    submittedAt: "5 hours ago",
    status: "Pending Human Review",
    integrityStatus: "Pass (100% Originality)",
    repoUrl: "https://github.com/priyanair/inventory-event-bus",
    demoUrl: "https://inventory-bus.dev.internal",
    adr: {
      whatBuilt: "Debezium CDC transactional outbox publisher with partitioned Kafka delivery guarantees.",
      whyApproach: "Guarantees dual-write safety between database orders and streaming broker without two-phase commit overhead.",
      alternatives: "Considered polling table query worker; discarded due to DB read amplification under 50k events/sec.",
      tradeOffs: "Slight latency buffer (100-250ms) introduced by Kafka consumer group rebalances.",
      scalePlan: "Dynamic partition re-assignment and tiered cloud storage for compacted inventory state topics."
    },
    aiAnalysis: {
      summary: "Clean separation of outbox writer and consumer event processors. Excellent handling of poison pills and DLQ routing.",
      testCoverage: "94% integration test coverage using Testcontainers.",
      flaggedItems: "None.",
      advisoryScore: 90
    }
  },
  {
    id: "rev-003",
    candidateName: "Arjun Kumar",
    candidateAvatar: "AK",
    challengeId: "backend-order-api",
    challengeTitle: "Backend Order Management API",
    skills: ["Java", "REST API", "Debugging"],
    aiPreScore: 75,
    submittedAt: "1 day ago",
    status: "In Review",
    integrityStatus: "Pass (98.4% Originality)",
    repoUrl: "https://github.com/arjun-k/order-api-spring",
    demoUrl: "https://order-api-arjun.dev",
    adr: {
      whatBuilt: "Layered Spring Boot application with JPA entities and basic REST endpoints.",
      whyApproach: "Standard MVC architecture for rapid developer onboarding and simplicity.",
      alternatives: "Considered reactive WebFlux; kept synchronous MVC due to team familiarities.",
      tradeOffs: "Higher thread usage per connection compared to non-blocking I/O.",
      scalePlan: "Horizontal container auto-scaling on Kubernetes with AWS RDS Aurora read endpoints."
    },
    aiAnalysis: {
      summary: "Functional implementation with clear REST semantics. Concurrency edge cases in stock reservation rely on optimistic retry.",
      testCoverage: "72% unit test coverage.",
      flaggedItems: "Retry loop could experience high latency under hot-spot contention.",
      advisoryScore: 75
    }
  }
];

export const mockRecruiterData = {
  company: "TechNova Solutions",
  logo: "TN",
  tagline: "Building resilient enterprise cloud infrastructures",
  openRolesCount: 3,
  verifiedCandidatesCount: 128,
  shortlistedCount: 14,
  roles: [
    {
      id: "job-001",
      title: "Backend Developer",
      company: "TechNova Solutions",
      location: "Bengaluru / Hybrid",
      experience: "2-4 years",
      difficulty: "Intermediate",
      skills: ["Java", "SQL", "REST API", "Spring Boot"],
      description: "We are seeking a backend engineer to design scalable transaction processing services, secure microservices, and reliable payment integrations.",
      matchedCandidatesCount: 18,
      postedDate: "3 days ago"
    },
    {
      id: "job-002",
      title: "Distributed Systems Engineer",
      company: "TechNova Solutions",
      location: "Remote (India)",
      experience: "3-6 years",
      difficulty: "Advanced",
      skills: ["Java", "Kafka", "Distributed Systems", "SQL"],
      description: "Scale high-throughput streaming pipelines and event-driven data workflows across distributed transactional architectures.",
      matchedCandidatesCount: 9,
      postedDate: "1 week ago"
    },
    {
      id: "job-003",
      title: "Senior Platform Reliability Engineer",
      company: "TechNova Solutions",
      location: "Bengaluru",
      experience: "5+ years",
      difficulty: "Advanced",
      skills: ["Java", "Debugging", "Performance", "SQL"],
      description: "Diagnose production incidents, optimize low-latency JVM runtimes, and build resilient auto-healing microservice platforms.",
      matchedCandidatesCount: 6,
      postedDate: "2 weeks ago"
    }
  ],
  candidates: [
    {
      id: "cand-001",
      name: "Rahul Sharma",
      avatar: "RS",
      domain: "Backend Engineering",
      score: 85,
      experience: "3 years",
      verifiedSkills: ["Java", "SQL", "REST API", "Spring Boot"],
      scorecardId: "SC-BE-2026-001",
      validity: "VALID",
      issuedDate: "September 2026",
      validUntil: "September 2028",
      reviewerName: "Ananya Rao",
      reviewerTitle: "Staff Systems Engineer",
      reviewerScore: 4.3,
      assessment: "Backend Engineering Challenge",
      status: "Available", // Can toggle to "Shortlisted"
      summary: "Specializes in idempotent transactional APIs, lock-free stock reservation, and relational indexing.",
      evidence: {
        coding: "Verified (Clean layered REST architecture, idempotency filter, zero-oversell test suite)",
        debugging: "Verified (Identified thread starvation & race conditions in concurrent inventory checkout)",
        sql: "Verified (Authored multi-table aggregation query with composite indexing rationale)",
        reasoning: "Reviewed (In-depth 5-question ADR evaluating pessimistic locking vs outbox patterns)"
      },
      skillBreakdown: [
        { skill: "Java", score: 86 },
        { skill: "REST API", score: 91 },
        { skill: "SQL", score: 82 },
        { skill: "Debugging", score: 88 },
        { skill: "Problem Solving", score: 89 }
      ]
    },
    {
      id: "cand-002",
      name: "Priya Nair",
      avatar: "PN",
      domain: "Distributed Systems",
      score: 91,
      experience: "4 years",
      verifiedSkills: ["Java", "Kafka", "SQL", "Distributed Systems"],
      scorecardId: "SC-DS-2026-004",
      validity: "VALID",
      issuedDate: "October 2026",
      validUntil: "October 2028",
      reviewerName: "Vikram Sen",
      reviewerTitle: "Principal Architect",
      reviewerScore: 4.7,
      assessment: "Distributed Event-Driven Inventory",
      status: "Available",
      summary: "Expert in Debezium outbox streams, Kafka partition balancing, and distributed transaction semantics.",
      evidence: {
        coding: "Verified (High-throughput transactional outbox publisher with Testcontainers)",
        debugging: "Verified (Resolved memory leak in consumer buffer deserialization under high load)",
        sql: "Verified (Partitioned time-series telemetry querying & outbox deduplication)",
        reasoning: "Reviewed (Exceptional ADR on at-least-once vs exactly-once delivery guarantees)"
      },
      skillBreakdown: [
        { skill: "Java", score: 93 },
        { skill: "Kafka", score: 95 },
        { skill: "Distributed Systems", score: 92 },
        { skill: "SQL", score: 87 },
        { skill: "Problem Solving", score: 88 }
      ]
    },
    {
      id: "cand-003",
      name: "Arjun Kumar",
      avatar: "AK",
      domain: "Backend Engineering",
      score: 76,
      experience: "2 years",
      verifiedSkills: ["Java", "REST API", "Debugging"],
      scorecardId: "SC-BE-2026-007",
      validity: "VALID",
      issuedDate: "August 2026",
      validUntil: "August 2028",
      reviewerName: "Ananya Rao",
      reviewerTitle: "Staff Systems Engineer",
      reviewerScore: 3.8,
      assessment: "Backend Engineering Challenge",
      status: "Available",
      summary: "Solid foundations in Spring Boot microservices, REST conventions, and integration testing.",
      evidence: {
        coding: "Verified (Clean standard Spring Boot REST controller with validation)",
        debugging: "Verified (Found null pointer exception in payment response handling)",
        sql: "Verified (Standard joins and grouping queries)",
        reasoning: "Reviewed (Basic ADR documenting MVC structure and thread models)"
      },
      skillBreakdown: [
        { skill: "Java", score: 78 },
        { skill: "REST API", score: 80 },
        { skill: "SQL", score: 72 },
        { skill: "Debugging", score: 74 },
        { skill: "Problem Solving", score: 76 }
      ]
    }
  ]
};
