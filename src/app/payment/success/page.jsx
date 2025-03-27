"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
// import { useLocation } from 'react-router-dom';

const PaymentSuccess = () => {
    // const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('order_id'); // Ambil order_id dari URL

    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch order details dari backend
        const fetchOrderDetails = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/payments/status/${orderId}`);
                if (response.data.success) {
                    setOrderDetails(response.data.data);
                } else {
                    setError('Gagal memuat detail pesanan');
                }
            } catch (err) {
                setError('Terjadi kesalahan saat memuat detail pesanan');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetails();
        } else {
            setError('Order ID tidak valid');
            setLoading(false);
        }
    }, [orderId]);

    if (loading) {
        return <div>Memuat detail pesanan...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            {orderDetails && (
                <div>
                    <h2>Detail Pesanan</h2>
                    <p>Order ID: {orderDetails.order_id}</p>
                    <p>Total Pembayaran: Rp {orderDetails.amount.toLocaleString()}</p>
                    <p>Status: {orderDetails.status}</p>
                </div>
            )}
        </div>
    );
};

export default PaymentSuccess;