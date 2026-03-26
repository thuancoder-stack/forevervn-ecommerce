import React, { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';

function mapOrdersToItems(orders = []) {
    const allOrdersItem = [];

    orders.forEach((order) => {
        order.items.forEach((item) => {
            allOrdersItem.push({
                ...item,
                status: order.status,
                payment: order.payment,
                paymentMethod: order.paymentMethod,
                date: order.date,
            });
        });
    });

    return allOrdersItem.reverse();
}

const Orders = () => {
    const { backendUrl, token, currency } = useContext(ShopContext);
    const [orderData, setOrderData] = useState([]);

    const fetchOrderData = useCallback(async () => {
        try {
            if (!token) return null;

            const response = await axios.post(
                `${backendUrl}/api/order/userorders`,
                {},
                { headers: { token } },
            );

            if (response.data.success) {
                return mapOrdersToItems(response.data.orders);
            }
        } catch (error) {
            console.error(error);
        }

        return [];
    }, [backendUrl, token]);

    const loadOrderData = useCallback(async () => {
        const nextOrderData = await fetchOrderData();

        if (nextOrderData) {
            setOrderData(nextOrderData);
        }
    }, [fetchOrderData]);

    useEffect(() => {
        if (!token) return;

        let ignore = false;

        fetchOrderData().then((nextOrderData) => {
            if (!ignore && nextOrderData) {
                setOrderData(nextOrderData);
            }
        });

        return () => {
            ignore = true;
        };
    }, [fetchOrderData, token]);

    const visibleOrders = token ? orderData : [];

    return (
        <div className="border-t pt-16">
            <div className="text-2xl">
                <Title text1={'MY'} text2={'ORDERS'} />
            </div>

            <div>
                {visibleOrders.map((item, index) => (
                    <div
                        key={index}
                        className="py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                        <div className="flex items-start gap-6 text-sm">
                            <img
                                className="w-16 sm:w-20"
                                src={item.image[0]}
                                alt={item.name}
                            />

                            <div>
                                <p className="sm:text-base font-medium">
                                    {item.name}
                                </p>

                                <div className="flex items-center gap-3 mt-2 text-base text-gray-700">
                                    <p className="text-lg">
                                        {currency}
                                        {item.price}
                                    </p>
                                    <p>Quantity: {item.quantity}</p>
                                    <p>Size: {item.size}</p>
                                </div>

                                <p className="mt-2">
                                    Date:{' '}
                                    <span className="text-gray-400">
                                        {new Date(item.date).toDateString()}
                                    </span>
                                </p>

                                <p className="mt-2">
                                    Payment:{' '}
                                    <span className="text-gray-400">
                                        {item.paymentMethod}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="md:w-1/2 flex justify-between">
                            <div className="flex items-center gap-2">
                                <p className="min-w-2 h-2 rounded-full bg-green-500" />
                                <p className="text-sm md:text-base">
                                    {item.status}
                                </p>
                            </div>

                            <button
                                onClick={loadOrderData}
                                className="border px-4 py-2 text-sm font-medium rounded-sm"
                            >
                                Track Order
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Orders;
