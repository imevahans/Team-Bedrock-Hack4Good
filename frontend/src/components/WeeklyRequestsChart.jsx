import React, { useRef } from "react";
import { Bar } from "react-chartjs-2";

const WeeklyRequestsChart = ({ data, onExportPDF }) => {
  const chartRef = useRef();

  // Aggregate purchases by product
  const aggregatedData = data.reduce((acc, item) => {
    if (!acc[item.productName]) {
      acc[item.productName] = { productName: item.productName, totalQuantity: 0 };
    }
    acc[item.productName].totalQuantity += item.quantity;
    return acc;
  }, {});

  const chartData = {
    labels: Object.values(aggregatedData).map((item) => item.productName),
    datasets: [
      {
        label: "Total Purchased",
        data: Object.values(aggregatedData).map((item) => item.totalQuantity),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <div>
      <div ref={chartRef}>
        <Bar data={chartData} />
      </div>
      <button onClick={() => onExportPDF(chartRef)}>Export Chart to PDF</button>
    </div>
  );
};

export default WeeklyRequestsChart;
