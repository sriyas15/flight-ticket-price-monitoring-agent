/**
 * Flight Provider Interface
 *
 * Every flight data provider (mock, Kiwi, Duffel, etc.) must implement
 * this interface so MonitoringService can swap providers without any
 * changes to business logic.
 *
 * @typedef {Object} FlightResult
 * @property {number}  price        - Lowest available fare
 * @property {string}  currency     - ISO 4217 currency code (e.g. "INR")
 * @property {string}  origin       - IATA origin code
 * @property {string}  destination  - IATA destination code
 * @property {string}  departureDate
 * @property {string|null} returnDate
 * @property {string}  provider     - Provider identifier string
 * @property {string}  bookingLink  - Deep-link to booking page
 * @property {Date}    fetchedAt    - When the result was retrieved
 */

/**
 * @interface IFlightProvider
 *
 * fetchLowestFare(params) => Promise<FlightResult | null>
 *
 * @param {Object} params
 * @param {string} params.origin
 * @param {string} params.destination
 * @param {string} params.departureDateFrom  - ISO date string
 * @param {string} [params.departureDateTo]
 * @param {string} [params.returnDateFrom]
 * @param {string} [params.returnDateTo]
 * @param {string} params.tripType          - "one_way" | "round_trip"
 * @param {string} params.cabinClass
 * @param {number} params.passengers
 * @param {string} params.currency
 *
 * Returns null if no fares found for the given params.
 */

// This file is documentation only — no runtime export needed.
// Import the concrete provider you want from the same directory.
