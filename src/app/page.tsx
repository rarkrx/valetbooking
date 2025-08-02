"use client"
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Car, Calculator, Clock, Star, Phone, Mail, User } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Autocomplete, DirectionsRenderer } from '@react-google-maps/api';
import Image from 'next/image'
import axios from 'axios';
import { toast } from 'react-toastify'; // Optional for notifications
//import { Helmet } from 'react-helmet';

// Define a type for a single booking for TypeScript
interface Booking {
    id: string;
    customerName: string;
    customerContact: string;
    startLocation: string;
    endLocation: string;
    distance: number;
    price: number;
    bookingDate: string;
}

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
    const [customerName, setName] = useState('');
    const [customerContact, setContact] = useState('');
    const [startLocation, setStartLocation] = useState<string | undefined>('');
    const [endLocation, setEndLocation] = useState<string | undefined>('');

    // State to hold the array of past bookings
    const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // useEffect hook to load data from local storage when the component mounts
    useEffect(() => {
        // Retrieve the stored bookings string from local storage
        const storedBookings = localStorage.getItem('valetBookings');

        // If data exists, parse it from a JSON string back into an array
        if (storedBookings) {
            setBookingHistory(JSON.parse(storedBookings));
        }
        setIsLoading(false); // Stop loading once data is fetched
    }, []); // The empty dependency array means this effect runs only once

    // Function to handle clearing the history
    const handleClearHistory = () => {
        // Confirm with the user before deleting
        if (window.confirm("Are you sure you want to delete all your booking history? This action cannot be undone.")) {
            localStorage.removeItem('valetBookings');
            setBookingHistory([]); // Clear the state to update the UI
        }
    };

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
        setStartLocation(startLocationRef.current?.value)
        setEndLocation(endLocationRef.current?.value)
        setBookingStep(2);
    };

    const sendTeleMessage = async (newBooking: Booking) => {

        try {
            const response = await axios.post('/api/contact', newBooking);

            if (response.status === 200) {
                toast.success('Message sent successfully!');
            } else {
                toast.error('Failed to send message.');
            }
        } catch (error) {
            toast.error('Error sending message.');
        }
    };

    const handleFinalBooking = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // You can now use the variables `name` and `contact`
        console.log('Customer Name:', customerName);
        console.log('Customer Contact:', customerContact);

        const newBooking : Booking= {
            id: new Date().toISOString(), // Unique ID using timestamp
            customerName: customerName,
            customerContact: customerContact,
            startLocation: startLocation!,
            endLocation: endLocation!,
            distance: distance,
            price: price,
            bookingDate: new Date().toLocaleString() // Store the current date and time
        };

        // 2. Get existing bookings from local storage
        const existingBookings = JSON.parse(localStorage.getItem('valetBookings') || '[]');
        // 3. Add the new booking to the array
        const updatedBookings = [...existingBookings, newBooking];

        // 4. Save the updated array back to local storage
        localStorage.setItem('valetBookings', JSON.stringify(updatedBookings));

        console.log('Booking saved successfully!');

        sendTeleMessage(newBooking)

        setBookingStep(3);
    }


    const resetForm = () => {
        if (startLocationRef.current) startLocationRef.current.value = '';
        if (endLocationRef.current) endLocationRef.current.value = '';
        setDistance(0);
        setPrice(0);
        setDuration('');
        setDirectionsResponse(null);
        setBookingStep(1);
        window.location.reload()
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

    const renderBookingStep = () => {
        switch (bookingStep) {
            case 1:
                return (
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
                        {BookingHistory()}
                    </>
                );
            case 2:
                return (
                    <>
                        {/* Contact Details & Booking Confirmation */}
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
                                            <p className="text-white font-semibold">{startLocation}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-300">To:</span>
                                            <p className="text-white font-semibold">{endLocation}</p>
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
                                                value={customerName}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="contact" className="block text-left text-slate-300 text-sm font-semibold mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                id="contact"
                                                type="text"
                                                placeholder="e.g., +65 91234567"
                                                required
                                                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={customerContact}
                                                onChange={(e) => setContact(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4 mb-6">
                                        <button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-200"
                                        >
                                            Confirm Booking
                                        </button>
                                        <button
                                            type="button"
                                            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-200"
                                            onClick={() => setBookingStep(1)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        {/* Final Booking Confirmation Page */}
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl text-center">
                                {/* Success Icon */}
                                <div className="bg-gradient-to-r from-green-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    {/* Using a check icon to indicate success */}
                                    <svg className="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Thanks for booking with us!</h2>
                                <p className="text-slate-300 mb-6">
                                    We will contact you shortly to confirm your booking. Please call us at <a href="tel:+6580266578" className="font-semibold text-white hover:underline">+65 8026 6578</a> if you do not receive a message from us within 5 minutes.
                                </p>

                                {/* Booking Details Summary */}
                                <div className="bg-white/10 rounded-lg p-6 mb-6 text-left">
                                    <h3 className="text-xl font-bold text-white mb-4 text-center">Your Booking Details</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                        {/* Assuming customerName and customerContact are passed as props or from state */}
                                        <div>
                                            <span className="text-slate-300">Name:</span>
                                            <p className="text-white font-semibold">{customerName}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-300">Contact:</span>
                                            <p className="text-white font-semibold">{customerContact}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-300">From:</span>
                                            <p className="text-white font-semibold">{startLocation}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-300">To:</span>
                                            <p className="text-white font-semibold">{endLocation}</p>
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

                                <button
                                    onClick={resetForm} // Assuming you have a function to reset the booking flow
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                                >
                                    Book Another Ride
                                </button>
                            </div>
                        </div>
                    </>

                )
            default:
                // Return the first step or null as a fallback
                return (
                    <>
                    </>
                );
        }
    };




    const BookingHistory = () => {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Your Past Bookings</h1>
                    {bookingHistory.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/40 transition-colors duration-200"
                        >
                            Clear History
                        </button>
                    )}
                </div>

                {bookingHistory.length === 0 ? (
                    <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20">
                        <h2 className="text-2xl font-semibold text-white mb-4">No Past Bookings Found</h2>
                        <p className="text-slate-300 mb-6">It looks like you haven{`'`}t booked a ride with us yet.</p>
                        {/* <button
                            // Assuming you have a function to navigate back to the booking page
                            onClick={() => console.log("Navigate to new booking page")}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                        >
                            Book a New Ride
                        </button> */}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Display bookings in reverse chronological order */}
                        {bookingHistory.slice().reverse().map((booking) => (
                            <div key={booking.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xl font-bold text-white">{booking.startLocation} to {booking.endLocation}</p>
                                        <p className="text-sm text-slate-300">
                                            Booked on: {new Date(booking.bookingDate).toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <p className="text-2xl font-bold text-green-400">S${booking.price.toFixed(2)}</p>
                                </div>
                                <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-slate-300 text-sm">Name:</span>
                                        <p className="text-white font-semibold">{booking.customerName}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-300 text-sm">Contact:</span>
                                        <p className="text-white font-semibold">{booking.customerContact}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-300 text-sm">Distance:</span>
                                        <p className="text-white font-semibold">{booking.distance} km</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };


    return (
        <>
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
                    {renderBookingStep()}
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
