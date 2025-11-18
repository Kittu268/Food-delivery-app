import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getOrders } from "../api";
import { CircularProgress } from "@mui/material";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../redux/reducers/SnackbarSlice";

const Container = styled.div`
  padding: 20px 30px;
  padding-bottom: 200px;
  height: 100%;
  overflow-y: scroll;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 30px;
  @media (max-width: 768px) {
    padding: 20px 12px;
  }
  background: ${({ theme }) => theme.bg};
`;
const Section = styled.div`
  width: 100%;
  max-width: 1400px;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 22px;
  gap: 28px;
`;
const Title = styled.div`
  font-size: 28px;
  font-weight: 500;
  display: flex;
  justify-content: ${({ center }) => (center ? "center" : "space-between")};
  align-items: center;
`;

const OrdersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1000px;
`;

const OrderCard = styled.div`
  border: 1px solid ${({ theme }) => theme.text_secondary + 40};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: ${({ theme }) => theme.card};
  box-shadow: 0 4px 12px ${({ theme }) => theme.shadow + "05"};
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

const OrderStatus = styled.div`
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  background: ${({ status, theme }) =>
    status === "Payment Done" ? theme.green + "20" : theme.red + "20"};
  color: ${({ status, theme }) =>
    status === "Payment Done" ? theme.green : theme.red};
`;

const OrderDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.text_secondary};
`;

const OrderProducts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
`;

const ProductItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
`;

const ProductImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
`;

const ProductInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProductName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
`;

const ProductQty = styled.div`
  color: ${({ theme }) => theme.text_secondary};
`;

const NoOrders = styled.div`
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_secondary};
  text-align: center;
  margin-top: 40px;
`;

const Orders = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    const token = localStorage.getItem("foodeli-app-token");
    
    try {
      if (!token) {
        throw new Error("No token");
      }

      console.log("\n========== ORDERS PAGE - FETCHING ==========");
      console.log("Token:", token.substring(0, 30) + "...");

      const res = await getOrders(token);
      
      console.log("Response status:", res.status);
      console.log("Response object keys:", Object.keys(res));
      console.log("Response.data:", res.data);
      console.log("Response.data keys:", Object.keys(res.data || {}));
      console.log("Response.data type:", typeof res.data);
      console.log("Response.data.orders exists?", !!res.data?.orders);
      console.log("Response.data.orders type:", typeof res.data?.orders);

      let fetched = res.data?.orders;
      
      console.log("Extracted 'orders':", fetched);
      console.log("Is array?", Array.isArray(fetched));

      if (!Array.isArray(fetched)) {
        console.warn("Not an array, setting to []");
        fetched = [];
      }

      console.log("Final fetched count:", fetched.length);
      console.log("========== END FETCH ==========\n");

      setDebugInfo({
        status: res.status,
        dataKeys: Object.keys(res.data || {}),
        hasOrdersKey: !!res.data?.orders,
        ordersType: typeof res.data?.orders,
        ordersCount: Array.isArray(fetched) ? fetched.length : 0,
        timestamp: new Date().toLocaleTimeString(),
      });

      setOrders(fetched);
    } catch (err) {
      console.error("❌ Fetch error:", err.message);
      
      setDebugInfo({
        error: err.message,
        status: err?.response?.status,
      });

      dispatch(
        openSnackbar({
          message: err.message || "Failed to fetch orders",
          severity: "error",
        })
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container>
      <Section>
        <Title>Your Orders</Title>
        {debugInfo && (
          <div style={{ 
            fontSize: "11px", 
            padding: "10px", 
            background: "#f5f5f5", 
            borderRadius: "4px",
            marginBottom: "15px",
            border: "1px solid #ddd"
          }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
        {loading ? (
          <CircularProgress />
        ) : (
          <OrdersContainer>
            {orders.length === 0 ? (
              <NoOrders>No orders found</NoOrders>
            ) : (
              orders.map((order) => (
                <OrderCard key={order._id}>
                  <OrderHeader>
                    <div>
                      Order ID: <span style={{ fontWeight: 400 }}>{order._id}</span>
                    </div>
                    <OrderStatus status={order.status || "Payment Done"}>
                      {order.status || "Payment Done"}
                    </OrderStatus>
                  </OrderHeader>
                  <OrderDetails>
                    <div>Date: {new Date(order.createdAt).toLocaleString()}</div>
                    <div>Address: {order.address}</div>
                    <div>Total: <b>${(order.total_amount || 0).toFixed(2)}</b></div>
                  </OrderDetails>
                  <OrderProducts>
                    <div style={{ fontWeight: "600", fontSize: "16px" }}>
                      Products ({(order.products || []).length}):
                    </div>
                    {(order.products || []).map((item, idx) => {
                      const prod = item?.product || {};
                      return (
                        <ProductItem key={prod._id || `${order._id}-${idx}`}>
                          <ProductImage src={prod.img || ""} alt={prod.name} />
                          <ProductInfo>
                            <ProductName>{prod.name}</ProductName>
                            <ProductQty>Qty: {item.quantity}</ProductQty>
                          </ProductInfo>
                          <div>${((prod.price?.org || 0) * item.quantity).toFixed(2)}</div>
                        </ProductItem>
                      );
                    })}
                  </OrderProducts>
                </OrderCard>
              ))
            )}
          </OrdersContainer>
        )}
      </Section>
    </Container>
  );
};

export default Orders;