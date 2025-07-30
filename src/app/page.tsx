"use client"
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Car, Calculator, Clock, Star, Phone, Mail, User } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Autocomplete, DirectionsRenderer } from '@react-google-maps/api';
import Image from 'next/image'
//import { Helmet } from 'react-helmet';


// Define the type for the Google Maps libraries
const libraries: ("places" | "routes" | "drawing" | "geometry")[] = ['places'];

// Map container style
const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
};

const ValetBookingApp = () => {
    // State from original component
    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState('');
    const [price, setPrice] = useState(0);
    const [isCalculating, setIsCalculating] = useState(false);
    const [bookingStep, setBookingStep] = useState(1);

    // Google Maps specific state
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

    // Refs for Autocomplete inputs
    const startLocationRef = useRef<HTMLInputElement>(null);
    const endLocationRef = useRef<HTMLInputElement>(null);

    // Load the Google Maps script
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_Maps_API_KEY || "",
        libraries,
    });

    // Pricing structure (SGD)
    const baseRate = 1; // Base rate per km
    const minimumFare = 25; // Minimum fare

    const calculateRoute = async () => {
        if (!startLocationRef.current?.value || !endLocationRef.current?.value) {
            return;
        }
        setIsCalculating(true);

        const directionsService = new google.maps.DirectionsService();
        try {
            const results = await directionsService.route({
                origin: startLocationRef.current.value,
                destination: endLocationRef.current.value,
                travelMode: google.maps.TravelMode.DRIVING,
                region: 'SG'
            });

            const route = results.routes[0].legs[0];
            if (!route.distance || !route.duration) {
                throw new Error("Could not retrieve distance or duration.");
            }

            const distanceInKm = route.distance.value / 1000;
            //const calculatedPrice = Math.max(distanceInKm * baseRate, minimumFare);
            const calculatedPrice = Math.ceil(distanceInKm * baseRate + minimumFare)
            setDirectionsResponse(results);
            setDistance(Math.round(distanceInKm * 10) / 10);
            setDuration(route.duration.text);
            setPrice(Math.round(calculatedPrice * 100) / 100);

        } catch (error) {
            console.error("Directions request failed", error);
            // Here you could set an error state to show a message to the user
            alert("Could not calculate the route. Please check the locations and try again.");
        } finally {
            setIsCalculating(false);
        }
    };

    const handleBooking = () => {
        setBookingStep(2);
    };

    const handleFinalBooking = () => {
        
    }


    const resetForm = () => {
        if (startLocationRef.current) startLocationRef.current.value = '';
        if (endLocationRef.current) endLocationRef.current.value = '';
        setDistance(0);
        setPrice(0);
        setDuration('');
        setDirectionsResponse(null);
        setBookingStep(1);
    };

    if (loadError) {
        return <div className="text-white text-center p-8">Error loading maps. Please check your API key and network connection.</div>;
    }

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl flex items-center">
                    <Car className="animate-pulse w-8 h-8 mr-4" />
                    Initializing Valet Service...
                </div>
            </div>
        );
    }

    return (
        <>
            <head>
                <title>DashValet - Singapore Valet Booking</title>
            </head>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

                {/* Header */}
                <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1 rounded-lg">
                                    <Image
                                        src="/logo.png"
                                        width={50}
                                        height={50}
                                        style={{ objectFit: 'cover' }}
                                        alt="logo"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">DashValet</h1>
                                    <p className="text-blue-200 text-sm">Singapore{`'`}s Premier Valet Service</p>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center space-x-6">
                                <div className="flex items-center space-x-2 text-white">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">+65 8026 6578</span>
                                </div>
                                <div className="flex items-center space-x-2 text-white">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">DashValet@gmail.com</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-6 py-12">
                    {bookingStep === 1 ? (
                        <>
                            {/* Hero Section */}
                            <div className="text-center mb-16">
                                <h2 className="text-5xl font-bold text-white mb-6">
                                    Professional Valet Service
                                    <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block">
                                        Distance-Based Pricing
                                    </span>
                                </h2>
                                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                                    Singapore{`'`}s first and only distance-based valet service. Get instant quotes and book your professional valet online.
                                </p>
                            </div>

                            {/* Booking Form */}
                            <div className="max-w-4xl mx-auto">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
                                    <div className="flex items-center justify-center mb-8">
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full">
                                            <Calculator className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white ml-4">Calculate Your Fare</h3>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                                        <Autocomplete
                                            options={{
                                                componentRestrictions: { country: 'sg' } // 'sg' is the code for Singapore
                                            }}>

                                            <div>
                                                <label className="block text-white font-semibold mb-2">
                                                    <MapPin className="inline w-4 h-4 mr-2" />
                                                    Pickup Location
                                                </label>
                                                <input
                                                    type="text"
                                                    ref={startLocationRef}
                                                    placeholder="Enter pickup address or landmark"
                                                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </Autocomplete>
                                        <Autocomplete
                                            options={{
                                                componentRestrictions: { country: 'sg' } // 'sg' is the code for Singapore
                                            }}>
                                            <div>
                                                <label className="block text-white font-semibold mb-2">
                                                    <MapPin className="inline w-4 h-4 mr-2" />
                                                    Destination
                                                </label>
                                                <input
                                                    type="text"
                                                    ref={endLocationRef}
                                                    placeholder="Enter destination address or landmark"
                                                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </Autocomplete>
                                    </div>

                                    <div className="text-center mb-8">
                                        <button
                                            onClick={calculateRoute}
                                            disabled={isCalculating}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                                        >
                                            {isCalculating ? 'Calculating...' : 'Calculate Fare'}
                                        </button>
                                    </div>

                                    {/* Results & Map */}
                                    {distance > 0 && directionsResponse && (
                                        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-500/30">
                                            <div className="grid md:grid-cols-3 gap-6 text-center mb-6">
                                                <div>
                                                    <div className="text-3xl font-bold text-white mb-2">{distance} km</div>
                                                    <div className="text-green-300 font-semibold">Total Distance</div>
                                                </div>
                                                <div>
                                                    <div className="text-3xl font-bold text-white mb-2">S${price}</div>
                                                    <div className="text-green-300 font-semibold">Total Fare</div>
                                                </div>
                                                <div>
                                                    <div className="text-3xl font-bold text-white mb-2">{duration}</div>
                                                    <div className="text-green-300 font-semibold">Est. Duration</div>
                                                </div>
                                            </div>

                                            {/* Map Display */}
                                            <div className="my-6">
                                                <GoogleMap
                                                    mapContainerStyle={mapContainerStyle}
                                                    zoom={12}
                                                    center={{ lat: 1.3521, lng: 103.8198 }} // Center on Singapore
                                                    options={{
                                                        disableDefaultUI: true,
                                                        zoomControl: true,
                                                        styles: [ // Dark mode map styles
                                                            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                                                            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                                                            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                                                            {
                                                                featureType: 'administrative.locality',
                                                                elementType: 'labels.text.fill',
                                                                stylers: [{ color: '#d59563' }],
                                                            },
                                                            {
                                                                featureType: 'poi',
                                                                elementType: 'labels.text.fill',
                                                                stylers: [{ color: '#d59563' }],
                                                            },
                                                            {
                                                                featureType: 'poi.park',
                                                                elementType: 'geometry',
                                                                stylers: [{ color: '#263c3f' }],
                                                            },
                                                            {
                                                                featureType: 'road',
                                                                elementType: 'geometry',
                                                                stylers: [{ color: '#38414e' }],
                                                            },
                                                            {
                                                                featureType: 'road',
                                                                elementType: 'geometry.stroke',
                                                                stylers: [{ color: '#212a37' }],
                                                            },
                                                            {
                                                                featureType: 'road',
                                                                elementType: 'labels.text.fill',
                                                                stylers: [{ color: '#9ca5b3' }],
                                                            },
                                                            {
                                                                featureType: 'road.highway',
                                                                elementType: 'geometry',
                                                                stylers: [{ color: '#746855' }],
                                                            },
                                                            {
                                                                featureType: 'transit',
                                                                elementType: 'geometry',
                                                                stylers: [{ color: '#2f3948' }],
                                                            },
                                                            {
                                                                featureType: 'water',
                                                                elementType: 'geometry',
                                                                stylers: [{ color: '#17263c' }],
                                                            },
                                                        ]
                                                    }}
                                                >
                                                    <DirectionsRenderer directions={directionsResponse} />
                                                </GoogleMap>
                                            </div>

                                            <div className="text-center">
                                                <button
                                                    onClick={handleBooking}
                                                    className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                                                >
                                                    Book This Ride
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Features Section */}
                            <div className="mt-20 grid md:grid-cols-3 gap-5">
                                <div className="text-center">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Star className="w-8 h-8 text-white" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Professional Service</h4>
                                    <p className="text-slate-300">Experienced and licensed valets you can trust</p>
                                </div>
                                <div className="text-center">
                                    <div className="bg-gradient-to-r from-green-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calculator className="w-8 h-8 text-white" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Pricing based on distance</h4>
                                    <p className="text-slate-300">S${baseRate}/km with S${minimumFare} flagdown fare</p>
                                    <p className="text-slate-300">(rounded up to nearest dollar)</p>
                                </div>
                                <div className="text-center">
                                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Clock className="w-8 h-8 text-white" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Operational Hours</h4>
                                    <p className="text-slate-300">8:30pm to 4am </p>
                                    <p className="text-slate-300">Additional S$20 charge outside of these hours </p>

                                </div>

                            </div>
                        </>
                    ) : (
/* Contact Details & Booking Confirmation */
<div className="max-w-2xl mx-auto">
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl text-center">
        {/* You can use a User icon here for the contact details step */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Almost There!</h2>
        <p className="text-slate-300 mb-6">Confirm your details to book your ride.</p>

        {/* Booking Summary */}
        <div className="bg-white/10 rounded-lg p-6 mb-6 text-left">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-slate-300">From:</span>
                    <p className="text-white font-semibold">{startLocationRef.current?.value}</p>
                </div>
                <div>
                    <span className="text-slate-300">To:</span>
                    <p className="text-white font-semibold">{endLocationRef.current?.value}</p>
                </div>
                <div>
                    <span className="text-slate-300">Distance:</span>
                    <p className="text-white font-semibold">{distance} km</p>
                </div>
                <div>
                    <span className="text-slate-300">Total Fare:</span>
                    <p className="text-white font-semibold">S${price}</p>
                </div>
            </div>
        </div>

        {/* Contact Details Form */}
        <form onSubmit={handleFinalBooking}>
            <div className="space-y-4 mb-6">
                <div>
                    <label htmlFor="name" className="block text-left text-slate-300 text-sm font-semibold mb-2">
                        Full Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        placeholder="e.g., Jane Doe"
                        required
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="contact" className="block text-left text-slate-300 text-sm font-semibold mb-2">
                        Phone or Telegram Handle
                    </label>
                    <input
                        id="contact"
                        type="text"
                        placeholder="e.g., +65 9123 4567 or @janedoe"
                        required
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200"
            >
                Confirm Booking
            </button>
        </form>
    </div>
</div>
                    )}
                </main>

                {/* Footer */}
                <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 mt-20">
                    <div className="container mx-auto px-6 py-8">
                        <div className="text-center text-slate-300">
                            <p>&copy; 2025 DashValet. Singapore{`'`}s Premier Distance-Based Valet Service.</p>
                            <p className="mt-2">Licensed • Insured • Professional</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>

    );
};

export default ValetBookingApp;
