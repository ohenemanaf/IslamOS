// Preset locations for people who don't want to share GPS. Coordinates are city centres.
export const CITIES = [
    { id: 'accra', name: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.187, timeZone: 'Africa/Accra' },
    { id: 'kumasi', name: 'Kumasi', country: 'Ghana', lat: 6.6885, lng: -1.6244, timeZone: 'Africa/Accra' },
    { id: 'tamale', name: 'Tamale', country: 'Ghana', lat: 9.4008, lng: -0.8393, timeZone: 'Africa/Accra' },
    { id: 'takoradi', name: 'Takoradi', country: 'Ghana', lat: 4.8845, lng: -1.7554, timeZone: 'Africa/Accra' },
    { id: 'cape-coast', name: 'Cape Coast', country: 'Ghana', lat: 5.1053, lng: -1.2466, timeZone: 'Africa/Accra' },
    { id: 'wa', name: 'Wa', country: 'Ghana', lat: 10.0601, lng: -2.5099, timeZone: 'Africa/Accra' },
    { id: 'bolgatanga', name: 'Bolgatanga', country: 'Ghana', lat: 10.7856, lng: -0.8514, timeZone: 'Africa/Accra' },
    { id: 'sunyani', name: 'Sunyani', country: 'Ghana', lat: 7.3349, lng: -2.3123, timeZone: 'Africa/Accra' },
    { id: 'ho', name: 'Ho', country: 'Ghana', lat: 6.6008, lng: 0.4713, timeZone: 'Africa/Accra' },
    { id: 'koforidua', name: 'Koforidua', country: 'Ghana', lat: 6.0941, lng: -0.2591, timeZone: 'Africa/Accra' },
    { id: 'lagos', name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, timeZone: 'Africa/Lagos' },
    { id: 'kano', name: 'Kano', country: 'Nigeria', lat: 12.0022, lng: 8.592, timeZone: 'Africa/Lagos' },
    { id: 'abidjan', name: 'Abidjan', country: "Côte d'Ivoire", lat: 5.36, lng: -4.0083, timeZone: 'Africa/Abidjan' },
    { id: 'dakar', name: 'Dakar', country: 'Senegal', lat: 14.7167, lng: -17.4677, timeZone: 'Africa/Dakar' },
    { id: 'cairo', name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, timeZone: 'Africa/Cairo' },
    { id: 'makkah', name: 'Makkah', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262, timeZone: 'Asia/Riyadh' },
    { id: 'madinah', name: 'Madinah', country: 'Saudi Arabia', lat: 24.4686, lng: 39.6142, timeZone: 'Asia/Riyadh' },
    { id: 'dubai', name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, timeZone: 'Asia/Dubai' },
    { id: 'istanbul', name: 'Istanbul', country: 'Türkiye', lat: 41.0082, lng: 28.9784, timeZone: 'Europe/Istanbul' },
    { id: 'london', name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, timeZone: 'Europe/London' },
    { id: 'new-york', name: 'New York', country: 'USA', lat: 40.7128, lng: -74.006, timeZone: 'America/New_York' },
];

export const DEFAULT_LOCATION = { ...CITIES[0], source: 'city' };
