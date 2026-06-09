import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Button from '../components/Button';

const PaymentPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const eventId = searchParams.get('event_id');
    const amount = parseFloat(searchParams.get('amount') || '0');
    const eventName = searchParams.get('name') || 'Event';
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [razorpayKey, setRazorpayKey] = useState('');

    useEffect(() => {
        axiosInstance.get('/payments/key').then(res => {
            setRazorpayKey(res.data.key_id);
        }).catch(() => {});
    }, []);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setStatus('error');
                return;
            }

            const orderRes = await axiosInstance.post('/payments', {
                event_id: eventId,
                amount: amount,
            });

            const { order } = orderRes.data;

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency,
                name: 'StudHelp',
                description: eventName,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        await axiosInstance.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        setStatus('success');
                    } catch {
                        setStatus('error');
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: '',
                },
                theme: {
                    color: '#2563eb',
                },
                modal: {
                    ondismiss: () => setLoading(false),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function () {
                setStatus('error');
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            console.error('Payment error:', err);
            setStatus('error');
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-600 mb-6">You are now registered for {eventName}</p>
                    <Button onClick={() => navigate(`/events/${eventId}`)} className="w-full">
                        Go to Event
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✕</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                    <p className="text-gray-600 mb-6">Something went wrong. Please try again.</p>
                    <Button onClick={() => setStatus(null)} className="w-full">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
                <p className="text-gray-600 mb-6">{eventName}</p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Event</span>
                        <span className="font-medium">{eventName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-bold text-lg text-gray-900">₹{amount.toFixed(2)}</span>
                    </div>
                </div>

                <Button onClick={handlePayment} isLoading={loading} className="w-full">
                    Pay ₹{amount.toFixed(2)}
                </Button>

                <p className="text-xs text-gray-400 text-center mt-4">
                    Secured by Razorpay
                </p>
            </div>
        </div>
    );
};

export default PaymentPage;
