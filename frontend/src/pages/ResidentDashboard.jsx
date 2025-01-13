import React, { useEffect, useState } from "react";
import api from "../services/api";

const ResidentDashboard = () => {
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch resident vouchers
        const voucherResponse = await api.get("/resident/vouchers");
        setVouchers(voucherResponse.data);

        // Fetch available products
        const productResponse = await api.get("/products");
        setProducts(productResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error.response?.data || error.message);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Resident Dashboard</h1>

      {/* Display Voucher Information */}
      <section>
        <h2>Your Vouchers</h2>
        <ul>
          {vouchers.map((voucher) => (
            <li key={voucher.id}>
              Voucher ID: {voucher.id}, Balance: {voucher.balance} points
            </li>
          ))}
        </ul>
      </section>

      {/* Display Available Products */}
      <section>
        <h2>Available Products</h2>
        <ul>
          {products.map((product) => (
            <li key={product.id}>
              {product.name} - {product.price} points
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ResidentDashboard;
