# Al Fallo — DynamoDB Schema Design

## Design Principles
- Single-table design where access patterns allow it
- GSIs for secondary access patterns (by date, sport, location, user)
- Denormalized for read-heavy operations (event listings, results)
- All dates stored as ISO-8601 strings for sortability
- All monetary values in centavos MXN

---

## Tables

### 1. `alfallo-events`

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | S | `EVENT#<eventId>` |
| `SK` | S | `METADATA` |
| `eventId` | S | UUID |
| `slug` | S | URL-friendly slug (e.g., `maraton-cdmx-2026`) |
| `title` | S | Event name |
| `description` | S | Full description / HTML |
| `shortDescription` | S | Card preview text |
| `sport` | S | `running` / `ciclismo` / `natacion` / `trail` / `triatlon` / `ocr` / `senderismo` / `downhill` / `otro` |
| `eventDate` | S | ISO-8601 |
| `eventEndDate` | S | ISO-8601 (optional, multi-day) |
| `registrationDeadline` | S | ISO-8601 |
| `location` | M | `{ venue, address, city, state, country, lat, lng }` |
| `city` | S | Denormalized for GSI |
| `state` | S | Denormalized for GSI |
| `imageUrl` | S | Card image |
| `bannerUrl` | S | Full-width banner |
| `galleryUrls` | L | Additional images |
| `distances` | L | `[{ name, distanceKm, price, currency, spotsTotal, spotsRemaining, category }]` |
| `priceRange` | M | `{ min, max, currency }` (centavos) |
| `organizer` | M | `{ id, name, logo, verified }` |
| `serialId` | S | FK to serial (nullable) |
| `tags` | SS | `["agotado", "virtual", "nuevo", "combo", "destacado"]` |
| `status` | S | `draft` / `published` / `soldout` / `cancelled` / `completed` |
| `totalSpots` | N | Aggregate total |
| `spotsRemaining` | N | Aggregate remaining |
| `resultsSummary` | M | `{ totalFinishers, fastestTime, averageTime }` |
| `createdAt` | S | ISO-8601 |
| `updatedAt` | S | ISO-8601 |

**GSIs:**
- `sport-date-index` — PK: `sport`, SK: `eventDate`
- `status-date-index` — PK: `status`, SK: `eventDate`
- `city-date-index` — PK: `city`, SK: `eventDate`
- `slug-index` — PK: `slug`
- `serial-date-index` — PK: `serialId`, SK: `eventDate`

---

### 2. `alfallo-users`

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | S | `USER#<userId>` |
| `SK` | S | `PROFILE` |
| `userId` | S | Cognito sub |
| `email` | S | |
| `firstName` | S | |
| `lastName` | S | |
| `displayName` | S | Public name |
| `avatarUrl` | S | |
| `phone` | S | |
| `dateOfBirth` | S | ISO-8601 |
| `gender` | S | `M` / `F` / `NB` / `other` |
| `city` | S | |
| `state` | S | |
| `country` | S | Default: MX |
| `bloodType` | S | Emergency info |
| `emergencyContact` | M | `{ name, phone, relationship }` |
| `shirtSize` | S | XS/S/M/L/XL/XXL |
| `role` | S | `athlete` / `organizer` / `admin` |
| `plusSubscription` | M | `{ active, plan, stripeSubId, startDate, endDate }` |
| `stats` | M | `{ totalEvents, totalDistanceKm, totalPodiums, personalRecords: { 5K, 10K, 21K, 42K } }` |
| `createdAt` | S | ISO-8601 |
| `updatedAt` | S | ISO-8601 |

**GSIs:**
- `email-index` — PK: `email`

---

### 3. `alfallo-registrations`

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | S | `REG#<registrationId>` |
| `SK` | S | `METADATA` |
| `registrationId` | S | UUID |
| `userId` | S | FK |
| `eventId` | S | FK |
| `distanceName` | S | e.g., "42K", "Sprint" |
| `distanceKm` | N | |
| `category` | S | `elite` / `general` / `fun` |
| `bibNumber` | N | Assigned race number |
| `status` | S | `pending` / `confirmed` / `cancelled` / `dns` / `dnf` / `finished` |
| `paymentStatus` | S | `pending` / `paid` / `refunded` |
| `stripePaymentIntentId` | S | |
| `amountPaid` | N | Centavos MXN |
| `currency` | S | MXN |
| `registeredAt` | S | ISO-8601 |
| `checkedInAt` | S | ISO-8601 |
| `waiverSigned` | BOOL | |
| `teamName` | S | Optional |
| `promoCode` | S | |
| `shirtSize` | S | |

**GSIs:**
- `user-event-index` — PK: `userId`, SK: `eventId`
- `event-status-index` — PK: `eventId`, SK: `status`
- `event-bib-index` — PK: `eventId`, SK: `bibNumber`

---

### 4. `alfallo-results`

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | S | `RESULT#<eventId>#<distanceName>` |
| `SK` | S | `RANK#<000001>` (zero-padded) |
| `resultId` | S | UUID |
| `eventId` | S | FK |
| `userId` | S | FK |
| `registrationId` | S | FK |
| `distanceName` | S | |
| `bibNumber` | N | |
| `athleteName` | S | Denormalized |
| `gender` | S | |
| `ageGroup` | S | e.g., "M30-34" |
| `overallRank` | N | |
| `genderRank` | N | |
| `ageGroupRank` | N | |
| `chipTime` | S | HH:MM:SS.ms (net) |
| `chipTimeSeconds` | N | For sorting |
| `gunTime` | S | HH:MM:SS.ms (gross) |
| `gunTimeSeconds` | N | |
| `pace` | S | MM:SS/km |
| `splits` | L | `[{ name, time, cumulativeKm }]` |
| `status` | S | `finished` / `dnf` / `dns` / `dq` |
| `photoUrls` | L | |
| `createdAt` | S | ISO-8601 |

**GSIs:**
- `event-chiptime-index` — PK: `eventId`, SK: `chipTimeSeconds`
- `user-results-index` — PK: `userId`, SK: `createdAt`
- `event-gender-index` — PK: `RESULT#<eventId>#<distanceName>#<gender>`, SK: `genderRank`

---

### 5. `alfallo-serials`

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | S | `SERIAL#<serialId>` |
| `SK` | S | `METADATA` |
| `serialId` | S | UUID |
| `slug` | S | |
| `name` | S | |
| `description` | S | |
| `imageUrl` | S | |
| `bannerUrl` | S | |
| `color` | S | Hex brand color |
| `organizerId` | S | FK |
| `year` | N | |
| `totalEvents` | N | |
| `cities` | SS | |
| `sports` | SS | |
| `scoringRules` | S | How points accumulate |
| `status` | S | `active` / `completed` / `upcoming` |
| `createdAt` | S | ISO-8601 |

**GSIs:**
- `slug-index` — PK: `slug`
- `year-status-index` — PK: `year`, SK: `status`

---

### 6. `alfallo-serial-standings`

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | S | `STANDING#<serialId>` |
| `SK` | S | `RANK#<000001>` |
| `userId` | S | FK |
| `athleteName` | S | Denormalized |
| `totalPoints` | N | |
| `eventsCompleted` | N | |
| `eventResults` | L | `[{ eventId, rank, points, time }]` |
| `ageGroup` | S | |
| `gender` | S | |

---

### 7. `alfallo-orders`

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | S | `ORDER#<orderId>` |
| `SK` | S | `METADATA` |
| `orderId` | S | UUID |
| `userId` | S | FK |
| `type` | S | `registration` / `plus_subscription` / `merchandise` |
| `items` | L | `[{ eventId, distanceName, quantity, unitPrice, subtotal }]` |
| `subtotal` | N | Centavos |
| `discount` | N | Centavos |
| `total` | N | Centavos |
| `currency` | S | MXN |
| `promoCode` | S | |
| `paymentMethod` | S | `card` / `oxxo` / `transfer` |
| `stripePaymentIntentId` | S | |
| `stripeSessionId` | S | |
| `status` | S | `pending` / `paid` / `refunded` / `failed` |
| `paidAt` | S | ISO-8601 |
| `refundedAt` | S | ISO-8601 |
| `createdAt` | S | ISO-8601 |

**GSIs:**
- `user-orders-index` — PK: `userId`, SK: `createdAt`
- `stripe-index` — PK: `stripePaymentIntentId`

---

### 8. `alfallo-blog`

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | S | `ARTICLE#<articleId>` |
| `SK` | S | `METADATA` |
| `articleId` | S | UUID |
| `slug` | S | |
| `title` | S | |
| `excerpt` | S | |
| `body` | S | Markdown/HTML |
| `category` | S | `running` / `nutricion` / `ciclismo` / `entrenamiento` / `equipamiento` |
| `imageUrl` | S | |
| `authorId` | S | FK |
| `authorName` | S | Denormalized |
| `readTimeMinutes` | N | |
| `tags` | SS | |
| `status` | S | `draft` / `published` |
| `publishedAt` | S | ISO-8601 |
| `createdAt` | S | ISO-8601 |

**GSIs:**
- `slug-index` — PK: `slug`
- `category-date-index` — PK: `category`, SK: `publishedAt`

---

## Access Pattern Summary

| Access Pattern | Table | Key/GSI |
|----------------|-------|---------|
| Get event by ID | events | PK |
| Get event by slug | events | slug-index |
| List events by sport | events | sport-date-index |
| List upcoming events | events | status-date-index (PK=published) |
| List events by city | events | city-date-index |
| List events in serial | events | serial-date-index |
| Get user profile | users | PK |
| User login (email) | users | email-index |
| Register for event | registrations | PK |
| My registrations | registrations | user-event-index |
| Event participant list | registrations | event-status-index |
| Check-in by bib | registrations | event-bib-index |
| Event results (ranked) | results | PK + SK (sorted by rank) |
| Results by finish time | results | event-chiptime-index |
| My results history | results | user-results-index |
| Gender leaderboard | results | event-gender-index |
| Serial standings | serial-standings | PK + SK |
| Order history | orders | user-orders-index |
| Webhook idempotency | orders | stripe-index |
| Blog by category | blog | category-date-index |
| Blog by slug | blog | slug-index |
