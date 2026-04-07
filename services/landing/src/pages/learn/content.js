// Learn section content — all 110 pages as structured data
// Each page: { slug, section, title, content: [blocks] }
// Block types: text, heading, code, list, table, tip, warning

export const learnContent = [

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTING STARTED
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'getting-started',
    section: 'Getting Started',
    title: 'Getting Started',
    content: [
      { type: 'text', value: 'This platform gives you a complete local microservice development environment. One command starts everything — databases, message brokers, monitoring, security, and a management console.' },
      { type: 'heading', value: 'What\'s Running' },
      { type: 'table', headers: ['Service', 'URL', 'Purpose'], rows: [
        ['DevConsole', 'http://localhost:13001', 'This UI — manage everything'],
        ['API Gateway', 'http://localhost:18090', 'Auth, routing, rate limiting'],
        ['Keycloak', 'http://localhost:18081', 'OAuth2 / JWT auth (admin/admin)'],
        ['Grafana', 'http://localhost:13000', 'Dashboards, metrics, logs (admin/admin)'],
        ['PostgreSQL', 'localhost:15432', 'Relational database (template/template123)'],
        ['Kafka', 'localhost:19092', 'Event streaming'],
        ['LocalStack', 'http://localhost:14566', 'S3, SQS, DynamoDB (AWS local)'],
        ['OpenSearch', 'http://localhost:19200', 'Full-text search'],
        ['Redis', 'Inside cluster', 'Caching'],
      ]},
      { type: 'heading', value: 'Create Your First Service' },
      { type: 'list', items: [
        'Click "Create Service" in the sidebar',
        'Enter a name (e.g. payment-service), pick dependencies',
        'Download the ZIP, extract, open in your IDE',
        'Run: ./scripts/build.sh 1.0.0',
        'Come back here → Services → Deploy → pick your image tag',
        'Your service is live at http://localhost:18090/<name>/actuator/health',
      ]},
      { type: 'heading', value: 'How Requests Flow' },
      { type: 'code', lang: 'text', value: 'Client → API Gateway (validates JWT, rate limits) → Your Service → Database/Kafka/Redis/S3' },
      { type: 'text', value: 'The gateway handles authentication and routing. Your service just implements business logic.' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE CONCEPTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'spring-beans',
    section: 'Core Concepts',
    title: 'Spring Beans & Dependency Injection',
    content: [
      { type: 'text', value: 'A bean is an object that Spring creates and manages for you. Instead of using "new", you let Spring create objects and inject them where needed.' },
      { type: 'heading', value: 'Constructor Injection (Preferred)' },
      { type: 'code', lang: 'java', value: `@Service
public class PaymentService {

    private final PaymentRepository repository;
    private final KafkaTemplate<String, String> kafka;

    // Spring automatically injects these — no @Autowired needed
    // when there's only one constructor
    public PaymentService(PaymentRepository repository,
                          KafkaTemplate<String, String> kafka) {
        this.repository = repository;
        this.kafka = kafka;
    }
}` },
      { type: 'warning', value: 'Avoid @Autowired on fields. Constructor injection makes dependencies explicit and testable.' },
      { type: 'heading', value: 'Bean Lifecycle' },
      { type: 'list', items: [
        'Spring scans your classes on startup',
        'Creates one instance of each @Component/@Service/@Repository',
        'Injects dependencies via constructors',
        'Beans are singletons by default — one instance shared across all requests',
      ]},
    ]
  },
  {
    slug: 'component-service-repository',
    section: 'Core Concepts',
    title: '@Component, @Service, @Repository, @Bean',
    content: [
      { type: 'text', value: 'These all create beans. The difference is semantic — it tells other developers what the class does.' },
      { type: 'table', headers: ['Annotation', 'Use For', 'Example'], rows: [
        ['@Service', 'Business logic', 'PaymentService'],
        ['@Repository', 'Data access', 'PaymentRepository'],
        ['@Component', 'Generic utility', 'EmailValidator'],
        ['@Configuration + @Bean', 'Third-party classes you can\'t annotate', 'RestTemplate, S3Client'],
      ]},
      { type: 'heading', value: 'When to Use @Bean' },
      { type: 'text', value: 'Use @Bean when you need to create a bean from a class you don\'t own (can\'t add @Component to it):' },
      { type: 'code', lang: 'java', value: `@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate rt = new RestTemplate();
        rt.setRequestFactory(new SimpleClientHttpRequestFactory());
        return rt;  // Spring manages this instance
    }
}` },
    ]
  },
  {
    slug: 'profiles',
    section: 'Core Concepts',
    title: 'Profiles — Loading Different Beans Per Env',
    content: [
      { type: 'text', value: 'Profiles let you swap implementations based on the environment. Different config for local, test, and prod.' },
      { type: 'code', lang: 'java', value: `// Uses real S3 in production
@Service
@Profile("prod")
public class S3FileStorage implements FileStorage { ... }

// Uses local filesystem in development
@Service
@Profile("local")
public class LocalFileStorage implements FileStorage { ... }` },
      { type: 'heading', value: 'Activate a Profile' },
      { type: 'code', lang: 'yaml', value: `# application.yml — set active profile
spring:
  profiles:
    active: local

# Or via environment variable:
# SPRING_PROFILES_ACTIVE=local` },
      { type: 'heading', value: 'Profile-Specific Config Files' },
      { type: 'list', items: [
        'application.yml — base config (always loaded)',
        'application-local.yml — overrides for local development',
        'application-test.yml — overrides for tests',
        'application-prod.yml — overrides for production',
      ]},
    ]
  },
  {
    slug: 'value-config-properties',
    section: 'Core Concepts',
    title: '@Value & @ConfigurationProperties',
    content: [
      { type: 'text', value: 'Read values from application.yml into your Java code.' },
      { type: 'heading', value: '@Value — Single Values' },
      { type: 'code', lang: 'java', value: `@Service
public class PaymentService {

    @Value("\${app.payment.max-amount:1000}")  // default 1000
    private BigDecimal maxAmount;

    @Value("\${app.payment.currency:USD}")
    private String defaultCurrency;
}` },
      { type: 'heading', value: '@ConfigurationProperties — Grouped Config (Preferred)' },
      { type: 'code', lang: 'java', value: `@ConfigurationProperties(prefix = "app.payment")
@Validated
public class PaymentProperties {
    @NotNull private BigDecimal maxAmount;
    @NotBlank private String currency;
    private int retryAttempts = 3;
    // getters + setters
}

// In application.yml:
// app:
//   payment:
//     max-amount: 5000
//     currency: USD
//     retry-attempts: 5` },
      { type: 'tip', value: 'Use @ConfigurationProperties for anything with more than 2 related values. It\'s type-safe and validatable.' },
    ]
  },
  {
    slug: 'auto-configure-beans',
    section: 'Core Concepts',
    title: 'Auto-Configure & Conditional Beans',
    content: [
      { type: 'text', value: 'Control when beans are created based on conditions.' },
      { type: 'code', lang: 'java', value: `@Configuration
public class NotificationConfig {

    // Only created if this property is set to "true"
    @Bean
    @ConditionalOnProperty(name = "app.notifications.enabled", havingValue = "true")
    public EmailNotificationService emailService() {
        return new EmailNotificationService();
    }

    // Only created if no other NotificationService bean exists
    @Bean
    @ConditionalOnMissingBean(NotificationService.class)
    public NoOpNotificationService noOpService() {
        return new NoOpNotificationService();
    }
}` },
      { type: 'heading', value: '@Primary and @Qualifier' },
      { type: 'code', lang: 'java', value: `// When multiple beans of same type exist:
@Bean @Primary
public DataSource primaryDb() { ... }

@Bean @Qualifier("analytics")
public DataSource analyticsDb() { ... }

// Inject specific one:
public MyService(@Qualifier("analytics") DataSource ds) { ... }` },
    ]
  },
  {
    slug: 'application-yml',
    section: 'Core Concepts',
    title: 'Application.yml Structure',
    content: [
      { type: 'text', value: 'The central configuration file. Every key in the template explained:' },
      { type: 'code', lang: 'yaml', value: `server:
  port: 8080                              # HTTP port
  servlet:
    context-path: /payment                # URL prefix for all endpoints

spring:
  application:
    name: payment-service                 # Used in logs, tracing, metrics
  datasource:
    url: jdbc:postgresql://host:5432/db   # Database connection
    username: payment
    password: payment123
  jpa:
    hibernate:
      ddl-auto: validate                  # Don't auto-create tables (Liquibase does it)
  redis:
    host: redis-master                    # Cache server
  cloud:
    stream:
      kafka:
        binder:
          brokers: kafka:9092             # Kafka connection
      bindings:
        paymentEventSupplier-out-0:
          destination: payment-events     # Topic to publish to
        paymentEventConsumer-in-0:
          destination: payment-events     # Topic to consume from
          group: payment-service-group    # Consumer group
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://keycloak:8080/realms/payment

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus   # Actuator endpoints to expose` },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // API DESIGN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'rest-conventions',
    section: 'API Design',
    title: 'REST Conventions & Status Codes',
    content: [
      { type: 'table', headers: ['Method', 'Path', 'Purpose', 'Status Code'], rows: [
        ['GET', '/api/v1/payments', 'List all', '200 OK'],
        ['GET', '/api/v1/payments/{id}', 'Get one', '200 OK or 404'],
        ['POST', '/api/v1/payments', 'Create', '201 Created'],
        ['PUT', '/api/v1/payments/{id}', 'Full update', '200 OK'],
        ['PATCH', '/api/v1/payments/{id}', 'Partial update', '200 OK'],
        ['DELETE', '/api/v1/payments/{id}', 'Delete', '204 No Content'],
      ]},
      { type: 'heading', value: 'Status Code Reference' },
      { type: 'table', headers: ['Code', 'When'], rows: [
        ['200', 'Success with body'],
        ['201', 'Created (POST)'],
        ['204', 'Success no body (DELETE)'],
        ['400', 'Bad request (validation failed)'],
        ['401', 'Not authenticated (no/invalid token)'],
        ['403', 'Forbidden (wrong role)'],
        ['404', 'Not found'],
        ['409', 'Conflict (duplicate)'],
        ['422', 'Unprocessable (business rule violated)'],
        ['429', 'Too many requests (rate limited)'],
        ['500', 'Server error'],
      ]},
    ]
  },
  {
    slug: 'api-best-practices',
    section: 'API Design',
    title: 'API Design Best Practices',
    content: [
      { type: 'list', items: [
        'Use nouns, not verbs: /payments not /createPayment',
        'Plural names: /payments not /payment',
        'Nested resources: /payments/{id}/refunds',
        'Use HTTP methods correctly: POST=create, PUT=full update, PATCH=partial, DELETE=remove',
        'Version your API: /api/v1/payments',
        'Return consistent error format across all endpoints',
        'Use pagination for list endpoints (never return unbounded lists)',
        'Include hypermedia links for discoverability (optional but nice)',
      ]},
      { type: 'heading', value: 'Good vs Bad' },
      { type: 'table', headers: ['Bad', 'Good', 'Why'], rows: [
        ['POST /createPayment', 'POST /api/v1/payments', 'Use HTTP method, not verb in URL'],
        ['GET /payment', 'GET /api/v1/payments', 'Plural, versioned'],
        ['GET /api/v1/payments?all=true', 'GET /api/v1/payments?page=0&size=20', 'Always paginate'],
        ['200 for everything', '201 for POST, 204 for DELETE', 'Correct status codes'],
      ]},
    ]
  },
  {
    slug: 'api-versioning',
    section: 'API Design',
    title: 'API Versioning',
    content: [
      { type: 'text', value: 'Version your APIs so existing clients don\'t break when you make changes.' },
      { type: 'heading', value: 'URL Path Versioning (Recommended)' },
      { type: 'code', lang: 'java', value: `@RestController
@RequestMapping("/api/v1/payments")
public class PaymentControllerV1 { ... }

@RestController
@RequestMapping("/api/v2/payments")
public class PaymentControllerV2 { ... }` },
      { type: 'heading', value: 'When to Version' },
      { type: 'list', items: [
        'Removing a field from the response',
        'Changing the meaning of a field',
        'Changing the URL structure',
        'NOT needed for: adding new optional fields, adding new endpoints',
      ]},
    ]
  },
  {
    slug: 'idempotent-apis',
    section: 'API Design',
    title: 'Idempotent APIs',
    content: [
      { type: 'text', value: 'An idempotent API can be called multiple times with the same result. GET, PUT, DELETE are naturally idempotent. POST is not — calling it twice creates two resources.' },
      { type: 'heading', value: 'Make POST Idempotent with Idempotency Key' },
      { type: 'code', lang: 'java', value: `@PostMapping
public ResponseEntity<Payment> create(
    @RequestHeader("Idempotency-Key") String idempotencyKey,
    @RequestBody CreatePaymentRequest request) {

    // Check if we already processed this key
    Optional<Payment> existing = repository.findByIdempotencyKey(idempotencyKey);
    if (existing.isPresent()) {
        return ResponseEntity.ok(existing.get());  // Return cached result
    }

    Payment payment = new Payment(request, idempotencyKey);
    repository.save(payment);
    return ResponseEntity.status(201).body(payment);
}` },
      { type: 'tip', value: 'The client generates a unique key (UUID) and sends it with each request. If the same key is seen again, return the previous result instead of creating a duplicate.' },
    ]
  },
  {
    slug: 'rate-limiting',
    section: 'API Design',
    title: 'Rate Limiting at Service Level',
    content: [
      { type: 'text', value: 'The gateway does global rate limiting. For per-user or per-endpoint limits within your service, use Resilience4j:' },
      { type: 'code', lang: 'java', value: `@RestController
public class PaymentController {

    @RateLimiter(name = "createPayment", fallbackMethod = "rateLimitFallback")
    @PostMapping("/api/v1/payments")
    public Payment create(@RequestBody CreatePaymentRequest req) { ... }

    private Payment rateLimitFallback(CreatePaymentRequest req, Exception ex) {
        throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
    }
}` },
      { type: 'code', lang: 'yaml', value: `# application.yml
resilience4j:
  ratelimiter:
    instances:
      createPayment:
        limitForPeriod: 10          # max 10 calls
        limitRefreshPeriod: 60s     # per 60 seconds
        timeoutDuration: 0s         # don't wait, fail immediately` },
    ]
  },
  {
    slug: 'dtos-vs-entities',
    section: 'API Design',
    title: 'DTOs vs Entities + MapStruct',
    content: [
      { type: 'text', value: 'Never expose JPA entities directly in your API. Use DTOs (Data Transfer Objects) to control what goes in and out.' },
      { type: 'heading', value: 'Why' },
      { type: 'list', items: [
        'Entity has fields you don\'t want exposed (createdAt, internalStatus, passwordHash)',
        'API request has different fields than the entity (no ID on create, no audit fields)',
        'Entity changes shouldn\'t break your API contract',
      ]},
      { type: 'heading', value: 'Example' },
      { type: 'code', lang: 'java', value: `// Request DTO — what the client sends
public class CreatePaymentRequest {
    @NotNull private BigDecimal amount;
    @NotBlank private String currency;
    // no id, no status, no timestamps
}

// Response DTO — what the client receives
public class PaymentResponse {
    private String id;
    private BigDecimal amount;
    private String currency;
    private String status;
    // no internal fields like version, deletedAt
}

// Entity — database representation
@Entity
public class Payment {
    @Id private UUID id;
    private BigDecimal amount;
    private String currency;
    private String status;
    @Version private Long version;        // internal
    private LocalDateTime deletedAt;      // internal
    @CreationTimestamp private LocalDateTime createdAt;
}` },
      { type: 'heading', value: 'MapStruct — Auto Mapping' },
      { type: 'code', lang: 'java', value: `@Mapper(componentModel = "spring")
public interface PaymentMapper {
    PaymentResponse toResponse(Payment entity);
    Payment toEntity(CreatePaymentRequest request);
}
// Spring auto-generates the implementation at compile time` },
    ]
  },
  {
    slug: 'error-response-format',
    section: 'API Design',
    title: 'Error Response Format',
    content: [
      { type: 'text', value: 'All errors return the same JSON structure so clients can handle them consistently.' },
      { type: 'code', lang: 'java', value: `@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PaymentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(PaymentNotFoundException ex) {
        return ResponseEntity.status(404).body(new ErrorResponse(
            "PAYMENT_NOT_FOUND", ex.getMessage(), LocalDateTime.now()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.toList());
        return ResponseEntity.badRequest().body(new ErrorResponse(
            "VALIDATION_FAILED", "Invalid request", errors
        ));
    }
}` },
      { type: 'heading', value: 'Standard Error Body' },
      { type: 'code', lang: 'json', value: `{
  "code": "PAYMENT_NOT_FOUND",
  "message": "Payment with id abc-123 not found",
  "timestamp": "2026-04-06T10:30:00"
}` },
    ]
  },
  {
    slug: 'cors',
    section: 'API Design',
    title: 'CORS',
    content: [
      { type: 'text', value: 'CORS (Cross-Origin Resource Sharing) controls which domains can call your API from a browser. In production, the gateway handles this. For local development:' },
      { type: 'code', lang: 'java', value: `@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")  // your frontend
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*");
    }
}` },
    ]
  },
  {
    slug: 'swagger',
    section: 'API Design',
    title: 'Swagger Documentation',
    content: [
      { type: 'text', value: 'Swagger auto-generates API documentation from your code. Access it at /swagger-ui.html.' },
      { type: 'code', lang: 'java', value: `@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments", description = "Payment management API")
public class PaymentController {

    @Operation(summary = "Create a payment",
               description = "Creates a new payment and publishes event to Kafka")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Payment created"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping
    public ResponseEntity<PaymentResponse> create(
        @Valid @RequestBody CreatePaymentRequest request) { ... }
}` },
      { type: 'heading', value: 'Document DTOs' },
      { type: 'code', lang: 'java', value: `@Schema(description = "Request to create a new payment")
public class CreatePaymentRequest {

    @Schema(description = "Amount in decimal", example = "99.99", required = true)
    @NotNull @Positive
    private BigDecimal amount;

    @Schema(description = "ISO currency code", example = "USD")
    @NotBlank @Size(min = 3, max = 3)
    private String currency;
}` },
    ]
  },
  {
    slug: 'validation',
    section: 'API Design',
    title: 'Validation',
    content: [
      { type: 'text', value: 'Validate input at the API boundary. Spring validates @Valid annotated request bodies automatically.' },
      { type: 'table', headers: ['Annotation', 'What it checks'], rows: [
        ['@NotNull', 'Cannot be null'],
        ['@NotBlank', 'Cannot be null, empty, or whitespace'],
        ['@Size(min=1, max=100)', 'String/collection length'],
        ['@Min(0) / @Max(10000)', 'Number range'],
        ['@Positive', 'Must be > 0'],
        ['@Email', 'Valid email format'],
        ['@Pattern(regexp="...")', 'Regex match'],
        ['@Past / @Future', 'Date in past/future'],
      ]},
      { type: 'code', lang: 'java', value: `@PostMapping
public ResponseEntity<Payment> create(@Valid @RequestBody CreatePaymentRequest req) {
    // If validation fails, Spring returns 400 automatically
    // with field-level error messages
}` },
    ]
  },
  {
    slug: 'pagination',
    section: 'API Design',
    title: 'Pagination, Sorting & Filtering',
    content: [
      { type: 'heading', value: 'Controller' },
      { type: 'code', lang: 'java', value: `@GetMapping
public Page<PaymentResponse> list(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "createdAt") String sortBy,
    @RequestParam(defaultValue = "desc") String sortDir,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) BigDecimal minAmount) {

    Pageable pageable = PageRequest.of(page, size,
        Sort.by(Sort.Direction.fromString(sortDir), sortBy));
    Specification<Payment> spec = PaymentSpec.build(status, minAmount);
    return repository.findAll(spec, pageable).map(mapper::toResponse);
}` },
      { type: 'heading', value: 'Dynamic Filters with Specification' },
      { type: 'code', lang: 'java', value: `public class PaymentSpec {
    public static Specification<Payment> build(String status, BigDecimal minAmount) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null)
                predicates.add(cb.equal(root.get("status"), status));
            if (minAmount != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}` },
      { type: 'heading', value: 'Usage' },
      { type: 'code', lang: 'text', value: 'GET /api/v1/payments?page=0&size=10&sortBy=amount&sortDir=desc&status=PENDING&minAmount=50' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DAY-TO-DAY TASKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'add-endpoint',
    section: 'Day-to-Day Tasks',
    title: 'Add a New REST Endpoint',
    content: [
      { type: 'text', value: 'Full flow: controller → service → repository. Every new endpoint follows this pattern.' },
      { type: 'heading', value: 'Step 1: Request + Response DTOs' },
      { type: 'code', lang: 'java', value: `public class CreateInvoiceRequest {
    @NotNull private BigDecimal amount;
    @NotBlank private String customerId;
}

public class InvoiceResponse {
    private String id;
    private BigDecimal amount;
    private String status;
}` },
      { type: 'heading', value: 'Step 2: Controller' },
      { type: 'code', lang: 'java', value: `@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceResponse create(@Valid @RequestBody CreateInvoiceRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public InvoiceResponse getById(@PathVariable String id) {
        return service.getById(id);
    }
}` },
      { type: 'heading', value: 'Step 3: Service' },
      { type: 'code', lang: 'java', value: `@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository repository;
    private final InvoiceMapper mapper;

    @Transactional
    public InvoiceResponse create(CreateInvoiceRequest req) {
        Invoice invoice = mapper.toEntity(req);
        invoice.setStatus("PENDING");
        invoice = repository.save(invoice);
        return mapper.toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getById(String id) {
        return repository.findById(UUID.fromString(id))
            .map(mapper::toResponse)
            .orElseThrow(() -> new InvoiceNotFoundException(id));
    }
}` },
      { type: 'heading', value: 'Step 4: Test it' },
      { type: 'code', lang: 'bash', value: `TOKEN=$(curl -s -X POST http://localhost:18081/realms/payment/protocol/openid-connect/token \\
  -d 'grant_type=password&client_id=payment-service&username=testuser&password=password' \\
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

curl -X POST http://localhost:18090/payment/api/v1/invoices \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 100.00, "customerId": "cust-1"}'` },
    ]
  },
  {
    slug: 'add-business-logic',
    section: 'Day-to-Day Tasks',
    title: 'Add Business Logic',
    content: [
      { type: 'text', value: 'Business logic goes in @Service classes. Keep controllers thin — they only validate input and delegate.' },
      { type: 'code', lang: 'java', value: `@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository repository;
    private final StreamBridge kafka;
    private final PaymentMetrics metrics;

    @Transactional
    public PaymentResponse processPayment(ProcessPaymentRequest request) {
        // 1. Validate business rules
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidPaymentException("Amount must be positive");
        }

        // 2. Execute business logic
        Payment payment = new Payment(request);
        payment.setStatus("PROCESSING");
        payment = repository.save(payment);

        // 3. Publish event
        kafka.send("payment-events",
            new PaymentCreatedEvent(payment.getId(), payment.getAmount()));

        // 4. Track metrics
        metrics.recordPaymentCreated(payment.getCurrency());

        // 5. Return DTO (never the entity)
        return mapper.toResponse(payment);
    }
}` },
      { type: 'tip', value: 'One service per domain concept. PaymentService handles payments, NotificationService handles notifications. If a service does too much, split it.' },
    ]
  },
  {
    slug: 'add-table-entity',
    section: 'Day-to-Day Tasks',
    title: 'Add a New Database Table + Entity',
    content: [
      { type: 'heading', value: 'Step 1: Liquibase Changelog' },
      { type: 'code', lang: 'xml', value: `<!-- src/main/resources/db/changelog/005-create-invoices.xml -->
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.9.xsd">

    <changeSet id="005" author="payment">
        <createTable tableName="invoices">
            <column name="id" type="uuid" defaultValueComputed="gen_random_uuid()">
                <constraints primaryKey="true"/>
            </column>
            <column name="amount" type="decimal(19,4)">
                <constraints nullable="false"/>
            </column>
            <column name="status" type="varchar(50)" defaultValue="PENDING"/>
            <column name="customer_id" type="varchar(100)">
                <constraints nullable="false"/>
            </column>
            <column name="created_at" type="timestamp" defaultValueComputed="now()"/>
        </createTable>
    </changeSet>
</databaseChangeLog>` },
      { type: 'heading', value: 'Step 2: Include in Master Changelog' },
      { type: 'code', lang: 'xml', value: '<include file="db/changelog/005-create-invoices.xml"/>' },
      { type: 'heading', value: 'Step 3: JPA Entity' },
      { type: 'code', lang: 'java', value: `@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(length = 50)
    private String status = "PENDING";

    @Column(name = "customer_id", nullable = false)
    private String customerId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}` },
      { type: 'heading', value: 'Step 4: Repository' },
      { type: 'code', lang: 'java', value: `public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByStatus(String status);
    List<Invoice> findByCustomerId(String customerId);
}` },
    ]
  },
  {
    slug: 'query-database',
    section: 'Day-to-Day Tasks',
    title: 'Query a Database',
    content: [
      { type: 'heading', value: 'Derived Queries (Spring generates SQL)' },
      { type: 'code', lang: 'java', value: `public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByStatus(String status);
    List<Payment> findByAmountGreaterThan(BigDecimal min);
    List<Payment> findByStatusAndCurrency(String status, String currency);
    Optional<Payment> findByIdempotencyKey(String key);
    long countByStatus(String status);
    boolean existsByIdempotencyKey(String key);
}` },
      { type: 'heading', value: 'Custom JPQL' },
      { type: 'code', lang: 'java', value: `@Query("SELECT p FROM Payment p WHERE p.amount > :min AND p.status IN :statuses")
List<Payment> findExpensiveByStatuses(@Param("min") BigDecimal min,
                                      @Param("statuses") List<String> statuses);` },
      { type: 'heading', value: 'Native SQL (Complex Queries)' },
      { type: 'code', lang: 'java', value: `@Query(value = """
    SELECT status, COUNT(*) as count, SUM(amount) as total
    FROM payments
    WHERE created_at > :since
    GROUP BY status
    """, nativeQuery = true)
List<Object[]> getStatusSummary(@Param("since") LocalDateTime since);` },
    ]
  },
  {
    slug: 'publish-kafka-event',
    section: 'Day-to-Day Tasks',
    title: 'Publish a Kafka Event',
    content: [
      { type: 'heading', value: 'Using StreamBridge (Recommended)' },
      { type: 'code', lang: 'java', value: `@Service
@RequiredArgsConstructor
public class PaymentService {

    private final StreamBridge streamBridge;

    public void createPayment(CreatePaymentRequest request) {
        Payment payment = repository.save(new Payment(request));

        // Publish event
        PaymentCreatedEvent event = new PaymentCreatedEvent(
            UUID.randomUUID().toString(),   // eventId
            payment.getId(),                 // paymentId
            payment.getAmount(),
            Instant.now()
        );
        streamBridge.send("payment-events", event);
    }
}` },
      { type: 'heading', value: 'Event DTO' },
      { type: 'code', lang: 'java', value: `public class PaymentCreatedEvent {
    private String eventId;      // for idempotency
    private String paymentId;
    private BigDecimal amount;
    private Instant timestamp;
    private String source = "payment-service";
}` },
      { type: 'heading', value: 'Config' },
      { type: 'code', lang: 'yaml', value: `spring:
  cloud:
    stream:
      bindings:
        paymentEventSupplier-out-0:
          destination: payment-events` },
    ]
  },
  {
    slug: 'consume-kafka-event',
    section: 'Day-to-Day Tasks',
    title: 'Consume a Kafka Event',
    content: [
      { type: 'code', lang: 'java', value: `@Configuration
public class KafkaConsumers {

    @Bean
    public Consumer<PaymentCreatedEvent> paymentEventConsumer(
            PaymentRepository repository,
            ProcessedEventRepository processedEvents) {

        return event -> {
            // Idempotency check
            if (processedEvents.existsById(event.getEventId())) {
                log.info("Already processed event {}, skipping", event.getEventId());
                return;
            }

            // Process the event
            log.info("Processing payment event: {}", event.getPaymentId());
            // ... your business logic ...

            // Mark as processed
            processedEvents.save(new ProcessedEvent(event.getEventId()));
        };
    }
}` },
      { type: 'heading', value: 'Config' },
      { type: 'code', lang: 'yaml', value: `spring:
  cloud:
    function:
      definition: paymentEventConsumer
    stream:
      bindings:
        paymentEventConsumer-in-0:
          destination: payment-events
          group: notification-service-group` },
    ]
  },
  {
    slug: 'cache-redis',
    section: 'Day-to-Day Tasks',
    title: 'Cache with Redis',
    content: [
      { type: 'code', lang: 'java', value: `@Service
public class PaymentService {

    @Cacheable(value = "payments", key = "#id")
    public PaymentResponse getById(String id) {
        // Called only on cache miss — result is cached automatically
        return repository.findById(UUID.fromString(id))
            .map(mapper::toResponse)
            .orElseThrow(() -> new PaymentNotFoundException(id));
    }

    @CacheEvict(value = "payments", key = "#id")
    public PaymentResponse update(String id, UpdatePaymentRequest req) {
        // Cache entry removed after update
        // ...
    }

    @CacheEvict(value = "payments", allEntries = true)
    public void clearCache() {
        // Removes all cached payments
    }
}` },
      { type: 'heading', value: 'TTL Configuration' },
      { type: 'code', lang: 'yaml', value: `spring:
  redis:
    host: redis-master
  cache:
    redis:
      time-to-live: 300000   # 5 minutes in milliseconds` },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT-DRIVEN ARCHITECTURE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'what-is-eda',
    section: 'Event-Driven Architecture',
    title: 'What is Event-Driven Architecture',
    content: [
      { type: 'text', value: 'Services communicate through events instead of direct API calls. When something happens in Service A, it publishes an event. Any interested service can react to it independently.' },
      { type: 'heading', value: 'Direct Calls vs Events' },
      { type: 'code', lang: 'text', value: `Direct (tight coupling):
  Payment Service --HTTP POST--> Notification Service
  Payment Service --HTTP POST--> Analytics Service
  Payment Service --HTTP POST--> Audit Service

Event-Driven (loose coupling):
  Payment Service --publishes "payment.created"--> Kafka
      Notification Service reads event and sends email
      Analytics Service reads event and updates dashboard
      Audit Service reads event and logs it` },
      { type: 'heading', value: 'When to Use Events' },
      { type: 'list', items: [
        'You don\'t need an immediate response (async is fine)',
        'Multiple services need to react to the same thing',
        'You want services to be independent (deploy separately)',
        'You need to replay events (reprocess historical data)',
      ]},
      { type: 'heading', value: 'When NOT to Use Events' },
      { type: 'list', items: [
        'You need an immediate response (use REST)',
        'Simple CRUD with no downstream effects',
        'One-to-one communication (consider REST or SQS instead)',
      ]},
    ]
  },
  {
    slug: 'events-vs-commands',
    section: 'Event-Driven Architecture',
    title: 'Events vs Commands',
    content: [
      { type: 'table', headers: ['', 'Event', 'Command'], rows: [
        ['Tense', 'Past — "payment.created"', 'Imperative — "process.payment"'],
        ['Intent', 'Notification — "this happened"', 'Instruction — "do this"'],
        ['Consumers', 'Many (broadcast)', 'One (targeted)'],
        ['Can reject?', 'No — it already happened', 'Yes — can fail'],
        ['Transport', 'Kafka (pub/sub)', 'SQS (queue)'],
      ]},
      { type: 'warning', value: 'Common mistake: putting commands on Kafka or naming events as commands. "createPayment" is a command. "payment.created" is an event.' },
    ]
  },
  {
    slug: 'event-design',
    section: 'Event-Driven Architecture',
    title: 'Event Design — What an Event Should Contain',
    content: [
      { type: 'code', lang: 'java', value: `public class PaymentCreatedEvent {
    private String eventId;         // UUID — for idempotency
    private String eventType;       // "payment.created"
    private Instant timestamp;      // when it happened
    private String source;          // "payment-service"
    private String correlationId;   // trace ID from the request

    // Payload — the actual data
    private String paymentId;
    private BigDecimal amount;
    private String currency;
    private String status;
}` },
      { type: 'heading', value: 'Rules' },
      { type: 'list', items: [
        'Always include eventId, eventType, timestamp, source',
        'Include enough data that consumers don\'t need to call back (fat event)',
        'Never include secrets, tokens, passwords, full credit card numbers',
        'Events are immutable — once published, never modify them',
      ]},
    ]
  },
  {
    slug: 'event-naming',
    section: 'Event-Driven Architecture',
    title: 'Event Naming Conventions',
    content: [
      { type: 'table', headers: ['What', 'Convention', 'Example'], rows: [
        ['Event type', 'domain.action (past tense)', 'payment.created, order.shipped'],
        ['Topic name', 'domain-events', 'payment-events, order-events'],
        ['Consumer group', 'consuming-service-topic', 'notification-service-payment-events'],
        ['DLQ topic', 'topic-dlq', 'payment-events-dlq'],
      ]},
    ]
  },
  {
    slug: 'event-versioning',
    section: 'Event-Driven Architecture',
    title: 'Event Versioning & Schema Evolution',
    content: [
      { type: 'text', value: 'When you need to change an event structure, follow backward-compatible rules.' },
      { type: 'list', items: [
        'Only ADD fields — never remove or rename',
        'New fields must have defaults (consumers that don\'t know about them still work)',
        'Add a "version" field so consumers can handle both old and new',
        'Breaking changes → create a new event type (payment.created.v2)',
      ]},
      { type: 'code', lang: 'java', value: `// V1
{ "eventId": "...", "paymentId": "...", "amount": 100 }

// V2 — added currency (backward compatible)
{ "eventId": "...", "paymentId": "...", "amount": 100, "currency": "USD" }

// Consumer handles both:
String currency = event.getCurrency() != null ? event.getCurrency() : "USD";` },
    ]
  },
  {
    slug: 'event-best-practices',
    section: 'Event-Driven Architecture',
    title: 'Event-Driven Best Practices',
    content: [
      { type: 'list', items: [
        'One event per state change (not one event with all changes)',
        'Events are immutable — never modify a published event',
        'Don\'t put commands in events',
        'Keep events small — only include what consumers need',
        'Always include metadata (eventId, timestamp, source, correlationId)',
        'Consumer owns its own data — store what you need locally, don\'t call back',
        'Design for failure — assume every consumer will fail at least once',
        'Don\'t chain events too deeply — A→B→C→D becomes impossible to debug',
        'Monitor consumer lag — if consumers fall behind, you have a problem',
        'Test with duplicate events — your system must handle replays',
        'Log every event consumed with eventId — essential for debugging',
      ]},
    ]
  },
  {
    slug: 'event-idempotency',
    section: 'Event-Driven Architecture',
    title: 'Idempotency — Handling Duplicate Events',
    content: [
      { type: 'text', value: 'Kafka delivers at-least-once. Duplicates will happen (retries, rebalancing). Your consumer must handle them safely.' },
      { type: 'code', lang: 'java', value: `@Bean
public Consumer<PaymentCreatedEvent> processPayment(
        ProcessedEventRepository processedEvents,
        PaymentService paymentService) {

    return event -> {
        // 1. Check if already processed
        if (processedEvents.existsById(event.getEventId())) {
            log.info("Duplicate event {}, skipping", event.getEventId());
            return;
        }

        // 2. Process
        paymentService.handle(event);

        // 3. Mark as processed (same transaction as step 2)
        processedEvents.save(new ProcessedEvent(event.getEventId()));
    };
}` },
      { type: 'heading', value: 'Processed Events Table' },
      { type: 'code', lang: 'sql', value: `CREATE TABLE processed_events (
    event_id VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMP DEFAULT now()
);` },
    ]
  },
  {
    slug: 'event-ordering',
    section: 'Event-Driven Architecture',
    title: 'Event Ordering — When Order Matters',
    content: [
      { type: 'text', value: 'Kafka guarantees order within a partition only. To ensure events for the same entity are ordered, use the entity ID as the partition key.' },
      { type: 'code', lang: 'java', value: `// All events for payment-123 go to the same partition → ordered
streamBridge.send("payment-events",
    MessageBuilder.withPayload(event)
        .setHeader(KafkaHeaders.KEY, payment.getId())  // partition key
        .build());` },
    ]
  },
  {
    slug: 'dead-letter-queues',
    section: 'Event-Driven Architecture',
    title: 'Dead Letter Queues — Handling Failures',
    content: [
      { type: 'text', value: 'When a consumer fails after all retries, the message goes to a Dead Letter Queue (DLQ) instead of being lost.' },
      { type: 'code', lang: 'yaml', value: `spring:
  cloud:
    stream:
      bindings:
        paymentEventConsumer-in-0:
          destination: payment-events
          group: my-service-group
      kafka:
        bindings:
          paymentEventConsumer-in-0:
            consumer:
              enableDlq: true
              dlqName: payment-events-dlq` },
    ]
  },
  {
    slug: 'event-sourcing',
    section: 'Event-Driven Architecture',
    title: 'Event Sourcing',
    content: [
      { type: 'text', value: 'Instead of storing current state, store all events. Rebuild state by replaying events.' },
      { type: 'code', lang: 'text', value: `Traditional: payment = { status: "PAID" }

Event Sourced:
  1. payment.created  { amount: 100 }
  2. payment.authorized { authCode: "ABC" }
  3. payment.captured { capturedAmount: 100 }
  4. payment.paid { paidAt: "2026-04-06" }

Current state = replay events 1→2→3→4` },
      { type: 'heading', value: 'When to Use' },
      { type: 'list', items: [
        'Full audit trail required',
        'Need to undo/replay operations',
        'Complex domain with many state transitions',
      ]},
      { type: 'heading', value: 'When NOT to Use' },
      { type: 'list', items: [
        'Simple CRUD',
        'Read-heavy workloads (event replay is slow for queries)',
        'Small team / simple domain',
      ]},
    ]
  },
  {
    slug: 'choreography-vs-orchestration',
    section: 'Event-Driven Architecture',
    title: 'Choreography vs Orchestration',
    content: [
      { type: 'text', value: 'Two ways to coordinate multi-service workflows.' },
      { type: 'table', headers: ['', 'Choreography', 'Orchestration'], rows: [
        ['How', 'Each service reacts to events', 'One service tells others what to do'],
        ['Coupling', 'Loose', 'Tighter (orchestrator knows all steps)'],
        ['Visibility', 'Hard to see full flow', 'Easy — orchestrator has the whole picture'],
        ['Failure', 'Each service handles its own compensation', 'Orchestrator handles rollback'],
        ['Best for', 'Simple flows, few steps', 'Complex flows, many steps'],
      ]},
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DESIGN PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'strategy-pattern',
    section: 'Design Patterns',
    title: 'Strategy Pattern',
    content: [
      { type: 'text', value: 'Same operation, different implementations. Select at runtime.' },
      { type: 'code', lang: 'java', value: `// Interface
public interface PaymentProcessor {
    String getType(); // "STRIPE", "PAYPAL"
    PaymentResult process(Payment payment);
}

// Implementations
@Component
public class StripeProcessor implements PaymentProcessor {
    public String getType() { return "STRIPE"; }
    public PaymentResult process(Payment p) { /* Stripe API */ }
}

@Component
public class PayPalProcessor implements PaymentProcessor {
    public String getType() { return "PAYPAL"; }
    public PaymentResult process(Payment p) { /* PayPal API */ }
}

// Factory picks the right one
@Service
public class PaymentService {
    private final Map<String, PaymentProcessor> processors;

    public PaymentService(List<PaymentProcessor> list) {
        this.processors = list.stream()
            .collect(Collectors.toMap(PaymentProcessor::getType, p -> p));
    }

    public PaymentResult process(Payment payment) {
        PaymentProcessor processor = processors.get(payment.getMethod());
        if (processor == null) throw new UnsupportedPaymentMethodException();
        return processor.process(payment);
    }
}` },
    ]
  },
  {
    slug: 'factory-pattern',
    section: 'Design Patterns',
    title: 'Factory Pattern',
    content: [
      { type: 'text', value: 'Create different objects based on input. Common in Spring with @Component + List injection.' },
      { type: 'code', lang: 'java', value: `public interface NotificationSender {
    String getChannel(); // "EMAIL", "SMS", "PUSH"
    void send(String to, String message);
}

@Component
public class EmailSender implements NotificationSender {
    public String getChannel() { return "EMAIL"; }
    public void send(String to, String msg) { /* send email */ }
}

@Component
public class SmsSender implements NotificationSender {
    public String getChannel() { return "SMS"; }
    public void send(String to, String msg) { /* send SMS */ }
}

// Spring injects all implementations automatically
@Service
@RequiredArgsConstructor
public class NotificationFactory {
    private final List<NotificationSender> senders;

    public NotificationSender getSender(String channel) {
        return senders.stream()
            .filter(s -> s.getChannel().equals(channel))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown: " + channel));
    }
}` },
    ]
  },
  {
    slug: 'builder-pattern',
    section: 'Design Patterns',
    title: 'Builder Pattern',
    content: [
      { type: 'text', value: 'Use Lombok @Builder for objects with many fields. Cleaner than telescoping constructors.' },
      { type: 'code', lang: 'java', value: `@Builder
@Data
public class SearchQuery {
    private String text;
    private String status;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private LocalDate from;
    private LocalDate to;
    @Builder.Default private int page = 0;
    @Builder.Default private int size = 20;
}

// Usage
SearchQuery query = SearchQuery.builder()
    .text("invoice")
    .status("PENDING")
    .minAmount(new BigDecimal("100"))
    .page(0)
    .size(10)
    .build();` },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KAFKA BASICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'what-is-kafka',
    section: 'Kafka Basics',
    title: 'What is Kafka',
    content: [
      { type: 'text', value: 'Kafka is a distributed message broker. Services publish messages to topics. Other services consume from those topics. Messages are persisted — consumers can replay them.' },
      { type: 'code', lang: 'text', value: `Producer → Topic (partitioned) → Consumer Group
                                      ↗ Consumer 1 (partition 0, 1)
Service A → [payment-events] ───────
                                      ↘ Consumer 2 (partition 2)` },
      { type: 'heading', value: 'Key Concepts' },
      { type: 'table', headers: ['Concept', 'What'], rows: [
        ['Topic', 'Named channel for messages (like a table)'],
        ['Partition', 'Topic is split for parallelism'],
        ['Offset', 'Position of a message in a partition'],
        ['Consumer Group', 'Multiple instances share the load'],
        ['Retention', 'Messages kept for a configured period (default 7 days)'],
      ]},
    ]
  },
  {
    slug: 'kafka-producers-consumers',
    section: 'Kafka Basics',
    title: 'Producers & Consumers',
    content: [
      { type: 'text', value: 'Producers send messages to a topic. Consumers read from a topic. Unlike a queue, messages are NOT deleted after consumption — other consumers can read the same message.' },
      { type: 'heading', value: 'In Spring Cloud Stream' },
      { type: 'code', lang: 'java', value: `// Producer — uses StreamBridge
streamBridge.send("payment-events", event);

// Consumer — functional bean
@Bean
public Consumer<PaymentEvent> processEvent() {
    return event -> {
        log.info("Received: {}", event);
    };
}` },
    ]
  },
  {
    slug: 'consumer-groups',
    section: 'Kafka Basics',
    title: 'Consumer Groups',
    content: [
      { type: 'text', value: 'When you run 3 instances of your service, they form a consumer group. Kafka splits partitions across instances so each message is processed once (not 3 times).' },
      { type: 'code', lang: 'text', value: `Topic: payment-events (3 partitions)
Consumer Group: payment-service-group

Instance 1 → reads partition 0
Instance 2 → reads partition 1
Instance 3 → reads partition 2

If Instance 2 dies:
Instance 1 → reads partition 0, 1
Instance 3 → reads partition 2` },
    ]
  },
  {
    slug: 'kafka-vs-sqs-vs-rest',
    section: 'Kafka Basics',
    title: 'When to Use Kafka vs SQS vs REST',
    content: [
      { type: 'table', headers: ['Use Case', 'Use', 'Why'], rows: [
        ['Need response now', 'REST', 'Synchronous request/reply'],
        ['Background job queue', 'SQS', 'One consumer, fire-and-forget'],
        ['Broadcast event', 'Kafka', 'Multiple consumers react independently'],
        ['Event replay', 'Kafka', 'Messages retained, can re-read'],
        ['Task with retry/DLQ', 'SQS', 'Built-in retry + dead letter'],
        ['High throughput events', 'Kafka', 'Partitioned, distributed'],
      ]},
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KUBERNETES BASICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'what-is-k8s',
    section: 'Kubernetes Basics',
    title: 'What is Kubernetes',
    content: [
      { type: 'text', value: 'Kubernetes runs your containers, restarts them if they crash, scales them up/down, and routes traffic to them.' },
      { type: 'table', headers: ['Concept', 'What', 'Analogy'], rows: [
        ['Pod', 'Your running container', 'A single instance of your app'],
        ['Deployment', 'Manages pod replicas', '"Run 3 copies of my service"'],
        ['Service', 'Stable network address', 'Load balancer for your pods'],
        ['Namespace', 'Isolation', 'Folder for related resources'],
        ['ConfigMap', 'Non-sensitive config', 'Environment variables file'],
        ['Secret', 'Sensitive config', 'Encrypted env vars'],
      ]},
    ]
  },
  {
    slug: 'how-service-runs',
    section: 'Kubernetes Basics',
    title: 'How Your Service Runs in K8s',
    content: [
      { type: 'code', lang: 'text', value: `Your code → Docker image → Loaded into Kind → Helm chart deployed

Helm chart defines:
  - Image name + tag
  - Replicas (how many pods)
  - Resources (CPU, memory limits)
  - Health checks (liveness, readiness probes)
  - Environment variables
  - Service (network address)` },
      { type: 'text', value: 'DevConsole handles all of this for you. You just click Deploy.' },
    ]
  },
  {
    slug: 'service-discovery',
    section: 'Kubernetes Basics',
    title: 'Service Discovery',
    content: [
      { type: 'text', value: 'Services find each other by DNS name. No hardcoded IPs.' },
      { type: 'code', lang: 'text', value: `http://payment-service.payments.svc.cluster.local:8080
       ↑ service name     ↑ namespace   ↑ always this` },
      { type: 'text', value: 'The gateway routes external traffic to internal services. Services can also call each other directly using these DNS names.' },
    ]
  },
  {
    slug: 'configmaps-secrets',
    section: 'Kubernetes Basics',
    title: 'ConfigMaps & Secrets',
    content: [
      { type: 'text', value: 'Config that varies per environment goes in ConfigMaps (non-sensitive) and Secrets (sensitive). They become environment variables in your pod.' },
      { type: 'code', lang: 'yaml', value: `# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: payment-config
data:
  SPRING_PROFILES_ACTIVE: "local"
  SERVER_SERVLET_CONTEXT_PATH: "/payment"

# In your application.yml, these override:
# spring.profiles.active and server.servlet.context-path` },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USING KEYCLOAK
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'keycloak-basics',
    section: 'Using Keycloak',
    title: 'Keycloak Basics — Realms, Clients, Users',
    content: [
      { type: 'text', value: 'Keycloak handles authentication. Open http://localhost:18081 (admin/admin).' },
      { type: 'table', headers: ['Concept', 'What'], rows: [
        ['Realm', 'Isolated auth space. Each project gets one (e.g., "payment")'],
        ['Client', 'Your service registered in Keycloak (e.g., "payment-service")'],
        ['User', 'Someone who can log in'],
        ['Role', 'Permission label assigned to users (e.g., "ADMIN", "USER")'],
      ]},
    ]
  },
  {
    slug: 'keycloak-users-roles',
    section: 'Using Keycloak',
    title: 'Create Users & Roles',
    content: [
      { type: 'heading', value: 'In the Keycloak UI' },
      { type: 'list', items: [
        'Realm Roles → Create Role → name it "PAYMENT_ADMIN"',
        'Users → Add User → set username + email',
        'User → Credentials → Set Password → toggle off "temporary"',
        'User → Role Mappings → select role → Add',
      ]},
      { type: 'heading', value: 'Get a Token' },
      { type: 'code', lang: 'bash', value: `curl -s -X POST http://localhost:18081/realms/payment/protocol/openid-connect/token \\
  -d 'grant_type=password&client_id=payment-service&client_secret=template-secret&username=testuser&password=password'` },
      { type: 'heading', value: 'Use the Token' },
      { type: 'code', lang: 'bash', value: 'curl -H "Authorization: Bearer $TOKEN" http://localhost:18090/payment/api/v1/payments' },
    ]
  },
  {
    slug: 'keycloak-sso',
    section: 'Using Keycloak',
    title: 'Single Sign-On with OAuth2',
    content: [
      { type: 'text', value: 'Login once with Keycloak, access all services. The token works for every service behind the gateway.' },
      { type: 'code', lang: 'text', value: `User logs in → Keycloak → JWT token
Token sent to Gateway → validated → forwarded to any service
Same token works for payment-service, order-service, etc.` },
    ]
  },
  {
    slug: 'keycloak-client-config',
    section: 'Using Keycloak',
    title: 'Client Configuration',
    content: [
      { type: 'table', headers: ['Setting', 'Value', 'Why'], rows: [
        ['Client Type', 'Confidential', 'Backend service with a secret'],
        ['Client ID', 'payment-service', 'Identifies your service'],
        ['Client Secret', 'auto-generated', 'For token exchange'],
        ['Redirect URI', 'Not needed', 'Backend API, no browser login'],
      ]},
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USING GRAFANA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'grafana-basics',
    section: 'Using Grafana',
    title: 'Grafana Basics — Navigating the UI',
    content: [
      { type: 'text', value: 'Open http://localhost:13000 (admin/admin). Grafana shows metrics from Prometheus and logs from Loki.' },
      { type: 'list', items: [
        'Home → overview of your dashboards',
        'Explore → query metrics (Prometheus) or logs (Loki) directly',
        'Dashboards → saved visualizations',
        'Alerting → set up alerts for error rates, latency, etc.',
      ]},
    ]
  },
  {
    slug: 'grafana-metrics',
    section: 'Using Grafana',
    title: 'View Service Performance Metrics',
    content: [
      { type: 'text', value: 'Go to Explore → select Prometheus data source. Copy-paste these queries:' },
      { type: 'table', headers: ['Metric', 'Query'], rows: [
        ['Request rate', 'rate(http_server_requests_seconds_count[5m])'],
        ['Latency p99', 'histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))'],
        ['Error rate', 'rate(http_server_requests_seconds_count{status="500"}[5m])'],
        ['JVM memory', 'jvm_memory_used_bytes'],
        ['Active DB connections', 'hikaricp_connections_active'],
      ]},
    ]
  },
  {
    slug: 'grafana-tracing',
    section: 'Using Grafana',
    title: 'Trace a Request',
    content: [
      { type: 'text', value: 'Every request gets a trace ID. Find it in the response header or logs, then search in Grafana → Explore → Loki:' },
      { type: 'code', lang: 'text', value: '{app="payment-service"} |= "traceId=abc123def"' },
      { type: 'text', value: 'This shows every log line related to that request, across all services it touched.' },
    ]
  },
  {
    slug: 'grafana-custom-metrics',
    section: 'Using Grafana',
    title: 'Emit Custom Metrics',
    content: [
      { type: 'code', lang: 'java', value: `@Component
@RequiredArgsConstructor
public class PaymentMetrics {

    private final MeterRegistry registry;

    // Counter — things that go up
    public void recordPaymentCreated(String currency) {
        registry.counter("payments.created", "currency", currency).increment();
    }

    // Timer — how long things take
    public void recordProcessingTime(long ms) {
        registry.timer("payment.processing").record(ms, TimeUnit.MILLISECONDS);
    }

    // Gauge — current value
    public void registerPendingGauge(List<?> pendingList) {
        Gauge.builder("payments.pending", pendingList, List::size)
            .register(registry);
    }
}` },
      { type: 'text', value: 'Query in Grafana: payments_created_total, payment_processing_seconds' },
    ]
  },
  {
    slug: 'grafana-dashboard',
    section: 'Using Grafana',
    title: 'Build a Dashboard for Your Service',
    content: [
      { type: 'list', items: [
        'Dashboards → New Dashboard → Add Panel',
        'Select Prometheus data source, paste query',
        'Choose visualization (time series, stat, gauge, table)',
        'Recommended panels: request rate, error rate, latency p50/p95/p99, DB connections, JVM heap, custom business metrics',
        'Add a $service variable to filter all panels by service name',
        'Save and share with your team',
      ]},
    ]
  },
  {
    slug: 'grafana-alerts',
    section: 'Using Grafana',
    title: 'Set Up Alerts',
    content: [
      { type: 'list', items: [
        'Panel → Alert tab → Create Alert Rule',
        'Set condition: e.g., error_rate > 0.05 for 5 minutes',
        'Configure notification: email, Slack, PagerDuty',
      ]},
      { type: 'heading', value: 'Recommended Alerts' },
      { type: 'list', items: [
        'Error rate > 5% for 5 minutes',
        'Latency p99 > 1 second for 5 minutes',
        'Kafka consumer lag > 1000 for 10 minutes',
        'Pod restarts > 2 in 10 minutes',
        'DB connection pool exhausted',
      ]},
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'transactions',
    section: 'Patterns',
    title: 'Transactions',
    content: [
      { type: 'code', lang: 'java', value: `@Service
public class PaymentService {

    @Transactional
    public Payment create(CreatePaymentRequest request) {
        Payment payment = repository.save(new Payment(request));
        outboxRepository.save(new OutboxEvent("payment.created", payment));
        // Both save or both rollback — guaranteed
        return payment;
    }

    @Transactional(readOnly = true)  // optimized for reads
    public List<Payment> list() {
        return repository.findAll();
    }
}` },
      { type: 'warning', value: '@Transactional on private methods does nothing. Must be public. Calling within the same class also bypasses the proxy — extract to another service if needed.' },
    ]
  },
  {
    slug: 'saga-concept',
    section: 'Patterns',
    title: 'Saga — Concept & Flow',
    content: [
      { type: 'text', value: 'A saga is a sequence of steps across services. If any step fails, previous steps are undone (compensated).' },
      { type: 'code', lang: 'text', value: `Happy path:
  Order Created → Stock Reserved → Payment Processed → Order Confirmed

Failure at step 3:
  Order Created → Stock Reserved → Payment FAILED
                   ↓ compensation
                   Release Stock → Cancel Order` },
    ]
  },
  {
    slug: 'saga-example',
    section: 'Patterns',
    title: 'Saga — Full Worked Example',
    content: [
      { type: 'code', lang: 'java', value: `@Entity
@Table(name = "saga_state")
public class PaymentSaga {
    @Id private String sagaId;
    @Enumerated(EnumType.STRING) private SagaStep currentStep;
    private String orderId;
    private String failureReason;
}

enum SagaStep { INITIATED, STOCK_RESERVED, PAYMENT_PROCESSED, COMPLETED, COMPENSATING }

// Step 2: Stock reserved → process payment
@Bean
public Consumer<StockReservedEvent> onStockReserved() {
    return event -> {
        PaymentSaga saga = sagaRepository.findById(event.getSagaId()).orElseThrow();
        try {
            paymentService.processPayment(saga.getOrderId());
            saga.setCurrentStep(SagaStep.PAYMENT_PROCESSED);
            streamBridge.send("payment-events", new PaymentProcessedEvent(saga.getSagaId()));
        } catch (Exception e) {
            saga.setCurrentStep(SagaStep.COMPENSATING);
            saga.setFailureReason(e.getMessage());
            streamBridge.send("inventory-events", new ReleaseStockEvent(saga.getSagaId()));
        }
        sagaRepository.save(saga);
    };
}` },
    ]
  },
  {
    slug: 'cqrs-concept',
    section: 'Patterns',
    title: 'CQRS — Concept & Flow',
    content: [
      { type: 'text', value: 'Write to PostgreSQL (source of truth). Read from OpenSearch (optimized for queries). Sync via Kafka events.' },
      { type: 'code', lang: 'text', value: `Write: POST /payments → Save to PostgreSQL → Publish event to Kafka
Sync:  Kafka consumer → Index to OpenSearch
Read:  GET /payments/search?q=... → Query OpenSearch` },
      { type: 'tip', value: 'Tradeoff: write is always consistent, read is eventually consistent (may lag by milliseconds).' },
    ]
  },
  {
    slug: 'cqrs-example',
    section: 'Patterns',
    title: 'CQRS — Full Worked Example',
    content: [
      { type: 'code', lang: 'java', value: `// Write side
@Transactional
public Payment create(CreatePaymentRequest req) {
    Payment payment = repository.save(new Payment(req));
    outboxRepository.save(new OutboxEvent("payment.created", toJson(payment)));
    return payment;
}

// Sync (Kafka consumer → OpenSearch)
@Bean
public Consumer<PaymentCreatedEvent> syncToSearch(OpenSearchService search) {
    return event -> search.index("payments", event.getPaymentId(), event);
}

// Read side
@GetMapping("/search")
public List<PaymentDocument> search(@RequestParam String q) {
    return openSearchService.search("payments", q);
}` },
    ]
  },
  {
    slug: 'outbox-concept',
    section: 'Patterns',
    title: 'Outbox — Concept & Flow',
    content: [
      { type: 'text', value: 'Problem: save to DB succeeds but Kafka publish fails → data inconsistency. Solution: write the event to an outbox table in the same DB transaction. A poller publishes it later.' },
      { type: 'code', lang: 'text', value: `@Transactional {
    repository.save(payment);         ← DB write
    outboxRepository.save(event);     ← same transaction
}

Poller (every 1s):
    read unpublished from outbox → publish to Kafka → mark published` },
    ]
  },
  {
    slug: 'outbox-example',
    section: 'Patterns',
    title: 'Outbox — Full Worked Example',
    content: [
      { type: 'code', lang: 'java', value: `@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
    @Id @GeneratedValue private UUID id;
    private String eventType;
    @Column(columnDefinition = "text") private String payload;
    private boolean published;
    @CreationTimestamp private LocalDateTime createdAt;
}

// Save in same transaction
@Transactional
public Payment create(CreatePaymentRequest req) {
    Payment payment = repository.save(new Payment(req));
    outboxRepository.save(new OutboxEvent("payment.created", toJson(payment)));
    return payment;
}

// Poller
@Scheduled(fixedDelay = 1000)
@Transactional
public void pollOutbox() {
    List<OutboxEvent> pending = outboxRepository.findByPublishedFalse();
    for (OutboxEvent event : pending) {
        streamBridge.send(event.getEventType(), event.getPayload());
        event.setPublished(true);
    }
}` },
    ]
  },
  {
    slug: 'saga-outbox-combined',
    section: 'Patterns',
    title: 'Saga + Outbox Combined',
    content: [
      { type: 'text', value: 'In production, saga steps use the outbox pattern for guaranteed event delivery. Each step saves business state + outbox event in one transaction.' },
      { type: 'code', lang: 'java', value: `@Transactional
public void processStep(StockReservedEvent event) {
    // 1. Update saga state
    PaymentSaga saga = sagaRepository.findById(event.getSagaId()).orElseThrow();
    saga.setCurrentStep(SagaStep.PAYMENT_PROCESSED);
    sagaRepository.save(saga);

    // 2. Save outbox event (same transaction)
    outboxRepository.save(new OutboxEvent(
        "payment.processed",
        toJson(new PaymentProcessedEvent(saga.getSagaId()))
    ));
    // Poller will publish to Kafka — guaranteed delivery
}` },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'jwt-oauth2',
    section: 'Security',
    title: 'JWT & OAuth2',
    content: [
      { type: 'code', lang: 'text', value: `Flow:
1. Client → Keycloak: "Here's my username + password"
2. Keycloak → Client: "Here's your JWT token"
3. Client → Gateway: "GET /payments" + Authorization: Bearer <token>
4. Gateway: validates token, checks expiry, forwards to service
5. Service: reads user info from token, processes request` },
      { type: 'heading', value: 'Read User Info from JWT' },
      { type: 'code', lang: 'java', value: `@GetMapping("/me")
public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
    return Map.of(
        "username", jwt.getClaim("preferred_username"),
        "roles", jwt.getClaim("realm_access")
    );
}` },
    ]
  },
  {
    slug: 'roles-permissions',
    section: 'Security',
    title: 'Roles & Permissions',
    content: [
      { type: 'text', value: 'Your service authenticates users via JWT tokens issued by Keycloak. Each token contains the user\'s roles. You can restrict endpoints to specific roles using Spring Security annotations.' },
      { type: 'heading', value: 'Step 1: Enable Method Security' },
      { type: 'text', value: 'Add @EnableMethodSecurity to your security config. This tells Spring to check @PreAuthorize annotations on your controllers.' },
      { type: 'code', lang: 'java', value: `@Configuration
@EnableMethodSecurity  // <-- enables @PreAuthorize
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()  // health checks are public
                .anyRequest().authenticated()                  // everything else needs JWT
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt());     // validate JWT from Keycloak
        return http.build();
    }
}` },
      { type: 'heading', value: 'Step 2: Create Roles in Keycloak' },
      { type: 'text', value: 'Open Keycloak Admin (http://localhost:18081/auth/admin/) → Realm "template" → Realm Roles → Add Role. Create roles like TEMPLATE_USER and TEMPLATE_ADMIN. Then assign them to users under Users → Role Mappings.' },
      { type: 'tip', value: 'The template already creates TEMPLATE_USER and TEMPLATE_ADMIN roles. testuser has TEMPLATE_USER, adminuser has both.' },
      { type: 'heading', value: 'Step 3: Secure Your Endpoints' },
      { type: 'text', value: 'Use @PreAuthorize on controller methods. Spring reads the roles from the JWT token automatically.' },
      { type: 'code', lang: 'java', value: `@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    // Any authenticated user can list payments
    @GetMapping
    public List<Payment> list() {
        return paymentService.findAll();
    }

    // Only users with TEMPLATE_ADMIN role can delete
    @PreAuthorize("hasRole('TEMPLATE_ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        paymentService.delete(id);
    }

    // Multiple roles: ADMIN or MANAGER can approve
    @PreAuthorize("hasAnyRole('TEMPLATE_ADMIN', 'TEMPLATE_MANAGER')")
    @PostMapping("/{id}/approve")
    public Payment approve(@PathVariable String id) {
        return paymentService.approve(id);
    }

    // Owner check: user can only see their own payments, unless admin
    @PreAuthorize("#userId == authentication.name or hasRole('TEMPLATE_ADMIN')")
    @GetMapping("/user/{userId}")
    public List<Payment> userPayments(@PathVariable String userId) {
        return paymentService.findByUser(userId);
    }
}` },
      { type: 'text', value: 'When a user without the required role tries to access a secured endpoint, Spring returns 403 Forbidden automatically.' },
      { type: 'heading', value: 'Step 4: Test It' },
      { type: 'text', value: 'Get a token for testuser (TEMPLATE_USER only) and try to delete — it should fail with 403. Then get a token for adminuser (has TEMPLATE_ADMIN) — it should succeed.' },
      { type: 'code', lang: 'bash', value: `# Get token for testuser (TEMPLATE_USER role)
TOKEN=$(curl -s -X POST http://localhost:18090/auth/realms/template/protocol/openid-connect/token \\
  -d "grant_type=password&client_id=microservice-template&client_secret=template-secret&username=testuser&password=password" \\
  | jq -r .access_token)

# Try to delete — should return 403 Forbidden
curl -X DELETE http://localhost:18090/payment/api/v1/payments/123 \\
  -H "Authorization: Bearer $TOKEN"
# → 403 Forbidden

# Get token for adminuser (has TEMPLATE_ADMIN)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:18090/auth/realms/template/protocol/openid-connect/token \\
  -d "grant_type=password&client_id=microservice-template&client_secret=template-secret&username=adminuser&password=password" \\
  | jq -r .access_token)

# Try to delete — should succeed
curl -X DELETE http://localhost:18090/payment/api/v1/payments/123 \\
  -H "Authorization: Bearer $ADMIN_TOKEN"
# → 200 OK` },
      { type: 'warning', value: 'Keycloak puts roles inside realm_access.roles in the JWT. Spring Security maps them automatically when you use oauth2ResourceServer().jwt(). The role names in @PreAuthorize must match exactly (case-sensitive).' },
    ]
  },
  {
    slug: 'owasp-top-10',
    section: 'Security',
    title: 'OWASP Top 10 for APIs',
    content: [
      { type: 'table', headers: ['Vulnerability', 'Protection in Template'], rows: [
        ['SQL Injection', 'JPA uses parameterized queries — safe by default'],
        ['Broken Auth', 'Gateway validates JWT on every request'],
        ['Mass Assignment', 'DTOs control what fields are accepted (entity has more)'],
        ['Rate Limiting', 'Gateway + Resilience4j rate limiter'],
        ['SSRF', 'Don\'t pass user input to internal URLs'],
        ['Injection', 'Validate all input with @Valid'],
      ]},
    ]
  },
  {
    slug: 'input-sanitization',
    section: 'Security',
    title: 'Input Sanitization',
    content: [
      { type: 'list', items: [
        'Always use @Valid on request bodies',
        '@Size to limit string lengths (prevent huge payloads)',
        '@Pattern for format constraints',
        'JPA parameterized queries prevent SQL injection',
        'Never concatenate user input into queries, URLs, or commands',
        'Log user input carefully — sanitize before logging',
      ]},
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'unit-tests',
    section: 'Testing',
    title: 'Unit Tests',
    content: [
      { type: 'heading', value: 'Service Test (Business Logic)' },
      { type: 'code', lang: 'java', value: `@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository repository;
    @Mock private StreamBridge kafka;
    @InjectMocks private PaymentService service;

    @Test
    void shouldCreatePayment() {
        when(repository.save(any())).thenReturn(new Payment("id-1", 100, "PENDING"));

        Payment result = service.create(new CreatePaymentRequest(100, "USD"));

        assertThat(result.getStatus()).isEqualTo("PENDING");
        verify(repository).save(any());
        verify(kafka).send(eq("payment-events"), any());
    }
}` },
      { type: 'heading', value: 'Controller Test (HTTP Layer)' },
      { type: 'code', lang: 'java', value: `@WebMvcTest(PaymentController.class)
class PaymentControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private PaymentService service;

    @Test
    @WithMockUser(roles = "USER")
    void shouldReturn201() throws Exception {
        when(service.create(any())).thenReturn(new PaymentResponse("id-1"));

        mockMvc.perform(post("/api/v1/payments")
                .contentType(APPLICATION_JSON)
                .content("{\\"amount\\": 100}"))
            .andExpect(status().isCreated());
    }
}` },
      { type: 'text', value: 'Run: mvn test' },
    ]
  },
  {
    slug: 'integration-tests',
    section: 'Testing',
    title: 'Integration Tests',
    content: [
      { type: 'text', value: 'Use Testcontainers to spin up real PostgreSQL, Redis, Kafka, etc. Tests run against actual services, not mocks.' },
      { type: 'code', lang: 'java', value: `@SpringBootTest(webEnvironment = RANDOM_PORT)
@ActiveProfiles("test")
class PaymentApiIT extends BaseIntegrationTest {

    @Autowired private TestRestTemplate restTemplate;

    @Test
    void shouldCreateAndRetrievePayment() {
        var request = new CreatePaymentRequest(100.00, "USD");
        var response = restTemplate.postForEntity(
            "/api/v1/payments", request, PaymentResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        String id = response.getBody().getId();
        var found = restTemplate.getForEntity(
            "/api/v1/payments/" + id, PaymentResponse.class);
        assertThat(found.getBody().getAmount()).isEqualTo(100.00);
    }
}` },
      { type: 'text', value: 'Run: mvn verify' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHEATSHEETS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: 'annotations-cheatsheet',
    section: 'Cheatsheets',
    title: 'Annotations',
    content: [
      { type: 'heading', value: 'REST' },
      { type: 'table', headers: ['Annotation', 'What'], rows: [
        ['@RestController', 'Marks class as REST controller'],
        ['@RequestMapping("/path")', 'Base URL for all endpoints'],
        ['@GetMapping', 'Handle GET'],
        ['@PostMapping', 'Handle POST'],
        ['@PutMapping', 'Handle PUT'],
        ['@DeleteMapping', 'Handle DELETE'],
        ['@PathVariable', 'Extract from URL: /users/{id}'],
        ['@RequestParam', 'Extract query param: ?page=1'],
        ['@RequestBody', 'Parse JSON body'],
        ['@Valid', 'Trigger validation'],
        ['@ResponseStatus(CREATED)', 'Set response code'],
      ]},
      { type: 'heading', value: 'JPA' },
      { type: 'table', headers: ['Annotation', 'What'], rows: [
        ['@Entity', 'JPA entity (maps to table)'],
        ['@Table(name="...")', 'Custom table name'],
        ['@Id', 'Primary key'],
        ['@GeneratedValue', 'Auto-generate ID'],
        ['@Column', 'Column config'],
        ['@CreationTimestamp', 'Auto-set on create'],
        ['@UpdateTimestamp', 'Auto-set on update'],
        ['@OneToMany / @ManyToOne', 'Relationships'],
      ]},
      { type: 'heading', value: 'Spring Core' },
      { type: 'table', headers: ['Annotation', 'What'], rows: [
        ['@Service', 'Business logic bean'],
        ['@Repository', 'Data access bean'],
        ['@Component', 'Generic bean'],
        ['@Configuration + @Bean', 'Manual bean creation'],
        ['@Value("${...}")', 'Inject config value'],
        ['@Transactional', 'Wrap in DB transaction'],
        ['@Cacheable / @CacheEvict', 'Redis cache'],
        ['@PreAuthorize', 'Role-based access'],
        ['@Async', 'Run in background thread'],
        ['@Scheduled', 'Cron job / periodic task'],
      ]},
    ]
  },
  {
    slug: 'common-errors',
    section: 'Cheatsheets',
    title: 'Common Errors',
    content: [
      { type: 'table', headers: ['Error', 'Cause', 'Fix'], rows: [
        ['No qualifying bean', 'Missing @Service/@Component annotation', 'Add annotation or @Bean method'],
        ['Circular dependency', 'A depends on B depends on A', 'Extract shared logic to a third service'],
        ['LazyInitializationException', 'Accessing lazy collection outside transaction', 'Use @Transactional or fetch eagerly'],
        ['Table not found', 'Liquibase didn\'t run / wrong schema', 'Check changelog includes and datasource URL'],
        ['401 Unauthorized', 'Missing or expired JWT token', 'Get fresh token from Keycloak'],
        ['403 Forbidden', 'User lacks required role', 'Check @PreAuthorize and user roles in Keycloak'],
        ['Connection refused', 'Service not running / wrong host', 'Check pod status: kubectl get pods -n payments'],
        ['Port already in use', 'Another process on same port', 'Kill existing process or change port'],
        ['OOMKilled', 'Pod exceeded memory limit', 'Increase resources.limits.memory in Helm values'],
        ['CrashLoopBackOff', 'App keeps crashing', 'Check logs: kubectl logs <pod> -n payments'],
      ]},
    ]
  },
];
