import { type ClientSchema, a, defineData } from '@aws-amplify/backend'
import { switchToOrganizer } from '../functions/switch-to-organizer/resource'
import { createCheckout } from '../functions/create-checkout/resource'
import { createGuestCheckout } from '../functions/create-guest-checkout/resource'

const schema = a.schema({
  // ─── USER PROFILE ───
  UserProfile: a
    .model({
      userId: a.id().required(),
      email: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      displayName: a.string(),
      avatarUrl: a.string(),
      phone: a.string(),
      dateOfBirth: a.date(),
      gender: a.enum(['M', 'F', 'NB', 'OTHER']),
      city: a.string(),
      state: a.string(),
      country: a.string().default('MX'),
      bloodType: a.string(),
      emergencyContactName: a.string(),
      emergencyContactPhone: a.string(),
      emergencyContactRelationship: a.string(),
      shirtSize: a.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      role: a.enum(['ATLETA', 'ORGANIZADOR', 'ADMIN']),
      // PLUS subscription
      plusActive: a.boolean().default(false),
      plusPlan: a.string(),
      plusStripeSubId: a.string(),
      plusStartDate: a.datetime(),
      plusEndDate: a.datetime(),
      // Stats
      totalEvents: a.integer().default(0),
      totalDistanceKm: a.float().default(0),
      totalPodiums: a.integer().default(0),
      // Relations
      registrations: a.hasMany('Registration', 'userId'),
      results: a.hasMany('Result', 'userId'),
      organizedEvents: a.hasMany('Event', 'organizerId'),
      orders: a.hasMany('Order', 'userId'),
    })
    .secondaryIndexes((idx) => [
      idx('email'),
      idx('role'),
    ])
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // ─── EVENTS ───
  Event: a
    .model({
      slug: a.string().required(),
      title: a.string().required(),
      description: a.string(),
      shortDescription: a.string(),
      sport: a.enum([
        'RUNNING', 'CICLISMO', 'NATACION', 'TRAIL', 'TRIATLON',
        'OCR', 'SENDERISMO', 'DOWNHILL', 'OTRO',
      ]),
      eventDate: a.datetime().required(),
      eventEndDate: a.datetime(),
      registrationDeadline: a.datetime(),
      // Location
      venue: a.string(),
      address: a.string(),
      city: a.string().required(),
      state: a.string(),
      country: a.string().default('MX'),
      latitude: a.float(),
      longitude: a.float(),
      // Media
      imageUrl: a.string(),
      bannerUrl: a.string(),
      // Organizer
      organizerId: a.id().required(),
      organizerName: a.string(),
      organizerLogo: a.string(),
      organizer: a.belongsTo('UserProfile', 'organizerId'),
      // Capacity
      totalSpots: a.integer(),
      spotsRemaining: a.integer(),
      // Pricing (centavos MXN)
      priceMin: a.integer(),
      priceMax: a.integer(),
      currency: a.string().default('MXN'),
      // Status
      status: a.enum(['DRAFT', 'PUBLISHED', 'SOLDOUT', 'CANCELLED', 'COMPLETED']),
      featured: a.boolean().default(false),
      // Serial
      serialId: a.id(),
      serial: a.belongsTo('Serial', 'serialId'),
      // Tags
      tags: a.string().array(),
      // Relations
      distances: a.hasMany('EventDistance', 'eventId'),
      registrations: a.hasMany('Registration', 'eventId'),
      guestRegistrations: a.hasMany('GuestRegistration', 'eventId'),
      results: a.hasMany('Result', 'eventId'),
    })
    .secondaryIndexes((idx) => [
      idx('slug'),
      idx('sport').sortKeys(['eventDate']),
      idx('status').sortKeys(['eventDate']),
      idx('city').sortKeys(['eventDate']),
      idx('serialId').sortKeys(['eventDate']),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('organizadores').to(['create', 'update', 'delete']),
      allow.guest().to(['read']),
    ]),

  // ─── EVENT DISTANCES ───
  EventDistance: a
    .model({
      eventId: a.id().required(),
      event: a.belongsTo('Event', 'eventId'),
      name: a.string().required(),         // "42K", "21K", "Sprint"
      distanceKm: a.float(),
      price: a.integer().required(),        // centavos MXN
      currency: a.string().default('MXN'),
      spotsTotal: a.integer(),
      spotsRemaining: a.integer(),
      category: a.enum(['ELITE', 'GENERAL', 'FUN']),
      minAge: a.integer(),
      maxAge: a.integer(),
    })
    .secondaryIndexes((idx) => [
      idx('eventId'),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('organizadores'),
      allow.guest().to(['read']),

    ]),

  // ─── REGISTRATIONS ───
  Registration: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
      eventId: a.id().required(),
      event: a.belongsTo('Event', 'eventId'),
      distanceId: a.id().required(),
      distanceName: a.string(),
      distanceKm: a.float(),
      category: a.enum(['ELITE', 'GENERAL', 'FUN']),
      bibNumber: a.integer(),
      status: a.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DNS', 'DNF', 'FINISHED']),
      paymentStatus: a.enum(['PENDING', 'PAID', 'REFUNDED']),
      stripePaymentIntentId: a.string(),
      amountPaid: a.integer(),              // centavos
      currency: a.string().default('MXN'),
      registeredAt: a.datetime(),
      checkedInAt: a.datetime(),
      waiverSigned: a.boolean().default(false),
      teamName: a.string(),
      promoCode: a.string(),
      shirtSize: a.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    })
    .secondaryIndexes((idx) => [
      idx('userId').sortKeys(['eventId']),
      idx('eventId').sortKeys(['status']),
    ])
    .authorization((allow) => [
      allow.owner(),
      allow.group('organizadores').to(['read', 'update']),
    ]),

  // ─── GUEST REGISTRATIONS ───
  GuestRegistration: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.string().required(),
      phone: a.string(),
      dateOfBirth: a.date(),
      gender: a.enum(['M', 'F', 'NB', 'OTHER']),
      eventId: a.id().required(),
      event: a.belongsTo('Event', 'eventId'),
      distanceId: a.id().required(),
      distanceName: a.string(),
      distanceKm: a.float(),
      category: a.enum(['ELITE', 'GENERAL', 'FUN']),
      bibNumber: a.integer(),
      status: a.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DNS', 'DNF', 'FINISHED']),
      paymentStatus: a.enum(['PENDING', 'PAID', 'REFUNDED']),
      stripePaymentIntentId: a.string(),
      amountPaid: a.integer(),
      currency: a.string().default('MXN'),
      registeredAt: a.datetime(),
      checkedInAt: a.datetime(),
      waiverSigned: a.boolean().default(false),
      teamName: a.string(),
      promoCode: a.string(),
      shirtSize: a.string(),
    })
    .secondaryIndexes((idx) => [
      idx('eventId').sortKeys(['status']),
      idx('email'),
    ])
    .authorization((allow) => [
      allow.guest().to(['create']),
      allow.group('organizadores').to(['read', 'update']),
    ]),

  // ─── RESULTS ───
  Result: a
    .model({
      eventId: a.id().required(),
      event: a.belongsTo('Event', 'eventId'),
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
      registrationId: a.id(),
      distanceName: a.string().required(),
      bibNumber: a.integer(),
      athleteName: a.string(),
      gender: a.enum(['M', 'F', 'NB', 'OTHER']),
      ageGroup: a.string(),                 // "M30-34"
      overallRank: a.integer(),
      genderRank: a.integer(),
      ageGroupRank: a.integer(),
      chipTime: a.string(),                 // "HH:MM:SS.ms"
      chipTimeSeconds: a.float(),
      gunTime: a.string(),
      gunTimeSeconds: a.float(),
      pace: a.string(),                     // "MM:SS/km"
      status: a.enum(['FINISHED', 'DNF', 'DNS', 'DQ']),
    })
    .secondaryIndexes((idx) => [
      idx('eventId').sortKeys(['chipTimeSeconds']),
      idx('userId'),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('organizadores'),
      allow.guest().to(['read']),
    ]),

  // ─── SERIALS ───
  Serial: a
    .model({
      slug: a.string().required(),
      name: a.string().required(),
      description: a.string(),
      imageUrl: a.string(),
      bannerUrl: a.string(),
      color: a.string(),                    // hex brand color
      organizerId: a.id(),
      year: a.integer(),
      totalEvents: a.integer(),
      cities: a.string().array(),
      sports: a.string().array(),
      scoringRules: a.string(),
      status: a.enum(['UPCOMING', 'ACTIVE', 'COMPLETED']),
      events: a.hasMany('Event', 'serialId'),
    })
    .secondaryIndexes((idx) => [
      idx('slug'),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('organizadores'),
      allow.guest().to(['read']),

    ]),

  // ─── ORDERS ───
  Order: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
      type: a.enum(['REGISTRATION', 'PLUS_SUBSCRIPTION', 'MERCHANDISE']),
      subtotal: a.integer(),                // centavos
      discount: a.integer().default(0),
      total: a.integer().required(),
      currency: a.string().default('MXN'),
      promoCode: a.string(),
      paymentMethod: a.enum(['CARD', 'OXXO', 'TRANSFER']),
      stripePaymentIntentId: a.string(),
      stripeSessionId: a.string(),
      status: a.enum(['PENDING', 'PAID', 'REFUNDED', 'FAILED']),
      paidAt: a.datetime(),
      refundedAt: a.datetime(),
      // Denormalized order details
      itemsJson: a.string(),               // JSON string of items array
    })
    .secondaryIndexes((idx) => [
      idx('userId'),
      idx('stripePaymentIntentId'),
    ])
    .authorization((allow) => [
      allow.owner(),
    ]),

  // ─── BLOG ───
  Article: a
    .model({
      slug: a.string().required(),
      title: a.string().required(),
      excerpt: a.string(),
      body: a.string(),
      category: a.enum(['RUNNING', 'NUTRICION', 'CICLISMO', 'ENTRENAMIENTO', 'EQUIPAMIENTO']),
      imageUrl: a.string(),
      authorId: a.id(),
      authorName: a.string(),
      readTimeMinutes: a.integer(),
      tags: a.string().array(),
      status: a.enum(['DRAFT', 'PUBLISHED']),
      publishedAt: a.datetime(),
    })
    .secondaryIndexes((idx) => [
      idx('slug'),
      idx('category').sortKeys(['publishedAt']),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.group('organizadores'),
      allow.group('atletas').to(['read']),
      allow.guest().to(['read']),

    ]),

  // Custom mutations
  switchToOrganizer: a
    .mutation()
    .arguments({})
    .returns(a.boolean())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(switchToOrganizer)),

  createCheckoutSession: a
    .mutation()
    .arguments({
      eventId: a.string().required(),
      distanceId: a.string().required(),
      distanceName: a.string().required(),
      eventTitle: a.string().required(),
      priceInCentavos: a.integer().required(),
      userId: a.string().required(),
      userEmail: a.string().required(),
      registrationId: a.string().required(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(createCheckout)),

  createGuestCheckoutSession: a
    .mutation()
    .arguments({
      eventId: a.string().required(),
      eventSlug: a.string().required(),
      distanceId: a.string().required(),
      distanceName: a.string().required(),
      eventTitle: a.string().required(),
      priceInCentavos: a.integer().required(),
      guestEmail: a.string().required(),
      guestRegistrationId: a.string().required(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(createGuestCheckout)),
})

export type Schema = ClientSchema<typeof schema>
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
})
