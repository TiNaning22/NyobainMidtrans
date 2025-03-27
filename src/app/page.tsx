"use client";

import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductCheckout = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAmountError, setPaymentAmountError] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [customerInfo, setCustomerInfo] = useState({ // Add this line
    first_name: "",
    email: "",
    phone: "",
    payment_amount: ""
  });
  const validateForm = () => {
    const errors = {};
    if (!customerInfo.first_name.trim()) {
      errors.first_name = "Nama wajib diisi";
    }
    
    if (!customerInfo.email.trim()) {
      errors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      errors.email = "Format email tidak valid";
    }
    
    if (!customerInfo.phone.trim()) {
      errors.phone = "Nomor telepon wajib diisi";
    } else if (!/^[0-9]{10,13}$/.test(customerInfo.phone.replace(/\D/g, ''))) {
      errors.phone = "Nomor telepon tidak valid (10-13 digit)";
    }
    
    setFormErrors(errors); // Update form errors
    return Object.keys(errors).length === 0; // Return true if no errors
  };
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({
      ...customerInfo,
      [name]: value
    });
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products from Laravel API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        console.log("Memulai fetch data...");
        
        const response = await axios.get('http://127.0.0.1:8000/api/product/', {
          timeout: 10000
        });
        
        console.log("Response diterima:", response);
        console.log("Response.data:", response.data);
        console.log("Keys dalam response.data:", Object.keys(response.data));
        
        // Kita periksa nilai property "List Produk" lebih detail
        const listProdukValue = response.data["List Produk"];
        console.log("Nilai dari 'List Produk':", listProdukValue);
        console.log("Tipe dari 'List Produk':", typeof listProdukValue);
        console.log("Apakah array?", Array.isArray(listProdukValue));
        
        if (listProdukValue && Array.isArray(listProdukValue) && listProdukValue.length > 0) {
          console.log("Produk ditemukan dalam 'List Produk'!");
          
          const productsWithQuantity = listProdukValue.map(product => {
            console.log("Data produk individual:", product);
            return {
              id: product.id,
              name: product.nama || product.name,
              price: parseFloat(product.harga || product.price),
              description: product.deskripsi || product.description,
              image_url: product.image_url,
              stok: product.stok,
              sku: product.sku,
              quantity: 0
            };
          });
          
          console.log("Hasil mapping produk:", productsWithQuantity);
          setProducts(productsWithQuantity);
        } else {
          // Jika "List Produk" tidak ada atau bukan array, coba temukan array lain
          console.warn("'List Produk' tidak ditemukan atau bukan array");
          
          // Coba cari array dalam response.data
          let foundArray = null;
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              console.log(`Ditemukan array dalam property "${key}"`);
              foundArray = response.data[key];
              break;
            }
          }
          
          if (foundArray && foundArray.length > 0) {
            console.log("Menggunakan array yang ditemukan:", foundArray);
            
            const productsWithQuantity = foundArray.map(product => ({
              id: product.id,
              name: product.nama || product.name,
              price: parseFloat(product.harga || product.price),
              description: product.deskripsi || product.description,
              image_url: product.image_url, 
              stok: product.stok,
              sku: product.sku,
              quantity: 0
            }));
            
            setProducts(productsWithQuantity);
          } else {
            console.error("Tidak ditemukan data produk dalam bentuk array");
            setError("Format data dari API tidak sesuai");
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(`Gagal memuat produk: ${err.message}`);
        setIsLoading(false);
      }
    };
  
    fetchProducts();
  }, []);

  const incrementQuantity = (productId) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        return { ...product, quantity: product.quantity + 1 };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  const decrementQuantity = (productId) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId && product.quantity > 0) {
        return { ...product, quantity: product.quantity - 1 };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  const addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product && product.quantity > 0) {
      const existingItem = cart.find(item => item.id === productId);
      
      if (existingItem) {
        const updatedCart = cart.map(item => {
          if (item.id === productId) {
            return { ...item, quantity: item.quantity + product.quantity };
          }
          return item;
        });
        setCart(updatedCart);
      } else {
        const newItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity
        };
        setCart([...cart, newItem]);
      }
      
      // Reset product quantity
      const resetProducts = products.map(p => {
        if (p.id === productId) {
          return { ...p, quantity: 0 };
        }
        return p;
      });
      setProducts(resetProducts);
    }
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
  };

  const validatePaymentAmount = () => {
    const totalPrice = getTotalPrice();
    const amount = parseFloat(paymentAmount);

    if (!paymentAmount.trim()) {
      setPaymentAmountError('Nominal pembayaran wajib diisi');
      return false;
    }

    if (isNaN(amount)) {
      setPaymentAmountError('Nominal pembayaran harus berupa angka');
      return false;
    }

    if (amount < totalPrice) {
      setPaymentAmountError(`Nominal pembayaran kurang dari total tagihan (${formatPrice(totalPrice)})`);
      return false;
    }

    setPaymentAmountError('');
    return true;
  };

  const handleCheckout = async () => {
    setIsCustomerFormOpen(false);
    setIsCheckoutModalOpen(true);
    
    try {
      // Prepare the order data using customer information
      const orderData = {
        first_name: customerInfo.first_name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        payment_amount: parseFloat(paymentAmount) || 0,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };
  
      // Call the initiatePayment endpoint
      const response = await axios.post('http://127.0.0.1:8000/api/payments', orderData);
      console.log("Full response:", response);
      console.log("Response data:", response.data);
  
      console.log("Payment response:", response.data);
      
      // Store the order ID for status checking
      if (response.data && response.data.order_id) {
        setOrderId(response.data.order_id);
      }
      
      // If Midtrans snap token is returned, open the Snap payment page
      if (response.data && response.data.data && response.data.data.snap_token) {
        const snapToken = response.data.data.snap_token;
    
        if (typeof window !== 'undefined' && window.snap) {
          window.snap.pay(snapToken, {
            onSuccess: function(result) {
              checkPaymentStatus(response.data.data.order_id);
            },
            onPending: function(result) {
              checkPaymentStatus(response.data.data.order_id);
            },
            onError: function(result) {
              setErrorMessage(result.status_message || 'Pembayaran gagal');
              setIsErrorModalOpen(true);
              setIsCheckoutModalOpen(false);
            },
            onClose: function() {
              setErrorMessage('Anda menutup popup tanpa menyelesaikan pembayaran');
              setIsErrorModalOpen(true);
              setIsCheckoutModalOpen(false);
            }
          });
        } else {
          setErrorMessage('Midtrans tidak tersedia. Pastikan Anda telah menyertakan script Snap.js');
          setIsErrorModalOpen(true);
          setIsCheckoutModalOpen(false);
        }
      } else {
        throw new Error('Tidak mendapatkan token pembayaran');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Terjadi kesalahan saat checkout');
      setIsErrorModalOpen(true);
      setIsCheckoutModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleSubmitCustomerForm = (e) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);
    
  //   if (validateForm() && validatePaymentAmount()) {
  //     handleCheckout();
  //   } else {
  //     setIsSubmitting(false);
  //   }
  // };

  const checkPaymentStatus = async (orderId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/payments/status/${orderId}`);
      const paymentStatus = response.data.data?.status || response.data.status;
  
      switch (paymentStatus) {
        case 'paid':
        case 'success':
          setIsSuccessModalOpen(true);
          setIsCheckoutModalOpen(false);
          setCart([]);
          break;
  
        case 'pending':
          setErrorMessage('Pembayaran dalam proses. Kami akan memberitahu Anda jika sudah selesai.');
          setIsErrorModalOpen(true);
          setIsCheckoutModalOpen(false);
          break;
  
        case 'failed':
          setErrorMessage('Pembayaran gagal. Silakan coba lagi atau hubungi tim support.');
          setIsErrorModalOpen(true);
          setIsCheckoutModalOpen(false);
          break;
  
        default:
          setErrorMessage(`Status pembayaran tidak diketahui: ${paymentStatus}`);
          setIsErrorModalOpen(true);
          setIsCheckoutModalOpen(false);
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setErrorMessage('Terjadi kesalahan saat memeriksa status pembayaran: ' + err.message);
      setIsErrorModalOpen(true);
      setIsCheckoutModalOpen(false);
    }
  };

  const SuccessModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <svg
            className="w-16 h-16 mx-auto text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h2 className="text-2xl font-bold mt-4">Pembayaran Berhasil!</h2>
          <p className="text-gray-600 mt-2">
            Terima kasih telah berbelanja dengan kami. Pesanan Anda sedang diproses.
          </p>
          <button
            className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    );
  };

  const ErrorModal = ({ isOpen, onClose, errorMessage, orderId }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl text-gray-950 font-bold mt-4">Pembayaran Gagal!</h2>
          <p className="text-gray-600 mt-2">{errorMessage}</p>
          
          {orderId && (
            <div className="bg-gray-100 p-3 rounded mt-4 text-sm">
              <p>Order ID: <span className="font-mono">{orderId}</span></p>
            </div>
          )}
          
          <button
            className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    );
  };

  const handleOpenCustomerForm = () => {
    setIsCustomerFormOpen(true); // Add this function
  };

  const handleSubmitCustomerForm = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (validateForm()) {
      handleCheckout();
    } else {
      setIsSubmitting(false);
    }
  };
  
  // Fungsi untuk mendapatkan data dummy jika API tidak berfungsi
  const getDummyProducts = () => {
    return [
      {
        id: 1,
        name: "Smartphone XYZ",
        price: 2500000,
        description: "Smartphone terbaru dengan spesifikasi tinggi",
        image_url: null
      },
      {
        id: 2,
        name: "Laptop ABC",
        price: 8500000,
        description: "Laptop ringan dengan performa maksimal",
        image_url: null
      },
    ];
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="text-lg">Memuat produk...</div>
    </div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-lg text-red-500 mb-4">{error}</div>
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => {
            setProducts(getDummyProducts().map(product => ({...product, quantity: 0})));
            setError(null);
          }}
        >
          Gunakan Data Dummy
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product List */}
        <div className="w-full lg:w-2/3">
          <h2 className="text-2xl font-bold mb-6">Daftar Produk</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md p-4">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded mb-4 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <h3 className="text-lg font-black font-semibold text-gray-600">{product.name}</h3>
                <p className="text-gray-600 mb-2">{product.description}</p>
                <p className="text-xl font-bold text-blue-600 mb-4">{formatPrice(product.price)}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center border rounded">
                    <button 
                      className="px-3 py-1 bg-dark-300 hover:bg-gray-200" 
                      onClick={() => decrementQuantity(product.id)}
                    >
                      -
                    </button>
                    <span className="px-4 py-1">{product.quantity}</span>
                    <button 
                      className="px-3 py-1 bg-dark-300 hover:bg-gray-200" 
                      onClick={() => incrementQuantity(product.id)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={() => addToCart(product.id)}
                    disabled={product.quantity === 0}
                  >
                    Tambah ke Keranjang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shopping Cart */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl text-gray-500 font-bold mb-6">Keranjang Belanja</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-800 font-bold">Keranjang belanja kosong.</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between border-b pb-2">
                      <div>
                        <h4 className="font-medium text-gray-600">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="font-medium mr-2 text-gray-600">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <button 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeFromCart(item.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg mb-6 text-gray-600">
                    <span>Total:</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>

                  {isCustomerFormOpen ? (
                    <form onSubmit={handleSubmitCustomerForm}>
                      <div className="mb-4">
                        <label className="block text-gray-700 mb-2" htmlFor="first_name">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="first_name"
                          name="first_name"
                          type="text"
                          className={`w-full px-3 py-2 border text-gray-700 rounded-lg ${formErrors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                          value={customerInfo.first_name}
                          onChange={handleInputChange}
                          placeholder="Masukkan nama lengkap"
                        />
                        {formErrors.first_name && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.first_name}</p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-gray-700 mb-2" htmlFor="email">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className={`w-full px-3 py-2 border text-gray-700 rounded-lg ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                          value={customerInfo.email}
                          onChange={handleInputChange}
                          placeholder="Masukkan alamat email"
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                        )}
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-gray-700 mb-2" htmlFor="phone">
                          Nomor Telepon <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          className={`w-full px-3 py-2 border text-gray-700 rounded-lg ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                          value={customerInfo.phone}
                          onChange={handleInputChange}
                          placeholder="Masukkan nomor telepon"
                        />
                        {formErrors.phone && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                        )}
                      </div>

                      {/* <div className="mb-4">
                        <label className="block text-gray-700 mb-2" htmlFor="payment_amount">
                          Nominal Pembayaran <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="payment_amount"
                          name="payment_amount"
                          type="text"
                          className={`w-full px-3 py-2 border text-gray-700 rounded-lg ${paymentAmountError ? 'border-red-500' : 'border-gray-300'}`}
                          value={paymentAmount}
                          onChange={(e) => {
                            // Only allow numeric input
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setPaymentAmount(value);
                          }}
                          placeholder="Masukkan nominal pembayaran"
                        />
                        {paymentAmountError && (
                          <p className="text-red-500 text-sm mt-1">{paymentAmountError}</p>
                        )}
                        
                        {/* Show total price and payment guidance */}
                        {/* <div className="mt-2 text-sm text-gray-600">
                          Total Tagihan: {formatPrice(getTotalPrice())}
                        </div>
                      </div> */} */}
                      
                      <div className="flex justify-between">
                        <button
                          type="button"
                          className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
                          onClick={() => setIsCustomerFormOpen(false)}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Proses...
                            </span>
                          ) : (
                            "Lanjutkan ke Pembayaran"
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium"
                      onClick={handleOpenCustomerForm}
                      
                      disabled={cart.length === 0}
                    >
                      Checkout
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Memproses Pembayaran...</h2>
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />

      <ErrorModal
      isOpen={isErrorModalOpen}
      onClose={() => setIsErrorModalOpen(false)}
      errorMessage={errorMessage}
      orderId={orderId}
    />

      
    </div>
  );
};

export default ProductCheckout;